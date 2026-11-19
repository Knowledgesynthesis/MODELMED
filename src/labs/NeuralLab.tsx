import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { LabFrame, Panel } from './LabFrame';
import { Segmented, Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { TinyMLP, type Activation } from '@/lib/ml/mlp';
import { fitLogistic, predictLogistic } from '@/lib/ml/logistic';
import { Rng } from '@/lib/stats/random';
import { auc } from '@/lib/stats/metrics';
import { num } from '@/lib/utils';

type Shape = 'linear' | 'circle' | 'xor';

function makeData(shape: Shape, n: number, noise: number, seed: number) {
  const rng = new Rng(seed);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = rng.uniform(-1, 1), b = rng.uniform(-1, 1);
    let label: number;
    if (shape === 'linear') label = a + 0.6 * b > 0.1 ? 1 : 0;
    else if (shape === 'circle') label = a * a + b * b < 0.42 ? 1 : 0;
    else label = a * b > 0 ? 1 : 0;
    if (rng.next() < noise) label = 1 - label;
    X.push([a, b]);
    y.push(label);
  }
  return { X, y };
}

const logloss = (p: number[], y: number[]) => -p.reduce((s, v, i) => s + (y[i] ? Math.log(Math.max(v, 1e-9)) : Math.log(Math.max(1 - v, 1e-9))), 0) / p.length;

