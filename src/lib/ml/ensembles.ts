import { Rng } from '../stats/random';
import { expit, logit, mean } from '../stats/core';
import { fitBoostTree, fitTree, predictTree, presort, type TreeNode } from './tree';

export interface ForestOptions {
  nTrees?: number;
  maxDepth?: number;
  minSamplesLeaf?: number;
  mtry?: number;
  seed?: number;
}

/** Random forest (Breiman, Machine Learning 2001): bootstrap samples + random feature subsets per split. */
export function fitForest(X: number[][], y: number[], opts: ForestOptions = {}) {
  const p = X[0].length;
  const { nTrees = 100, maxDepth = 8, minSamplesLeaf = 5, mtry = Math.max(1, Math.floor(Math.sqrt(p))), seed = 7 } = opts;
  const rng = new Rng(seed);
  const n = y.length;
  const trees: TreeNode[] = [];
  for (let t = 0; t < nTrees; t++) {
    const rows = Array.from({ length: n }, () => rng.int(n));
    trees.push(fitTree(X, y, { maxDepth, minSamplesLeaf, mtry, rng }, rows));
  }
  return trees;
}

export const predictForest = (trees: TreeNode[], X: number[][]) =>
  X.map((x) => trees.reduce((s, t) => s + predictTree(t, x), 0) / trees.length);

export interface BoostOptions {
  nRounds?: number;
  learningRate?: number;
  maxDepth?: number;
  minSamplesLeaf?: number;
  subsample?: number;
  seed?: number;
}

/**
 * Gradient boosting for the logistic loss (Friedman, Ann Stat 2001) with Newton leaf values,
 * the core idea behind XGBoost/LightGBM (without their regularisation and histogram tricks).
 */
export function fitBoosting(X: number[][], y: number[], opts: BoostOptions = {}) {
  const { nRounds = 100, learningRate = 0.1, maxDepth = 3, minSamplesLeaf = 10, subsample = 0.8, seed = 11 } = opts;
  const rng = new Rng(seed);
  const n = y.length;
  const f0 = logit(mean(y));
  const F = new Array(n).fill(f0);
  const trees: TreeNode[] = [];
  const orders = presort(X, Array.from({ length: n }, (_, i) => i));
  const inSample = new Uint8Array(n);
  for (let m = 0; m < nRounds; m++) {
    const g = new Array(n);
    const h = new Array(n);
    for (let i = 0; i < n; i++) {
      const p = expit(F[i]);
      g[i] = y[i] - p;
      h[i] = Math.max(p * (1 - p), 1e-6);
    }
    let nIn = 0;
    for (let i = 0; i < n; i++) {
      inSample[i] = rng.next() < subsample ? 1 : 0;
      nIn += inSample[i];
    }
    const tree = fitBoostTree(X, g, h, orders, inSample, nIn, maxDepth, minSamplesLeaf);
    trees.push(tree);
    for (let i = 0; i < n; i++) F[i] += learningRate * predictTree(tree, X[i]);
  }
  return { f0, trees, learningRate };
}

export function predictBoosting(model: { f0: number; trees: TreeNode[]; learningRate: number }, X: number[][], rounds?: number) {
  const R = rounds ?? model.trees.length;
  return X.map((x) => {
    let f = model.f0;
    for (let m = 0; m < R; m++) f += model.learningRate * predictTree(model.trees[m], x);
    return expit(f);
  });
}
