"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import {
  DEFAULT_PARAMS,
  generateRebalance,
  sizePortfolio,
  type AllocationFlag,
  type Broker,
  type EngineParams,
  type Idea,
} from "@/lib/portfolio/engine";
import {
  buildCorrelationSource,
  type CorrelationSource,
} from "@/lib/portfolio/correlation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://api.drawtree.capital";

type EditableIdea = Idea & {
  name?: string;
  _import?: "idle" | "loading" | "ok" | "err";
  _importMsg?: string;
};

type Quote = {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  exchange: string;
  previousClose: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
};

type SearchItem = { symbol: string; name: string; exchange: string; type: string };

let _seq = 0;
function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `idea-${++_seq}`;
}

const norm = (s: string) => s.trim().toUpperCase();

function blankIdea(seed?: Partial<EditableIdea>): EditableIdea {
  return {
    id: newId(),
    ticker: "",
    name: "",
    hypothesis: "",
    bull: 0,
    bear: 0,
    current: 0,
    conviction: 0.6,
    conviction_source: "manual",
    lot_size: 1,
    _import: "idle",
    ...seed,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const pct0 = (x: number) => `${(x * 100).toFixed(0)}%`;
const fmtPrice = (x: number) =>
  x >= 1000 ? x.toLocaleString(undefined, { maximumFractionDigits: 0 }) : x.toFixed(2);

export default function PortfolioPage() {
  const { m } = useI18n();
  const t = m.portfolio;

  // --- auth (client-side, mirrors the rest of the dashboard) --------------
  const [handle, setHandle] = useState<string | null>(null);
  const loggedIn = handle !== null;
  useEffect(() => {
    let key: string | null = null;
    try {
      key = sessionStorage.getItem("drawtree_api_key");
    } catch {}
    if (!key) return;
    fetch(`${API_BASE}/v1/account/me`, { headers: { Authorization: `Bearer ${key}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me?.handle) setHandle(me.handle);
      })
      .catch(() => {});
  }, []);

  // --- ideas ---------------------------------------------------------------
  const [ideas, setIdeas] = useState<EditableIdea[]>([
    blankIdea({
      ticker: "NVDA",
      name: "NVIDIA Corporation",
      hypothesis: "Data-center demand outruns the Street's growth-halving model.",
      current: 170,
      bull: 260,
      bear: 120,
      conviction: 0.68,
    }),
    blankIdea({
      ticker: "0700.HK",
      name: "Tencent Holdings Ltd.",
      hypothesis: "Ad recovery + payments re-rating; policy overhang fades.",
      current: 420,
      bull: 560,
      bear: 330,
      conviction: 0.6,
    }),
  ]);

  function patchIdea(id: string, patch: Partial<EditableIdea>) {
    setIdeas((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function addIdea() {
    setIdeas((xs) => [...xs, blankIdea()]);
  }
  function removeIdea(id: string) {
    setIdeas((xs) => xs.filter((x) => x.id !== id));
  }

  async function importTree(idea: EditableIdea) {
    if (!loggedIn) return;
    const ticker = norm(idea.ticker);
    if (!ticker) {
      patchIdea(idea.id, { _import: "err", _importMsg: t.importNeedsTicker });
      return;
    }
    patchIdea(idea.id, { _import: "loading", _importMsg: "" });
    try {
      const r = await fetch(`${API_BASE}/v1/trees/${encodeURIComponent(ticker)}`);
      if (!r.ok) throw new Error("not found");
      const tree = await r.json();
      const conviction = tree?.aggregation?.conviction;
      const val = tree?.tree?.valuation;
      const bull = val?.scenarios?.bull?.target_price;
      const bear = val?.scenarios?.bear?.target_price;
      const patch: Partial<EditableIdea> = {
        _import: "ok",
        _importMsg: t.importedFrom(tree?.agent_handle || "Draw Tree"),
        conviction_source: "mcp",
      };
      if (typeof conviction === "number") patch.conviction = conviction;
      if (typeof bull === "number") patch.bull = bull;
      if (typeof bear === "number") patch.bear = bear;
      patchIdea(idea.id, patch);
    } catch {
      patchIdea(idea.id, { _import: "err", _importMsg: t.importFailed });
    }
  }

  // --- live quotes (current price + general info) --------------------------
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteState, setQuoteState] = useState<Record<string, "loading" | "ok" | "err">>({});
  const requested = useRef<Set<string>>(new Set());

  const tickerKey = useMemo(
    () => Array.from(new Set(ideas.map((i) => norm(i.ticker)).filter(Boolean))).sort().join(","),
    [ideas],
  );

  useEffect(() => {
    const tickers = tickerKey ? tickerKey.split(",") : [];
    tickers.forEach((tk) => {
      if (requested.current.has(tk)) return;
      requested.current.add(tk);
      setQuoteState((s) => ({ ...s, [tk]: "loading" }));
      fetch(`/api/portfolio/quote?symbol=${encodeURIComponent(tk)}`)
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && typeof j.price === "number") {
            setQuotes((q) => ({ ...q, [tk]: j as Quote }));
            setQuoteState((s) => ({ ...s, [tk]: "ok" }));
          } else {
            setQuoteState((s) => ({ ...s, [tk]: "err" }));
          }
        })
        .catch(() => setQuoteState((s) => ({ ...s, [tk]: "err" })));
    });
  }, [tickerKey]);

  // Ideas as the engine sees them: live price overrides the stored fallback.
  const engineIdeas = useMemo<Idea[]>(
    () =>
      ideas.map((i) => {
        const tk = norm(i.ticker);
        const q = quotes[tk];
        return {
          ...i,
          ticker: tk,
          current: q && q.price > 0 ? q.price : i.current,
          lot_size: i.lot_size && i.lot_size > 0 ? i.lot_size : 1,
        };
      }),
    [ideas, quotes],
  );

  // --- params --------------------------------------------------------------
  const [params, setParams] = useState<EngineParams>({ ...DEFAULT_PARAMS });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- correlations from real price history (Layer 2) ----------------------
  type CorrData = {
    tickers: string[];
    rho: number[][]; // window-adjusted, used by the engine
    sameDay: number[][]; // raw contemporaneous, for transparency
    window: number;
    obs: number;
    source: string;
    missing: string[];
    note?: string;
  };
  const [corrData, setCorrData] = useState<CorrData | null>(null);
  const [corrLoading, setCorrLoading] = useState(false);

  useEffect(() => {
    const tickers = tickerKey ? tickerKey.split(",") : [];
    if (tickers.length < 2) {
      setCorrData(null);
      setCorrLoading(false);
      return;
    }
    let ignore = false;
    setCorrLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/portfolio/correlations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers }),
        });
        const j = await r.json();
        if (ignore) return;
        setCorrData({
          tickers: Array.isArray(j?.tickers) ? j.tickers : [],
          rho: Array.isArray(j?.rho) ? j.rho : [],
          sameDay: Array.isArray(j?.sameDay) ? j.sameDay : [],
          window: j?.corrWindow || 0,
          obs: j?.obs || 0,
          source: j?.source || "none",
          missing: Array.isArray(j?.missing) ? j.missing : tickers,
          note: j?.note,
        });
      } catch {
        if (!ignore) setCorrData(null);
      } finally {
        if (!ignore) setCorrLoading(false);
      }
    }, 600);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [tickerKey]);

  const corrSource = useMemo<CorrelationSource | null>(
    () =>
      corrData && corrData.tickers.length >= 2 && corrData.rho.length
        ? buildCorrelationSource(corrData.tickers, corrData.rho)
        : null,
    [corrData],
  );

  // --- engine (live) -------------------------------------------------------
  const result = useMemo(
    () => sizePortfolio(engineIdeas, params, corrSource ?? undefined),
    [engineIdeas, params, corrSource],
  );
  const hasResult = result.allocations.length > 0 || result.cash > 0;

  // --- rebalance (logged-in) ----------------------------------------------
  const [showRebalance, setShowRebalance] = useState(false);
  const [broker, setBroker] = useState<Broker>("futu");
  const [nlv, setNlv] = useState<number>(1_000_000);
  const [positions, setPositions] = useState<Record<string, number>>({});

  const rebalance = useMemo(() => {
    if (!showRebalance) return null;
    const pos = Object.entries(positions)
      .filter(([, sh]) => sh > 0)
      .map(([ticker, shares]) => ({ ticker, shares }));
    return generateRebalance(result.allocations, engineIdeas, pos, nlv, broker, params);
  }, [showRebalance, positions, result.allocations, engineIdeas, nlv, broker, params]);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Link href="/" className="text-xs text-muted underline-offset-4 hover:underline">
        {m.common.backToHome}
      </Link>

      <header className="mt-4 mb-10">
        <h1 className="text-3xl tracking-tight font-serif">{t.title}</h1>
        <p className="text-muted mt-3 max-w-2xl text-sm leading-relaxed font-serif">
          {t.subtitle}
        </p>
        <div
          className={`mt-5 text-sm rounded px-4 py-3 border ${
            loggedIn ? "text-pos bg-sunken border-line" : "text-muted bg-sunken border-line"
          }`}
        >
          {loggedIn ? t.loggedInAs(handle!) : t.loginNudge}
        </div>
      </header>

      {/* ---- Ideas ---- */}
      <section className="border border-line rounded p-6 mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-serif">{t.ideasTitle}</h2>
          <button
            onClick={addIdea}
            className="px-3 py-1.5 text-xs border border-line rounded hover:bg-line/40"
          >
            {t.addIdea}
          </button>
        </div>
        <p className="text-xs text-muted mt-2 mb-5 font-serif">{t.ideasHint}</p>

        <div className="space-y-4">
          {ideas.map((idea, idx) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              index={idx}
              t={t}
              loggedIn={loggedIn}
              quote={quotes[norm(idea.ticker)]}
              quoteStatus={quoteState[norm(idea.ticker)]}
              onPatch={patchIdea}
              onRemove={removeIdea}
              onImport={importTree}
              canRemove={ideas.length > 1}
            />
          ))}
        </div>

        {/* Advanced params */}
        <div className="mt-6 border-t border-line pt-4">
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-xs text-muted hover:text-ink"
          >
            {showAdvanced ? "▾" : "▸"} {t.advanced}
          </button>
          {showAdvanced && (
            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ParamField
                  label={t.kellyFraction}
                  value={params.kelly_fraction}
                  step={0.05}
                  onChange={(v) => setParams((p) => ({ ...p, kelly_fraction: v }))}
                />
                <ParamField
                  label={t.positionCap}
                  value={params.position_cap}
                  step={0.01}
                  onChange={(v) => setParams((p) => ({ ...p, position_cap: v }))}
                />
                <ParamField
                  label={t.haircutLambda}
                  value={params.haircut_lambda}
                  step={0.1}
                  onChange={(v) => setParams((p) => ({ ...p, haircut_lambda: v }))}
                />
                <ParamField
                  label={t.noTradeThreshold}
                  value={params.no_trade_threshold}
                  step={0.005}
                  onChange={(v) => setParams((p) => ({ ...p, no_trade_threshold: v }))}
                />
              </div>
              <p className="text-xs text-muted mt-3 font-serif">{t.paramsHint}</p>
            </div>
          )}
        </div>
      </section>

      {/* ---- Results ---- */}
      <section className="border border-line rounded p-6 mb-8">
        <h2 className="text-lg font-serif mb-5">{t.resultsTitle}</h2>

        {!hasResult ? (
          <p className="text-sm text-muted font-serif">{t.emptyResults}</p>
        ) : (
          <>
            {/* Portfolio conviction meter */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-muted">
                  {t.portfolioConviction}
                </span>
                <span className="text-2xl tabular-nums font-mono text-clay">
                  {result.portfolio_conviction.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded bg-sunken overflow-hidden">
                <div
                  className="h-full bg-clay"
                  style={{ width: `${Math.min(100, (result.portfolio_conviction / 3) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-2 font-serif">{t.portfolioConvictionHint}</p>
            </div>

            {/* Correlation provenance + matrix (Layer 2) */}
            <div className="mb-6 text-xs rounded border border-line bg-sunken px-3 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="uppercase tracking-wider text-muted">{t.corrTitle}</span>
                {corrLoading ? (
                  <span className="text-muted">{t.corrLoading}</span>
                ) : result.corr_pairs_live > 0 ? (
                  <span className="text-pos">{t.corrLiveBadge}</span>
                ) : (
                  <span className="text-muted">{t.corrFallbackBadge}</span>
                )}
              </div>
              {!corrLoading && (
                <div className="mt-1 text-muted font-mono">
                  {t.corrPairs(result.corr_pairs_live, result.corr_pairs_total)}
                  {result.corr_pairs_live > 0 && corrData ? (
                    <>
                      {" · "}
                      {t.corrObs(corrData.obs)}
                      {corrData.window ? ` · ${t.corrWindowDays(corrData.window)}` : ""}
                      {corrData.source && corrData.source !== "none"
                        ? ` · ${corrData.source}`
                        : ""}
                    </>
                  ) : null}
                </div>
              )}
              {!corrLoading && corrData?.missing?.length ? (
                <div className="mt-1 text-muted">{t.corrMissing(corrData.missing.join(", "))}</div>
              ) : null}

              {!corrLoading && corrData && corrData.tickers.length >= 2 && corrData.rho.length ? (
                <CorrelationTable data={corrData} t={t} />
              ) : null}

              <div className="mt-2 text-muted font-serif">{t.corrNote}</div>
            </div>

            {/* Allocations */}
            <div className="space-y-2">
              {result.allocations.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-mono text-sm truncate">{a.ticker}</span>
                  <div className="flex-1 h-6 rounded bg-sunken overflow-hidden relative">
                    <div
                      className="h-full bg-clay/80"
                      style={{ width: `${a.target_weight * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums font-mono text-sm">
                    {pct(a.target_weight)}
                  </span>
                  <span className="w-20 shrink-0 text-right">
                    <FlagPill flag={a.flag} t={t} />
                  </span>
                </div>
              ))}

              {result.cash > 1e-9 && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="w-28 shrink-0 font-mono text-sm text-muted truncate">
                    {result.cash_reason === "diversification_limit"
                      ? t.cashDiversification
                      : t.cash}
                  </span>
                  <div className="flex-1 h-6 rounded bg-sunken overflow-hidden">
                    <div className="h-full bg-line" style={{ width: `${result.cash * 100}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums font-mono text-sm text-muted">
                    {pct(result.cash)}
                  </span>
                  <span className="w-20 shrink-0" />
                </div>
              )}
            </div>

            {/* Excluded */}
            {result.excluded.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                  {t.excludedTitle}
                </h3>
                <div className="space-y-1">
                  {result.excluded.map((e) => (
                    <div key={e.id} className="flex items-baseline gap-2 text-sm">
                      <span className="font-mono">{e.ticker}</span>
                      <FlagPill flag="do_not_buy" t={t} />
                      <span className="text-muted text-xs font-serif">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                  {t.warningsTitle}
                </h3>
                <ul className="list-disc list-inside text-xs text-muted space-y-1 font-serif">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---- Rebalance ---- */}
      <section className="border border-line rounded p-6 mb-8">
        <button
          onClick={() => setShowRebalance((s) => !s)}
          className="flex items-baseline justify-between w-full text-left"
        >
          <h2 className="text-lg font-serif">{t.rebalanceTitle}</h2>
          <span className="text-xs text-muted">{showRebalance ? "▾" : "▸"}</span>
        </button>

        {showRebalance && (
          <div className="mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted">{t.broker}</span>
                  <select
                    value={broker}
                    onChange={(e) => setBroker(e.target.value as Broker)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-line rounded bg-raised focus:outline-none focus:border-ink"
                  >
                    <option value="futu">Futu</option>
                    <option value="ibkr">IBKR</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted">{t.nlv}</span>
                  <input
                    type="number"
                    value={Number.isFinite(nlv) ? nlv : ""}
                    onChange={(e) => setNlv(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
                  />
                </label>
              </div>

              <div className="mb-2 text-xs uppercase tracking-wider text-muted">
                {t.currentShares}
              </div>
              <p className="text-xs text-muted mb-3 font-serif">{t.noPositions}</p>
              <div className="space-y-2 mb-5">
                {result.allocations.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 font-mono text-sm truncate">{a.ticker}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={t.sharesPlaceholder}
                      value={positions[a.ticker] ?? ""}
                      onChange={(e) =>
                        setPositions((p) => ({
                          ...p,
                          [a.ticker]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-40 px-3 py-1.5 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
                    />
                  </div>
                ))}
              </div>

              {rebalance && (
                <div className="border-t border-line pt-4">
                  <h3 className="text-xs uppercase tracking-wider text-muted mb-3">
                    {broker.toUpperCase()} · {t.orders}
                  </h3>
                  {rebalance.orders.length === 0 ? (
                    <p className="text-sm text-muted font-serif">{t.noOrders}</p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted">
                        <span className="w-28 shrink-0">{t.ticker}</span>
                        <span className="w-14 shrink-0">{t.side}</span>
                        <span className="w-20 shrink-0 text-right">{t.qty}</span>
                        <span className="flex-1 text-right">{t.drift}</span>
                      </div>
                      {rebalance.orders.map((o) => (
                        <div
                          key={o.ticker}
                          className="flex items-center gap-3 text-sm tabular-nums font-mono"
                        >
                          <span className="w-28 shrink-0 truncate">{o.ticker}</span>
                          <span
                            className={`w-14 shrink-0 ${
                              o.side === "BUY" ? "text-pos" : "text-neg"
                            }`}
                          >
                            {o.side}
                          </span>
                          <span className="w-20 shrink-0 text-right">
                            {o.qty.toLocaleString()}
                          </span>
                          <span className="flex-1 text-right text-muted text-xs">
                            {pct0(o.current_weight)} → {pct0(o.target_weight)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {rebalance.skipped.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-[10px] uppercase tracking-wider text-muted mb-1">
                        {t.skipped}
                      </h4>
                      <div className="text-xs text-muted space-y-0.5 font-mono">
                        {rebalance.skipped.map((s) => (
                          <div key={s.ticker}>
                            {s.ticker} ·{" "}
                            {s.reason === "below_no_trade_threshold"
                              ? t.skipBelowThreshold
                              : s.reason === "no_price"
                              ? t.skipNoPrice
                              : t.skipLotZero}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      disabled
                      className="self-start px-4 py-2 text-sm rounded bg-ink/10 text-muted border border-line cursor-not-allowed"
                    >
                      {t.executeDisabled}
                    </button>
                    <p className="text-xs text-muted font-serif">{t.executeNote}</p>
                    <p className="text-xs text-muted font-serif">{t.persistenceNote}</p>
                  </div>
                </div>
              )}
            </div>
        )}
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// sub-components
// ---------------------------------------------------------------------------
function IdeaRow({
  idea,
  index,
  t,
  loggedIn,
  quote,
  quoteStatus,
  onPatch,
  onRemove,
  onImport,
  canRemove,
}: {
  idea: EditableIdea;
  index: number;
  t: any;
  loggedIn: boolean;
  quote?: Quote;
  quoteStatus?: "loading" | "ok" | "err";
  onPatch: (id: string, patch: Partial<EditableIdea>) => void;
  onRemove: (id: string) => void;
  onImport: (idea: EditableIdea) => void;
  canRemove: boolean;
}) {
  const numOrEmpty = (v: number) => (Number.isFinite(v) && v !== 0 ? v : "");
  return (
    <div className="border border-line rounded p-4 bg-raised">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted font-mono">#{index + 1}</span>
        <div className="flex items-center gap-2">
          {loggedIn && (
            <button
              onClick={() => onImport(idea)}
              className="px-2 py-1 text-[11px] border border-line rounded hover:bg-line/40 text-clay"
            >
              {idea._import === "loading" ? t.importing : t.importFromTree}
            </button>
          )}
          {canRemove && (
            <button
              onClick={() => onRemove(idea.id)}
              className="px-2 py-1 text-[11px] text-muted hover:text-neg"
            >
              {t.remove}
            </button>
          )}
        </div>
      </div>

      {/* Ticker search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">
            {t.ticker}
          </span>
          <TickerSearch
            value={idea.ticker}
            t={t}
            onSelect={(r) =>
              onPatch(idea.id, { ticker: r.symbol, name: r.name, _import: "idle", _importMsg: "" })
            }
          />
        </div>

        {/* General info panel */}
        <div className="sm:col-span-2 flex items-end">
          <InfoPanel idea={idea} quote={quote} status={quoteStatus} t={t} />
        </div>
      </div>

      {/* Thesis inputs */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Field label={t.conviction}>
          <input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={Number.isFinite(idea.conviction) ? idea.conviction : ""}
            onChange={(e) =>
              onPatch(idea.id, {
                conviction: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                conviction_source: "manual",
              })
            }
            className="w-full px-2 py-1.5 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label={t.bull}>
          <input
            type="number"
            value={numOrEmpty(idea.bull)}
            onChange={(e) => onPatch(idea.id, { bull: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label={t.bear}>
          <input
            type="number"
            value={numOrEmpty(idea.bear)}
            onChange={(e) => onPatch(idea.id, { bear: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
          />
        </Field>
      </div>

      <input
        value={idea.hypothesis ?? ""}
        onChange={(e) => onPatch(idea.id, { hypothesis: e.target.value })}
        placeholder={t.hypothesis}
        className="mt-3 w-full px-2 py-1.5 text-sm font-serif border border-line rounded focus:outline-none focus:border-ink"
      />

      {idea._import && idea._import !== "idle" && idea._importMsg && (
        <div
          className={`mt-2 text-[11px] ${
            idea._import === "ok"
              ? "text-pos"
              : idea._import === "err"
              ? "text-neg"
              : "text-muted"
          }`}
        >
          {idea._importMsg}
          {idea._import === "ok" && <span className="text-muted"> · {t.sourceMcp}</span>}
        </div>
      )}
    </div>
  );
}

function InfoPanel({
  idea,
  quote,
  status,
  t,
}: {
  idea: EditableIdea;
  quote?: Quote;
  status?: "loading" | "ok" | "err";
  t: any;
}) {
  if (!idea.ticker) {
    return <div className="text-xs text-muted font-serif">{t.infoEmpty}</div>;
  }
  if (status === "loading" && !quote) {
    return <div className="text-xs text-muted">{t.quoteFetching}</div>;
  }
  if (quote) {
    const up = (quote.changePct ?? 0) >= 0;
    return (
      <div className="w-full rounded bg-sunken border border-line px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-serif truncate">{quote.name || idea.name}</span>
          <span className="text-[10px] text-muted font-mono shrink-0">{quote.exchange}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-base">
            {fmtPrice(quote.price)}
            <span className="text-[10px] text-muted ml-1">{quote.currency}</span>
          </span>
          {quote.changePct != null && (
            <span className={`text-xs ${up ? "text-pos" : "text-neg"}`}>
              {up ? "+" : ""}
              {quote.changePct.toFixed(2)}%
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted">{t.priceLive}</span>
        </div>
      </div>
    );
  }
  // err / no quote — fall back to stored info
  return (
    <div className="w-full rounded bg-sunken border border-line px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-serif truncate">{idea.name || idea.ticker}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
        <span className="text-base">{idea.current > 0 ? fmtPrice(idea.current) : "—"}</span>
        <span className="ml-auto text-[10px] text-neg">{t.quoteFailed}</span>
      </div>
    </div>
  );
}

function TickerSearch({
  value,
  t,
  onSelect,
}: {
  value: string;
  t: any;
  onSelect: (r: SearchItem) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/portfolio/search?q=${encodeURIComponent(term)}`);
        const j = await r.json();
        if (!ignore) setResults(Array.isArray(j?.results) ? j.results : []);
      } catch {
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [q, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        value={open ? q : value}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        placeholder={t.searchPlaceholder}
        className="w-full px-2 py-1.5 text-sm font-mono border border-line rounded focus:outline-none focus:border-ink"
      />
      {open && q.trim().length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded border border-line bg-raised shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-xs text-muted">{t.searching}</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted">{t.noResults}</div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.symbol}-${r.exchange}`}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                  setQ("");
                }}
                className="block w-full text-left px-3 py-2 hover:bg-line/40 border-b border-line last:border-0"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm">{r.symbol}</span>
                  <span className="text-[10px] text-muted shrink-0">{r.exchange}</span>
                </div>
                <div className="text-xs text-muted truncate font-serif">{r.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CorrelationTable({
  data,
  t,
}: {
  data: { tickers: string[]; rho: number[][]; sameDay: number[][]; window: number };
  t: any;
}) {
  const [open, setOpen] = useState(true);
  const { tickers, rho, sameDay } = data;

  // Pairs where the window adjustment materially changed the figure — this is
  // the cross-market correction (e.g. an ADR vs its local ordinary line).
  const adjustments: { a: string; b: string; sd: number; adj: number }[] = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const adj = rho[i]?.[j];
      const sd = sameDay[i]?.[j];
      if (typeof adj === "number" && typeof sd === "number" && Math.abs(adj - sd) > 0.1) {
        adjustments.push({ a: tickers[i], b: tickers[j], sd, adj });
      }
    }
  }

  return (
    <div className="mt-3">
      <button onClick={() => setOpen((o) => !o)} className="text-muted hover:text-ink">
        {open ? "▾" : "▸"} {t.corrMatrixTitle}
      </button>
      {open && (
        <div className="mt-2">
          <div className="overflow-x-auto">
            <table className="border-collapse font-mono text-[10px]">
              <thead>
                <tr>
                  <th className="p-1" />
                  {tickers.map((tk) => (
                    <th
                      key={tk}
                      className="p-1 font-normal text-muted text-right whitespace-nowrap"
                    >
                      {tk}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((ti, i) => (
                  <tr key={ti}>
                    <th className="p-1 font-normal text-muted text-right whitespace-nowrap">
                      {ti}
                    </th>
                    {tickers.map((tj, j) => {
                      const v = i === j ? 1 : rho[i]?.[j] ?? 0;
                      return (
                        <td
                          key={tj}
                          className="p-1 text-right tabular-nums text-ink"
                          style={{ background: tint(v) }}
                        >
                          {v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {adjustments.length > 0 && (
            <div className="mt-3">
              <div className="uppercase tracking-wider text-muted mb-1">
                {t.corrAdjustmentsTitle}
              </div>
              <div className="space-y-0.5 font-mono text-muted">
                {adjustments.map((p, i) => (
                  <div key={i}>
                    {t.corrPairLine(p.a, p.b, p.sd.toFixed(2), p.adj.toFixed(2))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function tint(v: number): string {
  if (v > 0) return `rgba(217,119,87,${Math.min(0.7, v * 0.65)})`; // clay → positive
  if (v < 0) return `rgba(90,100,112,${Math.min(0.5, -v * 0.45)})`; // muted → negative
  return "transparent";
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function ParamField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2 py-1.5 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
      />
    </label>
  );
}

function FlagPill({ flag, t }: { flag: AllocationFlag; t: any }) {
  if (!flag) return null;
  const label =
    flag === "do_not_buy" ? t.flagDoNotBuy : flag === "capped" ? t.flagCapped : t.flagHaircut;
  const cls =
    flag === "do_not_buy"
      ? "text-neg bg-sunken"
      : flag === "capped"
      ? "text-clay bg-sunken"
      : "text-muted bg-sunken";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${cls}`}>{label}</span>
  );
}
