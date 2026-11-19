import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { expit, logit } from '@/lib/stats/core';
import { num, pct } from '@/lib/utils';

export default function LogisticCurveLab() {
  const [base, setBase] = useState(0.1);
  const [logOr, setLogOr] = useState(Math.log(2));
  const or = Math.exp(logOr);
  const pal = usePalette();
  const exposed = expit(logit(base) + logOr);
  const rd = exposed - base;
  const rr = exposed / base;
  const nnt = 1 / Math.abs(rd);

  const curves = useMemo(() => {
    const ard: [number, number][] = [];
    const rrC: [number, number][] = [];
    for (let i = 1; i < 100; i++) {
      const p = i / 100;
      const q = expit(logit(p) + logOr);
      ard.push([p, q - p]);
      rrC.push([p, q / p]);
    }
    return { ard, rrC };
  }, [logOr]);
  const sig = useMemo(() => Array.from({ length: 121 }, (_, i) => [-6 + i / 10, expit(-6 + i / 10)] as [number, number]), []);
  const lpBase = logit(base);

  return (
    <LabFrame
      id="logistic-curve"
      title="Odds ratios are constant; absolute risks are not"
      goal="A logistic model adds effects on the log-odds scale. See what a fixed odds ratio means for patients with different baseline risks."
      tryThis={[
        'Set OR = 2 and baseline risk = 2%. Is the risk ratio close to 2? Now move baseline risk to 50%.',
        'With OR = 2, find the baseline risk that maximises the absolute risk difference (and minimises the number needed to treat/harm).',
        'Set OR = 0.5 (a protective factor). Why can a protective OR never push risk below 0, however large the baseline?',
      ]}
      insight={
        'On the log-odds scale every patient moves by the same amount, ln(OR). On the probability scale the S-shaped curve compresses changes near 0 and 1, so the **absolute** effect peaks at intermediate risk. The OR approximates the risk ratio only when risk is low (rare-outcome assumption). Communicate effects to patients as absolute risks; use ORs for modelling.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Slider label="Baseline risk (reference patient)" value={base} min={0.01} max={0.95} step={0.01} onChange={setBase} format={(v) => pct(v, 0)} />
          <Slider label="Odds ratio for the exposure" value={logOr} min={Math.log(0.2)} max={Math.log(10)} step={0.01} onChange={setLogOr} format={() => num(or, 2)} hint={`β = ln(OR) = ${num(logOr, 2)} on the log-odds scale`} />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Risk with exposure" value={pct(exposed)} sub={`baseline ${pct(base)}`} />
            <Stat label="Absolute risk difference" value={`${rd >= 0 ? '+' : ''}${pct(rd)}`} sub={`NN${rd >= 0 ? 'H' : 'T'} ≈ ${Number.isFinite(nnt) ? Math.ceil(nnt) : '∞'}`} />
            <Stat label="Risk ratio" value={num(rr, 2)} sub={`vs odds ratio ${num(or, 2)}`} tone={Math.abs(rr - or) / or > 0.2 ? 'warn' : undefined} />
            <Stat label="Log-odds shift" value={num(logOr, 2)} sub="the same for every patient" />
          </div>
        </div>
        <Panel title="The logistic (inverse-logit) curve">
          <Plot title="Logistic curve" height={250} x={{ domain: [-6, 6], label: 'Linear predictor (log-odds)' }} y={{ domain: [0, 1], label: 'Probability', format: (v) => pct(v, 0) }}>
            {(s) => (
              <>
                <path d={linePath(sig, s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                <line x1={s.x(lpBase)} x2={s.x(lpBase + logOr)} y1={s.y(0.04)} y2={s.y(0.04)} stroke={s.pal.b} strokeWidth={3} markerEnd="" />
                <circle cx={s.x(lpBase)} cy={s.y(base)} r={5} fill={s.pal.muted} />
                <circle cx={s.x(lpBase + logOr)} cy={s.y(exposed)} r={5} fill={s.pal.b} />
                <line x1={s.x(lpBase)} x2={s.x(lpBase)} y1={s.y(base)} y2={s.y(0)} stroke={s.pal.muted} strokeDasharray="3 3" />
                <line x1={s.x(lpBase + logOr)} x2={s.x(lpBase + logOr)} y1={s.y(exposed)} y2={s.y(0)} stroke={s.pal.b} strokeDasharray="3 3" />
              </>
            )}
          </Plot>
          <p className="mt-2 text-xs text-muted-foreground">Orange bar: the constant ln(OR) step on the x-axis. Its vertical effect depends on where you start.</p>
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Absolute risk difference for OR = ${num(or, 2)}`}>
          <Plot title="Absolute risk difference by baseline risk" height={220} x={{ domain: [0, 1], label: 'Baseline risk', format: (v) => pct(v, 0) }} y={{ domain: [Math.min(0, ...curves.ard.map((d) => d[1])) - 0.02, Math.max(0, ...curves.ard.map((d) => d[1])) + 0.02], label: 'Risk difference', format: (v) => pct(v, 0) }}>
            {(s) => (
              <>
                <line x1={s.x(0)} x2={s.x(1)} y1={s.y(0)} y2={s.y(0)} stroke={s.pal.ref} />
                <path d={linePath(curves.ard, s)} fill="none" stroke={s.pal.b} strokeWidth={2.5} />
                <circle cx={s.x(base)} cy={s.y(rd)} r={5} fill={s.pal.b} />
              </>
            )}
          </Plot>
        </Panel>
        <Panel title="Risk ratio vs odds ratio">
          <Plot title="Risk ratio by baseline risk" height={220} x={{ domain: [0, 1], label: 'Baseline risk', format: (v) => pct(v, 0) }} y={{ domain: [Math.min(1, or, ...curves.rrC.map((d) => d[1])) * 0.9, Math.max(1, or) * 1.08], label: 'Ratio' }}>
            {(s) => (
              <>
                <line x1={s.x(0)} x2={s.x(1)} y1={s.y(or)} y2={s.y(or)} stroke={pal.c} strokeDasharray="5 4" strokeWidth={2} />
                <path d={linePath(curves.rrC, s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                <circle cx={s.x(base)} cy={s.y(rr)} r={5} fill={s.pal.a} />
              </>
            )}
          </Plot>
          <Legend items={[{ label: 'Risk ratio', color: pal.a }, { label: 'Odds ratio (constant)', color: pal.c, dash: true }]} />
        </Panel>
      </div>
    </LabFrame>
  );
}
