import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Slider, Toggle } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath, stepPath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { Rng } from '@/lib/stats/random';
import { kaplanMeier, survivalAt } from '@/lib/stats/survival';
import { Button } from '@/components/ui/Button';
import { pct } from '@/lib/utils';

const HORIZON = 24; // months

export default function KaplanMeierLab() {
  const [loss, setLoss] = useState(0.03);
  const [informative, setInformative] = useState(false);
  const [seed, setSeed] = useState(1);
  const pal = usePalette();

  const sim = useMemo(() => {
    const rng = new Rng(seed * 101 + 7);
    const n = 300;
    const times: number[] = [];
    const events: (0 | 1)[] = [];
    // two latent frailty groups: high-risk patients die faster
    const hazard = (hi: boolean) => (hi ? 0.08 : 0.015);
    let trueS = 0;
    for (let i = 0; i < n; i++) {
      const hi = rng.next() < 0.4;
      const t = rng.exponential(hazard(hi));
      // loss to follow-up; if informative, sick patients are lost 3× faster
      const lossRate = informative ? (hi ? loss * 3 : loss * 0.3) : loss;
      const c = lossRate > 0 ? rng.exponential(lossRate) : Infinity;
      const admin = HORIZON;
      const obs = Math.min(t, c, admin);
      times.push(Math.max(0.05, +obs.toFixed(2)));
      events.push(t <= c && t <= admin ? 1 : 0);
    }
    const truth: [number, number][] = [];
    for (let m = 0; m <= HORIZON; m += 0.25) truth.push([m, 0.4 * Math.exp(-hazard(true) * m) + 0.6 * Math.exp(-hazard(false) * m)]);
    trueS = truth[truth.length - 1][1];
    const km = kaplanMeier(times, events);
    // naive 1: drop everyone censored before the horizon, compute proportion alive among the rest
    const naive: [number, number][] = [];
    const naive2: [number, number][] = [];
    for (let m = 0; m <= HORIZON; m += 0.5) {
      const known = times.map((t, i) => (events[i] ? true : t >= m));
      let alive = 0, k = 0, alive2 = 0;
      times.forEach((t, i) => {
        if (known[i]) {
          k++;
          if (!(events[i] && t <= m)) alive++;
        }
        if (!(events[i] && t <= m)) alive2++;
      });
      naive.push([m, alive / k]);
      naive2.push([m, alive2 / n]);
    }
    const censored = events.filter((e) => !e).length;
    const lost = times.filter((t, i) => !events[i] && t < HORIZON).length;
    return { km, truth, naive, naive2, trueS, censored, lost, n, nEvents: n - censored };
  }, [loss, informative, seed]);

  const kmS = survivalAt(sim.km, HORIZON - 0.01);
  const naiveS = sim.naive[sim.naive.length - 1][1];
  const naive2S = sim.naive2[sim.naive2.length - 1][1];
  const kmPts = sim.km.map((s) => [s.time, s.survival] as [number, number]);
  const loPts = sim.km.map((s) => [s.time, s.lo] as [number, number]);
  const hiPts = sim.km.map((s) => [s.time, s.hi] as [number, number]);

  return (
    <LabFrame
      id="km"
      title="Censoring: why survival analysis exists"
      goal="300 simulated patients followed for up to 24 months. Some are lost to follow-up (censored). Compare the Kaplan–Meier estimate with two naive approaches and with the known truth."
      tryThis={[
        'Increase loss to follow-up from 0% to 15%/month. The KM curve stays close to the truth (wider band); both naive estimates drift. In which direction does each one drift, and why?',
        'Turn on **informative censoring** (high-risk patients drop out faster). Now even KM over-estimates survival. This assumption cannot be checked from the data alone.',
        'Resample several times at high censoring to see sampling variability in the KM curve.',
      ]}
      insight={
        'KM uses each patient for exactly as long as they were observed: at each event time S(t) is multiplied by (1 − deaths/at-risk). Dropping censored patients discards survivors and makes survival look worse; counting them as alive makes it look better. KM is unbiased only if censoring is **non-informative**: those censored must have the same prognosis as those still followed. When a competing event (e.g., death from another cause) prevents the event of interest, 1 − KM over-estimates cumulative incidence; use competing-risks methods instead.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-5">
          <Slider label="Loss to follow-up (per month)" value={loss} min={0} max={0.15} step={0.005} onChange={setLoss} format={(v) => pct(v, 1)} />
          <Toggle label="Informative censoring" checked={informative} onChange={setInformative} hint="Sicker patients are more likely to be lost" />
          <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
            Resample cohort
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="True 24-month survival" value={pct(sim.trueS)} />
            <Stat label="Kaplan–Meier" value={pct(kmS)} tone={Math.abs(kmS - sim.trueS) > 0.05 ? 'bad' : 'good'} />
            <Stat label="Drop the censored" value={pct(naiveS)} tone={Math.abs(naiveS - sim.trueS) > 0.05 ? 'bad' : undefined} />
            <Stat label="Count censored as alive" value={pct(naive2S)} tone={Math.abs(naive2S - sim.trueS) > 0.05 ? 'bad' : undefined} />
          </div>
          <p className="text-xs text-muted-foreground">
            {sim.nEvents} events · {sim.lost} lost to follow-up · {sim.censored - sim.lost} administratively censored at 24 months.
          </p>
        </div>
        <Panel>
          <Plot title="Survival curves" height={300} x={{ domain: [0, HORIZON], label: 'Months since index date', ticks: [0, 6, 12, 18, 24] }} y={{ domain: [0, 1], label: 'Proportion event-free', format: (v) => pct(v, 0) }}>
            {(s) => (
              <>
                <path d={stepPath(hiPts, s) + 'L' + [...loPts].reverse().map((p) => `${s.x(p[0])},${s.y(p[1])}`).join('L')} fill={s.pal.a} opacity={0.08} />
                <path d={linePath(sim.truth, s)} fill="none" stroke={s.pal.fg} strokeWidth={1.5} strokeDasharray="2 3" />
                <path d={linePath(sim.naive, s)} fill="none" stroke={s.pal.e} strokeWidth={2} />
                <path d={linePath(sim.naive2, s)} fill="none" stroke={s.pal.c} strokeWidth={2} />
                <path d={stepPath(kmPts, s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
              </>
            )}
          </Plot>
          <Legend
            items={[
              { label: 'Truth', color: pal.fg, dash: true },
              { label: 'Kaplan–Meier (95% band)', color: pal.a },
              { label: 'Drop censored', color: pal.e },
              { label: 'Censored = alive', color: pal.c },
            ]}
          />
        </Panel>
      </div>
    </LabFrame>
  );
}
