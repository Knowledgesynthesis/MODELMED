import { Rng } from '@/lib/stats/random';
import { expit } from '@/lib/stats/core';

/** A reproducible population with known true risks: lp ~ N(mu, sigma), y ~ Bernoulli(expit(lp)). */
export function simulatePopulation(n: number, mu: number, sigma: number, seed = 5) {
  const rng = new Rng(seed);
  const lp = Array.from({ length: n }, () => rng.normal(mu, sigma));
  const y = lp.map((v) => rng.bernoulli(expit(v)));
  return { lp, y };
}

/** Distort predictions on the logit scale around a centre: logit(p̂) = centre + offset + spread × (lp − centre). */
export const distort = (lp: number[], offset: number, spread: number, centre = 0) => lp.map((v) => expit(centre + offset + spread * (v - centre)));
