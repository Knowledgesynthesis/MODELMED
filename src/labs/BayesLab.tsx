import { useMemo, useState } from 'react';
import { LabFrame, Panel, Presets, ConfusionGrid } from './LabFrame';
import { Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { predictiveValues } from '@/lib/stats/metrics';
import { pct, num } from '@/lib/utils';

// prevalence slider runs on a log scale: 0.1% … 60%
const toPrev = (t: number) => 10 ** (-3 + t * Math.log10(600));
const fromPrev = (p: number) => (Math.log10(p) + 3) / Math.log10(600);

export default function BayesLab() {
  const [sens, setSens] = useState(0.9);
  const [spec, setSpec] = useState(0.9);
  const [t, setT] = useState(fromPrev(0.05));
  const prev = toPrev(t);
  const pal = usePalette();
  const N = 1000;
  const tp = sens * prev * N;
  const fn = (1 - sens) * prev * N;
  const fp = (1 - spec) * (1 - prev) * N;
  const tn = spec * (1 - prev) * N;
  const { ppv, npv } = predictiveValues(sens, spec, prev);
  const lrp = sens / (1 - spec);
  const lrn = (1 - sens) / spec;
  const curve = useMemo(() => {
    const pts: [number, number][] = [];
    const nv: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const p = toPrev(i / 120);
      const v = predictiveValues(sens, spec, p);
      pts.push([p, v.ppv]);
      nv.push([p, v.npv]);
    }
    return { pts, nv };
  }, [sens, spec]);

  // icon array: 1000 people, sorted TP, FN, FP, TN
  const cells = useMemo(() => {
    const r = (v: number) => Math.round(v);
    const a = r(tp), b = r(fn), c = r(fp);
    return Array.from({ length: N }, (_, i) => (i < a ? 'tp' : i < a + b ? 'fn' : i < a + b + c ? 'fp' : 'tn'));
  }, [tp, fn, fp]);
  const color = { tp: pal.d, fn: pal.e, fp: pal.b, tn: pal.grid } as const;

  return (
    <LabFrame
      id="bayes"
      title="Why the same test means different things in different places"
      goal="Sensitivity and specificity are properties of the test; PPV and NPV also depend on how common the condition is where you use it."
      tryThis={[
        'Keep sensitivity and specificity at 90%. Slide prevalence from 50% down to 1%. Watch PPV collapse while the test itself has not changed.',
        'At 1% prevalence, raise specificity to 99%. Which change helps PPV more: +9 points of specificity or +9 points of sensitivity?',
        'Pick **Ward sepsis alert**: how many alerts must a nurse answer to find one true case (1 / PPV)?',
      ]}
      insight={
        'PPV = sens·prev / (sens·prev + (1−spec)(1−prev)). When a condition is rare, false positives from the large healthy majority swamp true positives. Likelihood ratios travel better across settings: post-test odds = pre-test odds × LR. This is why a model validated in an ICU (high prevalence) produces mostly false alarms on a general ward.'
      }
    >
      <Presets
        presets={[
          { label: 'Ward sepsis alert', value: { s: 0.8, c: 0.85, p: 0.04 } },
          { label: 'ICU deterioration', value: { s: 0.8, c: 0.85, p: 0.25 } },
          { label: 'Population screening', value: { s: 0.9, c: 0.95, p: 0.003 } },
          { label: 'Confirmatory test, high-risk clinic', value: { s: 0.95, c: 0.98, p: 0.4 } },
        ]}
        onPick={(v) => {
          setSens(v.s);
          setSpec(v.c);
          setT(fromPrev(v.p));
        }}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <Slider label="Sensitivity" value={sens} min={0.5} max={0.999} step={0.001} onChange={setSens} format={(v) => pct(v)} />
          <Slider label="Specificity" value={spec} min={0.5} max={0.999} step={0.001} onChange={setSpec} format={(v) => pct(v)} />
          <Slider label="Prevalence (pre-test probability)" value={t} min={0} max={1} step={0.001} onChange={setT} format={() => pct(prev, prev < 0.01 ? 2 : 1)} hint="Log scale: 0.1% to 60%" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="PPV" value={pct(ppv)} sub={`1 in ${num(1 / ppv, 1)} flagged is a true case`} tone={ppv < 0.2 ? 'bad' : ppv < 0.5 ? 'warn' : 'good'} />
            <Stat label="NPV" value={pct(npv, 2)} sub={`${num((1 - npv) * 1000, 1)} missed per 1,000 negatives`} />
            <Stat label="LR+" value={num(lrp, 1)} sub="post-test odds = pre-test odds × LR+" />
            <Stat label="LR−" value={num(lrn, 2)} />
          </div>
        </div>
        <div className="space-y-4">
          <Panel title={`1,000 patients at ${pct(prev, prev < 0.01 ? 2 : 1)} prevalence`}>
            <svg viewBox="0 0 400 250" className="w-full" role="img" aria-label="Icon array of 1000 patients">
              {cells.map((c, i) => (
                <rect key={i} x={(i % 40) * 10 + 1} y={Math.floor(i / 40) * 10 + 1} width={8} height={8} rx={2} fill={color[c as keyof typeof color]} />
              ))}
            </svg>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: pal.d }} />True positive {Math.round(tp)}</span>
              <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: pal.e }} />Missed {Math.round(fn)}</span>
              <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: pal.b }} />False alarm {Math.round(fp)}</span>
              <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm border" style={{ background: pal.grid }} />True negative {Math.round(tn)}</span>
            </div>
          </Panel>
          <ConfusionGrid tp={tp} fp={fp} fn={fn} tn={tn} scaleTo={1000} />
        </div>
      </div>
      <Panel title="Predictive values across settings (same test)">
        <Plot
          title="PPV and NPV versus prevalence"
          height={240}
          x={{ domain: [0.001, 0.6], log: true, label: 'Prevalence (log scale)', ticks: [0.001, 0.01, 0.05, 0.1, 0.3, 0.6], format: (v) => pct(v, v < 0.01 ? 1 : 0) }}
          y={{ domain: [0, 1], label: 'Probability', format: (v) => pct(v, 0) }}
        >
          {(s) => (
            <>
              <path d={linePath(curve.pts, s)} fill="none" stroke={s.pal.b} strokeWidth={2.5} />
              <path d={linePath(curve.nv, s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} strokeDasharray="5 4" />
              <line x1={s.x(prev)} x2={s.x(prev)} y1={s.y(0)} y2={s.y(1)} stroke={s.pal.muted} strokeDasharray="3 3" />
              <circle cx={s.x(prev)} cy={s.y(ppv)} r={5} fill={s.pal.b} />
            </>
          )}
        </Plot>
        <div className="mt-1 flex justify-center gap-4 text-xs text-muted-foreground">
          <span style={{ color: pal.b }}>━ PPV</span>
          <span style={{ color: pal.a }}>╍ NPV</span>
        </div>
      </Panel>
    </LabFrame>
  );
}
