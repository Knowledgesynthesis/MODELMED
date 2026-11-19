import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Loader2, Play, AlertTriangle } from 'lucide-react';
import { getDatasets, type Dataset } from '@/data/datasets';
import { DEFAULT_PARAMS, MODEL_LABELS, fitModel, rawMatrix, stratifiedSplit, type FittedModel, type ModelKind, type ModelParams } from '@/lib/pipeline/pipeline';
import { aucWithCI, auc, brier, calibrationBins, calibrationSummary, classificationMetrics, confusionAt, decisionCurve, rocCurve, scaledBrier, smoothCalibration } from '@/lib/stats/metrics';
import { exactShapley, permutationImportance } from '@/lib/ml/explain';
import { Rng } from '@/lib/stats/random';
import { expit, mean } from '@/lib/stats/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { ConfusionGrid } from '@/labs/LabFrame';
import { Markdown } from '@/components/Markdown';
import { num, pct } from '@/lib/utils';

const LEAK_KEY = 'leak';

/** Optionally add a predictor recorded AFTER the prediction time (a classic leak). */
function withLeak(ds: Dataset, on: boolean): Dataset {
  if (!on) return ds;
  const rng = new Rng(404);
  const rows = ds.rows.map((r) => ({ ...r, [LEAK_KEY]: rng.bernoulli(r.outcome ? 0.7 : 0.07) }));
  const label = ds.id === 'sepsis' ? 'Antibiotics started (next 12 h)' : 'Seen by readmission team (next 30 d)';
  return { ...ds, rows, features: [...ds.features, { key: LEAK_KEY, label, type: 'binary', description: 'Recorded after the prediction time' }] };
}

interface Result {
  /** dataset configuration the result belongs to (cohort + leak flag) */
  dsKey: string;
  model: FittedModel;
  keys: string[];
  pTest: number[];
  yTest: number[];
  pTrain: number[];
  yTrain: number[];
  oracle: number[];
  groupTest: number[];
  test: number[];
  importance: { feature: number; drop: number; sd: number }[];
  ms: number;
}

