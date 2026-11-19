import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { Rng } from '@/lib/stats/random';
import { solve } from '@/lib/stats/linalg';
import { num } from '@/lib/utils';

// True dose–response: smooth, saturating (e.g., biomarker vs physiological response)
const truth = (x: number) => 2.2 * Math.tanh(1.6 * x) + 0.4 * x;
const cheb = (x: number, d: number) => {
  const T = [1, x];
  for (let k = 2; k <= d; k++) T.push(2 * x * T[k - 1] - T[k - 2]);
  return T.slice(0, d + 1);
};
function fitPoly(xs: number[], ys: number[], d: number) {
  const X = xs.map((x) => cheb(x, d));
  const p = d + 1;
  const A = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-9 : 0)));
  const b = Array.from({ length: p }, (_, i) => X.reduce((s, r, k) => s + r[i] * ys[k], 0));
  const w = solve(A, b) ?? new Array(p).fill(0);
  return (x: number) => cheb(x, d).reduce((s, v, i) => s + v * w[i], 0);
}
const rmse = (f: (x: number) => number, xs: number[], ys: number[]) => Math.sqrt(xs.reduce((s, x, i) => s + (f(x) - ys[i]) ** 2, 0) / xs.length);

export default function OverfittingLab() {
  const [n, setN] = useState(20);
  const [noise, setNoise] = useState(0.6);
  const [degree, setDegree] = useState(3);
  const [seed, setSeed] = useState(1);
  const pal = usePalette();

  const data = useMemo(() => {
    const rng = new Rng(seed * 31 + n);
    const xs = Array.from({ length: n }, () => rng.uniform(-1, 1));
    const ys = xs.map((x) => truth(x) + rng.normal(0, noise));
    const rt = new Rng(999);
    const tx = Array.from({ length: 2000 }, () => rt.uniform(-1, 1));
    const ty = tx.map((x) => truth(x) + rt.normal(0, noise));
    return { xs, ys, tx, ty };
  }, [n, noise, seed]);

  const errs = useMemo(
    () =>
      Array.from({ length: 15 }, (_, d) => {
        if (d + 1 >= data.xs.length) return { d, train: NaN, test: NaN };
        const f = fitPoly(data.xs, data.ys, d);
        return { d, train: rmse(f, data.xs, data.ys), test: Math.min(10, rmse(f, data.tx, data.ty)) };
      }),
    [data]
  );
  const f = useMemo(() => fitPoly(data.xs, data.ys, Math.min(degree, data.xs.length - 2)), [data, degree]);
  const curve = useMemo(() => Array.from({ length: 201 }, (_, i) => [-1 + i / 100, f(-1 + i / 100)] as [number, number]), [f]);
  const tcurve = useMemo(() => Array.from({ length: 101 }, (_, i) => [-1 + i / 50, truth(-1 + i / 50)] as [number, number]), []);
  const cur = errs[degree];
  const best = errs.filter((e) => Number.isFinite(e.test)).reduce((a, b) => (b.test < a.test ? b : a));
  const yMax = Math.max(...errs.filter((e) => Number.isFinite(e.test)).map((e) => e.test), 1);

  return (
    <LabFrame
      id="overfitting"
      title="Overfitting and the bias–variance trade-off"
      goal="Fit polynomials of increasing flexibility to a noisy biomarker–response relationship. Error on 2,000 new patients reveals what training error hides."
      tryThis={[
        'With n = 20, move the degree from 1 to 14. Training error falls monotonically; test error is U-shaped. Note the degree with lowest test error.',
        'Set degree = 12 and press **New sample** repeatedly: the wild curve changes every time (high variance). At degree 1 it barely moves but is systematically wrong (high bias).',
        'Increase n to 200. The best degree moves up and the penalty for flexibility shrinks — more data buys complexity.',
      ]}
      insight={
        'Expected test error = bias² + variance + irreducible noise. Flexible models reduce bias but chase noise when data are scarce. **Apparent (training) performance is optimistic**; the gap is the optimism that internal validation (bootstrap, cross-validation) estimates. In clinical models the same thing happens with too many candidate predictors, unpenalised interactions, or deep trees relative to the number of events.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-5">
          <Slider label="Training patients (n)" value={n} min={10} max={200} step={5} onChange={setN} />
          <Slider label="Noise (SD)" value={noise} min={0.1} max={1.5} step={0.05} onChange={setNoise} format={(v) => num(v, 2)} />
          <Slider label="Polynomial degree (flexibility)" value={degree} min={0} max={14} onChange={setDegree} />
          <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
            New sample
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Training RMSE" value={num(cur.train, 3)} />
            <Stat label="Test RMSE (new patients)" value={num(cur.test, 3)} tone={cur.test > best.test * 1.15 ? 'bad' : 'good'} />
            <Stat label="Optimism (test − train)" value={num(cur.test - cur.train, 3)} />
            <Stat label="Best degree for this n" value={best.d} sub={`test RMSE ${num(best.test, 3)}`} />
          </div>
        </div>
        <div className="space-y-4">
          <Panel title="Fitted curve vs truth">
            <Plot title="Polynomial fit" height={250} x={{ domain: [-1, 1], label: 'Biomarker (standardised)' }} y={{ domain: [-4.5, 4.5], label: 'Response' }}>
              {(s) => (
                <>
                  <path d={linePath(tcurve, s)} fill="none" stroke={s.pal.fg} strokeDasharray="3 3" strokeWidth={1.5} />
                  {data.xs.map((x, i) => (
                    <circle key={i} cx={s.x(x)} cy={s.y(data.ys[i])} r={3.2} fill={s.pal.a} opacity={0.8} />
                  ))}
                  <path d={linePath(curve, s)} fill="none" stroke={s.pal.b} strokeWidth={2.5} />
                </>
              )}
            </Plot>
            <Legend items={[{ label: 'True relationship', color: pal.fg, dash: true }, { label: `Degree-${degree} fit`, color: pal.b }]} />
          </Panel>
          <Panel title="Error vs flexibility">
            <Plot title="Training and test error by degree" height={200} x={{ domain: [0, 14], label: 'Polynomial degree' }} y={{ domain: [0, Math.min(4, yMax * 1.05)], label: 'RMSE' }}>
              {(s) => (
                <>
                  <path d={linePath(errs.map((e) => [e.d, e.train]), s)} fill="none" stroke={s.pal.b} strokeWidth={2.5} />
                  <path d={linePath(errs.map((e) => [e.d, e.test]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                  <line x1={s.x(degree)} x2={s.x(degree)} y1={s.y(0)} y2={s.y(4)} stroke={s.pal.muted} strokeDasharray="3 3" />
                  <line x1={s.x(0)} x2={s.x(14)} y1={s.y(noise)} y2={s.y(noise)} stroke={s.pal.ref} strokeDasharray="1 4" />
                </>
              )}
            </Plot>
            <Legend items={[{ label: 'Training', color: pal.b }, { label: 'Test', color: pal.a }, { label: 'Irreducible noise', color: pal.ref, dash: true }]} />
          </Panel>
        </div>
      </div>
    </LabFrame>
  );
}
