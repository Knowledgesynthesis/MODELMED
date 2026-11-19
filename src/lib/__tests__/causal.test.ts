import { describe, expect, it } from 'vitest';
import { Rng } from '../stats/random';
import { expit, mean } from '../stats/core';
import { crudeEffect, eValue, eValueForCI, iptWeights, iptwEffect, mantelHaenszelRateRatio, propensityScores, smd, standardizedEffect, weightSummary } from '../stats/causal';

describe('E-value', () => {
  it('reproduces VanderWeele & Ding (2017): RR 3.9 → 7.26', () => {
    expect(eValue(3.9)).toBeCloseTo(7.26, 2);
    expect(eValue(1 / 3.9)).toBeCloseTo(7.26, 2);
    expect(eValue(1)).toBe(1);
    expect(eValueForCI(1.4, 0.9, 2.1)).toBe(1);
    expect(eValueForCI(3.9, 1.8, 8.7)).toBeCloseTo(1.8 + Math.sqrt(1.8 * 0.8), 6);
  });
});

describe('confounding adjustment recovers the true marginal effect', () => {
  const rng = new Rng(11);
  const n = 40000;
  const L = Array.from({ length: n }, () => [rng.normal(), rng.bernoulli(0.3)]);
  const A = L.map((l) => rng.bernoulli(expit(-0.4 + 1.2 * l[0] + 0.8 * l[1])));
  const lp = (a: number, l: number[]) => -2 + 0.5 * a + 0.9 * l[0] + 0.7 * l[1];
  const Y = A.map((a, i) => rng.bernoulli(expit(lp(a, L[i]))));
  const truth = mean(L.map((l) => expit(lp(1, l)))) - mean(L.map((l) => expit(lp(0, l))));

  it('crude estimate is confounded upward', () => {
    expect(crudeEffect(A, Y).rd - truth).toBeGreaterThan(0.05);
  });
  it('g-formula and IPTW are close to the truth', () => {
    expect(standardizedEffect(A, L, Y).rd).toBeCloseTo(truth, 1);
    const ps = propensityScores(A, L);
    const w = iptWeights(A, ps);
    expect(Math.abs(iptwEffect(A, Y, w).rd - truth)).toBeLessThan(0.02);
    expect(Math.abs(smd(L.map((l) => l[0]), A))).toBeGreaterThan(0.5);
    expect(Math.abs(smd(L.map((l) => l[0]), A, w))).toBeLessThan(0.1);
    const s = weightSummary(w);
    expect(s.mean).toBeCloseTo(1, 1);
    expect(s.ess).toBeLessThan(n);
  });
});

describe('Mantel–Haenszel rate ratio', () => {
  it('equals the common stratum ratio when homogeneous', () => {
    expect(mantelHaenszelRateRatio([[10, 100, 20, 100], [30, 50, 120, 100]])).toBeCloseTo(0.5, 10);
  });
});