export default function NeuralLab() {
  const [shape, setShape] = useState<Shape>('circle');
  const [hidden, setHidden] = useState(6);
  const [act, setAct] = useState<Activation>('tanh');
  const [l2, setL2] = useState(0);
  const [noise, setNoise] = useState(0.08);
  const [nTrain, setNTrain] = useState(120);
  const [running, setRunning] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [hist, setHist] = useState<{ e: number; tr: number; te: number }[]>([]);
  const pal = usePalette();
  const canvas = useRef<HTMLCanvasElement>(null);
  const net = useRef<TinyMLP | null>(null);
  const train = useMemo(() => makeData(shape, nTrain, noise, 3), [shape, nTrain, noise]);
  const test = useMemo(() => makeData(shape, 600, noise, 99), [shape, noise]);
  const lr = useMemo(() => fitLogistic(train.X, train.y), [train]);

  const reset = useCallback(() => {
    net.current = hidden > 0 ? new TinyMLP(2, hidden, act, 7) : null;
    setEpoch(0);
    setHist([]);
    setRunning(false);
  }, [hidden, act]);
  useEffect(reset, [reset, train]);

  const predict = useCallback((X: number[][]) => (net.current ? net.current.predict(X) : predictLogistic(lr.beta, X)), [lr]);

  const draw = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const S = c.width;
    const G = 50;
    const cell = S / G;
    const pts: number[][] = [];
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) pts.push([-1 + (2 * (j + 0.5)) / G, 1 - (2 * (i + 0.5)) / G]);
    const p = predict(pts);
    const [r1, g1, b1] = [14, 116, 144];
    const [r2, g2, b2] = [194, 65, 12];
    p.forEach((v, k) => {
      const i = Math.floor(k / G), j = k % G;
      const t = v;
      ctx.fillStyle = `rgba(${r1 + (r2 - r1) * t},${g1 + (g2 - g1) * t},${b1 + (b2 - b1) * t},${0.18 + 0.5 * Math.abs(t - 0.5)})`;
      ctx.fillRect(j * cell, i * cell, cell + 0.5, cell + 0.5);
    });
    // decision boundary p = 0.5 approximated by cells
    train.X.forEach((x, k) => {
      ctx.beginPath();
      ctx.arc(((x[0] + 1) / 2) * S, ((1 - x[1]) / 2) * S, 4, 0, Math.PI * 2);
      ctx.fillStyle = train.y[k] ? `rgb(${r2},${g2},${b2})` : `rgb(${r1},${g1},${b1})`;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    });
  }, [predict, train]);

  useEffect(() => {
    draw();
  }, [draw, epoch]);

  useEffect(() => {
    if (!running || !net.current) return;
    let raf = 0;
    let e = epoch;
    const loop = () => {
      for (let k = 0; k < 8; k++) net.current!.step(train.X, train.y, 0.03, l2);
      e += 8;
      if (e % 40 === 0) {
        const tr = logloss(net.current!.predict(train.X), train.y);
        const te = logloss(net.current!.predict(test.X), test.y);
        setHist((h) => [...h, { e, tr, te }]);
      }
      setEpoch(e);
      if (e >= 4000) {
        setRunning(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const pTr = predict(train.X);
  const pTe = predict(test.X);
  const aTr = auc(pTr, train.y);
  const aTe = auc(pTe, test.y);
  const yMax = Math.max(0.8, ...hist.map((h) => Math.max(h.tr, h.te))) * 1.05;

  return (
    <LabFrame
      id="neural"
      title="Neural network playground"
      goal="A two-input network learns a decision surface by gradient descent (backpropagation + Adam). Compare it with logistic regression, which can only draw a straight line."
      tryThis={[
        'With the **circle** data, set hidden units to 0 (logistic regression). The best straight line cannot separate a ring: test AUC ≈ 0.5–0.6. Now use 6 hidden units and press Play.',
        'Use **XOR** with 2 hidden units, then 4. How many units does the problem need?',
        'Set 40 training points, 15% label noise, 32 hidden units, no L2, and train to the end. Watch training loss keep falling while test loss turns upward — overfitting. Add L2 = 0.003 and retrain.',
      ]}
      insight={
        'Hidden units compose simple nonlinear functions into flexible ones (universal approximation), learned by backpropagating the gradient of the loss. Flexibility is not free: networks need more data, careful regularisation (weight decay, early stopping, dropout), and are often over-confident without recalibration (Guo 2017). On typical tabular clinical data, gradient-boosted trees or well-specified regression usually match or beat neural networks; deep learning earns its place with images, waveforms and text.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Segmented
            label="Data pattern"
            value={shape}
            onChange={setShape}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'circle', label: 'Circle' },
              { value: 'xor', label: 'XOR' },
            ]}
          />
          <Slider label="Hidden units (0 = logistic regression)" value={hidden} min={0} max={32} onChange={setHidden} />
          <Segmented
            label="Activation"
            size="sm"
            value={act}
            onChange={setAct}
            options={[
              { value: 'tanh', label: 'tanh' },
              { value: 'relu', label: 'ReLU' },
            ]}
          />
          <Slider label="L2 weight decay" value={l2} min={0} max={0.01} step={0.0005} onChange={setL2} format={(v) => num(v, 4)} />
          <Slider label="Training points" value={nTrain} min={40} max={400} step={20} onChange={setNTrain} />
          <Slider label="Label noise" value={noise} min={0} max={0.3} step={0.01} onChange={setNoise} format={(v) => `${Math.round(v * 100)}%`} />
          <div className="flex gap-2">
            <Button onClick={() => setRunning((r) => !r)} disabled={hidden === 0}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Pause' : epoch ? 'Resume' : 'Play'}
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Epoch" value={hidden ? epoch : '—'} sub={hidden ? 'full-batch steps' : 'closed-form fit'} />
            <Stat label="Train AUC" value={num(aTr, 3)} />
            <Stat label="Test AUC" value={num(aTe, 3)} tone={aTr - aTe > 0.06 ? 'warn' : undefined} />
          </div>
          <Panel title="Decision surface (colour = predicted probability)">
            <canvas ref={canvas} width={420} height={420} className="mx-auto aspect-square w-full max-w-[420px] rounded-lg border" aria-label="Decision surface" />
          </Panel>
        </div>
      </div>
      {hidden > 0 && hist.length > 1 && (
        <Panel title="Learning curves (log-loss)">
          <Plot title="Training and test loss over epochs" height={180} x={{ domain: [0, Math.max(400, hist[hist.length - 1].e)], label: 'Epoch' }} y={{ domain: [0, yMax], label: 'Log-loss' }}>
            {(s) => (
              <>
                <path d={linePath(hist.map((h) => [h.e, h.tr]), s)} fill="none" stroke={s.pal.b} strokeWidth={2.25} />
                <path d={linePath(hist.map((h) => [h.e, h.te]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.25} />
              </>
            )}
          </Plot>
          <Legend items={[{ label: 'Training', color: pal.b }, { label: 'Test', color: pal.a }]} />
        </Panel>
      )}
    </LabFrame>
  );
}
