import { Rng } from '../stats/random';
import { auc } from '../stats/metrics';
import { logit } from '../stats/core';

export type Predictor = (X: number[][]) => number[];

/**
 * Exact interventional Shapley values (the quantity KernelSHAP / "interventional TreeSHAP" approximate).
 * v(S) = average model output when features in S are fixed to the patient's values and the rest are
 * drawn from a background sample. Computed on the log-odds scale so contributions add up exactly.
 * Complexity: 2^p × |background| model evaluations — fine for p ≤ 10.
 */
export function exactShapley(f: Predictor, x: number[], background: number[][], scale: 'logit' | 'prob' = 'logit') {
  const p = x.length;
  const nSub = 1 << p;
  const rows: number[][] = [];
  for (let mask = 0; mask < nSub; mask++) {
    for (const b of background) {
      const r = new Array(p);
      for (let j = 0; j < p; j++) r[j] = mask & (1 << j) ? x[j] : b[j];
      rows.push(r);
    }
  }
  const out = f(rows).map((v) => (scale === 'logit' ? logit(v) : v));
  const B = background.length;
  const v = new Float64Array(nSub);
  for (let mask = 0; mask < nSub; mask++) {
    let s = 0;
    for (let k = 0; k < B; k++) s += out[mask * B + k];
    v[mask] = s / B;
  }
  const fact = [1];
  for (let i = 1; i <= p; i++) fact[i] = fact[i - 1] * i;
  const phi = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    for (let mask = 0; mask < nSub; mask++) {
      if (mask & (1 << j)) continue;
      let size = 0;
      for (let t = mask; t; t &= t - 1) size++;
      const w = (fact[size] * fact[p - size - 1]) / fact[p];
      phi[j] += w * (v[mask | (1 << j)] - v[mask]);
    }
  }
  return { base: v[0], phi, prediction: v[nSub - 1] };
}

/**
 * Permutation importance (Breiman 2001; Fisher, Rudin & Dominici 2019): drop in AUC when a feature's
 * values are shuffled in the evaluation set, averaged over repeats. Correlated features share credit
 * and permutation creates unrealistic patients — interpret with care.
 */
export function permutationImportance(f: Predictor, X: number[][], y: number[], repeats = 5, seed = 3) {
  const rng = new Rng(seed);
  const base = auc(f(X), y);
  const p = X[0].length;
  return Array.from({ length: p }, (_, j) => {
    const drops: number[] = [];
    for (let r = 0; r < repeats; r++) {
      const col = rng.shuffle(X.map((row) => row[j]));
      const Xp = X.map((row, i) => {
        const c = [...row];
        c[j] = col[i];
        return c;
      });
      drops.push(base - auc(f(Xp), y));
    }
    const m = drops.reduce((a, b) => a + b, 0) / repeats;
    const s = Math.sqrt(drops.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, repeats - 1));
    return { feature: j, drop: m, sd: s };
  });
}
