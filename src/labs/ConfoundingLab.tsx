import { useMemo, useState } from 'react';
import { LabFrame, Panel, Presets } from './LabFrame';
import { Segmented, Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Tabs } from '@/components/ui/Tabs';
import { Plot } from '@/components/charts/Plot';
import { usePalette, type Palette } from '@/components/charts/palette';
import { Rng } from '@/lib/stats/random';
import { expit, mean } from '@/lib/stats/core';
import { crudeEffect, eValue, eValueForCI, iptWeights, iptwEffect, propensityScores, smd, standardizedEffect, weightSummary } from '@/lib/stats/causal';
import { cn, num, pct } from '@/lib/utils';

type Structure = 'confounder' | 'collider' | 'mediator';

/** Minimal causal diagram: A → Y plus a third node; a box marks conditioning. */
function Dag({ structure, adjusted, pal, unmeasured }: { structure: Structure; adjusted: boolean; pal: Palette; unmeasured?: boolean }) {
  const third = structure === 'confounder' ? 'L' : structure === 'collider' ? 'C' : 'M';
  const top = structure !== 'collider';
  const N = { A: [60, 130], Y: [300, 130], X: [180, top ? 40 : 220] } as const;
  const arrow = (from: readonly number[], to: readonly number[], color = pal.fg, dash = false) => {
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const r = 24;
    const x1 = from[0] + ux * r, y1 = from[1] + uy * r, x2 = to[0] - ux * (r + 6), y2 = to[1] - uy * (r + 6);
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.2} strokeDasharray={dash ? '5 4' : undefined} />
        <path d={`M${x2 + ux * 8},${y2 + uy * 8} L${x2 - uy * 5},${y2 + ux * 5} L${x2 + uy * 5},${y2 - ux * 5} Z`} fill={color} />
      </g>
    );
  };
  const edges: [readonly number[], readonly number[]][] =
    structure === 'confounder' ? [[N.X, N.A], [N.X, N.Y]] : structure === 'collider' ? [[N.A, N.X], [N.Y, N.X]] : [[N.A, N.X], [N.X, N.Y]];
  const node = (p: readonly number[], label: string, boxed: boolean, sub: string) => (
    <g>
      {boxed ? <rect x={p[0] - 24} y={p[1] - 24} width={48} height={48} rx={6} fill={pal.bg} stroke={pal.b} strokeWidth={3} /> : <circle cx={p[0]} cy={p[1]} r={24} fill={pal.bg} stroke={pal.fg} strokeWidth={2} />}
      <text x={p[0]} y={p[1]} dy="0.35em" textAnchor="middle" fontWeight={700} fontSize={16} fill={pal.fg}>
        {label}
      </text>
      <text x={p[0]} y={p[1] + (p[1] > 150 ? 42 : -32)} textAnchor="middle" fontSize={11} fill={pal.muted}>
        {sub}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 260" className="mx-auto w-full max-w-sm" role="img" aria-label={`Causal diagram with a ${structure}`}>
      {arrow(N.A, N.Y, pal.a)}
      {edges.map(([f, t], i) => (
        <g key={i}>{arrow(f, t)}</g>
      ))}
      {unmeasured && (
        <>
          <circle cx={180} cy={230} r={18} fill="none" stroke={pal.e} strokeDasharray="4 3" strokeWidth={2} />
          <text x={180} y={230} dy="0.35em" textAnchor="middle" fontSize={13} fontWeight={700} fill={pal.e}>U</text>
          {arrow([180, 230], N.A, pal.e, true)}
          {arrow([180, 230], N.Y, pal.e, true)}
        </>
      )}
      {node(N.A, 'A', false, 'treatment')}
      {node(N.Y, 'Y', false, 'outcome')}
      {node(N.X, third, adjusted, structure === 'confounder' ? 'confounder' : structure === 'collider' ? 'collider' : 'mediator')}
    </svg>
  );
}

const TEXT: Record<Structure, { name: string; example: string; right: 'adjust' | 'none'; why: string }> = {
  confounder: {
    name: 'Confounder',
    example: 'L = illness severity: sicker patients are more likely to get the drug and more likely to die.',
    right: 'adjust',
    why: 'L opens a back-door path A ← L → Y. Adjusting for it blocks the path.',
  },
  collider: {
    name: 'Collider',
    example: 'C = hospital admission: both the exposure and the outcome make admission more likely. Studying only admitted patients conditions on C.',
    right: 'none',
    why: 'A → C ← Y is closed until you condition on C. Adjusting (or restricting to C) opens it and creates a spurious association.',
  },
  mediator: {
    name: 'Mediator',
    example: 'M = blood pressure: an antihypertensive lowers BP, which lowers stroke risk.',
    right: 'none',
    why: 'M lies on the causal pathway. Adjusting removes the part of the effect that flows through M, so you no longer estimate the total effect.',
  },
};

