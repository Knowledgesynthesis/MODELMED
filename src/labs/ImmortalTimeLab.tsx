import { useMemo, useState } from 'react';
import { LabFrame, Panel, Presets } from './LabFrame';
import { Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot } from '@/components/charts/Plot';
import { usePalette } from '@/components/charts/palette';
import { Rng } from '@/lib/stats/random';
import { mantelHaenszelRateRatio, rateRatio } from '@/lib/stats/causal';
import { cn, num } from '@/lib/utils';

const F = 365; // days of follow-up
const LANDMARK = 90;

interface Pt {
  frail: number;
  start: number; // initiation day (Infinity if never)
  end: number; // death or censoring day
  died: number;
}

function simulate(hr: number, pInit: number, maxDelay: number, confounded: boolean, seed: number) {
  const rng = new Rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < 5000; i++) {
    const frail = rng.bernoulli(0.3);
    const lam = (frail ? 0.36 : 0.08) / 365; // per day
    const intends = rng.next() < pInit * (confounded && frail ? 0.35 : 1);
    const T = intends ? rng.uniform(0, maxDelay) : Infinity;
    const e = rng.exponential(1);
    let death = e / lam;
    if (death > T) death = T + (e - lam * T) / (lam * hr);
    const end = Math.min(death, F);
    const started = T < end ? T : Infinity;
    pts.push({ frail, start: started, end, died: death <= F ? 1 : 0 });
  }
  // 1) naive: ever vs never, everyone followed from day 0
  let d1 = 0, t1 = 0, d0 = 0, t0 = 0, immortal = 0;
  for (const p of pts) {
    if (p.start < Infinity) { d1 += p.died; t1 += p.end; immortal += p.start; }
    else { d0 += p.died; t0 += p.end; }
  }
  const naive = rateRatio(d1, t1, d0, t0);
  // 2) time-varying exposure (person-time split at initiation), optionally stratified by frailty
  const strata: [number, number, number, number][] = [[0, 0, 0, 0], [0, 0, 0, 0]];
  for (const p of pts) {
    const s = strata[p.frail];
    if (p.start < Infinity) {
      s[3] += p.start; // unexposed time before initiation
      s[1] += p.end - p.start;
      s[0] += p.died;
    } else {
      s[3] += p.end;
      s[2] += p.died;
    }
  }
  const tv = rateRatio(strata[0][0] + strata[1][0], strata[0][1] + strata[1][1], strata[0][2] + strata[1][2], strata[0][3] + strata[1][3]);
  const tvAdj = mantelHaenszelRateRatio(strata);
  // 3) landmark at day 90: alive at landmark, exposure = started by day 90, follow-up from day 90
  let ld1 = 0, lt1 = 0, ld0 = 0, lt0 = 0;
  for (const p of pts) {
    if (p.end <= LANDMARK) continue;
    const exposed = p.start <= LANDMARK;
    const time = p.end - LANDMARK;
    if (exposed) { ld1 += p.died; lt1 += time; } else { ld0 += p.died; lt0 += time; }
  }
  const landmark = rateRatio(ld1, lt1, ld0, lt0);
  return { pts, naive, tv, tvAdj, landmark, immortalYears: immortal / 365, treated: pts.filter((p) => p.start < Infinity).length };
}

