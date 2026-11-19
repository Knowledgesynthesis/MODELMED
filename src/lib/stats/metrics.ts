import { clamp, expit, logit, mean, normInv, ratio, wilson } from './core';
import { fitLogistic, predictLogistic } from '../ml/logistic';
import { rcsBasis, rcsKnots } from './rcs';

export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export function confusionAt(p: ArrayLike<number>, y: ArrayLike<number>, threshold: number): Confusion {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < p.length; i++) {
    const pos = p[i] >= threshold;
    if (pos && y[i] === 1) tp++;
    else if (pos) fp++;
    else if (y[i] === 1) fn++;
    else tn++;
  }
  return { tp, fp, tn, fn };
}

export interface ClassificationMetrics {
  n: number;
  prevalence: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  accuracy: number;
  f1: number;
  lrPos: number;
  lrNeg: number;
  flagged: number; // proportion predicted positive
  nnf: number; // number needed to flag (alerts per true positive) = 1 / PPV
}

export function classificationMetrics(c: Confusion): ClassificationMetrics {
  const n = c.tp + c.fp + c.tn + c.fn;
  const sens = ratio(c.tp, c.tp + c.fn);
  const spec = ratio(c.tn, c.tn + c.fp);
  const ppv = ratio(c.tp, c.tp + c.fp);
  return {
    n,
    prevalence: ratio(c.tp + c.fn, n),
    sensitivity: sens,
    specificity: spec,
    ppv,
    npv: ratio(c.tn, c.tn + c.fn),
    accuracy: ratio(c.tp + c.tn, n),
    f1: ratio(2 * c.tp, 2 * c.tp + c.fp + c.fn),
    lrPos: ratio(sens, 1 - spec),
    lrNeg: ratio(1 - sens, spec),
    flagged: ratio(c.tp + c.fp, n),
    nnf: ratio(1, ppv),
  };
}

/** Predictive values from sensitivity, specificity and prevalence (Bayes' theorem). */
export function predictiveValues(sens: number, spec: number, prev: number) {
  const ppv = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
  const npv = (spec * (1 - prev)) / (spec * (1 - prev) + (1 - sens) * prev);
  return { ppv, npv };
}

export interface RocPoint {
  threshold: number;
  fpr: number;
  tpr: number;
}

/** Empirical ROC curve; ties in score are handled as a single diagonal step. */
export function rocCurve(p: ArrayLike<number>, y: ArrayLike<number>): RocPoint[] {
  const idx = Array.from({ length: p.length }, (_, i) => i).sort((a, b) => p[b] - p[a]);
  let P = 0;
  for (let i = 0; i < y.length; i++) P += y[i];
  const N = y.length - P;
  const pts: RocPoint[] = [{ threshold: Infinity, fpr: 0, tpr: 0 }];
  let tp = 0, fp = 0;
  for (let k = 0; k < idx.length; ) {
    const s = p[idx[k]];
    while (k < idx.length && p[idx[k]] === s) {
      if (y[idx[k]] === 1) tp++;
      else fp++;
      k++;
    }
    pts.push({ threshold: s, fpr: N ? fp / N : 0, tpr: P ? tp / P : 0 });
  }
  return pts;
}

/** AUC (c-statistic) = Mann–Whitney probability that a random event outranks a random non-event; ties count 1/2. */
export function auc(p: ArrayLike<number>, y: ArrayLike<number>): number {
  const pts = rocCurve(p, y);
  let a = 0;
  for (let i = 1; i < pts.length; i++) a += ((pts[i].fpr - pts[i - 1].fpr) * (pts[i].tpr + pts[i - 1].tpr)) / 2;
  return a;
}

/**
 * AUC with DeLong (1988) standard error and a 95% CI computed on the logit scale
 * (keeps limits inside 0–1).
 */
