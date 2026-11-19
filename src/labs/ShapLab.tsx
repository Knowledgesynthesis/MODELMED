import { useEffect, useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Segmented, Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { usePalette } from '@/components/charts/palette';
import { getDataset } from '@/data/datasets';
import { DEFAULT_PARAMS, fitModel, rawMatrix, stratifiedSplit, type FittedModel } from '@/lib/pipeline/pipeline';
import { exactShapley } from '@/lib/ml/explain';
import { Rng } from '@/lib/stats/random';
import { expit, quantile } from '@/lib/stats/core';
import { cn, num, pct } from '@/lib/utils';

type Kind = 'logistic' | 'boosting';
const cache: Partial<Record<Kind, FittedModel>> = {};

function useSetup() {
  return useMemo(() => {
    const ds = getDataset('sepsis');
    const keys = ds.features.map((f) => f.key);
    const y = ds.rows.map((r) => r.outcome);
    const split = stratifiedSplit(y, 0.3, 1);
    const rng = new Rng(17);
    const bgRows = rng.shuffle(split.train).slice(0, 30);
    const background = rawMatrix(ds, bgRows, keys);
    const test = rawMatrix(ds, split.test, keys);
    const ranges = keys.map((_, j) => [quantile(ds.rows.map((r) => r[keys[j]]), 0.01), quantile(ds.rows.map((r) => r[keys[j]]), 0.99)] as [number, number]);
    return { ds, keys, split, background, test, ranges };
  }, []);
}

export default function ShapLab() {
  const { ds, keys, split, background, test, ranges } = useSetup();
  const [kind, setKind] = useState<Kind>('boosting');
  const [patientIdx, setPatientIdx] = useState(0);
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [global, setGlobal] = useState<number[] | null>(null);
  const pal = usePalette();
  const model = useMemo(() => {
    if (!cache[kind]) cache[kind] = fitModel(ds, split.train, keys, kind, DEFAULT_PARAMS);
    return cache[kind]!;
  }, [kind, ds, split, keys]);

  const presets = useMemo(() => {
    const p = model.predictRaw(test);
    const order = p.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    let hypo = test.findIndex((x) => x[1] < 36.2 && x[5] < 4.5);
    if (hypo < 0) hypo = test.findIndex((x) => x[1] < 36.2 || x[5] < 4);
    return [
      { label: 'Highest risk', i: order[order.length - 1][1] },
      { label: 'Typical (median)', i: order[Math.floor(order.length / 2)][1] },
      { label: 'Hypothermic, low WBC', i: hypo >= 0 ? hypo : order[5][1] },
      { label: 'Lowest risk', i: order[0][1] },
    ];
  }, [model, test]);
  const base = test[presets[patientIdx].i];
  const x = base.map((v, j) => edits[j] ?? v);
  const shap = useMemo(() => exactShapley(model.predictRaw, x, background, 'logit'), [model, x.join(','), background]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setGlobal(null);
    const id = setTimeout(() => {
      const sample = test.slice(0, 40);
      const acc = new Array(keys.length).fill(0);
      for (const row of sample) exactShapley(model.predictRaw, row, background.slice(0, 15), 'logit').phi.forEach((v, j) => (acc[j] += Math.abs(v) / sample.length));
      setGlobal(acc);
    }, 30);
    return () => clearTimeout(id);
  }, [model, test, background, keys.length]);

  const order = shap.phi.map((v, j) => [v, j] as [number, number]).sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
  let running = shap.base;
  const steps = order.map(([v, j]) => {
    const start = running;
    running += v;
    return { j, v, start, end: running };
  });
  const all = [shap.base, ...steps.map((s) => s.end)];
  const lo = Math.min(...all) - 0.3;
  const hi = Math.max(...all) + 0.3;
  const W = 100;
  const sx = (v: number) => ((v - lo) / (hi - lo)) * W;
  const lr = model.coefficients;

  return (
    <LabFrame
      id="shap"
      title="SHAP: who pushed this prediction up or down?"
      goal="Exact Shapley values (all 256 feature coalitions, interventional, on the log-odds scale) for one patient's sepsis prediction. Contributions add up exactly from the average prediction to this patient's prediction."
      tryThis={[
        'Choose **Hypothermic, low WBC** with gradient-boosted trees. Low temperature *raises* risk — the model learned the U-shape. Switch to linear logistic regression: what does it say about the same temperature?',
        'Edit lactate in the what-if panel. For logistic regression the SHAP value changes linearly (φ = β·(x − mean)); for boosted trees it changes in steps.',
        'Compare global importance (mean |SHAP|) between the two models. Importance is a property of the **model**, not of human physiology.',
      ]}
      insight={
        'SHAP splits a prediction into additive contributions relative to a **baseline** (the average prediction over a background sample). They describe the model, not causation: a feature can carry large SHAP values because it is a proxy (e.g., a lab ordered because a clinician was worried). With correlated features, interventional SHAP evaluates unrealistic patients and splits credit arbitrarily between correlated predictors; explanations can also be manipulated (Slack 2020). Additivity holds on the log-odds scale — converting each bar to "percentage points" is not additive.'
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <Segmented
          label="Model"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setEdits({});
          }}
          options={[
            { value: 'logistic', label: 'Logistic (linear)' },
            { value: 'boosting', label: 'Gradient-boosted trees' },
          ]}
        />
        <Segmented
          label="Patient"
          size="sm"
          value={String(patientIdx)}
          onChange={(v) => {
            setPatientIdx(Number(v));
            setEdits({});
          }}
          options={presets.map((p, i) => ({ value: String(i), label: p.label }))}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Waterfall (log-odds scale)">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-32 shrink-0 text-right text-muted-foreground sm:w-40">Baseline E[f(x)]</div>
              <div className="relative h-6 flex-1">
                <div className="absolute top-1 h-4 w-0.5 bg-foreground" style={{ left: `${sx(shap.base)}%` }} />
              </div>
              <div className="tabular w-24 shrink-0">{num(shap.base, 2)} ({pct(expit(shap.base), 1)})</div>
            </div>
            {steps.map((s) => {
              const f = ds.features[s.j];
              const left = Math.min(sx(s.start), sx(s.end));
              const width = Math.max(0.6, Math.abs(sx(s.end) - sx(s.start)));
              return (
                <div key={s.j} className="flex items-center gap-2">
                  <div className="w-32 shrink-0 truncate text-right sm:w-40" title={f.label}>
                    {f.label} = <span className="tabular font-semibold">{num(x[s.j], f.type === 'binary' ? 0 : 1)}</span>
                  </div>
                  <div className="relative h-6 flex-1 rounded bg-muted/40">
                    <div className="absolute top-1 h-4 rounded-sm" style={{ left: `${left}%`, width: `${width}%`, background: s.v >= 0 ? pal.pos : pal.neg }} />
                  </div>
                  <div className={cn('tabular w-24 shrink-0 font-medium')} style={{ color: s.v >= 0 ? pal.pos : pal.neg }}>
                    {s.v >= 0 ? '+' : ''}
                    {num(s.v, 2)}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2 border-t pt-1.5">
              <div className="w-32 shrink-0 text-right font-semibold sm:w-40">Prediction f(x)</div>
              <div className="relative h-6 flex-1">
                <div className="absolute top-1 h-4 w-0.5 bg-foreground" style={{ left: `${sx(shap.prediction)}%` }} />
              </div>
              <div className="tabular w-24 shrink-0 font-semibold">
                {num(shap.prediction, 2)} ({pct(expit(shap.prediction), 1)})
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Check: baseline + Σφ = {num(shap.base, 3)} + {num(shap.phi.reduce((a, b) => a + b, 0), 3)} = {num(shap.base + shap.phi.reduce((a, b) => a + b, 0), 3)} = model log-odds (efficiency property).
          </p>
        </Panel>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Predicted risk" value={pct(expit(shap.prediction))} />
            <Stat label="Average risk (baseline)" value={pct(expit(shap.base))} />
          </div>
          <Panel title="Global importance: mean |SHAP| (40 test patients)">
            {global ? (
              <div className="space-y-1">
                {global
                  .map((v, j) => [v, j] as [number, number])
                  .sort((a, b) => b[0] - a[0])
                  .map(([v, j]) => (
                    <div key={j} className="flex items-center gap-2 text-xs">
                      <div className="w-28 shrink-0 truncate text-right">{ds.features[j].label}</div>
                      <div className="h-3 flex-1 rounded bg-muted/40">
                        <div className="h-3 rounded" style={{ width: `${(v / Math.max(...global)) * 100}%`, background: pal.a }} />
                      </div>
                      <div className="tabular w-10 shrink-0">{num(v, 2)}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Computing…</p>
            )}
          </Panel>
          {kind === 'logistic' && lr && (
            <p className="text-xs text-muted-foreground">
              For a linear-logit model with a background sample, φⱼ = βⱼ·(xⱼ − x̄ⱼ) exactly: the SHAP value is just the coefficient times how far the patient is from average.
            </p>
          )}
        </div>
      </div>
      <details className="rounded-xl border bg-background/50 p-4">
        <summary className="cursor-pointer text-sm font-semibold">What-if: edit this patient</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ds.features.map((f, j) =>
            f.type === 'binary' ? (
              <Segmented
                key={f.key}
                size="sm"
                label={f.label}
                value={String(x[j])}
                onChange={(v) => setEdits((e) => ({ ...e, [j]: Number(v) }))}
                options={[
                  { value: '0', label: 'No' },
                  { value: '1', label: 'Yes' },
                ]}
              />
            ) : (
              <Slider
                key={f.key}
                label={`${f.label}${f.unit ? ` (${f.unit})` : ''}`}
                value={x[j]}
                min={+ranges[j][0].toFixed(1)}
                max={+ranges[j][1].toFixed(1)}
                step={f.key === 'temperature' || f.key === 'wbc' || f.key === 'lactate' ? 0.1 : 1}
                onChange={(v) => setEdits((e) => ({ ...e, [j]: v }))}
                format={(v) => num(v, f.key === 'temperature' || f.key === 'wbc' || f.key === 'lactate' ? 1 : 0)}
              />
            )
          )}
        </div>
        <button type="button" className="mt-3 text-xs font-medium text-primary underline" onClick={() => setEdits({})}>
          Reset patient
        </button>
      </details>
    </LabFrame>
  );
}
