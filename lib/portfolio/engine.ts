/* =============================================================================
   Drawtree — AI Conviction-Driven Position Sizing & Rebalancing Engine
   Production Spec v1.3 · Layers 1–5, pure & deterministic (no I/O, no deps).

   Layer 1  Raw fractional Kelly         f_i = max(0, c·(p·b − q·a)/(a·b))
   Layer 2  Fundamental Law of Active Management — correlation-haircut alpha
            distribution: w_L2 ∝ k_i · 1/(1 + λ_h·redundancy_i)
   Layer 3  Normalize to 100%
   Layer 4  Iterative 33% cap (water-fill) + cash fallback for too-few names
   Layer 5  Rebalance command generator (delta → board-lot orders)

   Covariance note: the spec calls for a Ledoit-Wolf shrunk Ω with a sector-tag
   fallback for thin-history names. In the browser we have no return history, so
   this MVP implements the *sector-tag fallback* directly — a same-sector vs.
   cross-sector correlation prior. The full shrunk-covariance path is post-MVP
   (it belongs server-side where price history is available).
   ============================================================================= */

export type ConvictionSource = "manual" | "mcp";

export type Idea = {
  /** Local row id (stable across edits, not sent to any broker). */
  id: string;
  ticker: string;
  hypothesis?: string;
  /** Bull-case target price. */
  bull: number;
  /** Bear-case target price. */
  bear: number;
  /** Current price (manual, or imported from a Draw Tree valuation snapshot). */
  current: number;
  /** Conviction p ∈ (0,1). */
  conviction: number;
  conviction_source?: ConvictionSource;
  /** Sector tag — drives the correlation haircut. Empty/"Other" = uncorrelated prior. */
  sector?: string;
  /** Board lot size for share rounding (HK names trade in lots; US = 1). */
  lot_size?: number;
};

export type EngineParams = {
  /** Kelly fraction c — quarter-Kelly default for margin of safety. */
  kelly_fraction: number;
  /** Hard per-name ceiling (0.33). */
  position_cap: number;
  /** Active-risk-aversion knob λ_h for the correlation haircut. */
  haircut_lambda: number;
  /** Skip rebalance trades whose drift is below this fraction of NLV. */
  no_trade_threshold: number;
};

export const DEFAULT_PARAMS: EngineParams = {
  kelly_fraction: 0.25,
  position_cap: 0.33,
  haircut_lambda: 0.9,
  no_trade_threshold: 0.01,
};

/** Sector vocabulary used for the correlation-haircut prior. */
export const SECTORS = [
  "Technology",
  "Financials",
  "Healthcare",
  "Consumer",
  "Industrials",
  "Energy",
  "Materials",
  "Utilities",
  "Real Estate",
  "Communications",
  "Other",
] as const;
export type Sector = (typeof SECTORS)[number];

/** Same known-sector names are treated as highly correlated; everything else
 *  (including "Other"/unknown) gets a low cross-sector prior. */
const RHO_SAME_SECTOR = 0.7;
const RHO_CROSS_SECTOR = 0.15;

function correlation(a: Idea, b: Idea): number {
  const sa = (a.sector || "Other").trim();
  const sb = (b.sector || "Other").trim();
  if (sa && sb && sa !== "Other" && sa === sb) return RHO_SAME_SECTOR;
  return RHO_CROSS_SECTOR;
}

export type AllocationFlag = "do_not_buy" | "capped" | "haircut" | null;

export type Allocation = {
  id: string;
  ticker: string;
  /** Layer-1 raw fractional Kelly f_i (pre-normalization). */
  raw_kelly: number;
  /** Final target weight after Layers 2–4 (0 for excluded names). */
  target_weight: number;
  flag: AllocationFlag;
  /** Upside odds b = (bull − current)/current. */
  b: number;
  /** Downside magnitude a = (current − bear)/current. */
  a: number;
  /** Human-readable reason when excluded. */
  reason?: string;
};

export type SizeResult = {
  /** Names that survived Layer 1 (target_weight ≥ 0), sorted desc by weight. */
  allocations: Allocation[];
  /** Names dropped at Layer 1 (negative edge / invalid case). */
  excluded: Allocation[];
  /** Residual cash fraction. */
  cash: number;
  cash_reason: "diversification_limit" | null;
  /** Portfolio Conviction meter = Σ raw Kelly over survivors (pre-normalization). */
  portfolio_conviction: number;
  warnings: string[];
};

// ----------------------------------------------------------------------------
// Layer 1 — Raw fractional Kelly
// ----------------------------------------------------------------------------
type KellyResult = { f: number; b: number; a: number; reason?: string };

