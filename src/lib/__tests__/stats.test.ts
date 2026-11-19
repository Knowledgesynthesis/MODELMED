import { describe, expect, it } from 'vitest';
import { Rng } from '../stats/random';
import { expit, logit, normCdf, normInv, wilson } from '../stats/core';
import { auc, aucWithCI, brier, calibrationSummary, confusionAt, classificationMetrics, netBenefit, netBenefitTreatAll, predictiveValues, smoothCalibration } from '../stats/metrics';
import { fitLogistic } from '../ml/logistic';
import { kaplanMeier, logRank, harrellC } from '../stats/survival';
import { rileySampleSize, r2csFromC } from '../stats/sampleSize';
import { exactShapley } from '../ml/explain';
import { fitTree, predictTree } from '../ml/tree';
import { fitBoosting, predictBoosting, fitForest, predictForest } from '../ml/ensembles';
import { TinyMLP } from '../ml/mlp';

describe('core', () => {
  it('normal cdf / inverse are consistent', () => {
    expect(normCdf(1.959964)).toBeCloseTo(0.975, 5);
    expect(normInv(0.975)).toBeCloseTo(1.959964, 5);
    expect(normCdf(0)).toBeCloseTo(0.5, 7);
  });
  it('wilson interval matches reference (k=8, n=10)', () => {
    const [lo, hi] = wilson(8, 10);
    expect(lo).toBeCloseTo(0.4902, 3);
    expect(hi).toBeCloseTo(0.9433, 3);
  });
  it('logit/expit invert', () => expect(expit(logit(0.3))).toBeCloseTo(0.3, 10));
});

describe('discrimination', () => {
  it('AUC equals Mann–Whitney with ties = 0.5', () => {
    // pos: 0.9, 0.5 ; neg: 0.5, 0.1 → pairs: (0.9>0.5)=1,(0.9>0.1)=1,(0.5=0.5)=.5,(0.5>0.1)=1 → 3.5/4
    expect(auc([0.9, 0.5, 0.5, 0.1], [1, 1, 0, 0])).toBeCloseTo(0.875, 10);
  });
  it('AUC of binormal scores ≈ Φ(d/√2) and DeLong CI covers it', () => {
    const r = new Rng(1);
    const p: number[] = [], y: number[] = [];
    for (let i = 0; i < 4000; i++) {
      const yi = r.bernoulli(0.3);
      y.push(yi);
      p.push(r.normal(yi ? 1.5 : 0, 1));
    }
    const truth = normCdf(1.5 / Math.SQRT2);
    const res = aucWithCI(p, y);
    expect(res.auc).toBeCloseTo(truth, 1);
    expect(res.lo).toBeLessThan(truth);
    expect(res.hi).toBeGreaterThan(truth);
    expect(res.se).toBeGreaterThan(0.003);
    expect(res.se).toBeLessThan(0.02);
  });
  it('AUC is invariant to monotone transformation of scores', () => {
    const r = new Rng(2);
    const p = Array.from({ length: 500 }, () => r.next());
    const y = p.map((v) => r.bernoulli(v));
    expect(auc(p.map((v) => v ** 3), y)).toBeCloseTo(auc(p, y), 12);
  });
});

describe('classification & Bayes', () => {
  it('confusion metrics', () => {
    const c = confusionAt([0.9, 0.8, 0.2, 0.7, 0.1], [1, 0, 1, 0, 0], 0.5);
    expect(c).toEqual({ tp: 1, fp: 2, tn: 1, fn: 1 });
    const m = classificationMetrics(c);
    expect(m.sensitivity).toBeCloseTo(0.5);
    expect(m.ppv).toBeCloseTo(1 / 3);
  });
  it('PPV at 1% prevalence with 90/90 test is ~8.3%', () => {
    expect(predictiveValues(0.9, 0.9, 0.01).ppv).toBeCloseTo(0.0833, 3);
  });
});

