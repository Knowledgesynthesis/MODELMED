import { useMemo, useState } from 'react';
import { LabFrame, Panel, Presets } from './LabFrame';
import { Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { simulatePopulation, distort } from './sim';
import { auc, brier, calibrationBins, calibrationSummary, scaledBrier, smoothCalibration } from '@/lib/stats/metrics';
import { fitLogistic, predictLogistic } from '@/lib/ml/logistic';
import { logit, mean } from '@/lib/stats/core';
import { num, pct } from '@/lib/utils';

const MU = -2.1;

export default function CalibrationLab() {
  const [offset, setOffset] = useState(0);
  const [spread, setSpread] = useState(1);
  const [recal, setRecal] = useState(false);
  const pal = usePalette();
  const pop = useMemo(() => simulatePopulation(4000, MU, 1.1, 21), []);
  // first half: local recalibration sample; second half: evaluation
  const half = 2000;
  const res = useMemo(() => {
    const p = distort(pop.lp, offset, spread, MU);
    let pe = p.slice(half);
    const ye = pop.y.slice(half);
    if (recal) {
      const fit = fitLogistic(p.slice(0, half).map((v) => [logit(v)]), pop.y.slice(0, half));
      pe = predictLogistic(fit.beta, pe.map((v) => [logit(v)]));
    }
    const sm = smoothCalibration(pe, ye);
    return {
      pe,
      ye,
      bins: calibrationBins(pe, ye, 10),
      smooth: sm,
      cal: calibrationSummary(pe, ye),
      auc: auc(pe, ye),
      brier: brier(pe, ye),
      sbrier: scaledBrier(pe, ye),
    };
  }, [pop, offset, spread, recal]);
  const maxP = Math.min(1, Math.max(0.5, ...res.bins.map((b) => Math.max(b.meanPredicted, b.hi))) * 1.05);
  const hist = useMemo(() => {
    const H = new Array(25).fill(0);
    res.pe.forEach((v) => H[Math.min(24, Math.floor((v / maxP) * 25))]++);
    const m = Math.max(...H);
    return H.map((h) => h / m);
  }, [res.pe, maxP]);
  const truthPrev = mean(res.ye);

  return (
    <LabFrame
      id="calibration"
      title="Calibration: do 20% predictions come true 20% of the time?"
      goal="Start from a model whose risks are exactly right, then distort its predictions. AUC measures ranking; calibration measures whether the numbers can be trusted."
      tryThis={[
        'Choose **Overfitted**. The calibration slope falls below 1: high risks are too high, low risks too low. Check AUC: it has not moved.',
        'Choose **Developed where outcome was commoner**. Every prediction is too high (CITL < 0, O/E < 1). This is typical when a model moves from a tertiary centre to a community hospital.',
        'Now switch on **Recalibrate locally**. A two-parameter update (intercept and slope) fitted on 2,000 local patients fixes calibration — without changing AUC.',
      ]}
      insight={
        'Any monotone transformation of predictions leaves AUC unchanged but can wreck calibration, so AUC alone can never certify a model. Report the calibration **intercept** (calibration-in-the-large; target 0), **slope** (target 1; < 1 signals overfitting), and a flexible calibration curve with its uncertainty. The Brier score mixes calibration and discrimination and depends on prevalence; compare models with it only on the same data. Miscalibration is the commonest failure at external validation, and recalibration — not rebuilding — is often the right first fix.'
      }
    >
      <Presets
        presets={[
          { label: 'Well calibrated', value: [0, 1] as const },
          { label: 'Overfitted (too extreme)', value: [0, 1.5] as const },
          { label: 'Too modest', value: [0, 0.55] as const },
          { label: 'Developed where outcome was commoner', value: [1, 1] as const },
          { label: 'Under-predicts', value: [-0.9, 1] as const },
        ]}
        onPick={([o, s]) => {
          setOffset(o);
          setSpread(s);
        }}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <Slider label="Offset on log-odds scale" value={offset} min={-2} max={2} step={0.05} onChange={setOffset} format={(v) => (v >= 0 ? '+' : '') + num(v, 2)} hint="Positive = every prediction pushed up" />
          <Slider label="Spread of log-odds" value={spread} min={0.3} max={2.2} step={0.05} onChange={setSpread} format={(v) => '×' + num(v, 2)} hint="> 1 = predictions too extreme (overfitting); < 1 = too modest" />
          <Toggle label="Recalibrate locally" checked={recal} onChange={setRecal} hint="Logistic recalibration on 2,000 local patients, evaluated on 2,000 others" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="AUC" value={num(res.auc, 3)} />
            <Stat label="Calibration intercept" value={num(res.cal.citl, 2)} tone={Math.abs(res.cal.citl) > 0.2 ? 'bad' : 'good'} sub="target 0" />
            <Stat label="Calibration slope" value={num(res.cal.slope, 2)} tone={Math.abs(res.cal.slope - 1) > 0.15 ? 'bad' : 'good'} sub="target 1" />
            <Stat label="O/E ratio" value={num(res.cal.oe, 2)} sub={`obs ${pct(truthPrev)} vs exp ${pct(res.cal.meanPredicted)}`} />
            <Stat label="ICI" value={num(res.smooth.ici, 3)} sub="mean |obs − pred|" />
            <Stat label="Brier (scaled)" value={num(res.brier, 3)} sub={`scaled ${num(res.sbrier, 2)}`} />
          </div>
        </div>
        <Panel title="Calibration plot (evaluation sample, n = 2,000)">
          <Plot title="Calibration plot" square x={{ domain: [0, maxP], label: 'Predicted risk', format: (v) => pct(v, 0) }} y={{ domain: [0, maxP], label: 'Observed proportion', format: (v) => pct(v, 0) }}>
            {(s) => (
              <>
                {hist.map((h, i) => (
                  <rect key={i} x={s.x((i / 25) * maxP)} width={Math.max(1, s.x(maxP / 25) - s.x(0) - 1)} y={s.y(0) - h * 28} height={h * 28} fill={s.pal.muted} opacity={0.25} />
                ))}
                <line x1={s.x(0)} y1={s.y(0)} x2={s.x(maxP)} y2={s.y(maxP)} stroke={s.pal.ref} strokeDasharray="4 4" />
                <path d={linePath(res.smooth.curve.map((c) => [c.predicted, c.observed]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                {res.bins.map((b, i) => (
                  <g key={i}>
                    <line x1={s.x(b.meanPredicted)} x2={s.x(b.meanPredicted)} y1={s.y(b.lo)} y2={s.y(b.hi)} stroke={s.pal.b} strokeWidth={1.5} />
                    <circle cx={s.x(b.meanPredicted)} cy={s.y(b.observed)} r={4.5} fill={s.pal.b} />
                  </g>
                ))}
              </>
            )}
          </Plot>
          <Legend items={[{ label: 'Perfect calibration', color: pal.ref, dash: true }, { label: 'Flexible (spline) curve', color: pal.a }, { label: 'Deciles ± 95% CI', color: pal.b }]} />
          <p className="mt-1 text-center text-xs text-muted-foreground">Grey bars: distribution of predictions.</p>
        </Panel>
      </div>
    </LabFrame>
  );
}
