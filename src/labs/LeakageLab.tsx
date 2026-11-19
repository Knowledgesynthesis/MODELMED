import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { usePalette } from '@/components/charts/palette';
import { Plot } from '@/components/charts/Plot';
import { Rng } from '@/lib/stats/random';
import { auc } from '@/lib/stats/metrics';
import { num } from '@/lib/utils';

/** Indices of the k features with the largest |t| between classes, using only `rows`. */
function selectTop(X: Float64Array[], y: number[], rows: number[], k: number) {
  const p = X[0].length;
  const scores = new Float64Array(p);
  for (let j = 0; j < p; j++) {
    let s1 = 0, s0 = 0, q1 = 0, q0 = 0, n1 = 0, n0 = 0;
    for (const i of rows) {
      const v = X[i][j];
      if (y[i]) { s1 += v; q1 += v * v; n1++; } else { s0 += v; q0 += v * v; n0++; }
    }
    const m1 = s1 / n1, m0 = s0 / n0;
    const v1 = q1 / n1 - m1 * m1, v0 = q0 / n0 - m0 * m0;
    scores[j] = Math.abs(m1 - m0) / Math.sqrt(v1 / n1 + v0 / n0 + 1e-12);
  }
  return Array.from(scores.keys()).sort((a, b) => scores[b] - scores[a]).slice(0, k);
}

/** Diagonal nearest-centroid score trained on `train`, applied to `test`. */
function centroidScores(X: Float64Array[], y: number[], train: number[], test: number[], feats: number[]) {
  const w: number[] = [];
  const mid: number[] = [];
  for (const j of feats) {
    let s1 = 0, s0 = 0, n1 = 0, n0 = 0, q = 0;
    for (const i of train) (y[i] ? ((s1 += X[i][j]), n1++) : ((s0 += X[i][j]), n0++));
    const m1 = s1 / n1, m0 = s0 / n0;
    for (const i of train) q += (X[i][j] - (y[i] ? m1 : m0)) ** 2;
    const v = q / (train.length - 2) + 1e-9;
    w.push((m1 - m0) / v);
    mid.push((m1 + m0) / 2);
  }
  return test.map((i) => feats.reduce((s, j, k) => s + (X[i][j] - mid[k]) * w[k], 0));
}

function runOnce(seed: number, n: number, p: number, k: number) {
  const rng = new Rng(seed);
  const y = Array.from({ length: n }, (_, i) => (i < n / 2 ? 1 : 0));
  const X = Array.from({ length: n }, () => {
    const r = new Float64Array(p);
    for (let j = 0; j < p; j++) r[j] = rng.normal();
    return r;
  });
  const order = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const folds = 5;
  const fold = new Array(n);
  // stratified fold assignment
  const pos = order.filter((i) => y[i] === 1), neg = order.filter((i) => y[i] === 0);
  pos.forEach((i, r) => (fold[i] = r % folds));
  neg.forEach((i, r) => (fold[i] = r % folds));
  const all = Array.from({ length: n }, (_, i) => i);
  const wrongFeats = selectTop(X, y, all, k); // selection on ALL data — leakage
  const oofWrong = new Array(n), oofRight = new Array(n);
  for (let f = 0; f < folds; f++) {
    const tr = all.filter((i) => fold[i] !== f);
    const te = all.filter((i) => fold[i] === f);
    centroidScores(X, y, tr, te, wrongFeats).forEach((s, q) => (oofWrong[te[q]] = s));
    const rightFeats = selectTop(X, y, tr, k); // selection inside the fold
    centroidScores(X, y, tr, te, rightFeats).forEach((s, q) => (oofRight[te[q]] = s));
  }
  return { wrong: auc(oofWrong, y), right: auc(oofRight, y) };
}

export default function LeakageLab() {
  const [n, setN] = useState(60);
  const [p, setP] = useState(2000);
  const [k, setK] = useState(20);
  const [batch, setBatch] = useState(1);
  const pal = usePalette();
  const runs = useMemo(() => Array.from({ length: 12 }, (_, r) => runOnce(batch * 1000 + r, n, p, k)), [n, p, k, batch]);
  const mW = runs.reduce((s, r) => s + r.wrong, 0) / runs.length;
  const mR = runs.reduce((s, r) => s + r.right, 0) / runs.length;

  return (
    <LabFrame
      id="leakage"
      title="The wrong way to cross-validate"
      goal="Every feature here is random noise and the outcome is a coin flip: the true AUC is 0.50. Watch what happens when feature selection sees the whole dataset before cross-validation."
      tryThis={[
        'Note the **leaky** cross-validated AUC with the defaults. A reviewer seeing this number would believe the model works.',
        'Increase the number of candidate features (e.g., a genomic or EHR-wide screen). Leakage gets worse; honest CV stays near 0.5.',
        'Increase n to 200. Leakage shrinks but does not disappear.',
      ]}
      insight={
        'Any data-driven step — feature selection, imputation, scaling, resampling for class balance, hyperparameter tuning, choosing a threshold — is part of the model and must be repeated inside each training fold (nested CV for tuning). Other leakage routes in clinical data: predictors recorded *after* the prediction time (e.g., antibiotics ordered, ICU transfer), the same patient in train and test, and features that encode the outcome process (a lactate order signals suspected sepsis). Kapoor & Narayanan (2023) found leakage across hundreds of published ML studies in 17 fields.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <Slider label="Patients (n)" value={n} min={30} max={200} step={10} onChange={setN} />
          <Slider label="Candidate features (all noise)" value={p} min={50} max={5000} step={50} onChange={setP} />
          <Slider label="Features selected" value={k} min={2} max={50} onChange={setK} />
          <Button variant="outline" size="sm" onClick={() => setBatch((b) => b + 1)}>
            Re-run 12 new datasets
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Leaky CV AUC (mean)" value={num(mW, 2)} tone="bad" sub="selection on all data, then 5-fold CV" />
            <Stat label="Honest CV AUC (mean)" value={num(mR, 2)} tone="good" sub="selection repeated inside each fold" />
          </div>
        </div>
        <Panel title="Cross-validated AUC across 12 independent pure-noise datasets">
          <Plot title="Leaky vs honest cross-validation" height={240} x={{ domain: [0.2, 1], label: 'Cross-validated AUC', ticks: [0.2, 0.4, 0.5, 0.6, 0.8, 1] }} y={{ domain: [0, 3], ticks: [], format: () => '' }}>
            {(s) => (
              <>
                <line x1={s.x(0.5)} x2={s.x(0.5)} y1={s.y(0)} y2={s.y(3)} stroke={s.pal.fg} strokeDasharray="4 3" />
                <text x={s.x(0.5) + 4} y={s.y(2.85)} fontSize={11} fill={s.pal.muted}>truth = 0.50</text>
                {runs.map((r, i) => (
                  <g key={i}>
                    <circle cx={s.x(r.wrong)} cy={s.y(2 + ((i % 6) - 2.5) * 0.08)} r={6} fill={s.pal.e} opacity={0.85} />
                    <circle cx={s.x(r.right)} cy={s.y(1 + ((i % 6) - 2.5) * 0.08)} r={6} fill={s.pal.a} opacity={0.85} />
                  </g>
                ))}
                <text x={s.x(0.21)} y={s.y(2) - 14} fontSize={12} fontWeight={600} fill={pal.e}>Leaky</text>
                <text x={s.x(0.21)} y={s.y(1) - 14} fontSize={12} fontWeight={600} fill={pal.a}>Honest</text>
              </>
            )}
          </Plot>
        </Panel>
      </div>
    </LabFrame>
  );
}