describe('logistic regression (IRLS) recovers truth', () => {
  it('estimates coefficients and SEs', () => {
    const r = new Rng(3);
    const X: number[][] = [], y: number[] = [];
    for (let i = 0; i < 20000; i++) {
      const x1 = r.normal(), x2 = r.bernoulli(0.4);
      X.push([x1, x2]);
      y.push(r.bernoulli(expit(-1 + 0.8 * x1 - 0.5 * x2)));
    }
    const fit = fitLogistic(X, y);
    expect(fit.converged).toBe(true);
    expect(fit.beta[0]).toBeCloseTo(-1, 1);
    expect(fit.beta[1]).toBeCloseTo(0.8, 1);
    expect(fit.beta[2]).toBeCloseTo(-0.5, 1);
    expect(fit.se[1]).toBeGreaterThan(0.01);
    expect(fit.se[1]).toBeLessThan(0.03);
  });
});

describe('calibration', () => {
  const r = new Rng(4);
  const truthLp = Array.from({ length: 20000 }, () => r.normal(-1.5, 1.2));
  const y = truthLp.map((v) => r.bernoulli(expit(v)));
  it('perfect model → intercept ≈ 0, slope ≈ 1, small ICI', () => {
    const p = truthLp.map(expit);
    const c = calibrationSummary(p, y);
    expect(c.citl).toBeCloseTo(0, 1);
    expect(c.slope).toBeCloseTo(1, 1);
    expect(smoothCalibration(p, y).ici).toBeLessThan(0.01);
  });
  it('overfit-style predictions (lp × 2) → slope ≈ 0.5', () => {
    const p = truthLp.map((v) => expit(-1.5 + 2 * (v + 1.5)));
    expect(calibrationSummary(p, y).slope).toBeCloseTo(0.5, 1);
  });
  it('systematic over-prediction (+1 logit) → CITL ≈ −1', () => {
    const p = truthLp.map((v) => expit(v + 1));
    expect(calibrationSummary(p, y).citl).toBeCloseTo(-1, 1);
  });
  it('Brier of constant prevalence = p(1-p)', () => {
    const prev = y.reduce((a: number, b) => a + b, 0) / y.length;
    expect(brier(y.map(() => prev), y)).toBeCloseTo(prev * (1 - prev), 6);
  });
});

describe('decision curve analysis', () => {
  it('treat-all net benefit formula', () => {
    expect(netBenefitTreatAll(0.2, 0.1)).toBeCloseTo(0.2 - 0.8 / 9, 10);
  });
  it('model net benefit at pt', () => {
    // 10 patients: tp=2, fp=3 at pt=0.2 → 0.2 - 0.3*0.25 = 0.125
    const p = [0.9, 0.8, 0.5, 0.4, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1];
    const y = [1, 1, 0, 0, 0, 1, 0, 0, 0, 0];
    expect(netBenefit(p, y, 0.2)).toBeCloseTo(0.125, 10);
  });
});

describe('survival', () => {
  it('Kaplan–Meier matches textbook example', () => {
    // times 1,2,2+,3,4+,5 ; events 1,1,0,1,0,1
    const km = kaplanMeier([1, 2, 2, 3, 4, 5], [1, 1, 0, 1, 0, 1]);
    const at = (t: number) => km.filter((s) => s.time <= t).pop()!.survival;
    expect(at(1)).toBeCloseTo(5 / 6, 10);
    expect(at(2)).toBeCloseTo((5 / 6) * (4 / 5), 10);
    expect(at(3)).toBeCloseTo((5 / 6) * (4 / 5) * (2 / 3), 10);
    expect(at(5)).toBeCloseTo(0, 10);
  });
  it('log-rank detects a hazard difference; C-index ≈ 1 for perfect risk', () => {
    const r = new Rng(5);
    const t: number[] = [], e: (0 | 1)[] = [], g: (0 | 1)[] = [];
    for (let i = 0; i < 400; i++) {
      const gi = (i % 2) as 0 | 1;
      g.push(gi);
      const ti = r.exponential(gi ? 0.2 : 0.1);
      const ci = r.exponential(0.05);
      t.push(Math.min(ti, ci));
      e.push(ti <= ci ? 1 : 0);
    }
    expect(logRank(t, e, g).p).toBeLessThan(0.001);
    expect(harrellC([1, 2, 3, 4], [1, 1, 1, 1], [4, 3, 2, 1])).toBe(1);
  });
});