export function aucWithCI(p: ArrayLike<number>, y: ArrayLike<number>, level = 0.95) {
  const pos: number[] = [];
  const neg: number[] = [];
  for (let i = 0; i < p.length; i++) (y[i] === 1 ? pos : neg).push(p[i]);
  const m = pos.length;
  const n = neg.length;
  if (!m || !n) return { auc: NaN, se: NaN, lo: NaN, hi: NaN };
  // structural components via sorting (O(N log N))
  const negSorted = [...neg].sort((a, b) => a - b);
  const posSorted = [...pos].sort((a, b) => a - b);
  const countBelow = (arr: number[], v: number) => {
    // returns (#<v) + 0.5*(#==v)
    let lo = 0, hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < v) lo = mid + 1; else hi = mid; }
    let eq = lo;
    while (eq < arr.length && arr[eq] === v) eq++;
    return lo + 0.5 * (eq - lo);
  };
  const v10 = pos.map((x) => countBelow(negSorted, x) / n);
  // P(pos > x) + ½·P(pos = x) = (m − #below − ½#equal) / m
  const v01 = neg.map((x) => (m - countBelow(posSorted, x)) / m);
  const A = mean(v10);
  const s10 = v10.reduce((s, v) => s + (v - A) ** 2, 0) / Math.max(1, m - 1);
  const s01 = v01.reduce((s, v) => s + (v - A) ** 2, 0) / Math.max(1, n - 1);
  const se = Math.sqrt(s10 / m + s01 / n);
  const z = normInv(1 - (1 - level) / 2);
  const a = clamp(A, 1e-6, 1 - 1e-6);
  const seLogit = se / (a * (1 - a));
  return { auc: A, se, lo: expit(logit(a) - z * seLogit), hi: expit(logit(a) + z * seLogit) };
}

export interface PrPoint {
  threshold: number;
  recall: number;
  precision: number;
}

export function prCurve(p: ArrayLike<number>, y: ArrayLike<number>): { points: PrPoint[]; averagePrecision: number } {
  const roc = rocCurve(p, y);
  let P = 0;
  for (let i = 0; i < y.length; i++) P += y[i];
  const N = y.length - P;
  const points: PrPoint[] = [];
  let ap = 0;
  let prevRecall = 0;
  for (let i = 1; i < roc.length; i++) {
    const tp = roc[i].tpr * P;
    const fp = roc[i].fpr * N;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    points.push({ threshold: roc[i].threshold, recall: roc[i].tpr, precision });
    ap += (roc[i].tpr - prevRecall) * precision;
    prevRecall = roc[i].tpr;
  }
  return { points, averagePrecision: ap };
}

export function brier(p: ArrayLike<number>, y: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) s += (p[i] - y[i]) ** 2;
  return s / p.length;
}

/** Scaled Brier (Brier skill score): 1 − Brier / Brier of predicting the observed prevalence for everyone. */
export function scaledBrier(p: ArrayLike<number>, y: ArrayLike<number>): number {
  const prev = mean(y);
  const ref = prev * (1 - prev);
  return ref > 0 ? 1 - brier(p, y) / ref : NaN;
}

export interface CalibrationSummary {
  /** Calibration-in-the-large: intercept of logistic recalibration with logit(p) as offset. Target 0. */
  citl: number;
  citlSe: number;
  /** Calibration slope: coefficient on logit(p). Target 1. < 1 → predictions too extreme (overfitting). */
  slope: number;
  slopeSe: number;
  /** Ratio of observed to expected events. Target 1. */
  oe: number;
  meanPredicted: number;
  observedRate: number;
}

export function calibrationSummary(p: ArrayLike<number>, y: ArrayLike<number>): CalibrationSummary {
  const lp = Array.from(p, (v) => logit(v));
  const yy = Array.from(y);
  const fitSlope = fitLogistic(lp.map((v) => [v]), yy);
  const fitCitl = fitLogistic(lp.map(() => []), yy, { offset: lp });
  const meanPredicted = mean(p);
  const observedRate = mean(y);
  return {
    citl: fitCitl.beta[0],
    citlSe: fitCitl.se[0],
    slope: fitSlope.beta[1],
    slopeSe: fitSlope.se[1],
    oe: observedRate / meanPredicted,
    meanPredicted,
    observedRate,
  };
}

export interface CalibrationBin {
  meanPredicted: number;
  observed: number;
  n: number;
  lo: number;
  hi: number;
}

