import { useMemo, useState } from 'react';
import { LabFrame, Panel } from './LabFrame';
import { Segmented, Slider } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { Plot, Legend } from '@/components/charts/Plot';
import { linePath } from '@/components/charts/paths';
import { usePalette } from '@/components/charts/palette';
import { getDataset } from '@/data/datasets';
import { stratifiedSplit, rawMatrix } from '@/lib/pipeline/pipeline';
import { fitTree, predictTree, countLeaves, type TreeNode } from '@/lib/ml/tree';
import { auc } from '@/lib/stats/metrics';
import { cn, num, pct } from '@/lib/utils';

function NodeView({ node, labels, units, depth = 0 }: { node: TreeNode; labels: string[]; units: (string | undefined)[]; depth?: number }) {
  const leaf = !node.left;
  const risk = node.value;
  return (
    <div className={cn(depth > 0 && 'ml-3 border-l pl-3 sm:ml-5 sm:pl-4')}>
      <div className="my-1 inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs">
        <span className="tabular font-semibold" style={{ color: `hsl(${(1 - Math.min(1, risk * 2.5)) * 190} 75% 42%)` }}>
          {pct(risk, 0)} risk
        </span>
        <span className="text-muted-foreground">n={node.n}</span>
        {leaf ? <span className="rounded bg-muted px-1.5">leaf</span> : <span className="text-muted-foreground">Gini {num(node.impurity, 3)}</span>}
      </div>
      {!leaf && (
        <div>
          <div className="mt-1 text-xs font-medium">
            {labels[node.feature!]} ≤ {num(node.threshold!, 1)}
            {units[node.feature!] ? ` ${units[node.feature!]}` : ''}
          </div>
          <NodeView node={node.left!} labels={labels} units={units} depth={depth + 1} />
          <div className="mt-1 text-xs font-medium">
            {labels[node.feature!]} &gt; {num(node.threshold!, 1)}
          </div>
          <NodeView node={node.right!} labels={labels} units={units} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

export default function TreeLab() {
  const [depth, setDepth] = useState(3);
  const [minLeaf, setMinLeaf] = useState(20);
  const [dsId, setDsId] = useState<'sepsis' | 'readmission'>('sepsis');
  const pal = usePalette();
  const ds = getDataset(dsId);
  const keys = ds.features.map((f) => f.key);
  const data = useMemo(() => {
    const y = ds.rows.map((r) => r.outcome);
    const { train, test } = stratifiedSplit(y, 0.3, 3);
    return { Xtr: rawMatrix(ds, train, keys), ytr: train.map((i) => y[i]), Xte: rawMatrix(ds, test, keys), yte: test.map((i) => y[i]) };
  }, [ds, keys]);
  const curve = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const t = fitTree(data.Xtr, data.ytr, { maxDepth: i + 1, minSamplesLeaf: minLeaf });
        return { d: i + 1, train: auc(data.Xtr.map((x) => predictTree(t, x)), data.ytr), test: auc(data.Xte.map((x) => predictTree(t, x)), data.yte) };
      }),
    [data, minLeaf]
  );
  const tree = useMemo(() => fitTree(data.Xtr, data.ytr, { maxDepth: depth, minSamplesLeaf: minLeaf }), [data, depth, minLeaf]);
  const cur = curve[depth - 1];
  const best = curve.reduce((a, b) => (b.test > a.test ? b : a));

  return (
    <LabFrame
      id="tree"
      title="Grow a decision tree"
      goal="CART chooses, at each node, the single split that most reduces Gini impurity. Watch training and test discrimination as the tree deepens."
      tryThis={[
        'Increase depth from 1 to 12 with minimum leaf size 5. Training AUC keeps rising; where does test AUC peak?',
        'Raise the minimum leaf size to 60. How does this regularise the tree?',
        'Read the first split on the **sepsis** data. Does the tree find the U-shaped temperature or WBC effect by splitting the same variable twice?',
      ]}
      insight={
        'Each split is greedy and axis-aligned, so trees naturally capture thresholds and interactions — but predictions are step functions and a single tree is unstable: a slightly different sample can produce a different first split. Ensembles (random forests, boosting) average many trees to cut that variance. Depth and leaf size are hyperparameters: tune them on validation data, never on the test set.'
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <Segmented
            label="Dataset"
            value={dsId}
            onChange={setDsId}
            options={[
              { value: 'sepsis', label: 'Sepsis (nonlinear)' },
              { value: 'readmission', label: 'Readmission (linear)' },
            ]}
          />
          <Slider label="Maximum depth" value={depth} min={1} max={12} onChange={setDepth} />
          <Slider label="Minimum patients per leaf" value={minLeaf} min={5} max={100} step={5} onChange={setMinLeaf} />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Leaves" value={countLeaves(tree)} />
            <Stat label="Train AUC" value={num(cur.train, 3)} />
            <Stat label="Test AUC" value={num(cur.test, 3)} tone={cur.test < best.test - 0.02 ? 'warn' : 'good'} />
          </div>
          <Panel title="Discrimination vs depth">
            <Plot title="Train and test AUC by tree depth" height={200} x={{ domain: [1, 12], label: 'Maximum depth', ticks: [1, 3, 5, 7, 9, 11] }} y={{ domain: [0.5, 1], label: 'AUC' }}>
              {(s) => (
                <>
                  <path d={linePath(curve.map((c) => [c.d, c.train]), s)} fill="none" stroke={s.pal.b} strokeWidth={2.5} />
                  <path d={linePath(curve.map((c) => [c.d, c.test]), s)} fill="none" stroke={s.pal.a} strokeWidth={2.5} />
                  <line x1={s.x(depth)} x2={s.x(depth)} y1={s.y(0.5)} y2={s.y(1)} stroke={s.pal.muted} strokeDasharray="3 3" />
                </>
              )}
            </Plot>
            <Legend items={[{ label: 'Training', color: pal.b }, { label: 'Test (held out)', color: pal.a }]} />
          </Panel>
        </div>
        <Panel title={`Tree structure (${ds.short}, depth ${depth})`} className="max-h-[560px] overflow-auto">
          <NodeView node={tree} labels={ds.features.map((f) => f.label)} units={ds.features.map((f) => f.unit)} />
        </Panel>
      </div>
    </LabFrame>
  );
}