export function SandboxPage() {
  const datasets = getDatasets();
  const [dsId, setDsId] = useState('sepsis');
  const [leak, setLeak] = useState(false);
  const base = datasets.find((d) => d.id === dsId)!;
  const ds = useMemo(() => withLeak(base, leak), [base, leak]);
  const [selected, setSelected] = useState<string[]>(base.features.map((f) => f.key));
  const [kind, setKind] = useState<ModelKind>('logistic');
  const [prm, setPrm] = useState<ModelParams>(DEFAULT_PARAMS);
  const [testFrac, setTestFrac] = useState(0.3);
  const [seed, setSeed] = useState(1);
  const [threshold, setThreshold] = useState(0.15);
  const [busy, setBusy] = useState(false);
  const [result, setRes] = useState<Result | null>(null);
  const pal = usePalette();
  const dsKey = `${dsId}:${leak}`;
  // never render results computed for a different cohort/predictor set
  const res = result && result.dsKey === dsKey ? result : null;

  useEffect(() => {
    setSelected(ds.features.map((f) => f.key));
  }, [ds]);

  const train = () => {
    setBusy(true);
    setTimeout(() => {
      const t0 = performance.now();
      const y = ds.rows.map((r) => r.outcome);
      const split = stratifiedSplit(y, testFrac, seed);
      const keys = ds.features.map((f) => f.key).filter((k) => selected.includes(k));
      const model = fitModel(ds, split.train, keys, kind, prm, seed);
      const Xte = rawMatrix(ds, split.test, keys);
      const Xtr = rawMatrix(ds, split.train, keys);
      const pTest = model.predictRaw(Xte);
      const pTrain = model.predictRaw(Xtr);
      const yTest = split.test.map((i) => y[i]);
      const importance = permutationImportance(model.predictRaw, Xte, yTest, kind === 'forest' || kind === 'boosting' ? 3 : 5);
      setRes({
        dsKey,
        model,
        keys,
        pTest,
        yTest,
        pTrain,
        yTrain: split.train.map((i) => y[i]),
        oracle: split.test.map((i) => ds.rows[i].trueRisk),
        groupTest: split.test.map((i) => ds.rows[i][ds.group.key]),
        test: split.test,
        importance,
        ms: performance.now() - t0,
      });
      setBusy(false);
    }, 20);
  };

  const ev = useMemo(() => {
    if (!res) return null;
    const cm = confusionAt(res.pTest, res.yTest, threshold);
    const groups = [0, 1].map((g) => {
      const idx = res.groupTest.map((v, i) => (v === g ? i : -1)).filter((i) => i >= 0);
      const p = idx.map((i) => res.pTest[i]);
      const yy = idx.map((i) => res.yTest[i]);
      const c = classificationMetrics(confusionAt(p, yy, threshold));
      return { label: ds.group.labels[g], n: idx.length, events: yy.reduce((a, b) => a + b, 0), auc: auc(p, yy), cal: calibrationSummary(p, yy), sens: c.sensitivity, spec: c.specificity, ppv: c.ppv };
    });
    return {
      disc: aucWithCI(res.pTest, res.yTest),
      trainAuc: auc(res.pTrain, res.yTrain),
      oracleAuc: auc(res.oracle, res.yTest),
      cal: calibrationSummary(res.pTest, res.yTest),
      smooth: smoothCalibration(res.pTest, res.yTest),
      bins: calibrationBins(res.pTest, res.yTest, 10),
      brier: brier(res.pTest, res.yTest),
      sbrier: scaledBrier(res.pTest, res.yTest),
      cm,
      cls: classificationMetrics(cm),
      roc: rocCurve(res.pTest, res.yTest),
      rocOracle: rocCurve(res.oracle, res.yTest),
      dca: decisionCurve(res.pTest, res.yTest, Array.from({ length: 45 }, (_, i) => 0.01 + i * 0.01)),
      dcaOracle: decisionCurve(res.oracle, res.yTest, Array.from({ length: 45 }, (_, i) => 0.01 + i * 0.01)),
      groups,
    };
  }, [res, threshold, ds.group]);

  const leakSuspect = ev && res && (ev.disc.auc > ev.oracleAuc + 0.02 || res.importance.some((im) => res.keys[im.feature] === LEAK_KEY && im.drop > 0.03));
  const optimism = ev ? ev.trainAuc - ev.disc.auc : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-10">
      <header>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <FlaskConical className="h-4 w-4" /> Capstone
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Model sandbox</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Develop and validate a clinical prediction model end to end on synthetic cohorts whose true risks are known. Every number below is computed in your browser from the data — nothing is simulated for display.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>1 · Design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Select label="Cohort" value={dsId} onChange={(v) => { setDsId(v); setLeak(false); }} options={datasets.map((d) => ({ value: d.id, label: d.name }))} />
            <p className="text-xs text-muted-foreground">{ds.description}</p>
            <details className="rounded-lg border p-3 text-sm">
              <summary className="cursor-pointer font-medium">Reveal the true data-generating model</summary>
              <Markdown md={ds.truth} className="mt-2 text-sm" />
            </details>
            <div>
              <div className="mb-2 text-sm font-medium">Candidate predictors</div>
              <div className="grid grid-cols-1 gap-1.5">
                {ds.features.map((f) => (
                  <label key={f.key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={selected.includes(f.key)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, f.key] : s.filter((k) => k !== f.key)))}
                    />
                    <span className={f.key === LEAK_KEY ? 'font-medium text-warning' : ''}>
                      {f.label}
                      {f.unit ? <span className="text-muted-foreground"> ({f.unit})</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Toggle label="Add a post-prediction-time variable" checked={leak} onChange={setLeak} hint="A realistic EHR field that is only known after the moment of prediction" />
            <Select label="Model" value={kind} onChange={(v) => setKind(v)} options={(Object.keys(MODEL_LABELS) as ModelKind[]).map((k) => ({ value: k, label: MODEL_LABELS[k] }))} />
            {(kind === 'logistic' || kind === 'logistic-spline') && (
              <Slider label="Ridge penalty (λ)" value={prm.ridge} min={0} max={50} step={1} onChange={(v) => setPrm({ ...prm, ridge: v })} hint="0 = maximum likelihood (with standard errors)" />
            )}
            {kind === 'logistic-spline' && (
              <Slider label="Spline knots" value={prm.knots} min={3} max={5} onChange={(v) => setPrm({ ...prm, knots: v as 3 | 4 | 5 })} />
            )}
            {(kind === 'tree' || kind === 'forest' || kind === 'boosting') && (
              <>
                <Slider label="Max depth" value={prm.maxDepth} min={1} max={kind === 'boosting' ? 4 : 12} onChange={(v) => setPrm({ ...prm, maxDepth: v })} />
                <Slider label="Min patients per leaf" value={prm.minLeaf} min={5} max={100} step={5} onChange={(v) => setPrm({ ...prm, minLeaf: v })} />
              </>
            )}
            {kind === 'forest' && <Slider label="Trees" value={prm.nTrees} min={10} max={300} step={10} onChange={(v) => setPrm({ ...prm, nTrees: v })} />}
            {kind === 'boosting' && (
              <>
                <Slider label="Boosting rounds" value={prm.nRounds} min={10} max={500} step={10} onChange={(v) => setPrm({ ...prm, nRounds: v })} />
                <Slider label="Learning rate" value={prm.learningRate} min={0.01} max={0.5} step={0.01} onChange={(v) => setPrm({ ...prm, learningRate: v })} format={(v) => num(v, 2)} />
              </>
            )}
            <Slider label="Held-out test fraction" value={testFrac} min={0.2} max={0.5} step={0.05} onChange={setTestFrac} format={(v) => pct(v, 0)} hint="Stratified random split" />
            <div className="flex items-center gap-2">
              <Button className="flex-1" onClick={train} disabled={busy || selected.length === 0}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {busy ? 'Training…' : 'Train & validate'}
              </Button>
              <Button variant="outline" onClick={() => setSeed((s) => s + 1)} title="Draw a different random split">
                Split #{seed}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          {!res || !ev ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="font-medium text-foreground">Configure a model and press Train & validate.</p>
                <p className="mt-2 text-sm">Suggested path: (1) linear logistic on sepsis → (2) splines → (3) boosted trees → (4) add the post-prediction-time variable and see if you can spot the leak → (5) readmission cohort, compare all models.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {leakSuspect && (
                <div className="flex gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <div className="font-semibold">Too good to be true?</div>
                    Test AUC ({num(ev.disc.auc, 3)}) exceeds the AUC of the <em>true risk</em> ({num(ev.oracleAuc, 3)}) — impossible for a legitimate model. A predictor is carrying information from after the prediction time. In real data you will not have the oracle: check every predictor’s timestamp against the moment of prediction.
                  </div>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>2 · Validation results</CardTitle>
                  <CardDescription>
                    {MODEL_LABELS[kind]} · {res.keys.length} predictors · train n = {res.yTrain.length} ({res.yTrain.reduce((a, b) => a + b, 0)} events) · test n = {res.yTest.length} ({res.yTest.reduce((a, b) => a + b, 0)} events) · {Math.round(res.ms)} ms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Stat label="Test AUC (95% CI)" value={num(ev.disc.auc, 3)} sub={`${num(ev.disc.lo, 3)}–${num(ev.disc.hi, 3)}`} />
                    <Stat label="Apparent (train) AUC" value={num(ev.trainAuc, 3)} sub={`optimism ${optimism >= 0 ? '+' : ''}${num(optimism, 3)}`} tone={optimism > 0.05 ? 'warn' : undefined} />
                    <Stat label="Best possible (true risk)" value={num(ev.oracleAuc, 3)} sub="oracle on the same test set" />
                    <Stat label="Calibration slope" value={num(ev.cal.slope, 2)} sub={`intercept ${num(ev.cal.citl, 2)}`} tone={Math.abs(ev.cal.slope - 1) > 0.2 || Math.abs(ev.cal.citl) > 0.2 ? 'warn' : 'good'} />
                    <Stat label="O/E" value={num(ev.cal.oe, 2)} />
                    <Stat label="ICI" value={num(ev.smooth.ici, 3)} />
                    <Stat label="Brier" value={num(ev.brier, 3)} sub={`scaled ${num(ev.sbrier, 2)}`} />
                    <Stat label="Prevalence (test)" value={pct(mean(res.yTest))} />
                  </div>
                  {res.model.separation && <Badge tone="warning">Coefficients diverging — possible separation (common with leaky predictors)</Badge>}
                  <Tabs
                    tabs={[
                      {
                        id: 'threshold',
                        label: 'Threshold',
                        content: (
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <Slider label="Decision threshold (predicted risk)" value={threshold} min={0.01} max={0.8} step={0.01} onChange={setThreshold} format={(v) => pct(v, 0)} hint={`Implied trade-off: ${num((1 - threshold) / threshold, 1)} false alarms acceptable per true case`} />
                              <div className="grid grid-cols-2 gap-2">
                                <Stat label="Sensitivity" value={pct(ev.cls.sensitivity)} />
                                <Stat label="Specificity" value={pct(ev.cls.specificity)} />
                                <Stat label="PPV" value={pct(ev.cls.ppv)} sub={`${num(ev.cls.nnf, 1)} flags per true case`} />
                                <Stat label="NPV" value={pct(ev.cls.npv)} />
                                <Stat label="Flag rate" value={pct(ev.cls.flagged)} />
                                <Stat label="Accuracy" value={pct(ev.cls.accuracy)} sub="rarely the right metric" />
                              </div>
                            </div>
                            <ConfusionGrid tp={ev.cm.tp} fp={ev.cm.fp} fn={ev.cm.fn} tn={ev.cm.tn} />
                          </div>
                        ),
                      },
                      {
                        id: 'roc',
                        label: 'ROC',
                        content: (
                          <div className="mx-auto max-w-md">
                            <Plot title="ROC curve" square x={{ domain: [0, 1], label: '1 − specificity', format: (v) => pct(v, 0) }} y={{ domain: [0, 1], label: 'Sensitivity', format: (v) => pct(v, 0) }}>
                              {(s) => (
                                <>
                                  <line x1={s.x(0)} y1={s.y(0)} x2={s.x(1)} y2={s.y(1)} stroke={s.pal.ref} strokeDasharray="4 4" />
                                  <path d={linePath(ev.rocOracle.map((p) => [p.fpr, p.tpr]), s)} fill="none" stroke={s.pal.muted} strokeWidth={1.5} strokeDasharray="2 3" />
                                  <path d={linePath(ev.roc.map((p) => [p.fpr, p.tpr]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                                  <circle cx={s.x(1 - ev.cls.specificity)} cy={s.y(ev.cls.sensitivity)} r={6} fill={s.pal.b} />
                                </>
                              )}
                            </Plot>
                            <Legend items={[{ label: `Model (AUC ${num(ev.disc.auc, 3)})`, color: pal.a }, { label: `True risk (AUC ${num(ev.oracleAuc, 3)})`, color: pal.muted, dash: true }]} />
                          </div>
                        ),
                      },
                      {
                        id: 'cal',
                        label: 'Calibration',
                        content: (
                          <div className="mx-auto max-w-md">
                            <Plot title="Calibration plot" square x={{ domain: [0, Math.max(0.4, ...ev.bins.map((b) => b.meanPredicted)) * 1.1], label: 'Predicted risk', format: (v) => pct(v, 0) }} y={{ domain: [0, Math.max(0.4, ...ev.bins.map((b) => b.hi)) * 1.1], label: 'Observed', format: (v) => pct(v, 0) }}>
                              {(s) => (
                                <>
                                  <line x1={s.x(0)} y1={s.y(0)} x2={s.x(1)} y2={s.y(1)} stroke={s.pal.ref} strokeDasharray="4 4" />
                                  <path d={linePath(ev.smooth.curve.map((c) => [c.predicted, c.observed]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                                  {ev.bins.map((b, i) => (
                                    <g key={i}>
                                      <line x1={s.x(b.meanPredicted)} x2={s.x(b.meanPredicted)} y1={s.y(b.lo)} y2={s.y(b.hi)} stroke={s.pal.b} />
                                      <circle cx={s.x(b.meanPredicted)} cy={s.y(b.observed)} r={4} fill={s.pal.b} />
                                    </g>
                                  ))}
                                </>
                              )}
                            </Plot>
                            <Legend items={[{ label: 'Ideal', color: pal.ref, dash: true }, { label: 'Spline curve', color: pal.a }, { label: 'Deciles ± 95% CI', color: pal.b }]} />
                          </div>
                        ),
                      },
                      {
                        id: 'dca',
                        label: 'Net benefit',
                        content: (
                          <div>
                            <Plot title="Decision curve" height={280} x={{ domain: [0, 0.45], label: 'Threshold probability', format: (v) => pct(v, 0) }} y={{ domain: [-0.02, Math.max(0.05, mean(res.yTest)) * 1.15], label: 'Net benefit', format: (v) => num(v, 2) }}>
                              {(s) => (
                                <>
                                  <line x1={s.x(0)} x2={s.x(0.45)} y1={s.y(0)} y2={s.y(0)} stroke={s.pal.fg} />
                                  <path d={linePath(ev.dca.map((p) => [p.threshold, p.treatAll]), s)} fill="none" stroke={s.pal.muted} strokeDasharray="5 4" strokeWidth={2} />
                                  <path d={linePath(ev.dcaOracle.map((p) => [p.threshold, p.model]), s)} fill="none" stroke={s.pal.muted} strokeDasharray="2 3" strokeWidth={1.5} />
                                  <path d={linePath(ev.dca.map((p) => [p.threshold, p.model]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                                  <line x1={s.x(threshold)} x2={s.x(threshold)} y1={s.y(-0.02)} y2={s.y(1)} stroke={s.pal.b} strokeDasharray="3 3" />
                                </>
                              )}
                            </Plot>
                            <Legend items={[{ label: 'Model', color: pal.a }, { label: 'True risk', color: pal.muted, dash: true }, { label: 'Treat all', color: pal.muted, dash: true }, { label: 'Treat none', color: pal.fg }]} />
                          </div>
                        ),
                      },
                      {
                        id: 'imp',
                        label: 'Importance',
                        content: (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Permutation importance on the test set: drop in AUC when each predictor is shuffled (mean ± SD over repeats). It is a property of this model, not a causal effect.</p>
                            {[...res.importance]
                              .sort((a, b) => b.drop - a.drop)
                              .map((im) => {
                                const f = ds.features.find((x) => x.key === res.keys[im.feature])!;
                                const maxDrop = Math.max(0.01, ...res.importance.map((i) => i.drop));
                                return (
                                  <div key={im.feature} className="flex items-center gap-2 text-sm">
                                    <div className="w-36 shrink-0 truncate text-right sm:w-52">{f.label}</div>
                                    <div className="h-4 flex-1 rounded bg-muted/50">
                                      <div className="h-4 rounded" style={{ width: `${Math.max(0, im.drop / maxDrop) * 100}%`, background: f.key === LEAK_KEY ? pal.e : pal.a }} />
                                    </div>
                                    <div className="tabular w-24 shrink-0 text-xs">
                                      {num(im.drop, 3)} ± {num(im.sd, 3)}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ),
                      },
                      ...(res.model.coefficients
                        ? [
                            {
                              id: 'coef',
                              label: 'Coefficients',
                              content: (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground">
                                      <tr>
                                        <th className="py-1 text-left font-medium">Term</th>
                                        <th className="text-right font-medium">β</th>
                                        <th className="text-right font-medium">OR (95% CI)</th>
                                        <th className="text-left font-medium pl-3">Scale</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {res.model.coefficients.map((c) => (
                                        <tr key={c.term} className="border-t">
                                          <td className="py-1.5">{c.term}</td>
                                          <td className="tabular text-right">{num(c.beta, 3)}</td>
                                          <td className="tabular whitespace-nowrap text-right">{c.term === '(Intercept)' || c.term.includes('spline') ? '—' : `${num(c.or, 2)} (${num(c.lo, 2)}–${num(c.hi, 2)})`}</td>
                                          <td className="pl-3 text-xs text-muted-foreground">{c.perUnit}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <p className="mt-2 text-xs text-muted-foreground">Continuous predictors standardised using training data. Spline terms are not interpretable one at a time — plot the fitted relationship instead. Coefficients are associations conditional on the other predictors, not causal effects. Confidence intervals are not shown for penalised fits.</p>
                                </div>
                              ),
                            },
                          ]
                        : []),
                      {
                        id: 'groups',
                        label: 'Subgroups',
                        content: (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="text-xs text-muted-foreground">
                                <tr>
                                  <th className="py-1 text-left font-medium">Group</th>
                                  <th className="text-right font-medium">n (events)</th>
                                  <th className="text-right font-medium">AUC</th>
                                  <th className="text-right font-medium">O/E</th>
                                  <th className="text-right font-medium">Slope</th>
                                  <th className="text-right font-medium">Sens</th>
                                  <th className="text-right font-medium">PPV</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ev.groups.map((g) => (
                                  <tr key={g.label} className="border-t">
                                    <td className="py-1.5">{g.label}</td>
                                    <td className="tabular text-right">
                                      {g.n} ({g.events})
                                    </td>
                                    <td className="tabular text-right">{num(g.auc, 3)}</td>
                                    <td className="tabular text-right">{num(g.cal.oe, 2)}</td>
                                    <td className="tabular text-right">{num(g.cal.slope, 2)}</td>
                                    <td className="tabular text-right">{pct(g.sens, 0)}</td>
                                    <td className="tabular text-right">{pct(g.ppv, 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <p className="mt-2 text-xs text-muted-foreground">Subgroup estimates are noisy at these sample sizes — look for consistent, clinically meaningful gaps and report CIs. Sex is not a predictor here; differences arise from case mix.</p>
                          </div>
                        ),
                      },
                      { id: 'explain', label: 'Explain a patient', content: <PatientExplainer res={res} ds={ds} /> },
                    ]}
                  />
                </CardContent>
              </Card>
              <ModelCard res={res} ev={ev} ds={ds} kind={kind} threshold={threshold} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientExplainer({ res, ds }: { res: Result; ds: Dataset }) {
  const pal = usePalette();
  const [rank, setRank] = useState(0.95);
  const order = useMemo(() => res.pTest.map((p, i) => [p, i] as [number, number]).sort((a, b) => a[0] - b[0]), [res]);
  const idx = order[Math.min(order.length - 1, Math.floor(rank * (order.length - 1)))][1];
  const X = useMemo(() => rawMatrix(ds, res.test, res.keys), [ds, res]);
  const bg = useMemo(() => new Rng(5).shuffle(X).slice(0, res.keys.length > 8 ? 12 : 25), [X, res.keys.length]);
  const sh = useMemo(() => exactShapley(res.model.predictRaw, X[idx], bg, 'logit'), [res, X, idx, bg]);
  const max = Math.max(...sh.phi.map(Math.abs), 0.1);
  return (
    <div className="space-y-4">
      <Slider label="Pick a test patient by predicted-risk percentile" value={rank} min={0} max={1} step={0.01} onChange={setRank} format={(v) => `${Math.round(v * 100)}th`} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Predicted risk" value={pct(res.pTest[idx])} />
        <Stat label="True risk (oracle)" value={pct(res.oracle[idx])} />
        <Stat label="Outcome" value={res.yTest[idx] ? 'Event' : 'No event'} />
      </div>
      <div className="space-y-1.5">
        {sh.phi
          .map((v, j) => [v, j] as [number, number])
          .sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]))
          .map(([v, j]) => {
            const f = ds.features.find((x) => x.key === res.keys[j])!;
            return (
              <div key={j} className="flex items-center gap-2 text-xs">
                <div className="w-40 shrink-0 truncate text-right sm:w-56">
                  {f.label} = <b className="tabular">{num(X[idx][j], f.type === 'binary' ? 0 : 1)}</b>
                </div>
                <div className="relative h-4 flex-1">
                  <div className="absolute left-1/2 top-0 h-4 w-px bg-border" />
                  <div className="absolute top-0 h-4 rounded-sm" style={{ left: v >= 0 ? '50%' : `${50 - (Math.abs(v) / max) * 50}%`, width: `${(Math.abs(v) / max) * 50}%`, background: v >= 0 ? pal.pos : pal.neg }} />
                </div>
                <div className="tabular w-12 shrink-0">{(v >= 0 ? '+' : '') + num(v, 2)}</div>
              </div>
            );
          })}
      </div>
      <p className="text-xs text-muted-foreground">
        Exact interventional SHAP values (log-odds). Baseline {num(sh.base, 2)} ({pct(expit(sh.base))}) + contributions = {num(sh.prediction, 2)} ({pct(expit(sh.prediction))}).
      </p>
    </div>
  );
}

interface CardEval {
  disc: { auc: number; lo: number; hi: number };
  cal: { citl: number; slope: number; oe: number };
  brier: number;
  sbrier: number;
  cls: { sensitivity: number; specificity: number; ppv: number; flagged: number };
}

function ModelCard({ res, ev, ds, kind, threshold }: { res: Result; ev: CardEval; ds: Dataset; kind: ModelKind; threshold: number }) {
  const events = res.yTrain.reduce((a, b) => a + b, 0);
  const testEvents = res.yTest.reduce((a, b) => a + b, 0);
  const md = `**Intended use.** Estimate the risk of *${ds.outcome.toLowerCase()}* for ${ds.description.split('.')[0].toLowerCase()}.

**Development data.** Synthetic cohort, n = ${res.yTrain.length} (${events} events). ${res.keys.length} candidate predictors: ${res.keys.map((k) => ds.features.find((f) => f.key === k)!.label).join(', ')}.

**Model.** ${MODEL_LABELS[kind]}.

**Validation.** Random stratified split (internal validation only — not evidence of transportability). Test n = ${res.yTest.length} (${testEvents} events).

| Measure | Estimate |
|---|---|
| AUC (95% CI) | ${num(ev.disc.auc, 3)} (${num(ev.disc.lo, 3)}–${num(ev.disc.hi, 3)}) |
| Calibration intercept / slope | ${num(ev.cal.citl, 2)} / ${num(ev.cal.slope, 2)} |
| O/E ratio | ${num(ev.cal.oe, 2)} |
| Brier (scaled) | ${num(ev.brier, 3)} (${num(ev.sbrier, 2)}) |
| At ${pct(threshold, 0)} threshold | sens ${pct(ev.cls.sensitivity, 0)}, spec ${pct(ev.cls.specificity, 0)}, PPV ${pct(ev.cls.ppv, 0)}, flags ${pct(ev.cls.flagged, 0)} |

**Before any clinical use:** external validation in the target setting (temporal and geographic), calibration and net-benefit assessment there, subgroup performance with CIs, a monitoring plan, and reporting per TRIPOD+AI [@collins2024tripodai].`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>3 · Auto-generated model summary</CardTitle>
        <CardDescription>A TRIPOD+AI-style fact sheet for what you just built. Notice what it cannot claim.</CardDescription>
      </CardHeader>
      <CardContent>
        <Markdown md={md} />
      </CardContent>
    </Card>
  );
}
