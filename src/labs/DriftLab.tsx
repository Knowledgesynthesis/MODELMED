import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Select, Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { Rng } from '@/lib/stats/random';
import { expit, wilson } from '@/lib/stats/core';
import { auc } from '@/lib/stats/metrics';
import { fitLogistic } from '@/lib/ml/logistic';
import { num } from '@/lib/utils';

type Scenario = 'stable' | 'prevalence' | 'casemix' | 'assay' | 'concept' | 'feedback';
const SCEN: Record<Scenario, { label: string; text: string }> = {
  stable: { label: 'Stable world', text: 'Nothing changes. Month-to-month noise only — learn what normal variation looks like before raising alarms.' },
  prevalence: { label: 'Rising incidence (prior shift)', text: 'Baseline risk rises steadily (e.g., a new circulating pathogen). The model under-predicts more each month; ranking is preserved.' },
  casemix: { label: 'Older, sicker case mix (covariate shift)', text: 'Patients become older/sicker, but the risk relationship is unchanged. A correctly specified model stays calibrated; discrimination can even change with case-mix spread.' },
  assay: { label: 'Lab assay change at month 12', text: 'A new lactate assay reads systematically lower. Same patients, lower numbers → abrupt under-prediction.' },
  concept: { label: 'Better treatment (concept drift)', text: 'Earlier treatment makes high lactate less dangerous: the predictor–outcome relationship weakens. Over-prediction at the high end and falling AUC.' },
  feedback: { label: 'Feedback loop after go-live', text: 'From month 6, flagged patients (risk ≥ 20%) receive an effective intervention that halves their risk. The model looks over-confident precisely because it works.' },
};

const BETA = [-2.4, 0.9, 0.6, 0.5];

