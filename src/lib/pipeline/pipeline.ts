import type { Dataset } from '@/data/datasets';
import { Rng } from '../stats/random';
import { mean, sd } from '../stats/core';
import { rcsBasis, rcsKnots } from '../stats/rcs';
import { fitLogistic, predictLogistic } from '../ml/logistic';
import { fitTree, predictTree, countLeaves, type TreeNode } from '../ml/tree';
import { fitForest, predictForest, fitBoosting, predictBoosting } from '../ml/ensembles';

export type ModelKind = 'logistic' | 'logistic-spline' | 'tree' | 'forest' | 'boosting';

export const MODEL_LABELS: Record<ModelKind, string> = {
  logistic: 'Logistic regression (linear terms)',
  'logistic-spline': 'Logistic regression + restricted cubic splines',
  tree: 'Single decision tree (CART)',
  forest: 'Random forest',
  boosting: 'Gradient-boosted trees',
};

export interface ModelParams {
  ridge: number;
  knots: 3 | 4 | 5;
  maxDepth: number;
  minLeaf: number;
  nTrees: number;
  nRounds: number;
  learningRate: number;
}

export const DEFAULT_PARAMS: ModelParams = {
  ridge: 0,
  knots: 4,
  maxDepth: 4,
  minLeaf: 20,
  nTrees: 100,
  nRounds: 200,
  learningRate: 0.05,
};

export interface Split {
  train: number[];
  test: number[];
}

/** Stratified random split — preserves the event rate in both partitions. */
export function stratifiedSplit(y: number[], testFraction: number, seed: number): Split {
  const rng = new Rng(seed);
  const pos = rng.shuffle(y.map((v, i) => (v ? i : -1)).filter((i) => i >= 0));
  const neg = rng.shuffle(y.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0));
  const cut = (a: number[]) => Math.round(a.length * testFraction);
  return {
    test: [...pos.slice(0, cut(pos)), ...neg.slice(0, cut(neg))],
    train: [...pos.slice(cut(pos)), ...neg.slice(cut(neg))],
  };
}

export interface FittedModel {
  kind: ModelKind;
  featureKeys: string[];
  /** Predict risk from raw (unscaled) feature vectors in featureKeys order. */
  predictRaw: (X: number[][]) => number[];
  coefficients?: { term: string; beta: number; se: number; or: number; lo: number; hi: number; perUnit: string }[];
  tree?: TreeNode;
  leaves?: number;
  separation?: boolean;
}

export function rawMatrix(ds: Dataset, rows: number[], keys: string[]) {
  return rows.map((i) => keys.map((k) => ds.rows[i][k]));
}

/**
 * Fit a model on the training rows only. All preprocessing (standardisation, spline knots) is learned
 * from training data and frozen — fitting it on the full data set would leak test information.
 */
export function fitModel(ds: Dataset, train: number[], keys: string[], kind: ModelKind, prm: ModelParams, seed = 1): FittedModel {
  const Xraw = rawMatrix(ds, train, keys);
  const y = train.map((i) => ds.rows[i].outcome);
  const mu = keys.map((_, j) => mean(Xraw.map((r) => r[j])));
  const sdv = keys.map((_, j) => sd(Xraw.map((r) => r[j])) || 1);
  const binary = keys.map((k) => ds.features.find((f) => f.key === k)?.type === 'binary');
  const scale = (X: number[][]) => X.map((r) => r.map((v, j) => (binary[j] ? v : (v - mu[j]) / sdv[j])));

  if (kind === 'logistic' || kind === 'logistic-spline') {
    const knots = keys.map((_, j) =>
      kind === 'logistic-spline' && !binary[j] && ds.features.find((f) => f.key === keys[j])?.type === 'continuous'
        ? rcsKnots(scale(Xraw).map((r) => r[j]), prm.knots)
        : null
    );
    const expand = (X: number[][]) => scale(X).map((r) => r.flatMap((v, j) => (knots[j] ? rcsBasis(v, knots[j]!) : [v])));
    const fit = fitLogistic(expand(Xraw), y, { lambda: prm.ridge });
    const terms: string[] = ['(Intercept)'];
    keys.forEach((k, j) => {
      const f = ds.features.find((x) => x.key === k)!;
      if (knots[j]) knots[j]!.forEach((_, s) => s < knots[j]!.length - 1 && terms.push(s === 0 ? `${f.label}` : `${f.label} (spline ${s})`));
      else terms.push(f.label);
    });
    const coefficients = fit.beta.map((b, t) => {
      const j = t === 0 ? -1 : keys.findIndex((k) => terms[t].startsWith(ds.features.find((f) => f.key === k)!.label));
      const isBin = j >= 0 && binary[j];
      const f = j >= 0 ? ds.features.find((x) => x.key === keys[j])! : null;
      const perUnit = t === 0 ? '' : isBin ? 'yes vs no' : terms[t].includes('spline') ? 'nonlinear term' : `per 1 SD (${sdv[j].toFixed(1)}${f?.unit ? ' ' + f.unit : ''})`;
      const se = prm.ridge > 0 ? NaN : fit.se[t];
      return { term: terms[t], beta: b, se, or: Math.exp(b), lo: Math.exp(b - 1.96 * se), hi: Math.exp(b + 1.96 * se), perUnit };
    });
    return {
      kind,
      featureKeys: keys,
      predictRaw: (X) => predictLogistic(fit.beta, expand(X)),
      coefficients,
      separation: fit.separation,
    };
  }
  if (kind === 'tree') {
    const tree = fitTree(Xraw, y, { maxDepth: prm.maxDepth, minSamplesLeaf: prm.minLeaf });
    return { kind, featureKeys: keys, predictRaw: (X) => X.map((x) => predictTree(tree, x)), tree, leaves: countLeaves(tree) };
  }
  if (kind === 'forest') {
    const trees = fitForest(Xraw, y, { nTrees: prm.nTrees, maxDepth: Math.max(prm.maxDepth, 6), minSamplesLeaf: Math.max(3, Math.round(prm.minLeaf / 4)), seed });
    return { kind, featureKeys: keys, predictRaw: (X) => predictForest(trees, X) };
  }
  const gb = fitBoosting(Xraw, y, { nRounds: prm.nRounds, learningRate: prm.learningRate, maxDepth: Math.min(prm.maxDepth, 3), minSamplesLeaf: prm.minLeaf, seed });
  return { kind, featureKeys: keys, predictRaw: (X) => predictBoosting(gb, X) };
}