function simulateStructure(structure: Structure, beta: number, s: number) {
  const rng = new Rng(31);
  const n = 50000;
  const A: number[] = [], Y: number[] = [], X: number[] = [];
  let truth = 0;
  for (let i = 0; i < n; i++) {
    if (structure === 'confounder') {
      const l = rng.normal();
      const a = rng.bernoulli(expit(-0.3 + s * l));
      const lp = (aa: number) => -1.5 + beta * aa + s * l;
      truth += expit(lp(1)) - expit(lp(0));
      A.push(a); X.push(l); Y.push(rng.bernoulli(expit(lp(a))));
    } else if (structure === 'collider') {
      const a = rng.bernoulli(0.4);
      const lp = (aa: number) => -1.2 + beta * aa;
      const y = rng.bernoulli(expit(lp(a)));
      truth += expit(lp(1)) - expit(lp(0));
      A.push(a); Y.push(y); X.push(s * a + s * y + rng.normal());
    } else {
      const a = rng.bernoulli(0.5);
      const e = rng.normal();
      const m = (aa: number) => s * aa + e;
      const lp = (aa: number) => -1.5 + beta * aa + 0.8 * m(aa);
      truth += expit(lp(1)) - expit(lp(0));
      A.push(a); X.push(m(a)); Y.push(rng.bernoulli(expit(lp(a))));
    }
  }
  truth /= n;
  const crude = crudeEffect(A, Y).rd;
  const adjusted = standardizedEffect(A, X.map((v) => [v]), Y).rd;
  return { truth, crude, adjusted };
}

function WhatToAdjust() {
  const [structure, setStructure] = useState<Structure>('confounder');
  const [beta, setBeta] = useState(0);
  const [s, setS] = useState(1.2);
  const [adjust, setAdjust] = useState(false);
  const pal = usePalette();
  const r = useMemo(() => simulateStructure(structure, beta, s), [structure, beta, s]);
  const est = adjust ? r.adjusted : r.crude;
  const correct = (TEXT[structure].right === 'adjust') === adjust;
  const t = TEXT[structure];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <Segmented
          label="Causal structure of the third variable"
          value={structure}
          onChange={(v) => { setStructure(v); setAdjust(false); }}
          options={[
            { value: 'confounder', label: 'Confounder' },
            { value: 'collider', label: 'Collider' },
            { value: 'mediator', label: 'Mediator' },
          ]}
        />
        <p className="rounded-lg bg-muted p-3 text-sm">{t.example}</p>
        <Slider label="True direct effect of A on Y (log-odds)" value={beta} min={-1} max={1} step={0.05} onChange={setBeta} format={(v) => num(v, 2)} hint="0 = the treatment does nothing directly" />
        <Slider label="Strength of the other arrows" value={s} min={0} max={2.5} step={0.05} onChange={setS} format={(v) => num(v, 2)} />
        <Toggle label={`Adjust for ${structure === 'confounder' ? 'L' : structure === 'collider' ? 'C' : 'M'}`} checked={adjust} onChange={setAdjust} hint="Include it in the outcome model, then standardise" />
      </div>
      <div className="space-y-4">
        <Panel>
          <Dag structure={structure} adjusted={adjust} pal={pal} />
          <p className="mt-1 text-center text-xs text-muted-foreground">A box marks a variable you condition on.</p>
        </Panel>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="True total effect (RD)" value={pct(r.truth, 1)} />
          <Stat label={adjust ? 'Adjusted estimate' : 'Unadjusted estimate'} value={pct(est, 1)} tone={correct ? 'good' : 'bad'} />
          <Stat label="Bias" value={`${est - r.truth >= 0 ? '+' : ''}${pct(est - r.truth, 1)}`} tone={Math.abs(est - r.truth) > 0.02 ? 'bad' : 'good'} />
        </div>
        <p className={cn('rounded-lg p-3 text-sm', correct ? 'bg-success/10' : 'bg-destructive/10')}>
          <b>{correct ? 'Right choice. ' : 'Biased. '}</b>
          {t.why}
        </p>
      </div>
    </div>
  );
}

