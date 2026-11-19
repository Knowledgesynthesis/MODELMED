import { quantile } from './core';

/** Harrell's recommended knot placements (quantiles) for restricted cubic splines. */
export const RCS_KNOT_QUANTILES: Record<number, number[]> = {
  3: [0.1, 0.5, 0.9],
  4: [0.05, 0.35, 0.65, 0.95],
  5: [0.05, 0.275, 0.5, 0.725, 0.95],
};

export function rcsKnots(values: number[], k: 3 | 4 | 5): number[] {
  const knots = RCS_KNOT_QUANTILES[k].map((q) => quantile(values, q));
  // de-duplicate (can happen for discrete predictors)
  return knots.filter((v, i) => i === 0 || v > knots[i - 1] + 1e-9);
}

/**
 * Restricted (natural) cubic spline basis: linear beyond the boundary knots.
 * Returns [x, s1, ..., s_{k-2}] — k-1 columns for k knots (Harrell, Regression Modeling Strategies, 2.4.5).
 */
export function rcsBasis(x: number, knots: number[]): number[] {
  const k = knots.length;
  if (k < 3) return [x];
  const tk = knots[k - 1];
  const tk1 = knots[k - 2];
  const scale = (tk - knots[0]) ** 2;
  const pos3 = (v: number) => (v > 0 ? v * v * v : 0);
  const out = [x];
  for (let j = 0; j < k - 2; j++) {
    const tj = knots[j];
    const val = pos3(x - tj) - (pos3(x - tk1) * (tk - tj)) / (tk - tk1) + (pos3(x - tk) * (tk1 - tj)) / (tk - tk1);
    out.push(val / scale);
  }
  return out;
}
