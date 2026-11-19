import { expit, mean } from './core';
import { fitLogistic, predictLogistic } from '../ml/logistic';

export interface EffectEstimate {
  risk1: number;
  risk0: number;
  rd: number;
  rr: number;
}

const effect = (risk1: number, risk0: number): EffectEstimate => ({ risk1, risk0, rd: risk1 - risk0, rr: risk1 / risk0 });

/** Unadjusted risks in treated vs untreated. */
export function crudeEffect(A: number[], Y: number[]): EffectEstimate {
  let n1 = 0, y1 = 0, n0 = 0, y0 = 0;
  A.forEach((a, i) => (a ? ((n1 += 1), (y1 += Y[i])) : ((n0 += 1), (y0 += Y[i]))));
  return effect(y1 / n1, y0 / n0);
}

/**
 * Standardisation / parametric g-formula: fit an outcome model Y ~ A + L, predict every patient's risk
 * under A = 1 and under A = 0, and average over the whole population (marginal effect).
 */
export function standardizedEffect(A: number[], L: number[][], Y: number[]): EffectEstimate {
  const X = A.map((a, i) => [a, ...L[i]]);
  const fit = fitLogistic(X, Y);
  const p1 = predictLogistic(fit.beta, L.map((l) => [1, ...l]));
  const p0 = predictLogistic(fit.beta, L.map((l) => [0, ...l]));
  return effect(mean(p1), mean(p0));
}

/** Propensity score P(A = 1 | L) from a logistic model. */
export function propensityScores(A: number[], L: number[][]): number[] {
  const fit = fitLogistic(L, A);
  return predictLogistic(fit.beta, L);
}

export interface WeightSummary {
  max: number;
  mean: number;
  /** Kish effective sample size, Σw² / Σw²-normalised. */
  ess: number;
}

/** Stabilised inverse-probability-of-treatment weights: P(A=a) / P(A=a | L). */
export function iptWeights(A: number[], ps: number[], stabilised = true): number[] {
  const pA = mean(A);
  return A.map((a, i) => {
    const p = Math.min(1 - 1e-6, Math.max(1e-6, ps[i]));
    return a ? (stabilised ? pA : 1) / p : (stabilised ? 1 - pA : 1) / (1 - p);
  });
}

export function weightSummary(w: number[]): WeightSummary {
  const s = w.reduce((a, b) => a + b, 0);
  const s2 = w.reduce((a, b) => a + b * b, 0);
  return { max: Math.max(...w), mean: s / w.length, ess: (s * s) / s2 };
}

/** IPTW (Hájek) estimate of the marginal risks. */
export function iptwEffect(A: number[], Y: number[], w: number[]): EffectEstimate {
  let n1 = 0, y1 = 0, n0 = 0, y0 = 0;
  A.forEach((a, i) => (a ? ((n1 += w[i]), (y1 += w[i] * Y[i])) : ((n0 += w[i]), (y0 += w[i] * Y[i]))));
  return effect(y1 / n1, y0 / n0);
}

/** Standardised mean difference of a covariate between groups (optionally weighted). < 0.1 is the usual balance target. */
export function smd(x: number[], A: number[], w?: number[]): number {
  const stats = (g: number) => {
    let sw = 0, sx = 0, sxx = 0;
    x.forEach((v, i) => {
      if (A[i] !== g) return;
      const wi = w ? w[i] : 1;
      sw += wi;
      sx += wi * v;
      sxx += wi * v * v;
    });
    const m = sx / sw;
    return { m, v: Math.max(0, sxx / sw - m * m) };
  };
  const a = stats(1), b = stats(0);
  const pooled = Math.sqrt((a.v + b.v) / 2);
  return pooled > 0 ? (a.m - b.m) / pooled : 0;
}

/**
 * E-value (VanderWeele & Ding, Ann Intern Med 2017): the minimum strength of association, on the risk-ratio
 * scale, that an unmeasured confounder would need with both treatment and outcome to explain away the estimate.
 */
export function eValue(rr: number): number {
  if (!(rr > 0)) return NaN;
  const r = rr < 1 ? 1 / rr : rr;
  return r + Math.sqrt(r * (r - 1));
}

/** E-value for the confidence limit closest to the null (1 if the interval includes 1). */
export function eValueForCI(rr: number, lo: number, hi: number): number {
  if (lo <= 1 && hi >= 1) return 1;
  return eValue(rr > 1 ? lo : hi);
}

/** Person-time rate ratio (exposed vs unexposed). */
export function rateRatio(d1: number, t1: number, d0: number, t0: number) {
  const r1 = d1 / t1, r0 = d0 / t0;
  const se = Math.sqrt(1 / Math.max(d1, 0.5) + 1 / Math.max(d0, 0.5));
  const rr = r1 / r0;
  return { rr, lo: rr * Math.exp(-1.96 * se), hi: rr * Math.exp(1.96 * se), r1, r0 };
}

/** Mantel–Haenszel rate ratio across strata: each stratum = [d1, t1, d0, t0]. */
export function mantelHaenszelRateRatio(strata: [number, number, number, number][]): number {
  let num = 0, den = 0;
  for (const [d1, t1, d0, t0] of strata) {
    const T = t1 + t0;
    if (T <= 0) continue;
    num += (d1 * t0) / T;
    den += (d0 * t1) / T;
  }
  return num / den;
}

export { expit };