export default function ImmortalTimeLab() {
  const [logHr, setLogHr] = useState(0);
  const [pInit, setPInit] = useState(0.6);
  const [maxDelay, setMaxDelay] = useState(180);
  const [confounded, setConfounded] = useState(false);
  const [seed, setSeed] = useState(1);
  const hr = Math.exp(logHr);
  const pal = usePalette();
  const r = useMemo(() => simulate(hr, pInit, maxDelay, confounded, seed), [hr, pInit, maxDelay, confounded, seed]);
  const rows: [string, number, string, string][] = [
    ['Ever vs never (from discharge)', r.naive.rr, pal.e, 'immortal time misclassified as treated'],
    ['Landmark (day 90)', r.landmark.rr, pal.c, 'aligned time zero; later starters count as untreated'],
    ['Time-varying exposure', r.tv.rr, pal.a, 'person-time split at initiation'],
    ['Time-varying + frailty strata', r.tvAdj, pal.d, 'also adjusts for the measured confounder'],
  ];
  const vals = [hr, ...rows.map((x) => x[1])].filter(Number.isFinite);
  const lo = Math.min(0.2, ...vals) * 0.9, hi = Math.max(2, ...vals) * 1.1;
  const sample = r.pts.filter((_, i) => i % 7 === 0).slice(0, 14);

  return (
    <LabFrame
      id="immortal-time"
      title="Immortal time bias: how a useless drug looks life-saving"
      goal="5,000 simulated patients are followed for one year after discharge; some start a drug at some point. You set the drug's true effect. Compare the classic 'ever vs never treated' analysis with designs that align time zero."
      tryThis={[
        'Leave the true hazard ratio at **1.00** (no effect). Read the "ever vs never" estimate — a large apparent benefit from pure design error.',
        'Increase the maximum delay to starting treatment. The more time patients must survive before they can be classified as treated, the bigger the bias.',
        'Switch on **healthy initiators** (frail patients rarely start). Now even the time-varying analysis is biased until it is stratified by frailty: aligning time zero fixes immortal time, not confounding.',
      ]}
      insight={
        'Treated patients had to survive until they started treatment; counting that "immortal" interval as treated time (or classifying patients by what they do later) guarantees a spurious benefit. Specifying the target trial — eligibility, assignment and start of follow-up all at the same time zero — prevents it by design. Valid analyses treat exposure as time-varying, use a landmark, or clone patients into strategies with a grace period and censor them when they deviate (with weights to handle confounding). This design flaw explains several famous observational "benefits" that randomised trials did not confirm.'
      }
    >
      <Presets
        presets={[
          { label: 'No effect', value: [1, false] as const },
          { label: 'Truly protective (HR 0.7)', value: [0.7, false] as const },
          { label: 'No effect + healthy initiators', value: [1, true] as const },
        ]}
        onPick={([h, c]) => { setLogHr(Math.log(h)); setConfounded(c); }}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <Slider label="True hazard ratio of the drug" value={logHr} min={Math.log(0.5)} max={Math.log(1.5)} step={0.01} onChange={setLogHr} format={() => num(hr, 2)} hint="1.00 = the drug does nothing" />
          <Slider label="Share of patients who start the drug" value={pInit} min={0.2} max={0.9} step={0.05} onChange={setPInit} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Starting day: spread from 0 to" value={maxDelay} min={14} max={330} step={1} onChange={setMaxDelay} format={(v) => `${v} days`} />
          <Toggle label="Healthy initiators" checked={confounded} onChange={setConfounded} hint="Frail patients (3–4× mortality) are much less likely to start" />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="text-xs font-medium text-primary underline">Resample cohort</button>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Patients who start" value={r.treated.toLocaleString()} />
            <Stat label="Immortal person-years" value={num(r.immortalYears, 0)} sub="counted as 'treated' by the naive analysis" />
          </div>
        </div>
        <div className="space-y-4">
          <Panel title="Estimated mortality rate ratio (treated vs untreated)">
            <Plot title="Rate ratio estimates" height={230} x={{ domain: [lo, hi], log: true, label: 'Rate ratio (log scale)', ticks: [0.25, 0.5, 0.75, 1, 1.5, 2].filter((t) => t >= lo && t <= hi), format: (v) => num(v, 2) }} y={{ domain: [0, 5], ticks: [], format: () => '' }}>
              {(s) => (
                <>
                  <line x1={s.x(1)} x2={s.x(1)} y1={s.y(0)} y2={s.y(5)} stroke={s.pal.ref} />
                  <line x1={s.x(hr)} x2={s.x(hr)} y1={s.y(0)} y2={s.y(5)} stroke={s.pal.fg} strokeWidth={2} strokeDasharray="5 3" />
                  <text x={s.x(hr) + 4} y={s.y(0.2)} fontSize={11} fill={s.pal.fg} stroke={s.pal.bg} strokeWidth={4} paintOrder="stroke">truth {num(hr, 2)}</text>
                  {rows.map(([label, v, c], i) => (
                    <g key={label}>
                      <circle cx={s.x(v)} cy={s.y(4.2 - i)} r={7} fill={c} />
                      <text x={s.x(lo) + 4} y={s.y(4.2 - i) - 12} fontSize={11} fill={s.pal.fg} stroke={s.pal.bg} strokeWidth={4} paintOrder="stroke">{label}: {num(v, 2)}</text>
                    </g>
                  ))}
                </>
              )}
            </Plot>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {rows.map(([label, , c, how]) => (
                <li key={label} className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                  <span>
                    <b className="text-foreground">{label}</b> — {how}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Fourteen patients from the cohort">
            <div className="space-y-1">
              {sample.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="w-10 shrink-0 text-right text-muted-foreground">{p.frail ? 'frail' : ''}</span>
                  <div className="relative h-3 flex-1 rounded bg-muted/40">
                    <div className="absolute top-0 h-3 rounded-l" style={{ left: 0, width: `${(Math.min(p.start, p.end) / F) * 100}%`, background: p.start < Infinity ? `repeating-linear-gradient(45deg, ${pal.e}55 0 3px, transparent 3px 6px)` : pal.ref }} />
                    {p.start < Infinity && <div className="absolute top-0 h-3 rounded-r" style={{ left: `${(p.start / F) * 100}%`, width: `${((p.end - p.start) / F) * 100}%`, background: pal.a }} />}
                    <span className={cn('absolute -top-0.5 text-[11px] font-bold')} style={{ left: `calc(${(p.end / F) * 100}% - 4px)`, color: p.died ? pal.e : pal.muted }}>{p.died ? '✕' : '|'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span><i className="mr-1 inline-block h-2 w-3 align-middle" style={{ background: `repeating-linear-gradient(45deg, ${pal.e}88 0 3px, transparent 3px 6px)` }} />before starting (immortal if classified as treated)</span>
              <span><i className="mr-1 inline-block h-2 w-3 align-middle" style={{ background: pal.a }} />on drug</span>
              <span><i className="mr-1 inline-block h-2 w-3 align-middle" style={{ background: pal.ref }} />never starts</span>
              <span>✕ death · | censored at 1 year</span>
            </div>
          </Panel>
        </div>
      </div>
    </LabFrame>
  );
}
