import { expit } from '../stats/core';
import { invert, solve } from '../stats/linalg';

export interface LogisticFit {
  /** Intercept first, then one coefficient per column of X. */
  beta: number[];
  /** Standard errors from the observed information (only meaningful when lambda = 0). */
  se: number[];
  converged: boolean;
  iterations: number;
  logLik: number;
  /** True when coefficients diverge — a sign of (quasi-)complete separation. */
  separation: boolean;
}

export interface LogisticOptions {
  /** Ridge (L2) penalty on non-intercept coefficients; 0 = maximum likelihood. */
  lambda?: number;
  maxIter?: number;
  tol?: number;
  /** Optional fixed offset added to the linear predictor (used for recalibration). */
  offset?: number[];
}

/**
 * Logistic regression by Newton–Raphson / IRLS with step-halving (the estimator behind R's glm()).
 * With lambda > 0 it maximises the ridge-penalised log-likelihood.
 */
export function fitLogistic(X: number[][], y: number[], opts: LogisticOptions = {}): LogisticFit {
  const { lambda = 0, maxIter = 60, tol = 1e-9, offset } = opts;
  const n = y.length;
  const p = (X[0]?.length ?? 0) + 1;
  let beta = new Array(p).fill(0);
  const ybar = y.reduce((a, b) => a + b, 0) / Math.max(1, n);
  if (!offset) beta[0] = Math.log(Math.max(1e-6, ybar) / Math.max(1e-6, 1 - ybar));

  const objective = (b: number[]) => {
    let ll = 0;
    for (let i = 0; i < n; i++) {
      const xi = X[i];
      let eta = b[0] + (offset ? offset[i] : 0);
      for (let j = 1; j < p; j++) eta += b[j] * xi[j - 1];
      // log-likelihood in a numerically stable form
      ll += y[i] * eta - (eta > 0 ? eta + Math.log1p(Math.exp(-eta)) : Math.log1p(Math.exp(eta)));
    }
    let pen = 0;
    for (let j = 1; j < p; j++) pen += b[j] * b[j];
    return ll - 0.5 * lambda * pen;
  };

  const derivatives = (b: number[]) => {
    const g = new Array(p).fill(0);
    const H = Array.from({ length: p }, () => new Array(p).fill(0));
    for (let i = 0; i < n; i++) {
      const xi = X[i];
      let eta = b[0] + (offset ? offset[i] : 0);
      for (let j = 1; j < p; j++) eta += b[j] * xi[j - 1];
      const mu = expit(eta);
      const w = Math.max(mu * (1 - mu), 1e-12);
      const r = y[i] - mu;
      g[0] += r;
      H[0][0] += w;
      for (let j = 1; j < p; j++) {
        const xj = xi[j - 1];
        g[j] += r * xj;
        H[0][j] += w * xj;
        for (let k = j; k < p; k++) H[j][k] += w * xj * xi[k - 1];
      }
    }
    for (let j = 0; j < p; j++) for (let k = 0; k < j; k++) H[j][k] = H[k][j];
    for (let j = 1; j < p; j++) {
      g[j] -= lambda * b[j];
      H[j][j] += lambda;
    }
    return { g, H };
  };

  let obj = objective(beta);
  let converged = false;
  let it = 0;
  for (it = 1; it <= maxIter; it++) {
    const { g, H } = derivatives(beta);
    const step = solve(H, g);
    if (!step) break;
    let t = 1;
    let cand = beta.map((b, j) => b + step[j]);
    let candObj = objective(cand);
    while (candObj < obj - 1e-12 && t > 1e-6) {
      t /= 2;
      cand = beta.map((b, j) => b + t * step[j]);
      candObj = objective(cand);
    }
    const change = Math.abs(candObj - obj);
    beta = cand;
    obj = candObj;
    if (change < tol * (Math.abs(obj) + tol)) {
      converged = true;
      break;
    }
  }
  const { H } = derivatives(beta);
  const inv = invert(H);
  const se = inv ? inv.map((row, j) => Math.sqrt(Math.max(0, row[j]))) : new Array(p).fill(NaN);
  const separation = beta.some((b) => Math.abs(b) > 25) || se.some((s) => !Number.isFinite(s) || s > 1e3);
  let ll = 0;
  {
    const lam = lambda;
    let pen = 0;
    for (let j = 1; j < p; j++) pen += beta[j] * beta[j];
    ll = obj + 0.5 * lam * pen;
  }
  return { beta, se, converged, iterations: it, logLik: ll, separation };
}

export function predictLogistic(beta: number[], X: number[][], offset?: number[]): number[] {
  return X.map((xi, i) => {
    let eta = beta[0] + (offset ? offset[i] : 0);
    for (let j = 1; j < beta.length; j++) eta += beta[j] * xi[j - 1];
    return expit(eta);
  });
}

export function linearPredictor(beta: number[], X: number[][]): number[] {
  return X.map((xi) => {
    let eta = beta[0];
    for (let j = 1; j < beta.length; j++) eta += beta[j] * xi[j - 1];
    return eta;
  });
}
