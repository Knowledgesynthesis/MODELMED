import { useMemo, useState } from 'react';
import { LabFrame, Panel, ConfusionGrid } from './LabFrame';
import { Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Tabs } from '@/components/ui/Tabs';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { normCdf, normPdf } from '@/lib/stats/core';
import { num, pct } from '@/lib/utils';

export default function RocLab() {
  const [d, setD] = useState(1.3);
  const [s1, setS1] = useState(1);
  const [c, setC] = useState(0.8);
  const [prev, setPrev] = useState(0.1);
  const pal = usePalette();
  const aucV = normCdf(d / Math.sqrt(1 + s1 * s1));
  const sensAt = (t: number) => 1 - normCdf((t - d) / s1);
  const specAt = (t: number) => normCdf(t);
  const sens = sensAt(c);
  const spec = specAt(c);
  const ppv = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
  const npv = (spec * (1 - prev)) / (spec * (1 - prev) + (1 - sens) * prev);
  const flagged = sens * prev + (1 - spec) * (1 - prev);

  const lo = -4, hi = Math.max(4, d + 4 * s1);
  const grid = useMemo(() => Array.from({ length: 241 }, (_, i) => lo + ((hi - lo) * i) / 240), [lo, hi]);
  const roc = useMemo(() => grid.map((t) => [1 - specAt(t), sensAt(t)] as [number, number]).reverse(), [grid, d, s1]); // eslint-disable-line react-hooks/exhaustive-deps
  const pr = useMemo(
    () =>
      grid
        .map((t) => {
          const se = sensAt(t), sp = specAt(t);
          const den = se * prev + (1 - sp) * (1 - prev);
          return [se, den > 1e-9 ? (se * prev) / den : 1] as [number, number];
        })
        .filter((p) => p[0] > 0.001),
    [grid, d, s1, prev] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const youden = useMemo(() => grid.reduce((b, t) => (sensAt(t) + specAt(t) > sensAt(b) + specAt(b) ? t : b), grid[0]), [grid, d, s1]); // eslint-disable-line react-hooks/exhaustive-deps
  const N = 1000;
  const ymax = Math.max(normPdf(0), normPdf(0) / s1) * 1.1;

  return (
    <LabFrame
      id="roc"
      title="ROC curves, thresholds and the confusion matrix"
      goal="A risk score separates patients with and without the outcome imperfectly. The ROC curve traces every possible threshold; you still have to choose one."
      tryThis={[
        'Drag the **threshold** and watch one point move along a fixed ROC curve. The curve (and AUC) never changes — only the operating point.',
        'Set separation so AUC ≈ 0.80, then change prevalence from 30% to 2%. ROC is unchanged; the PR curve and PPV collapse. Which would a ward nurse care about?',
        'Make the event-group SD 2.0 (unequal variance). The ROC curve becomes asymmetric and can cross the diagonal at the extremes.',
      ]}
      insight={
        'AUC = probability that a random patient with the outcome scores higher than a random patient without it (here exactly Φ(d/√(1+σ²))). It summarises ranking across *all* thresholds, including clinically irrelevant ones, and says nothing about calibration or about how many alerts a threshold generates. The Youden index maximises sensitivity + specificity, which implicitly treats a missed case and a false alarm as equally bad — rarely true clinically. Pick thresholds from the harm:benefit trade-off (see decision curves).'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="space-y-5">
          <Slider label="Separation between groups (d)" value={d} min={0} max={3.5} step={0.05} onChange={setD} format={(v) => num(v, 2)} hint={`AUC = ${num(aucV, 3)}`} />
          <Slider label="Spread of scores in events (SD)" value={s1} min={0.5} max={2} step={0.05} onChange={setS1} format={(v) => num(v, 2)} />
          <Slider label="Decision threshold (score)" value={c} min={lo} max={hi} step={0.02} onChange={setC} format={(v) => num(v, 2)} />
          <button type="button" className="text-xs font-medium text-primary underline underline-offset-2" onClick={() => setC(youden)}>
            Jump to Youden-optimal threshold ({num(youden, 2)})
          </button>
          <Slider label="Prevalence in the target setting" value={prev} min={0.01} max={0.5} step={0.005} onChange={setPrev} format={(v) => pct(v, 1)} />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="AUC" value={num(aucV, 3)} />
            <Stat label="Sensitivity" value={pct(sens)} />
            <Stat label="Specificity" value={pct(spec)} />
            <Stat label="PPV" value={pct(ppv)} tone={ppv < 0.2 ? 'bad' : undefined} />
            <Stat label="NPV" value={pct(npv)} />
            <Stat label="Flagged" value={pct(flagged)} sub={`${Math.round(flagged * N)} / 1,000`} />
          </div>
        </div>
        <div className="space-y-4">
          <Panel title="Score distributions">
            <Plot title="Score distributions of patients with and without the outcome" height={200} x={{ domain: [lo, hi], label: 'Model score (log-odds scale)' }} y={{ domain: [0, ymax], ticks: [], format: () => '' }} onPointer={(xv) => setC(+xv.toFixed(2))}>
              {(s) => {
                const neg = grid.map((t) => [t, normPdf(t)] as [number, number]);
                const pos = grid.map((t) => [t, normPdf((t - d) / s1) / s1] as [number, number]);
                const area = (pts: [number, number][], right: boolean) => {
                  const sel = pts.filter((p) => (right ? p[0] >= c : p[0] < c));
                  if (!sel.length) return '';
                  return `M${s.x(sel[0][0])},${s.y(0)}` + sel.map((p) => `L${s.x(p[0])},${s.y(p[1])}`).join('') + `L${s.x(sel[sel.length - 1][0])},${s.y(0)}Z`;
                };
                return (
                  <>
                    <path d={area(neg, true)} fill={s.pal.b} opacity={0.25} />
                    <path d={area(pos, true)} fill={s.pal.d} opacity={0.3} />
                    <path d={linePath(neg, s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                    <path d={linePath(pos, s)} fill="none" stroke={s.pal.e} strokeWidth={2.5} />
                    <line x1={s.x(c)} x2={s.x(c)} y1={s.y(0)} y2={s.y(ymax)} stroke={s.pal.fg} strokeWidth={2} />
                    <text x={s.x(c) + 4} y={s.y(ymax) + 12} fontSize={11} fill={s.pal.fg}>flag ≥</text>
                  </>
                );
              }}
            </Plot>
            <Legend items={[{ label: 'No outcome', color: pal.a }, { label: 'Outcome', color: pal.e }]} />
            <p className="mt-1 text-center text-xs text-muted-foreground">Tap or drag on the chart to move the threshold. Shaded: flagged patients (green = TP, orange = FP).</p>
          </Panel>
          <Tabs
            tabs={[
              {
                id: 'roc',
                label: 'ROC curve',
                content: (
                  <Plot title="ROC curve" square x={{ domain: [0, 1], label: '1 − specificity (false-positive rate)', format: (v) => pct(v, 0) }} y={{ domain: [0, 1], label: 'Sensitivity', format: (v) => pct(v, 0) }}>
                    {(s) => (
                      <>
                        <line x1={s.x(0)} y1={s.y(0)} x2={s.x(1)} y2={s.y(1)} stroke={s.pal.ref} strokeDasharray="4 4" />
                        <path d={linePath(roc, s) + `L${s.x(1)},${s.y(0)}L${s.x(0)},${s.y(0)}Z`} fill={s.pal.a} opacity={0.1} />
                        <path d={linePath(roc, s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                        <circle cx={s.x(1 - spec)} cy={s.y(sens)} r={6} fill={s.pal.b} stroke={s.pal.bg} strokeWidth={2} />
                        <text x={s.x(0.55)} y={s.y(0.2)} fontSize={13} fontWeight={600} fill={s.pal.fg}>AUC {num(aucV, 3)}</text>
                      </>
                    )}
                  </Plot>
                ),
              },
              {
                id: 'pr',
                label: 'Precision–recall',
                content: (
                  <Plot title="Precision-recall curve" square x={{ domain: [0, 1], label: 'Recall (sensitivity)', format: (v) => pct(v, 0) }} y={{ domain: [0, 1], label: 'Precision (PPV)', format: (v) => pct(v, 0) }}>
                    {(s) => (
                      <>
                        <line x1={s.x(0)} x2={s.x(1)} y1={s.y(prev)} y2={s.y(prev)} stroke={s.pal.ref} strokeDasharray="4 4" />
                        <path d={linePath(pr, s)} fill="none" stroke={s.pal.c} strokeWidth={2.5} />
                        <circle cx={s.x(sens)} cy={s.y(ppv)} r={6} fill={s.pal.b} stroke={s.pal.bg} strokeWidth={2} />
                        <text x={s.x(0.02)} y={s.y(prev) - 6} fontSize={11} fill={s.pal.muted}>baseline = prevalence</text>
                      </>
                    )}
                  </Plot>
                ),
              },
              { id: 'cm', label: 'Confusion matrix', content: <ConfusionGrid tp={sens * prev} fp={(1 - spec) * (1 - prev)} fn={(1 - sens) * prev} tn={spec * (1 - prev)} scaleTo={1000} /> },
            ]}
          />
        </div>
      </div>
    </LabFrame>
  );
}
