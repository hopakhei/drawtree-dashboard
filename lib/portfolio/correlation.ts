/* =============================================================================
   Drawtree — return-correlation estimation for Layer 2 (FLAM haircut)

   Implements the spec's intended covariance path: a sample correlation matrix
   estimated from historical daily log returns, regularized with Ledoit-Wolf
   shrinkage toward a constant-correlation target (Ledoit & Wolf 2004, "Honey,
   I shrunk the sample covariance matrix").

   Pure math — no I/O. The price history is fetched server-side and aligned
   before it reaches here (see app/api/portfolio/correlations/route.ts). Names
   with insufficient overlapping history never enter this estimator; the engine
   falls back to a sector prior for them.
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

export type CorrelationEstimate = {
  /** Asset order matching the input rows. */
  tickers: string[];
  /** Shrunk correlation matrix (symmetric, unit diagonal). */
  corr: number[][];
  /** Ledoit-Wolf shrinkage intensity δ ∈ [0,1] (1 = fully toward target). */
  delta: number;
  /** Average off-diagonal sample correlation (the shrink target). */
  rbar: number;
  /** Number of return observations used. */
  T: number;
  /** Number of assets. */
  N: number;
};

/**
 * Ledoit-Wolf shrunk correlation from per-asset return series.
 *
 * @param tickers asset labels, one per row of `returns`
 * @param returns returns[i] is the equal-length return series for asset i
 *
 * On the correlation scale, the shrinkage collapses to a clean form:
 *   C_ij = δ·r̄ + (1-δ)·r_ij          (off-diagonal)
 * because the constant-correlation target shares the sample variances, so the
 * diagonal is preserved exactly. We still compute δ via the full LW formulas
 * (π̂, ρ̂, γ̂) so the intensity is the asymptotically optimal one, not a guess.
 */
export function ledoitWolfCorrelation(
  tickers: string[],
  returns: number[][],
): CorrelationEstimate {
  const N = returns.length;
  const T = N > 0 ? returns[0].length : 0;

  // Degenerate guards — caller should have filtered, but be safe.
  if (N < 2 || T < 2) {
    const corr = identity(N);
    return { tickers, corr, delta: 1, rbar: 0, T, N };
  }

  // Demean each series.
  const mean = returns.map((r) => r.reduce((s, x) => s + x, 0) / T);
  const x: number[][] = returns.map((r, i) => r.map((v) => v - mean[i]));

  // Sample covariance S (1/T convention, as in Ledoit-Wolf).
  const s: number[][] = matrix(N, N);
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      let acc = 0;
      for (let t = 0; t < T; t++) acc += x[i][t] * x[j][t];
      const v = acc / T;
      s[i][j] = v;
      s[j][i] = v;
    }
  }

  // Variances must be positive; a flat series can't be correlated.
  for (let i = 0; i < N; i++) {
    if (!(s[i][i] > 0)) {
      const corr = identity(N);
      return { tickers, corr, delta: 1, rbar: 0, T, N };
    }
  }

  // Sample correlation + average off-diagonal correlation r̄.
  const r: number[][] = matrix(N, N);
  let rsum = 0;
  let pairs = 0;
  for (let i = 0; i < N; i++) {
    r[i][i] = 1;
    for (let j = i + 1; j < N; j++) {
      const c = s[i][j] / Math.sqrt(s[i][i] * s[j][j]);
      r[i][j] = c;
      r[j][i] = c;
      rsum += c;
      pairs++;
    }
  }
  const rbar = pairs > 0 ? rsum / pairs : 0;

  // Constant-correlation target F.
  const f: number[][] = matrix(N, N);
  for (let i = 0; i < N; i++) {
    f[i][i] = s[i][i];
    for (let j = i + 1; j < N; j++) {
      const v = rbar * Math.sqrt(s[i][i] * s[j][j]);
      f[i][j] = v;
      f[j][i] = v;
    }
  }

  // π̂ = Σ_ij πᵢⱼ, with πᵢⱼ = (1/T) Σ_t (xᵢₜxⱼₜ − sᵢⱼ)².
  const pi: number[][] = matrix(N, N);
  let piHat = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      let acc = 0;
      for (let t = 0; t < T; t++) {
        const d = x[i][t] * x[j][t] - s[i][j];
        acc += d * d;
      }
      const v = acc / T;
      pi[i][j] = v;
      pi[j][i] = v;
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) piHat += pi[i][j];

  // ρ̂ — diagonal π terms + the constant-correlation cross terms.
  // ϑ̂_kk,ij = (1/T) Σ_t (x_kt² − s_kk)(x_it x_jt − s_ij)
  const theta = (k: number, i: number, j: number): number => {
    let acc = 0;
    for (let t = 0; t < T; t++) {
      acc += (x[k][t] * x[k][t] - s[k][k]) * (x[i][t] * x[j][t] - s[i][j]);
    }
    return acc / T;
  };
  let rhoHat = 0;
  for (let i = 0; i < N; i++) rhoHat += pi[i][i];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const term =
        (rbar / 2) *
        (Math.sqrt(s[j][j] / s[i][i]) * theta(i, i, j) +
          Math.sqrt(s[i][i] / s[j][j]) * theta(j, i, j));
      rhoHat += term;
    }
  }

  // γ̂ = Σ_ij (Fᵢⱼ − sᵢⱼ)².
  let gammaHat = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const d = f[i][j] - s[i][j];
      gammaHat += d * d;
    }
  }

  // Optimal shrinkage intensity.
  let delta: number;
  if (!(gammaHat > 0)) {
    delta = 1; // sample already equals the target — shrink fully, harmless.
  } else {
    const kappa = (piHat - rhoHat) / gammaHat;
    delta = clamp01(kappa / T);
  }

  // Shrunk correlation: convex pull of each r_ij toward r̄.
  const corr: number[][] = matrix(N, N);
  for (let i = 0; i < N; i++) {
    corr[i][i] = 1;
    for (let j = i + 1; j < N; j++) {
      const c = delta * rbar + (1 - delta) * r[i][j];
      corr[i][j] = c;
      corr[j][i] = c;
    }
  }

  return { tickers, corr, delta, rbar, T, N };
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
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 1;
  return Math.min(1, Math.max(0, x));
}
