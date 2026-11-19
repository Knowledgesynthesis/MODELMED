import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Segmented, Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Tabs } from '@/components/ui/Tabs';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { Rng } from '@/lib/stats/random';
import { expit, logit } from '@/lib/stats/core';
import { num, pct } from '@/lib/utils';

/** Obermeyer-style label-choice bias: predicting cost (a proxy) instead of health need. */
function LabelBias() {
  const [gap, setGap] = useState(0.3);
  const [label, setLabel] = useState<'cost' | 'need'>('cost');
  const [top, setTop] = useState(0.05);
  const pal = usePalette();
  const sim = useMemo(() => {
    const rng = new Rng(12);
    const n = 8000;
    const people = Array.from({ length: n }, () => {
      const b = rng.next() < 0.3 ? 1 : 0;
      // same distribution of true need (active chronic conditions) in both groups
      const need = rng.poisson(Math.exp(rng.normal(0.6, 0.7)));
      const access = b ? 1 - gap : 1;
      // prior-year cost reflects need × access to care, plus noise; future cost the same
      const cost = Math.max(0, need * 1500 * access * Math.exp(rng.normal(0, 0.35)) + rng.normal(800, 300));
      const measuredNeed = need + rng.normal(0, 0.6); // need measured with noise from problem lists
      return { b, need, cost, score: label === 'cost' ? cost : measuredNeed };
    });
    const sorted = [...people].sort((a, z) => z.score - a.score);
    const k = Math.round(n * top);
    const enrolled = sorted.slice(0, k);
    const byNeed = [...people].sort((a, z) => z.need - a.need).slice(0, k);
    const shareB = enrolled.filter((p) => p.b).length / k;
    const shareBNeed = byNeed.filter((p) => p.b).length / k;
    const meanNeed = (g: number) => {
      const s = enrolled.filter((p) => p.b === g);
      return s.reduce((a, p) => a + p.need, 0) / Math.max(1, s.length);
    };
    // need by score percentile (Obermeyer Fig. 1 style)
    const bins = 20;
    const curve = [0, 1].map((g) =>
      Array.from({ length: bins }, (_, q) => {
        const slice = sorted.slice(Math.floor((n * (bins - q - 1)) / bins), Math.floor((n * (bins - q)) / bins)).filter((p) => p.b === g);
        return [((q + 0.5) / bins) * 100, slice.reduce((a, p) => a + p.need, 0) / Math.max(1, slice.length)] as [number, number];
      })
    );
    return { shareB, shareBNeed, needA: meanNeed(0), needB: meanNeed(1), curve };
  }, [gap, label, top]);
  const yMax = Math.max(...sim.curve.flat().map((c) => c[1])) * 1.1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="space-y-5">
        <Segmented
          label="What the algorithm is trained to predict"
          value={label}
          onChange={setLabel}
          options={[
            { value: 'cost', label: 'Future cost (proxy)' },
            { value: 'need', label: 'Health need (chronic conditions)' },
          ]}
        />
        <Slider label="Access gap for group B" value={gap} min={0} max={0.6} step={0.05} onChange={setGap} format={(v) => `${Math.round(v * 100)}% less care used for the same need`} />
        <Slider label="Programme capacity (top % enrolled)" value={top} min={0.01} max={0.2} step={0.01} onChange={setTop} format={(v) => pct(v, 0)} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Group B share of enrolled" value={pct(sim.shareB)} tone={Math.abs(sim.shareB - sim.shareBNeed) > 0.05 ? 'bad' : 'good'} />
          <Stat label="…if enrolled by true need" value={pct(sim.shareBNeed)} />
          <Stat label="Need of enrolled — group A" value={num(sim.needA, 1)} sub="active conditions" />
          <Stat label="Need of enrolled — group B" value={num(sim.needB, 1)} tone={sim.needB - sim.needA > 0.5 ? 'warn' : undefined} sub="B must be sicker to qualify" />
        </div>
      </div>
      <Panel title="True health need at each algorithm-score percentile">
        <Plot title="Need by score percentile, by group" height={280} x={{ domain: [0, 100], label: 'Algorithm risk-score percentile' }} y={{ domain: [0, yMax], label: 'Mean active chronic conditions' }}>
          {(s) => (
            <>
              <rect x={s.x(100 - top * 100)} y={s.y(yMax)} width={s.x(100) - s.x(100 - top * 100)} height={s.y(0) - s.y(yMax)} fill={s.pal.b} opacity={0.08} />
              <path d={linePath(sim.curve[0], s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
              <path d={linePath(sim.curve[1], s)} fill="none" stroke={s.pal.e} strokeWidth={2.5} />
            </>
          )}
        </Plot>
        <Legend items={[{ label: 'Group A', color: pal.a }, { label: 'Group B', color: pal.e }]} />
        <p className="mt-1 text-center text-xs text-muted-foreground">Shaded: patients enrolled. Same score, sicker group B → biased label.</p>
      </Panel>
    </div>
  );
}

/** With different base rates, calibration and equal error rates cannot all hold (Kleinberg 2017; Chouldechova 2017). */
function Impossibility() {
  const [prevA, setPrevA] = useState(0.1);
  const [prevB, setPrevB] = useState(0.25);
  const [tA, setTA] = useState(0.2);
  const [tB, setTB] = useState(0.2);
  const [linked, setLinked] = useState(true);
  const sim = useMemo(() => {
    const rng = new Rng(4);
    const group = (prev: number, t: number) => {
      const n = 20000;
      let tp = 0, fp = 0, fn = 0, tn = 0, sp = 0, sy = 0;
      for (let i = 0; i < n; i++) {
        const p = expit(logit(prev) - 0.5 + rng.normal(0, 1.2) * 1); // true, perfectly calibrated risk
        const y = rng.bernoulli(p);
        sp += p;
        sy += y;
        if (p >= t) (y ? tp++ : fp++);
        else y ? fn++ : tn++;
      }
      return { tpr: tp / (tp + fn), fpr: fp / (fp + tn), ppv: tp / (tp + fp || 1), flagged: (tp + fp) / n, oe: sy / sp, prev: sy / n };
    };
    return { A: group(prevA, tA), B: group(prevB, linked ? tA : tB) };
  }, [prevA, prevB, tA, tB, linked]);
  const row = (label: string, f: (g: typeof sim.A) => string) => (
    <tr key={label}>
      <td className="py-1.5 pr-2">{label}</td>
      <td className="tabular text-right">{f(sim.A)}</td>
      <td className="tabular text-right">{f(sim.B)}</td>
    </tr>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <Slider label="Outcome prevalence — group A" value={prevA} min={0.02} max={0.5} step={0.01} onChange={setPrevA} format={(v) => pct(v, 0)} />
        <Slider label="Outcome prevalence — group B" value={prevB} min={0.02} max={0.5} step={0.01} onChange={setPrevB} format={(v) => pct(v, 0)} />
        <Toggle label="Same threshold for both groups" checked={linked} onChange={setLinked} />
        <Slider label={linked ? 'Threshold (both groups)' : 'Threshold — group A'} value={tA} min={0.02} max={0.6} step={0.01} onChange={setTA} format={(v) => pct(v, 0)} />
        {!linked && <Slider label="Threshold — group B" value={tB} min={0.02} max={0.6} step={0.01} onChange={setTB} format={(v) => pct(v, 0)} />}
      </div>
      <Panel title="The risk score is perfectly calibrated in both groups">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium">Metric</th>
              <th className="text-right font-medium">Group A</th>
              <th className="text-right font-medium">Group B</th>
            </tr>
          </thead>
          <tbody>
            {row('Observed / expected events', (g) => num(g.oe, 2))}
            {row('Flagged', (g) => pct(g.flagged))}
            {row('Sensitivity (TPR)', (g) => pct(g.tpr))}
            {row('False-positive rate', (g) => pct(g.fpr))}
            {row('PPV', (g) => pct(g.ppv))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">
          Try to equalise false-positive rates by unlinking thresholds: PPV then diverges. When base rates differ and prediction is imperfect, you cannot have calibration within groups <em>and</em> equal error rates at the same time.
        </p>
      </Panel>
    </div>
  );
}

export default function FairnessLab() {
  return (
    <LabFrame
      id="fairness"
      title="How bias enters — and why 'fair' has several incompatible meanings"
      goal="Two simulations: (1) a care-management algorithm that predicts cost instead of need; (2) a perfectly calibrated score applied to groups with different base rates."
      tryThis={[
        'Tab 1: with a 30% access gap and a cost label, compare group B’s share of enrolment with its share by true need. Then switch the label to health need.',
        'Tab 1: set the access gap to 0. The bias disappears — it came from the label, not from including a group variable (there is none in the model).',
        'Tab 2: keep one threshold and widen the base-rate difference. Then unlink thresholds and try to equalise false-positive rates. What happens to PPV?',
      ]}
      insight={
        'Obermeyer et al. (2019) found a widely used algorithm predicting cost under-enrolled Black patients, because unequal access means lower spending at the same level of illness; re-labelling on health need would have increased their enrolment from 17.7% to 46.5%. Bias usually enters through the **label**, the **measurements** (e.g., pulse oximetry), who is in the data, and how outputs are acted on — "removing race" does not remove it. Fairness criteria (calibration within groups, equal TPR/FPR, equal flag rates) conflict when base rates differ, so the choice is a clinical and ethical decision, not a technical default.'
      }
    >
      <Tabs
        tabs={[
          { id: 'label', label: '1 · Label choice', content: <LabelBias /> },
          { id: 'impossible', label: '2 · Base rates & trade-offs', content: <Impossibility /> },
        ]}
      />
    </LabFrame>
  );
}
