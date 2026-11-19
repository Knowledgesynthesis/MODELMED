import { describe, expect, it } from 'vitest';
import { getDataset } from '@/data/datasets';
import { DEFAULT_PARAMS, fitModel, rawMatrix, stratifiedSplit, type ModelKind } from '../pipeline/pipeline';
import { auc, calibrationSummary } from '../stats/metrics';

const kinds: ModelKind[] = ['logistic', 'logistic-spline', 'tree', 'forest', 'boosting'];

describe('pipeline reproduces the intended lessons', () => {
  for (const id of ['sepsis', 'readmission']) {
    it(id, () => {
      const ds = getDataset(id);
      const y = ds.rows.map((r) => r.outcome);
      const { train, test } = stratifiedSplit(y, 0.3, 1);
      const keys = ds.features.map((f) => f.key);
      const yte = test.map((i) => y[i]);
      const oracle = auc(test.map((i) => ds.rows[i].trueRisk), yte);
      const res: Record<string, number> = { oracle };
      for (const k of kinds) {
        const t0 = performance.now();
        const m = fitModel(ds, train, keys, k, DEFAULT_PARAMS);
        const p = m.predictRaw(rawMatrix(ds, test, keys));
        const ptr = m.predictRaw(rawMatrix(ds, train, keys));
        res[k] = auc(p, yte);
        res[k + '_train'] = auc(ptr, train.map((i) => y[i]));
        res[k + '_slope'] = calibrationSummary(p, yte).slope;
        res[k + '_ms'] = performance.now() - t0;
      }
      if (id === 'sepsis') {
        // nonlinear truth: splines and ensembles beat linear terms; splines ≈ ensembles
        expect(res['logistic-spline'] - res.logistic).toBeGreaterThan(0.02);
        expect(Math.abs(res['logistic-spline'] - res.forest)).toBeLessThan(0.03);
      } else {
        // linear truth: plain logistic regression is near the oracle and at least as good as trees
        expect(oracle - res.logistic).toBeLessThan(0.03);
        expect(res.logistic).toBeGreaterThan(res.tree);
      }
      // ensembles show the classic optimism gap (train ≫ test)
      expect(res.forest_train - res.forest).toBeGreaterThan(0.05);
      for (const k of kinds) expect(res[k + '_ms']).toBeLessThan(3000);
    });
  }
});
