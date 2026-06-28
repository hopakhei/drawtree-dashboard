/* =============================================================================
   POST /api/portfolio/size-and-rebalance

   The full pipeline as one stateless call — the engine-as-a-service that the
   Draw Tree MCP `size_portfolio` / `build_rebalance` tools wrap.

   ideas (+ optional live price fetch) → history correlations → sizePortfolio
   (Kelly → FLAM haircut → cap → weights) → generateRebalance (broker-native
   order list) → response (aligned to the prod spec §11 contract).

   Pure compute over the inputs you pass — no user data is read here, so it needs
   no auth. The MCP tool resolves the caller's theses into `ideas` (under the
   user's identity) and forwards them. Execution is preview-only and paper-first
   (trd_env defaults to SIMULATE); the agent's broker MCP places any orders.
   ============================================================================= */
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_PARAMS,
  generateRebalance,
  sizePortfolio,
  type Broker,
  type EngineParams,
  type Idea,
} from "@/lib/portfolio/engine";
import { buildCorrelationSource } from "@/lib/portfolio/correlation";
import { computeCorrelations, toYahoo } from "@/lib/portfolio/history";
import { yahooQuote } from "@/lib/portfolio/marketdata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IDEAS = 50;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  // --- parse ideas ---------------------------------------------------------
  const rawIdeas: any[] = Array.isArray(body?.ideas) ? body.ideas.slice(0, MAX_IDEAS) : [];
  if (rawIdeas.length === 0) {
    return NextResponse.json({ ok: false, error: "ideas[] required" }, { status: 400 });
  }
  const ideas: Idea[] = rawIdeas.map((x, i) => ({
    id: String(x?.id ?? `idea-${i + 1}`),
    ticker: String(x?.ticker ?? "").trim().toUpperCase(),
    hypothesis: x?.hypothesis ? String(x.hypothesis) : undefined,
    bull: num(x?.bull),
    bear: num(x?.bear),
    current: num(x?.current),
    conviction: clamp01(num(x?.conviction)),
    conviction_source: x?.conviction_source === "mcp" ? "mcp" : "manual",
    sector: x?.sector ? String(x.sector) : undefined,
    lot_size: x?.lot_size && num(x.lot_size) > 0 ? num(x.lot_size) : 1,
  }));

  // --- params --------------------------------------------------------------
  const params: EngineParams = {
    kelly_fraction: numOr(body?.params?.kelly_fraction, DEFAULT_PARAMS.kelly_fraction),
    position_cap: numOr(body?.params?.position_cap, DEFAULT_PARAMS.position_cap),
    haircut_lambda: numOr(body?.params?.haircut_lambda, DEFAULT_PARAMS.haircut_lambda),
    no_trade_threshold: numOr(body?.params?.no_trade_threshold, DEFAULT_PARAMS.no_trade_threshold),
  };

  const warnings: string[] = [];

  // --- optionally fill current prices from live quotes ---------------------
  const fetchPrices = body?.fetch_prices === true;
  await Promise.all(
    ideas.map(async (idea) => {
      if (!idea.ticker) return;
      if (!fetchPrices && idea.current > 0) return; // respect provided price
      try {
        const q = await yahooQuote(toYahoo(idea.ticker));
        if (q && q.price > 0) idea.current = q.price;
      } catch {
        /* keep provided/zero — engine will flag if unusable */
      }
    }),
  );

  // --- correlations from history (best-effort; sector fallback otherwise) ---
  const tickers = Array.from(new Set(ideas.map((i) => i.ticker).filter(Boolean)));
  let correlation = null as Awaited<ReturnType<typeof computeCorrelations>> | null;
  try {
    if (tickers.length >= 2) correlation = await computeCorrelations(tickers);
  } catch {
    correlation = null;
  }
  const corrSource =
    correlation && correlation.tickers.length >= 2 && correlation.rho.length
      ? buildCorrelationSource(correlation.tickers, correlation.rho)
      : undefined;

  // --- Layers 1–4: size ----------------------------------------------------
  const sized = sizePortfolio(ideas, params, corrSource);
  warnings.push(...sized.warnings);

  // --- Layer 5: rebalance (only when an account NLV is supplied) -----------
  const exec = body?.execution ?? {};
  const broker: Broker = exec?.broker === "ibkr" ? "ibkr" : "futu";
  const nlv = num(exec?.nlv);
  const trdEnv = exec?.trd_env === "REAL" ? "REAL" : "SIMULATE"; // paper-first
  const positions = Array.isArray(exec?.positions)
    ? exec.positions
        .map((p: any) => ({ ticker: String(p?.ticker ?? "").trim().toUpperCase(), shares: num(p?.shares) }))
        .filter((p: { ticker: string; shares: number }) => p.ticker && p.shares > 0)
    : [];

  let rebalance_command: any = null;
  const orderByTicker = new Map<
    string,
    { action: "BUY" | "SELL" | "HOLD"; qty: number; lot_size: number; delta_value: number; current_weight: number }
  >();

  if (nlv > 0) {
    const reb = generateRebalance(sized.allocations, ideas, positions, nlv, broker, params);
    warnings.push(...reb.warnings);
    for (const o of reb.orders) {
      orderByTicker.set(o.ticker, {
        action: o.side,
        qty: o.qty,
        lot_size: o.lot_size,
        delta_value: o.delta_value,
        current_weight: o.current_weight,
      });
    }
    for (const s of reb.skipped) {
      if (!orderByTicker.has(s.ticker)) {
        orderByTicker.set(s.ticker, {
          action: "HOLD",
          qty: 0,
          lot_size: 1,
          delta_value: s.delta_value,
          current_weight: s.current_weight,
        });
      }
    }
    rebalance_command = {
      type: "place_orders",
      broker,
      trd_env: trdEnv,
      orders: reb.orders.map((o) => ({
        code: o.ticker,
        side: o.side,
        qty: o.qty,
        order_type: "NORMAL",
      })),
      skipped: reb.skipped,
      note:
        "Preview only. Place via your connected Futu/IBKR MCP after confirming; paper-first (SIMULATE) unless you explicitly switch to REAL.",
    };
  }

  // --- assemble allocations (spec §11 shape) -------------------------------
  const allocations = sized.allocations.map((a) => {
    const o = orderByTicker.get(a.ticker);
    return {
      ticker: a.ticker,
      target_weight: round4(a.target_weight),
      raw_kelly: round4(a.raw_kelly),
      flag: a.flag,
      ...(o
        ? {
            current_weight: round4(o.current_weight),
            action: o.action,
            delta_value: Math.round(o.delta_value),
            qty: o.qty,
            lot_size: o.lot_size,
          }
        : {}),
    };
  });

  return NextResponse.json({
    ok: true,
    allocations,
    cash: round4(sized.cash),
    cash_reason: sized.cash_reason,
    portfolio_conviction: round4(sized.portfolio_conviction),
    excluded: sized.excluded.map((e) => ({ ticker: e.ticker, flag: e.flag, reason: e.reason })),
    correlation: correlation
      ? {
          tickers: correlation.tickers,
          used: correlation.rho,
          sameDay: correlation.sameDay,
          window: correlation.corrWindow,
          obs: correlation.obs,
          source: correlation.source,
          missing: correlation.missing,
        }
      : null,
    rebalance_command,
    warnings,
  });
}

// ----------------------------------------------------------------------------
function num(x: any): number {
  const n = typeof x === "number" ? x : parseFloat(x);
  return Number.isFinite(n) ? n : 0;
}
function numOr(x: any, fallback: number): number {
  const n = typeof x === "number" ? x : parseFloat(x);
  return Number.isFinite(n) ? n : fallback;
}
function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
function round4(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}