export function rawKelly(idea: Idea, c: number): KellyResult {
  const P = idea.current;
  const p = clamp01(idea.conviction);
  const q = 1 - p;
  const b = (idea.bull - P) / P;
  const a = (P - idea.bear) / P;

  if (!(P > 0)) return { f: 0, b, a, reason: "current price must be > 0" };
  if (!(b > 0)) return { f: 0, b, a, reason: "bull target must exceed current price" };
  if (!(a > 0)) return { f: 0, b, a, reason: "bear target must be below current price" };

  // f = c · (p·b − q·a) / (a·b)
  const edge = p * b - q * a;
  const f = c * (edge / (a * b));
  if (!(f > 0)) return { f: 0, b, a, reason: "negative edge — do not buy" };
  return { f, b, a };
}

// ----------------------------------------------------------------------------
// Layers 1–4 — full sizing pipeline
// ----------------------------------------------------------------------------
export function sizePortfolio(ideas: Idea[], params: EngineParams = DEFAULT_PARAMS): SizeResult {
  const c = params.kelly_fraction;
  const cap = params.position_cap;
  const lambda = params.haircut_lambda;
  const warnings: string[] = [];

  // --- Layer 1 -------------------------------------------------------------
  const survivors: { idea: Idea; f: number; b: number; a: number }[] = [];
  const excluded: Allocation[] = [];
  for (const idea of ideas) {
    if (!idea.ticker.trim()) continue;
    const { f, b, a, reason } = rawKelly(idea, c);
    if (f > 0) {
      survivors.push({ idea, f, b, a });
    } else {
      excluded.push({
        id: idea.id,
        ticker: idea.ticker,
        raw_kelly: 0,
        target_weight: 0,
        flag: "do_not_buy",
        b,
        a,
        reason,
      });
      warnings.push(`${idea.ticker || "(idea)"} excluded — ${reason || "no edge"}.`);
    }
  }

  const portfolio_conviction = survivors.reduce((s, x) => s + x.f, 0);

  if (survivors.length === 0) {
    return {
      allocations: [],
      excluded,
      cash: 1,
      cash_reason: "diversification_limit",
      portfolio_conviction: 0,
      warnings: warnings.length ? warnings : ["No names with positive edge — fully in cash."],
    };
  }

  // --- Layer 2 — FLAM correlation-haircut ---------------------------------
  // k_i = normalized Layer-1 alpha (the μ vector).
  const totalF = portfolio_conviction || 1;
  const k = survivors.map((x) => x.f / totalF);

  const wL2 = survivors.map((x, i) => {
    let redundancy = 0;
    for (let j = 0; j < survivors.length; j++) {
      if (j === i) continue;
      redundancy += correlation(x.idea, survivors[j].idea) * k[j];
    }
    const haircutFactor = 1 / (1 + lambda * redundancy);
    return { w: Math.max(0, k[i] * haircutFactor), haircutFactor };
  });

  // --- Layer 3 — normalize to 100% ----------------------------------------
  const sumL2 = wL2.reduce((s, x) => s + x.w, 0) || 1;
  let weights = wL2.map((x) => x.w / sumL2);

  // --- Layer 4 — iterative 33% cap (water-fill) + cash fallback -----------
  const N = survivors.length;
  let cash = 0;
  let cash_reason: SizeResult["cash_reason"] = null;
  const cappedFlags = new Array<boolean>(N).fill(false);

  if (cap * N <= 1 + 1e-9) {
    // Too few names to fully invest under the cap → all at cap, rest is cash.
    weights = weights.map(() => cap);
    for (let i = 0; i < N; i++) cappedFlags[i] = true;
    cash = Math.max(0, 1 - cap * N);
    if (cash > 1e-9) {
      cash_reason = "diversification_limit";
      warnings.push(
        `Only ${N} eligible name${N === 1 ? "" : "s"} — each capped at ${(cap * 100).toFixed(
          0,
        )}%, ${(cash * 100).toFixed(1)}% held as cash (diversification limit).`,
      );
    }
  } else {
    // Water-fill: cap breaches down, redistribute excess pro-rata to names
    // strictly below the cap, repeat until no breach.
    for (let iter = 0; iter < 100; iter++) {
      let excess = 0;
      const below: number[] = [];
      let belowSum = 0;
      for (let i = 0; i < N; i++) {
        if (weights[i] > cap + 1e-12) {
          excess += weights[i] - cap;
          weights[i] = cap;
          cappedFlags[i] = true;
        } else if (weights[i] < cap - 1e-12) {
          below.push(i);
          belowSum += weights[i];
        }
      }
      if (excess <= 1e-12 || below.length === 0 || belowSum <= 0) break;
      for (const i of below) weights[i] += excess * (weights[i] / belowSum);
    }
  }

  // --- Assemble allocations + flags ---------------------------------------
  const allocations: Allocation[] = survivors.map((x, i) => {
    let flag: AllocationFlag = null;
    if (cappedFlags[i]) flag = "capped";
    else if (wL2[i].haircutFactor < 0.95) flag = "haircut";
    return {
      id: x.idea.id,
      ticker: x.idea.ticker,
      raw_kelly: x.f,
      target_weight: weights[i],
      flag,
      b: x.b,
      a: x.a,
    };
  });

  allocations.sort((p, q) => q.target_weight - p.target_weight);
  return { allocations, excluded, cash, cash_reason, portfolio_conviction, warnings };
}

