import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Segmented, Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { rileySampleSize, r2csFromC, maxR2cs } from '@/lib/stats/sampleSize';
import { num, pct } from '@/lib/utils';

export default function SampleSizeLab() {
  const [params, setParams] = useState(12);
  const [prev, setPrev] = useState(0.12);
  const [mode, setMode] = useState<'c' | 'r2'>('c');
  const [c, setC] = useState(0.78);
  const [r2, setR2] = useState(0.1);
  const [shrink, setShrink] = useState(0.9);

  const r2cs = useMemo(() => (mode === 'c' ? r2csFromC(c, prev) : Math.min(r2, maxR2cs(prev) * 0.99)), [mode, c, r2, prev]);
  const res = useMemo(() => rileySampleSize({ parameters: params, prevalence: prev, r2cs, shrinkage: shrink }), [params, prev, r2cs, shrink]);
  const epv10 = Math.ceil((10 * params) / prev);
  const binding = res.n === res.criterion1 ? 1 : res.n === res.criterion2 ? 2 : 3;

  return (
    <LabFrame
      id="sample-size"
      title="How many patients do you need to develop a model?"
      goal="The Riley et al. (BMJ 2020) criteria — implemented in the pmsampsize package — replace the '10 events per variable' rule of thumb. This calculator reproduces the published worked example (n = 662)."
      tryThis={[
        'Count **parameters**, not variables: a 4-knot spline uses 3 parameters; a 5-level category uses 4. Set 8 variables with splines on 5 of them → 8 + 2×5 = 18.',
        'Lower the anticipated C-statistic from 0.85 to 0.70. Why does a *weaker* model need *more* patients?',
        'At 2% prevalence, compare the Riley answer with the 10-EPV rule. Which criterion is binding?',
      ]}
      insight={
        'Criterion 1 targets expected shrinkage ≥ 0.9 (≤10% overfitting of predictor effects). Criterion 2 keeps optimism in apparent R² small. Criterion 3 estimates overall risk within ±0.05. The required n depends on the number of parameters, the outcome prevalence and the expected strength of the model — so no fixed EPV is universally adequate. Penalised regression does not rescue an undersized study: shrinkage estimates are themselves unstable when n is small.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Slider label="Candidate predictor parameters (df)" value={params} min={1} max={60} onChange={setParams} hint="Include every df considered, even those later dropped by selection." />
          <Slider label="Anticipated outcome prevalence" value={prev} min={0.01} max={0.5} step={0.005} onChange={setPrev} format={(v) => pct(v, 1)} />
          <Segmented
            label="Anticipated model strength"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'c', label: 'From C-statistic' },
              { value: 'r2', label: 'Cox–Snell R²' },
            ]}
          />
          {mode === 'c' ? (
            <Slider label="Anticipated C-statistic (AUC)" value={c} min={0.6} max={0.95} step={0.01} onChange={setC} format={(v) => num(v, 2)} hint={`Converted to Cox–Snell R² = ${num(r2cs, 3)} (Riley 2021 approach)`} />
          ) : (
            <Slider label="Anticipated Cox–Snell R²" value={r2} min={0.01} max={Math.min(0.6, maxR2cs(prev) * 0.95)} step={0.005} onChange={setR2} format={(v) => num(v, 3)} hint={`Maximum possible at this prevalence: ${num(maxR2cs(prev), 3)}`} />
          )}
          <Slider label="Target expected shrinkage" value={shrink} min={0.8} max={0.97} step={0.01} onChange={setShrink} format={(v) => num(v, 2)} />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Minimum sample size" value={res.n.toLocaleString()} sub={`criterion ${binding} is binding`} tone="good" />
            <Stat label="Events required" value={Math.ceil(res.events).toLocaleString()} sub={`${num(res.epp, 1)} events per parameter`} />
          </div>
          <Panel title="Criteria">
            <table className="w-full text-sm">
              <tbody className="[&_td]:py-1.5">
                {[
                  ['1. Shrinkage ≥ ' + num(shrink, 2), res.criterion1],
                  ['2. Optimism in R²_Nagelkerke ≤ 0.05', res.criterion2],
                  ['3. Overall risk ± 0.05', res.criterion3],
                ].map(([l, v], i) => (
                  <tr key={String(l)} className={i + 1 === binding ? 'font-semibold text-primary' : ''}>
                    <td>{l}</td>
                    <td className="tabular text-right">{Number(v).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-t text-muted-foreground">
                  <td>For comparison: "10 events per variable"</td>
                  <td className="tabular text-right">{epv10.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </Panel>
          <p className="text-xs text-muted-foreground">
            Formulas: n = P / ((S − 1)·ln(1 − R²cs/S)); criterion 2 uses S = R²cs / (R²cs + 0.05·max R²cs); criterion 3: n = (1.96/0.05)²·φ(1−φ). For time-to-event or continuous outcomes, and for external validation (Riley 2024), use the corresponding pmsampsize / pmvalsampsize routines.
          </p>
        </div>
      </div>
    </LabFrame>
  );
}