/** Grouped calibration: equal-size groups by predicted risk, observed proportion with Wilson 95% CI. */
export function calibrationBins(p: ArrayLike<number>, y: ArrayLike<number>, groups = 10): CalibrationBin[] {
  const idx = Array.from({ length: p.length }, (_, i) => i).sort((a, b) => p[a] - p[b]);
  const bins: CalibrationBin[] = [];
  const size = idx.length / groups;
  for (let g = 0; g < groups; g++) {
    const slice = idx.slice(Math.round(g * size), Math.round((g + 1) * size));
    if (!slice.length) continue;
    const k = slice.reduce((s, i) => s + y[i], 0);
    const [lo, hi] = wilson(k, slice.length);
    bins.push({ meanPredicted: slice.reduce((s, i) => s + p[i], 0) / slice.length, observed: k / slice.length, n: slice.length, lo, hi });
  }
  return bins;
}

/**
 * Flexible ("moderate") calibration curve: logistic regression of the outcome on a
 * restricted cubic spline of logit(p) (Van Calster et al., J Clin Epidemiol 2016).
 * Returns the curve on a grid plus the Integrated Calibration Index (Austin & Steyerberg, Stat Med 2019).
 */
export function smoothCalibration(p: ArrayLike<number>, y: ArrayLike<number>, knots: 3 | 4 | 5 = 4) {
  const lp = Array.from(p, (v) => logit(v));
  const kn = rcsKnots(lp, knots);
  const X = lp.map((v) => rcsBasis(v, kn));
  const fit = fitLogistic(X, Array.from(y), { lambda: 1e-6 });
  const fittedAtObs = predictLogistic(fit.beta, X);
  const absErr = fittedAtObs.map((f, i) => Math.abs(f - p[i])).sort((a, b) => a - b);
  const ici = mean(absErr);
  const e50 = absErr[Math.floor(absErr.length * 0.5)] ?? NaN;
  const e90 = absErr[Math.floor(absErr.length * 0.9)] ?? NaN;
  const sorted = Array.from(p).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.01)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.99)] ?? 1;
  const curve: { predicted: number; observed: number }[] = [];
  for (let i = 0; i <= 60; i++) {
    const pr = lo + ((hi - lo) * i) / 60;
    const b = rcsBasis(logit(pr), kn);
    curve.push({ predicted: pr, observed: predictLogistic(fit.beta, [b])[0] });
  }
  return { curve, ici, e50, e90 };
}

/** Net benefit at threshold pt (Vickers & Elkin, Med Decis Making 2006). */
export function netBenefit(p: ArrayLike<number>, y: ArrayLike<number>, pt: number): number {
  const c = confusionAt(p, y, pt);
  const n = p.length;
  return c.tp / n - (c.fp / n) * (pt / (1 - pt));
}

export const netBenefitTreatAll = (prevalence: number, pt: number) => prevalence - (1 - prevalence) * (pt / (1 - pt));

export interface DcaPoint {
  threshold: number;
  model: number;
  treatAll: number;
  treatNone: number;
  /** Net reduction in interventions per 100 patients vs treat-all, at equal benefit. */
  interventionsAvoided: number;
}

export function decisionCurve(p: ArrayLike<number>, y: ArrayLike<number>, thresholds: number[]): DcaPoint[] {
  const prev = mean(y);
  return thresholds.map((t) => {
    const nb = netBenefit(p, y, t);
    const all = netBenefitTreatAll(prev, t);
    return {
      threshold: t,
      model: nb,
      treatAll: all,
      treatNone: 0,
      interventionsAvoided: ((nb - all) / (t / (1 - t))) * 100,
    };
  });
}

/** Everything a validation report needs in one call. */
export function evaluate(p: number[], y: number[], threshold: number) {
  const cm = confusionAt(p, y, threshold);
  return {
    confusion: cm,
    classification: classificationMetrics(cm),
    discrimination: aucWithCI(p, y),
    brier: brier(p, y),
    scaledBrier: scaledBrier(p, y),
    calibration: calibrationSummary(p, y),
  };
}