// ----------------------------------------------------------------------------
// Layer 5 — Rebalance command generator
// ----------------------------------------------------------------------------
export type Position = { ticker: string; shares: number };

export type Broker = "ibkr" | "futu";

export type RebalanceOrder = {
  ticker: string;
  side: "BUY" | "SELL";
  qty: number;
  lot_size: number;
  current_weight: number;
  target_weight: number;
  delta_value: number;
  order_type: "NORMAL";
};

export type SkippedOrder = {
  ticker: string;
  current_weight: number;
  target_weight: number;
  delta_value: number;
  reason: "below_no_trade_threshold" | "no_price" | "lot_rounds_to_zero";
};

export type RebalanceResult = {
  broker: Broker;
  nlv: number;
  orders: RebalanceOrder[];
  skipped: SkippedOrder[];
  warnings: string[];
};

export function generateRebalance(
  allocations: Allocation[],
  ideas: Idea[],
  positions: Position[],
  nlv: number,
  broker: Broker,
  params: EngineParams = DEFAULT_PARAMS,
): RebalanceResult {
  const orders: RebalanceOrder[] = [];
  const skipped: SkippedOrder[] = [];
  const warnings: string[] = [];

  const priceOf = new Map<string, number>();
  const lotOf = new Map<string, number>();
  for (const idea of ideas) {
    if (idea.ticker) {
      priceOf.set(idea.ticker, idea.current);
      lotOf.set(idea.ticker, idea.lot_size && idea.lot_size > 0 ? idea.lot_size : 1);
    }
  }
  const targetOf = new Map<string, number>();
  for (const a of allocations) targetOf.set(a.ticker, a.target_weight);
  const sharesOf = new Map<string, number>();
  for (const p of positions) if (p.ticker) sharesOf.set(p.ticker, p.shares);

  if (!(nlv > 0)) {
    return { broker, nlv, orders, skipped, warnings: ["Net Liquidation Value must be > 0."] };
  }

  // Union of target names and currently-held names (held-not-targeted → sell to 0).
  const tickers = new Set<string>([...targetOf.keys(), ...sharesOf.keys()]);

  for (const ticker of tickers) {
    const target_weight = targetOf.get(ticker) ?? 0;
    const price = priceOf.get(ticker);
    const shares = sharesOf.get(ticker) ?? 0;

    if (price == null || !(price > 0)) {
      // Held name with no known price — can't compute a delta safely.
      skipped.push({
        ticker,
        current_weight: 0,
        target_weight,
        delta_value: 0,
        reason: "no_price",
      });
      warnings.push(`${ticker}: no current price available — order skipped.`);
      continue;
    }

    const current_value = shares * price;
    const current_weight = current_value / nlv;
    const target_value = target_weight * nlv;
    const delta_value = target_value - current_value;

    if (Math.abs(delta_value) / nlv < params.no_trade_threshold) {
      skipped.push({
        ticker,
        current_weight,
        target_weight,
        delta_value,
        reason: "below_no_trade_threshold",
      });
      continue;
    }

    const lot = lotOf.get(ticker) ?? 1;
    const side: "BUY" | "SELL" = delta_value > 0 ? "BUY" : "SELL";
    // Round toward zero on board lots → never overshoot / oversell.
    let qty = Math.floor(Math.abs(delta_value) / price / lot) * lot;
    if (side === "SELL") qty = Math.min(qty, Math.floor(shares / lot) * lot);

    if (qty <= 0) {
      skipped.push({
        ticker,
        current_weight,
        target_weight,
        delta_value,
        reason: "lot_rounds_to_zero",
      });
      continue;
    }

    orders.push({
      ticker,
      side,
      qty,
      lot_size: lot,
      current_weight,
      target_weight,
      delta_value,
      order_type: "NORMAL",
    });
  }

  // Sells first (free up buying power before buys), then by size.
  orders.sort((x, y) => {
    if (x.side !== y.side) return x.side === "SELL" ? -1 : 1;
    return Math.abs(y.delta_value) - Math.abs(x.delta_value);
  });

  return { broker, nlv, orders, skipped, warnings };
}

// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