export default function DriftLab() {
  const [scenario, setScenario] = useState<Scenario>('prevalence');
  const [recalAt, setRecalAt] = useState(0);
  const pal = usePalette();
  const months = 24;
  const sim = useMemo(() => {
    const rng = new Rng(8);
    const out: { m: number; oe: number; lo: number; hi: number; auc: number; obs: number; exp: number }[] = [];
    let recal: number[] | null = null;
    const store: { lp: number; y: number; m: number }[] = [];
    for (let m = 1; m <= months; m++) {
      const lps: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < 500; i++) {
        const z1 = rng.normal();
        let z2 = rng.normal(), z3 = rng.normal();
        if (scenario === 'casemix') {
          z3 += 0.05 * m;
          z2 += 0.03 * m;
        }
        let trueLp = BETA[0] + BETA[1] * z1 + BETA[2] * z2 + BETA[3] * z3;
        if (scenario === 'prevalence') trueLp += 0.045 * m;
        if (scenario === 'concept') trueLp -= 0.035 * m * Math.max(0, z1);
        const measured1 = scenario === 'assay' && m >= 12 ? z1 - 0.8 : z1;
        const modelLp = BETA[0] + BETA[1] * measured1 + BETA[2] * z2 + BETA[3] * z3;
        let risk = expit(trueLp);
        if (scenario === 'feedback' && m >= 6 && expit(modelLp) >= 0.2) risk *= 0.5;
        const y = rng.bernoulli(risk);
        const used = recal ? recal[0] + recal[1] * modelLp : modelLp;
        lps.push(used);
        ys.push(y);
        store.push({ lp: modelLp, y, m });
      }
      const obs = ys.reduce((a, b) => a + b, 0);
      const exp = lps.reduce((a, v) => a + expit(v), 0);
      const [lo, hi] = wilson(obs, ys.length);
      const meanExp = exp / ys.length;
      out.push({ m, oe: obs / exp, lo: lo / meanExp, hi: hi / meanExp, auc: auc(lps.map(expit), ys), obs, exp });
      if (recalAt > 0 && m === recalAt) {
        const recent = store.filter((s) => s.m > m - 3);
        const fit = fitLogistic(recent.map((s) => [s.lp]), recent.map((s) => s.y));
        recal = [fit.beta[0], fit.beta[1]];
      }
    }
    return out;
  }, [scenario, recalAt]);
  const last = sim[sim.length - 1];
  const yHi = Math.max(1.6, ...sim.map((s) => s.hi)) * 1.05;
  const yLo = Math.min(0.5, ...sim.map((s) => s.lo)) * 0.95;

  return (
    <LabFrame
      id="drift"
      title="After go-live: monitoring for dataset shift"
      goal="A sepsis-style model is deployed in month 0 and audited monthly (500 patients/month). Pick a way the world changes and watch the observed/expected ratio and AUC."
      tryThis={[
        'Start with **Stable world** to see how much O/E wobbles by chance alone (the band is a 95% interval). Do not recalibrate on noise.',
        'Choose **Lab assay change**. When does the drift become visible? Recalibrate at month 15 using the previous 3 months.',
        'Choose **Feedback loop**. The model now over-predicts because interventions prevented events. Should you "fix" it by recalibrating on post-deployment outcomes?',
      ]}
      insight={
        'Performance is a property of a model *in a setting at a time*. Monitor calibration (O/E, calibration slope) and alert burden continuously, not just AUC — prior shift and assay changes leave ranking intact while making the numbers wrong. Distinguish shift types before acting: covariate shift may need nothing; prior shift needs an intercept update; concept drift may need re-modelling; feedback loops mean outcome labels are contaminated by the model’s own effect, so naive retraining teaches the model that high-risk patients are safe.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="space-y-5">
          <Select label="What changes after deployment?" value={scenario} onChange={setScenario} options={(Object.keys(SCEN) as Scenario[]).map((k) => ({ value: k, label: SCEN[k].label }))} />
          <p className="rounded-lg bg-muted p-3 text-sm">{SCEN[scenario].text}</p>
          <Slider label="Recalibrate (intercept + slope) at month" value={recalAt} min={0} max={23} onChange={setRecalAt} format={(v) => (v === 0 ? 'never' : `month ${v}`)} hint="Uses the previous 3 months of local outcomes" />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="O/E, month 24" value={num(last.oe, 2)} tone={Math.abs(last.oe - 1) > 0.2 ? 'bad' : 'good'} sub={`${last.obs} observed vs ${num(last.exp, 0)} expected`} />
            <Stat label="AUC, month 24" value={num(last.auc, 3)} sub={`month 1: ${num(sim[0].auc, 3)}`} />
          </div>
        </div>
        <div className="space-y-4">
          <Panel title="Observed / expected events by month">
            <Plot title="O/E ratio over time" height={220} x={{ domain: [1, months], label: 'Month after deployment', ticks: [1, 6, 12, 18, 24] }} y={{ domain: [yLo, yHi], label: 'O/E', format: (v) => num(v, 1) }}>
              {(s) => (
                <>
                  <path d={linePath(sim.map((p) => [p.m, p.hi]), s) + 'L' + [...sim].reverse().map((p) => `${s.x(p.m)},${s.y(p.lo)}`).join('L') + 'Z'} fill={s.pal.a} opacity={0.12} />
                  <line x1={s.x(1)} x2={s.x(months)} y1={s.y(1)} y2={s.y(1)} stroke={s.pal.fg} strokeDasharray="4 3" />
                  <path d={linePath(sim.map((p) => [p.m, p.oe]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                  {sim.map((p) => (
                    <circle key={p.m} cx={s.x(p.m)} cy={s.y(p.oe)} r={3.5} fill={p.lo > 1 || p.hi < 1 ? s.pal.e : s.pal.a} />
                  ))}
                  {recalAt > 0 && <line x1={s.x(recalAt + 0.5)} x2={s.x(recalAt + 0.5)} y1={s.y(yLo)} y2={s.y(yHi)} stroke={s.pal.b} strokeWidth={2} />}
                </>
              )}
            </Plot>
            <Legend items={[{ label: 'O/E with 95% band (red dot = band excludes 1)', color: pal.a }, ...(recalAt ? [{ label: 'Recalibration', color: pal.b }] : [])]} />
          </Panel>
          <Panel title="Discrimination by month">
            <Plot title="AUC over time" height={160} x={{ domain: [1, months], label: 'Month', ticks: [1, 6, 12, 18, 24] }} y={{ domain: [0.6, 0.95], label: 'AUC' }}>
              {(s) => <path d={linePath(sim.map((p) => [p.m, p.auc]), s)} fill="none" stroke={s.pal.c} strokeWidth={2.5} />}
            </Plot>
          </Panel>
        </div>
      </div>
    </LabFrame>
  );
}
