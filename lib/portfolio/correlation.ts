/* =============================================================================
   Drawtree — return-correlation estimation for Layer 2 (FLAM haircut)

   Correlations are estimated from historical daily log returns. Two figures are
   produced for every pair so nothing is a black box:

     • sameDay — the raw contemporaneous Pearson correlation of daily returns.
     • used    — the Pearson correlation of overlapping multi-day (default 5-day)
                 cumulative returns, which the engine consumes.

   Why the multi-day window? Markets in different time zones don't trade at the
   same instant. An ADR and its local ordinary line (e.g. BABA on NYSE and
   9988.HK on HKEX) are the *same company*, yet their same-day returns cover
   different ~12h news windows, so the contemporaneous correlation is badly
   understated — the linkage shows up a session later. A multi-day return window
   absorbs that offset and recovers the relationship. Because `used` is itself a
   Pearson correlation (of the windowed series) it stays in [−1,1] and, for a
   genuinely synchronous pair, ≈ the same-day figure — the correction is
   self-limiting, not a distortion.

   The engine uses `used` only as redundancy weights in the Layer-2 haircut (it
   never inverts the matrix — that's the whole point of the haircut
   approximation).

   Pure math — no I/O. Price history is fetched and aligned server-side
   (app/api/portfolio/correlations/route.ts) before it reaches here. Names with
   insufficient overlapping history never enter the estimator; the engine falls
   back to a sector prior for them.
   ============================================================================= */

/** Minimum overlapping return observations required to trust a sample estimate. */
export const MIN_OBS = 20;

/** Daily log returns from an aligned price series (length T → T-1 returns). */
export function logReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const a = prices[i - 1];
    const b = prices[i];
    if (a > 0 && b > 0) out.push(Math.log(b / a));
  }
  return out;
}

export type CorrelationResult = {
  /** Asset order matching the input rows. */
  tickers: string[];
  /** Overlapping multi-day return correlation (what the engine consumes). */
  used: number[][];
  /** Raw contemporaneous (same-day) Pearson correlation, for transparency. */
  sameDay: number[][];
  /** Cumulative-return window (trading days) used for the `used` figure. */
  window: number;
  /** Number of daily return observations used. */
  T: number;
  /** Number of assets. */
  N: number;
};

/**
 * Estimate same-day and window-adjusted correlations from per-asset return
 * series.
 *
 * @param tickers asset labels, one per row of `returns`
 * @param returns returns[i] is the equal-length daily return series for asset i
 * @param window  cumulative-return window in trading days (5 ⇒ weekly; absorbs
 *                the cross-market session offset)
 */
export function estimateCorrelations(
  tickers: string[],
  returns: number[][],
  window = 5,
): CorrelationResult {
  const N = returns.length;
  const T = N > 0 ? returns[0].length : 0;

  if (N < 2 || T < 2) {
    return { tickers, used: identity(N), sameDay: identity(N), window: 1, T, N };
  }

  const sameDay = pearsonMatrix(returns);

  const W = Math.max(1, Math.min(window, T - 1));
  const windowed = returns.map((r) => overlap(r, W));
  const used = windowed[0].length >= 2 ? pearsonMatrix(windowed) : sameDay;

  return { tickers, used, sameDay, window: W, T, N };
}

/** Pearson correlation matrix of equal-length series (rows = assets). */
function pearsonMatrix(series: number[][]): number[][] {
  const N = series.length;
  const T = N > 0 ? series[0].length : 0;
  const out = matrix(N, N);
  if (N === 0) return out;

  const mean = series.map((r) => r.reduce((s, x) => s + x, 0) / T);
  const x = series.map((r, i) => r.map((v) => v - mean[i]));
  const variance = x.map((r) => r.reduce((s, v) => s + v * v, 0) / T);

  for (let i = 0; i < N; i++) {
    out[i][i] = 1;
    for (let j = i + 1; j < N; j++) {
      const denom = Math.sqrt(variance[i] * variance[j]);
      let c = 0;
      if (denom > 0) {
        let acc = 0;
        for (let t = 0; t < T; t++) acc += x[i][t] * x[j][t];
        c = clampPm1(acc / T / denom);
      }
      out[i][j] = out[j][i] = c;
    }
  }
  return out;
}

/** Overlapping W-day cumulative returns: out[t] = Σ_{u<W} r[t−u]. */
function overlap(r: number[], w: number): number[] {
  if (w <= 1) return r.slice();
  const out: number[] = [];
  for (let t = w - 1; t < r.length; t++) {
    let s = 0;
    for (let u = 0; u < w; u++) s += r[t - u];
    out.push(s);
  }
  return out;
}

// ----------------------------------------------------------------------------
// CorrelationSource — the contract Layer 2 consumes
// ----------------------------------------------------------------------------
/** Pairwise correlation lookup. Returns null when a pair has no trusted
 *  history-based estimate, signalling the engine to use its sector fallback. */
export type CorrelationSource = {
  get(a: string, b: string): number | null;
};

/** Wrap a (tickers, matrix) estimate as a CorrelationSource. Unknown tickers →
 *  null (→ sector fallback). */
export function buildCorrelationSource(
  tickers: string[],
  corr: number[][],
): CorrelationSource {
  const idx = new Map<string, number>();
  tickers.forEach((tk, i) => idx.set(tk, i));
  return {
    get(a, b) {
      if (a === b) return 1;
      const i = idx.get(a);
      const j = idx.get(b);
      if (i == null || j == null) return null;
      const v = corr[i]?.[j];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    },
  };
}

// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------
function matrix(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
}
function identity(n: number): number[][] {
  const m = matrix(n, n);
  for (let i = 0; i < n; i++) m[i][i] = 1;
  return m;
}
function clampPm1(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(-1, x));
}