function Estimators() {
  const [k, setK] = useState(1.2);
  const [gamma, setGamma] = useState(0);
  const [beta, setBeta] = useState(-0.5);
  const pal = usePalette();
  const r = useMemo(() => {
    const rng = new Rng(77);
    const n = 6000;
    const L: number[][] = [], A: number[] = [], Y: number[] = [];
    let truth = 0;
    for (let i = 0; i < n; i++) {
      const sev = rng.normal();
      const frail = rng.bernoulli(0.3);
      const u = rng.normal();
      const a = rng.bernoulli(expit(-0.5 + k * sev + 0.6 * frail + gamma * u));
      const lp = (aa: number) => -2 + beta * aa + 1.0 * sev + 0.6 * frail + gamma * u;
      truth += expit(lp(1)) - expit(lp(0));
      L.push([sev, frail]); A.push(a); Y.push(rng.bernoulli(expit(lp(a))));
    }
    truth /= n;
    const ps = propensityScores(A, L);
    const w = iptWeights(A, ps);
    const hist = [0, 1].map((g) => {
      const H = new Array(20).fill(0);
      ps.forEach((p, i) => A[i] === g && H[Math.min(19, Math.floor(p * 20))]++);
      return H;
    });
    return {
      truth,
      crude: crudeEffect(A, Y).rd,
      gform: standardizedEffect(A, L, Y).rd,
      iptw: iptwEffect(A, Y, w).rd,
      ws: weightSummary(w),
      smdBefore: [smd(L.map((l) => l[0]), A), smd(L.map((l) => l[1]), A)],
      smdAfter: [smd(L.map((l) => l[0]), A, w), smd(L.map((l) => l[1]), A, w)],
      hist,
      treated: mean(A),
    };
  }, [k, gamma, beta]);
  const rows: [string, number, string][] = [
    ['Unadjusted', r.crude, pal.e],
    ['g-formula (standardisation)', r.gform, pal.a],
    ['IP weighting (IPTW)', r.iptw, pal.c],
  ];
  const all = [r.truth, ...rows.map((x) => x[1])];
  const lo = Math.min(...all) - 0.03, hi = Math.max(...all) + 0.03;
  const hmax = Math.max(...r.hist.flat(), 1);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <Slider label="Confounding by indication (severity → treatment)" value={k} min={0} max={4} step={0.1} onChange={setK} format={(v) => num(v, 1)} hint="High values = treatment almost determined by severity (positivity problems)" />
        <Slider label="Unmeasured confounder U (affects treatment and outcome)" value={gamma} min={0} max={1.5} step={0.05} onChange={setGamma} format={(v) => num(v, 2)} hint="Not available to any estimator" />
        <Slider label="True treatment effect (log-odds)" value={beta} min={-1.5} max={1} step={0.05} onChange={setBeta} format={(v) => num(v, 2)} />
        <Panel title="Covariate balance (standardised mean difference)">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="text-left font-medium">Covariate</th><th className="text-right font-medium">Before</th><th className="text-right font-medium">After IPTW</th></tr>
            </thead>
            <tbody>
              {['Severity', 'Frailty'].map((c, j) => (
                <tr key={c} className="border-t">
                  <td className="py-1">{c}</td>
                  <td className={cn('tabular text-right', Math.abs(r.smdBefore[j]) > 0.1 && 'text-destructive')}>{num(r.smdBefore[j], 2)}</td>
                  <td className={cn('tabular text-right', Math.abs(r.smdAfter[j]) > 0.1 ? 'text-destructive' : 'text-success')}>{num(r.smdAfter[j], 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">Balance on <em>measured</em> covariates says nothing about U.</p>
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel title="Estimated risk difference vs truth (n = 6,000)">
          <Plot title="Effect estimates" height={190} x={{ domain: [lo, hi], label: 'Risk difference (treated − untreated)', format: (v) => pct(v, 0) }} y={{ domain: [0, 4], ticks: [], format: () => '' }}>
            {(s) => (
              <>
                <line x1={s.x(r.truth)} x2={s.x(r.truth)} y1={s.y(0)} y2={s.y(4)} stroke={s.pal.fg} strokeWidth={2} strokeDasharray="5 3" />
                <line x1={s.x(0)} x2={s.x(0)} y1={s.y(0)} y2={s.y(4)} stroke={s.pal.ref} />
                {rows.map(([label, v, c], i) => (
                  <g key={label}>
                    <circle cx={s.x(v)} cy={s.y(3 - i)} r={7} fill={c} />
                    <text x={s.x(lo) + 4} y={s.y(3 - i) - 12} fontSize={11} fill={s.pal.fg} stroke={s.pal.bg} strokeWidth={4} paintOrder="stroke">{label}: {pct(v, 1)}</text>
                  </g>
                ))}
                <text x={s.x(r.truth) + 4} y={s.y(0.25)} fontSize={11} fill={s.pal.fg} stroke={s.pal.bg} strokeWidth={4} paintOrder="stroke">truth {pct(r.truth, 1)}</text>
              </>
            )}
          </Plot>
        </Panel>
        <Panel title="Propensity-score overlap">
          <svg viewBox="0 0 200 90" className="w-full" role="img" aria-label="Propensity score distributions">
            {r.hist[1].map((h, i) => <rect key={'t' + i} x={i * 10 + 0.5} y={45 - (h / hmax) * 42} width={9} height={(h / hmax) * 42} fill={pal.b} opacity={0.8} />)}
            {r.hist[0].map((h, i) => <rect key={'u' + i} x={i * 10 + 0.5} y={45} width={9} height={(h / hmax) * 42} fill={pal.a} opacity={0.8} />)}
            <line x1={0} x2={200} y1={45} y2={45} stroke={pal.muted} strokeWidth={0.5} />
          </svg>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>PS 0</span><span style={{ color: pal.b }}>▲ treated</span><span style={{ color: pal.a }}>▼ untreated</span><span>PS 1</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Largest weight" value={num(r.ws.max, 1)} tone={r.ws.max > 20 ? 'bad' : undefined} />
            <Stat label="Effective sample size" value={Math.round(r.ws.ess).toLocaleString()} sub="of 6,000" tone={r.ws.ess < 3000 ? 'warn' : undefined} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EValueCalc() {
  const [logRR, setLogRR] = useState(Math.log(3.9));
  const [logLim, setLogLim] = useState(Math.log(1.8));
  const rr = Math.exp(logRR);
  const lim = Math.exp(logLim);
  const ev = eValue(rr);
  const evCI = rr >= 1 ? eValueForCI(rr, lim, Infinity) : eValueForCI(rr, 0, lim);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <Presets
          presets={[
            { label: 'RR 3.9 (CI 1.8–8.7)', value: [3.9, 1.8] },
            { label: 'HR 0.80 (CI 0.70–0.92)', value: [0.8, 0.92] },
            { label: 'RR 1.3 (CI 0.95–1.8)', value: [1.3, 0.95] },
          ]}
          onPick={([a, b]) => { setLogRR(Math.log(a)); setLogLim(Math.log(b)); }}
        />
        <Slider label="Observed risk ratio" value={logRR} min={Math.log(0.2)} max={Math.log(6)} step={0.01} onChange={setLogRR} format={() => num(rr, 2)} />
        <Slider label="Confidence limit closest to 1" value={logLim} min={Math.log(0.2)} max={Math.log(6)} step={0.01} onChange={setLogLim} format={() => num(lim, 2)} />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="E-value (point estimate)" value={num(ev, 2)} />
          <Stat label="E-value (confidence limit)" value={num(evCI, 2)} tone={evCI <= 1.0001 ? 'bad' : undefined} />
        </div>
        <p className="rounded-lg bg-muted p-3 text-sm">
          To explain away the observed RR of {num(rr, 2)}, an unmeasured confounder would need a risk-ratio association of at least <b>{num(ev, 2)}</b> with <em>both</em> treatment and outcome, beyond the measured covariates. {evCI <= 1.0001 ? 'The confidence interval already includes 1, so no confounding is needed to move it to the null.' : `To shift the confidence interval to include 1 would need ${num(evCI, 2)}.`}
        </p>
        <p className="text-xs text-muted-foreground">E = RR + √(RR × (RR − 1)), using 1/RR for protective estimates. For hazard ratios this approximation holds for rare outcomes. An E-value is a sensitivity summary, not proof of causality — judge it against how strong known confounders are.</p>
      </div>
    </div>
  );
}

export default function ConfoundingLab() {
  return (
    <LabFrame
      id="confounding"
      title="Confounding, colliders, mediators — and what adjustment can and cannot do"
      goal="Simulated cohorts with known causal structure and a known true effect. Decide what to adjust for, compare estimators, check overlap, and quantify sensitivity to unmeasured confounding."
      tryThis={[
        'Tab 1, **Collider**, true effect 0: without adjustment the estimate is ~0. Now adjust for C — a strong spurious association appears from nothing.',
        'Tab 1, **Mediator**: adjusting for M shrinks the estimate toward the direct effect only. Which answer does a clinician deciding whether to prescribe need?',
        'Tab 2: raise confounding by indication to 3.5. Both estimators still work on average, but the largest IP weight and the effective sample size show the positivity problem. Then add an unmeasured confounder: nothing fixes it, and balance tables look perfect.',
      ]}
      insight={
        'Whether to adjust for a variable depends on its causal role, not on its p-value or its association with the outcome: adjust for confounders, never for colliders or (for total effects) mediators. Standardisation and inverse probability weighting estimate the same marginal effect under the same assumptions — exchangeability given measured covariates, positivity and consistency. They differ in which model must be right. Neither can correct for unmeasured confounding; that is what design, negative controls and sensitivity analyses (E-values) are for.'
      }
    >
      <Tabs
        tabs={[
          { id: 'adjust', label: '1 · What to adjust for', content: <WhatToAdjust /> },
          { id: 'estimators', label: '2 · Estimators & overlap', content: <Estimators /> },
          { id: 'evalue', label: '3 · E-value', content: <EValueCalc /> },
        ]}
      />
    </LabFrame>
  );
}
