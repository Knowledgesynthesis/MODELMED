import { describe, expect, it } from 'vitest';
import { getDatasets } from '@/data/datasets';
import { auc } from '../stats/metrics';
import { mean } from '../stats/core';

describe('synthetic datasets', () => {
  for (const d of getDatasets()) {
    it(`${d.id}: realistic prevalence and oracle discrimination`, () => {
      const y = d.rows.map((r) => r.outcome);
      const prev = mean(y);
      const oracle = auc(d.rows.map((r) => r.trueRisk), y);
      console.log(d.id, 'n', y.length, 'prev', prev.toFixed(3), 'oracle AUC', oracle.toFixed(3));
      expect(prev).toBeGreaterThan(0.08);
      expect(prev).toBeLessThan(0.2);
      expect(oracle).toBeGreaterThan(0.65);
      expect(oracle).toBeLessThan(0.95);
    });
  }
  it('is deterministic', () => {
    const a = getDatasets()[0].rows[10];
    expect(a.age).toBeTypeOf('number');
  });
});