describe('Riley sample size (pmsampsize reference)', () => {
  it('reproduces the published example: n = 662', () => {
    const res = rileySampleSize({ parameters: 24, prevalence: 0.174, r2cs: 0.288 });
    expect(res.criterion1).toBe(623);
    expect(res.criterion2).toBe(662);
    expect(res.criterion3).toBe(221);
    expect(res.n).toBe(662);
    expect(res.epp).toBeCloseTo(4.8, 1);
  });
  it('converts C = 0.89 at prevalence 0.174 to R²cs ≈ 0.288 (pmsampsize documentation example)', () => {
    expect(r2csFromC(0.89, 0.174)).toBeCloseTo(0.288, 2);
    expect(r2csFromC(0.8, 0.2)).toBeGreaterThan(r2csFromC(0.7, 0.2));
  });
});

describe('exact Shapley values', () => {
  it('satisfy efficiency and equal β(x − E[x]) for a linear logit model', () => {
    const beta = [-1, 0.7, -0.4, 1.1];
    const f = (X: number[][]) => X.map((x) => expit(beta[0] + beta[1] * x[0] + beta[2] * x[1] + beta[3] * x[2]));
    const r = new Rng(6);
    const bg = Array.from({ length: 50 }, () => [r.normal(), r.normal(), r.bernoulli(0.3)]);
    const x = [1.2, -0.5, 1];
    const res = exactShapley(f, x, bg, 'logit');
    const sum = res.phi.reduce((a, b) => a + b, 0);
    expect(res.base + sum).toBeCloseTo(logit(f([x])[0]), 8);
    for (let j = 0; j < 3; j++) {
      const m = bg.reduce((s, b) => s + b[j], 0) / bg.length;
      expect(res.phi[j]).toBeCloseTo(beta[j + 1] * (x[j] - m), 8);
    }
  });
});

describe('tree-based models learn a nonlinear (U-shaped) signal', () => {
  const r = new Rng(8);
  const X: number[][] = [], y: number[] = [];
  for (let i = 0; i < 3000; i++) {
    const x = r.normal();
    const z = r.normal();
    X.push([x, z]);
    y.push(r.bernoulli(expit(-2 + 1.5 * x * x)));
  }
  const tr = X.slice(0, 2000), ytr = y.slice(0, 2000), te = X.slice(2000), yte = y.slice(2000);
  it('logistic (linear) fails, trees succeed', () => {
    const lr = fitLogistic(tr, ytr);
    const pLr = te.map((x) => expit(lr.beta[0] + lr.beta[1] * x[0] + lr.beta[2] * x[1]));
    const tree = fitTree(tr, ytr, { maxDepth: 4, minSamplesLeaf: 20 });
    const pTree = te.map((x) => predictTree(tree, x));
    const rf = fitForest(tr, ytr, { nTrees: 40, maxDepth: 6 });
    const gb = fitBoosting(tr, ytr, { nRounds: 60 });
    expect(auc(pLr, yte)).toBeLessThan(0.6);
    expect(auc(pTree, yte)).toBeGreaterThan(0.75);
    expect(auc(predictForest(rf, te), yte)).toBeGreaterThan(0.75);
    expect(auc(predictBoosting(gb, te), yte)).toBeGreaterThan(0.75);
  });
});

describe('MLP', () => {
  it('learns XOR-like pattern', () => {
    const r = new Rng(9);
    const X: number[][] = [], y: number[] = [];
    for (let i = 0; i < 300; i++) {
      const a = r.uniform(-1, 1), b = r.uniform(-1, 1);
      X.push([a, b]);
      y.push(a * b > 0 ? 1 : 0);
    }
    const net = new TinyMLP(2, 8, 'tanh', 2);
    for (let k = 0; k < 600; k++) net.step(X, y, 0.05);
    expect(auc(net.predict(X), y)).toBeGreaterThan(0.95);
  });
});
