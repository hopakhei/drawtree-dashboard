"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import {
  DEFAULT_PARAMS,
  SECTORS,
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

type EditableIdea = Idea & { _import?: "idle" | "loading" | "ok" | "err"; _importMsg?: string };

let _seq = 0;
function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `idea-${++_seq}`;
}

function blankIdea(seed?: Partial<Idea>): EditableIdea {
  return {
    id: newId(),
    ticker: "",
    hypothesis: "",
    bull: 0,
    bear: 0,
    current: 0,
    conviction: 0.6,
    conviction_source: "manual",
    sector: "Other",
    lot_size: 1,
    _import: "idle",
    ...seed,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const pct0 = (x: number) => `${(x * 100).toFixed(0)}%`;

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
      hypothesis: "Data-center demand outruns the Street's growth-halving model.",
      current: 170,
      bull: 260,
      bear: 120,
      conviction: 0.68,
      sector: "Technology",
    }),
    blankIdea({
      ticker: "HK.00700",
      hypothesis: "Ad recovery + payments re-rating; policy overhang fades.",
      current: 420,
      bull: 560,
      bear: 330,
      conviction: 0.6,
      sector: "Communications",
      lot_size: 100,
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
    const ticker = idea.ticker.trim().toUpperCase();
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
      const current = val?.snapshot_price;
      const bull = val?.scenarios?.bull?.target_price;
      const bear = val?.scenarios?.bear?.target_price;
      const patch: Partial<EditableIdea> = {
        _import: "ok",
        _importMsg: t.importedFrom(tree?.agent_handle || "Draw Tree"),
        conviction_source: "mcp",
      };
      if (typeof conviction === "number") patch.conviction = conviction;
      if (typeof current === "number") patch.current = current;
      if (typeof bull === "number") patch.bull = bull;
      if (typeof bear === "number") patch.bear = bear;
      patchIdea(idea.id, patch);
    } catch {
      patchIdea(idea.id, { _import: "err", _importMsg: t.importFailed });
    }
  }

  // --- params --------------------------------------------------------------
  const [params, setParams] = useState<EngineParams>({ ...DEFAULT_PARAMS });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- correlations from real price history (Layer 2) ----------------------
  type CorrMeta = {
    source: string;
    obs: number;
    delta: number;
    missing: string[];
    note?: string;
  };
  const [corrSource, setCorrSource] = useState<CorrelationSource | null>(null);
  const [corrMeta, setCorrMeta] = useState<CorrMeta | null>(null);
  const [corrLoading, setCorrLoading] = useState(false);

  // Stable key of the distinct tickers in play — drives the (debounced) fetch.
  const tickerKey = useMemo(
    () =>
      Array.from(
        new Set(ideas.map((i) => i.ticker.trim().toUpperCase()).filter(Boolean)),
      )
        .sort()
        .join(","),
    [ideas],
  );

  useEffect(() => {
    const tickers = tickerKey ? tickerKey.split(",") : [];
    if (tickers.length < 2) {
      setCorrSource(null);
      setCorrMeta(null);
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
        if (j?.ok && Array.isArray(j.tickers) && j.tickers.length >= 2) {
          setCorrSource(() => buildCorrelationSource(j.tickers, j.rho));
          setCorrMeta({
            source: j.source,
            obs: j.obs,
            delta: j.delta,
            missing: j.missing || [],
            note: j.note,
          });
        } else {
          setCorrSource(null);
          setCorrMeta({
            source: "none",
            obs: j?.obs || 0,
            delta: 0,
            missing: j?.missing || tickers,
            note: j?.note,
          });
        }
      } catch {
        if (ignore) return;
        setCorrSource(null);
        setCorrMeta(null);
      } finally {
        if (!ignore) setCorrLoading(false);
      }
    }, 600);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [tickerKey]);

  // --- engine (live) -------------------------------------------------------
  const result = useMemo(
    () => sizePortfolio(ideas, params, corrSource ?? undefined),
    [ideas, params, corrSource],
  );
  const hasResult = result.allocations.length > 0 || result.cash > 0;

  // --- rebalance (logged-in) ----------------------------------------------
  const [showRebalance, setShowRebalance] = useState(false);
  const [broker, setBroker] = useState<Broker>("futu");
  const [nlv, setNlv] = useState<number>(1_000_000);
  const [positions, setPositions] = useState<Record<string, number>>({});

  const rebalance = useMemo(() => {
    if (!showRebalance || !loggedIn) return null;
    const pos = Object.entries(positions)
      .filter(([, sh]) => sh > 0)
      .map(([ticker, shares]) => ({ ticker, shares }));
    return generateRebalance(result.allocations, ideas, pos, nlv, broker, params);
  }, [showRebalance, loggedIn, positions, result.allocations, ideas, nlv, broker, params]);

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
            loggedIn
              ? "text-pos bg-sunken border-line"
              : "text-muted bg-sunken border-line"
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
                  style={{
                    width: `${Math.min(100, (result.portfolio_conviction / 3) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted mt-2 font-serif">
                {t.portfolioConvictionHint}
              </p>
            </div>

            {/* Correlation provenance (Layer 2) */}
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
                  {result.corr_pairs_live > 0 && corrMeta ? (
                    <>
                      {" · "}
                      {t.corrObs(corrMeta.obs)}
                      {" · "}
                      {t.corrShrinkage(corrMeta.delta.toFixed(2))}
                      {corrMeta.source && corrMeta.source !== "none"
                        ? ` · ${corrMeta.source}`
                        : ""}
                    </>
                  ) : null}
                </div>
              )}
              {!corrLoading && corrMeta?.missing?.length ? (
                <div className="mt-1 text-muted">
                  {t.corrMissing(corrMeta.missing.join(", "))}
                </div>
              ) : null}
              <div className="mt-1 text-muted font-serif">{t.corrNote}</div>
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
                    <div
                      className="h-full bg-line"
                      style={{ width: `${result.cash * 100}%` }}
                    />
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
          onClick={() => loggedIn && setShowRebalance((s) => !s)}
          className="flex items-baseline justify-between w-full text-left"
          disabled={!loggedIn}
        >
          <h2 className="text-lg font-serif">{t.rebalanceTitle}</h2>
          <span className="text-xs text-muted">
            {!loggedIn ? "🔒" : showRebalance ? "▾" : "▸"}
          </span>
        </button>

        {!loggedIn ? (
          <p className="text-sm text-muted mt-3 font-serif">{t.rebalanceLocked}</p>
        ) : (
          showRebalance && (
            <div className="mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {t.broker}
                  </span>
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

              {/* current positions per target name */}
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

              {/* orders */}
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

                  {/* execution gate */}
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
          )
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
  onPatch,
  onRemove,
  onImport,
  canRemove,
}: {
  idea: EditableIdea;
  index: number;
  t: any;
  loggedIn: boolean;
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

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Field label={t.ticker} className="col-span-2 sm:col-span-2">
          <input
            value={idea.ticker}
            onChange={(e) => onPatch(idea.id, { ticker: e.target.value })}
            placeholder="NVDA"
            className="w-full px-2 py-1.5 text-sm font-mono border border-line rounded focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label={t.sector}>
          <select
            value={idea.sector}
            onChange={(e) => onPatch(idea.id, { sector: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-line rounded bg-raised focus:outline-none focus:border-ink"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.current}>
          <input
            type="number"
            value={numOrEmpty(idea.current)}
            onChange={(e) => onPatch(idea.id, { current: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 text-sm font-mono tabular-nums border border-line rounded focus:outline-none focus:border-ink"
          />
        </Field>
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
        <Field label={t.lotSize}>
          <input
            type="number"
            value={numOrEmpty(idea.lot_size ?? 1)}
            onChange={(e) => onPatch(idea.id, { lot_size: parseFloat(e.target.value) || 1 })}
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
          {idea._import === "ok" && (
            <span className="text-muted"> · {t.sourceMcp}</span>
          )}
        </div>
      )}
    </div>
  );
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
      <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">
        {label}
      </span>
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
      <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">
        {label}
      </span>
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
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${cls}`}>
      {label}
    </span>
  );
}
