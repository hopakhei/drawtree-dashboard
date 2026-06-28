/* =============================================================================
   Server-side price-history → correlation pipeline (shared).

   Fetches ~6mo daily closes (Yahoo primary, Stooq fallback), aligns on common
   trading dates, and produces same-day + window-adjusted correlations. Used by
   both /api/portfolio/correlations and /api/portfolio/size-and-rebalance so the
   data path lives in exactly one place.

   Free, no-key sources — unofficial and rate-limit-prone; any ticker we can't
   price is returned in `missing` and the engine falls back to its sector prior.
   ============================================================================= */
import { MIN_OBS, estimateCorrelations, logReturns } from "./correlation";

const FETCH_TIMEOUT_MS = 9000;
const MAX_OBS = 200; // bound history length (Stooq returns multi-year CSV)
const CORR_WINDOW = 5; // trading-day window for the cross-market-adjusted figure

type Series = Map<string, number>; // date(YYYY-MM-DD) → close

export type CorrelationPayload = {
  ok: true;
  window: "6mo";
  source: string;
  tickers: string[];
  rho: number[][]; // window-adjusted (engine consumes this)
  sameDay: number[][];
  corrWindow: number;
  obs: number;
  missing: string[];
  note?: string;
};

/** Estimate the correlation matrix for a set of tickers from real history. */
export async function computeCorrelations(rawTickers: string[]): Promise<CorrelationPayload> {
  const tickers = Array.from(
    new Set(rawTickers.map((t) => String(t || "").trim().toUpperCase()).filter(Boolean)),
  ).slice(0, 25);

  if (tickers.length < 2) {
    return empty(tickers, "none", 0, "Need at least two tickers to estimate correlations.");
  }

  const fetched = await Promise.all(
    tickers.map(async (tk) => {
      const y = await fetchYahoo(tk);
      if (y && y.size >= MIN_OBS + 1) return { tk, series: y, source: "yahoo" as const };
      const s = await fetchStooq(tk);
      if (s && s.size >= MIN_OBS + 1) return { tk, series: s, source: "stooq" as const };
      return { tk, series: null, source: null };
    }),
  );

  const good = fetched.filter((f) => f.series) as {
    tk: string;
    series: Series;
    source: "yahoo" | "stooq";
  }[];
  const missing = fetched.filter((f) => !f.series).map((f) => f.tk);

  if (good.length < 2) {
    return empty(tickers, "none", 0, "Could not retrieve enough history; using sector fallback.");
  }

  // Align on the intersection of trading dates present in every good series.
  let commonDates: string[] | null = null;
  for (const g of good) {
    const dates = new Set(g.series.keys());
    commonDates = commonDates == null ? [...dates] : commonDates.filter((d) => dates.has(d));
  }
  commonDates = (commonDates ?? []).sort();
  if (commonDates.length > MAX_OBS) commonDates = commonDates.slice(-MAX_OBS);

  if (commonDates.length < MIN_OBS + 1) {
    return empty(
      tickers,
      good[0].source,
      commonDates.length,
      `Only ${commonDates.length} overlapping observations (< ${MIN_OBS + 1}); using sector fallback.`,
    );
  }

  const returns = good.map((g) => logReturns(commonDates!.map((d) => g.series.get(d)!)));
  const labels = good.map((g) => g.tk);
  const est = estimateCorrelations(labels, returns, CORR_WINDOW);

  const sources = Array.from(new Set(good.map((g) => g.source)));
  return {
    ok: true,
    window: "6mo",
    source: sources.length === 1 ? sources[0] : "mixed",
    tickers: est.tickers,
    rho: est.used,
    sameDay: est.sameDay,
    corrWindow: est.window,
    obs: est.T,
    missing,
  };
}

function empty(missing: string[], source: string, obs: number, note: string): CorrelationPayload {
  return {
    ok: true,
    window: "6mo",
    source,
    tickers: [],
    rho: [],
    sameDay: [],
    corrWindow: 0,
    obs,
    missing,
    note,
  };
}

// ----------------------------------------------------------------------------
// symbol mapping
// ----------------------------------------------------------------------------
/** Map a Drawtree/Futu-style ticker to a Yahoo Finance symbol. */
export function toYahoo(ticker: string): string {
  const tk = ticker.trim().toUpperCase();
  const m = tk.match(/^([A-Z]+)\.(.+)$/);
  if (m) {
    const ex = m[1];
    const code = m[2];
    if (ex === "HK") return `${String(parseInt(code, 10)).padStart(4, "0")}.HK`;
    if (ex === "US") return code;
    if (ex === "SH") return `${code}.SS`;
    if (ex === "SZ") return `${code}.SZ`;
    if (/^[A-Z]{1,2}$/.test(code)) return `${ex}-${code}`; // BRK.B → BRK-B
    return tk;
  }
  return tk;
}

/** Map to a Stooq symbol (US + HK supported in the fallback). */
function toStooq(ticker: string): string | null {
  const tk = ticker.trim().toUpperCase();
  const m = tk.match(/^([A-Z]+)\.(.+)$/);
  if (m) {
    const ex = m[1];
    const code = m[2];
    if (ex === "HK") return `${String(parseInt(code, 10)).padStart(4, "0")}.hk`;
    if (ex === "US") return `${code.toLowerCase()}.us`;
    return null;
  }
  return `${tk.toLowerCase()}.us`;
}

// ----------------------------------------------------------------------------
// providers
// ----------------------------------------------------------------------------
async function fetchYahoo(ticker: string): Promise<Series | null> {
  const sym = toYahoo(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    sym,
  )}?range=6mo&interval=1d`;
  try {
    const j = await fetchJSON(url);
    const res = j?.chart?.result?.[0];
    const ts: number[] | undefined = res?.timestamp;
    const adj: (number | null)[] | undefined = res?.indicators?.adjclose?.[0]?.adjclose;
    const close: (number | null)[] | undefined = res?.indicators?.quote?.[0]?.close;
    const px = adj ?? close;
    if (!ts || !px || ts.length !== px.length) return null;
    const series: Series = new Map();
    for (let i = 0; i < ts.length; i++) {
      const p = px[i];
      if (p == null || !(p > 0)) continue;
      series.set(isoDate(ts[i] * 1000), p);
    }
    return series.size ? series : null;
  } catch {
    return null;
  }
}

async function fetchStooq(ticker: string): Promise<Series | null> {
  const sym = toStooq(ticker);
  if (!sym) return null;
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&i=d`;
  try {
    const text = await fetchText(url);
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2 || !/^date,/i.test(lines[0])) return null;
    const series: Series = new Map();
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const date = cols[0];
      const cl = parseFloat(cols[4]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(cl > 0)) continue;
      series.set(date, cl);
    }
    return series.size ? series : null;
  } catch {
    return null;
  }
}

async function fetchJSON(url: string): Promise<any> {
  return JSON.parse(await fetchText(url));
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DrawtreeBot/1.0)" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
