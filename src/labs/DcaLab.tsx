import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { simulatePopulation, distort } from './sim';
import { auc, confusionAt, decisionCurve, netBenefit, netBenefitTreatAll } from '@/lib/stats/metrics';
import { mean } from '@/lib/stats/core';
import { num, pct } from '@/lib/utils';

export default function DcaLab() {
  const [strength, setStrength] = useState(1.1);
  const [pt, setPt] = useState(0.1);
  const [showB, setShowB] = useState(true);
  const pal = usePalette();
  const mu = -2.0 - 0.15 * strength * strength;
  const pop = useMemo(() => simulatePopulation(6000, mu, strength, 33), [mu, strength]);
  const pA = useMemo(() => distort(pop.lp, 0, 1, mu), [pop, mu]);
  const pB = useMemo(() => distort(pop.lp, 0.7, 1.6, mu), [pop, mu]); // same ranking, over-predicting and too extreme
  const ths = useMemo(() => Array.from({ length: 50 }, (_, i) => 0.01 + i * 0.01), []);
  const dA = useMemo(() => decisionCurve(pA, pop.y, ths), [pA, pop.y, ths]);
  const dB = useMemo(() => decisionCurve(pB, pop.y, ths), [pB, pop.y, ths]);
  const prev = mean(pop.y);
  const nbA = netBenefit(pA, pop.y, pt);
  const nbB = netBenefit(pB, pop.y, pt);
  const nbAll = netBenefitTreatAll(prev, pt);
  const cmA = confusionAt(pA, pop.y, pt);
  const odds = pt / (1 - pt);
  const avoided = ((nbA - nbAll) / odds) * 100;
  const yMax = Math.max(prev, 0.02) * 1.15;
  const yMin = -Math.max(0.02, prev * 0.35);

  return (
    <LabFrame
      id="dca"
      title="Decision curve analysis: is the model worth using?"
      goal="Net benefit counts true positives and subtracts false positives weighted by the threshold odds — the exchange rate between missing a case and treating unnecessarily."
      tryThis={[
        'At a 10% threshold, read net benefit for the model, *treat all* and *treat none*. A model is only useful where its curve sits above **both**.',
        'Model B has the **same AUC** as model A but is miscalibrated. Find the thresholds where B is worse than treating nobody.',
        'Reduce model strength. Over what range of thresholds does the model still add value?',
      ]}
      insight={
        'Choosing threshold p_t means you would accept (1−p_t)/p_t unnecessary interventions to catch one true case (10% → 9:1). Net benefit = TP/n − FP/n × p_t/(1−p_t) is expressed in "true positives per patient", net of harm. Read the curve only across the range of thresholds that clinicians would plausibly use. Miscalibration directly reduces net benefit even when AUC is unchanged — the reason calibration must be checked before deployment.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="space-y-5">
          <Slider label="Model strength (SD of log-odds)" value={strength} min={0.3} max={2.2} step={0.05} onChange={setStrength} format={() => `AUC ${num(auc(pA, pop.y), 2)}`} />
          <Slider label="Threshold probability (p_t)" value={pt} min={0.01} max={0.5} step={0.01} onChange={setPt} format={(v) => pct(v, 0)} hint={`Accept ${num((1 - pt) / pt, 1)} unnecessary interventions per case found`} />
          <Toggle label="Show model B (same AUC, miscalibrated)" checked={showB} onChange={setShowB} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Net benefit — model A" value={num(nbA, 4)} sub={`= ${num(nbA * 100, 1)} net true positives /100`} tone={nbA > Math.max(0, nbAll) ? 'good' : 'bad'} />
            <Stat label="Treat all" value={num(nbAll, 4)} />
            {showB && <Stat label="Net benefit — model B" value={num(nbB, 4)} tone={nbB > Math.max(0, nbAll) ? 'good' : 'bad'} />}
            <Stat label="Interventions avoided /100" value={num(avoided, 1)} sub="vs treat-all, no loss of TPs" />
          </div>
          <p className="text-xs text-muted-foreground">
            At p_t = {pct(pt, 0)}, model A flags {pct((cmA.tp + cmA.fp) / pop.y.length)} of patients and finds {cmA.tp} of {cmA.tp + cmA.fn} events (prevalence {pct(prev)}).
          </p>
        </div>
        <Panel title="Decision curves">
          <Plot title="Decision curve" height={320} x={{ domain: [0, 0.5], label: 'Threshold probability', format: (v) => pct(v, 0) }} y={{ domain: [yMin, yMax], label: 'Net benefit', format: (v) => num(v, 2) }}>
            {(s) => (
              <>
                <line x1={s.x(0)} x2={s.x(0.5)} y1={s.y(0)} y2={s.y(0)} stroke={s.pal.fg} strokeWidth={1.5} />
                <path d={linePath(dA.map((p) => [p.threshold, p.treatAll]), s)} fill="none" stroke={s.pal.muted} strokeWidth={2} strokeDasharray="5 4" />
                <path d={linePath(dA.map((p) => [p.threshold, p.model]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.75} />
                {showB && <path d={linePath(dB.map((p) => [p.threshold, p.model]), s)} fill="none" stroke={s.pal.e} strokeWidth={2.25} />}
                <line x1={s.x(pt)} x2={s.x(pt)} y1={s.y(yMin)} y2={s.y(yMax)} stroke={s.pal.b} strokeDasharray="3 3" />
                <circle cx={s.x(pt)} cy={s.y(nbA)} r={5} fill={s.pal.a} />
              </>
            )}
          </Plot>
          <Legend
            items={[
              { label: 'Model A (calibrated)', color: pal.a },
              ...(showB ? [{ label: 'Model B (same AUC, miscalibrated)', color: pal.e }] : []),
              { label: 'Treat all', color: pal.muted, dash: true },
              { label: 'Treat none', color: pal.fg },
            ]}
          />
        </Panel>
      </div>
    </LabFrame>
  );
}
