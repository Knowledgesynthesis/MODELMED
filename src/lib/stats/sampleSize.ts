import { expit } from './core';

/**
 * Minimum sample size for developing a binary-outcome prediction model
 * (Riley et al., BMJ 2020;368:m441 — the method implemented in pmsampsize).
 */
export interface SampleSizeInput {
  parameters: number; // candidate predictor parameters (df), not variables
  prevalence: number;
  r2cs: number; // anticipated Cox–Snell R²
  shrinkage?: number; // target expected uniform shrinkage, default 0.9
  delta?: number; // max optimism in Nagelkerke R², default 0.05
  margin?: number; // absolute margin of error for overall risk, default 0.05
}

export interface SampleSizeResult {
  maxR2cs: number;
  criterion1: number; // shrinkage
  criterion2: number; // optimism in R²
  criterion3: number; // precise intercept / overall risk
  n: number;
  events: number;
  epp: number; // events per candidate predictor parameter
  shrinkageAtN: number;
}

export const maxR2cs = (prev: number) => 1 - Math.pow(Math.pow(prev, prev) * Math.pow(1 - prev, 1 - prev), 2);

export function rileySampleSize(input: SampleSizeInput): SampleSizeResult {
  const { parameters: P, prevalence: phi, r2cs: R, shrinkage = 0.9, delta = 0.05, margin = 0.05 } = input;
  const maxR = maxR2cs(phi);
  const nFor = (S: number) => P / ((S - 1) * Math.log(1 - R / S));
  const c1 = Math.ceil(nFor(shrinkage));
  const S2 = R / (R + delta * maxR);
  const c2 = Math.ceil(nFor(S2));
  const c3 = Math.ceil((1.96 / margin) ** 2 * phi * (1 - phi));
  const n = Math.max(c1, c2, c3);
  const S = Math.max(shrinkage, S2);
  // expected shrinkage at the final n:  S = 1 + P / (n ln(1 − R/S))  solved by iteration
  let s = S;
  for (let i = 0; i < 100; i++) s = 1 + P / (n * Math.log(1 - R / s));
  return { maxR2cs: maxR, criterion1: c1, criterion2: c2, criterion3: c3, n, events: n * phi, epp: (n * phi) / P, shrinkageAtN: s };
}

/**
 * Convert an anticipated C-statistic and prevalence into Cox–Snell R² (Riley, Van Calster & Collins,
 * Stat Med 2021). We assume the linear predictor is normally distributed and integrate numerically
 * instead of simulating a million patients.
 */
export function r2csFromC(c: number, prevalence: number): number {
  const grid = 301;
  const moments = (mu: number, sigma: number) => {
    const xs: number[] = [];
    const ws: number[] = [];
    let wsum = 0;
    for (let i = 0; i < grid; i++) {
      const z = -8 + (16 * i) / (grid - 1);
      const w = Math.exp(-0.5 * z * z);
      xs.push(mu + sigma * z);
      ws.push(w);
      wsum += w;
    }
    let prev = 0;
    for (let i = 0; i < grid; i++) {
      ws[i] /= wsum;
      prev += ws[i] * expit(xs[i]);
    }
    let cumCtrl = 0, conc = 0, ll = 0;
    for (let i = 0; i < grid; i++) {
      const p = expit(xs[i]);
      const case_ = ws[i] * p;
      const ctrl = ws[i] * (1 - p);
      conc += case_ * (cumCtrl + 0.5 * ctrl);
      cumCtrl += ctrl;
      if (p > 0 && p < 1) ll += ws[i] * (p * Math.log(p) + (1 - p) * Math.log(1 - p));
    }
    return { prev, c: conc / (prev * (1 - prev)), ll };
  };
  const muFor = (sigma: number) => {
    let lo = -20, hi = 20;
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (moments(mid, sigma).prev < prevalence) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  let lo = 0.001, hi = 12;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (moments(muFor(mid), mid).c < c) lo = mid;
    else hi = mid;
  }
  const sigma = (lo + hi) / 2;
  const m = moments(muFor(sigma), sigma);
  const llNull = prevalence * Math.log(prevalence) + (1 - prevalence) * Math.log(1 - prevalence);
  return 1 - Math.exp(-2 * (m.ll - llNull));
}
