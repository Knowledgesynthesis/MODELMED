import { Rng } from '../stats/random';

export interface TreeNode {
  id: number;
  depth: number;
  n: number;
  /** Classification: number of events in node. */
  nPos: number;
  /** Leaf output: proportion of events (classification) or Newton step (boosting). */
  value: number;
  impurity: number;
  feature?: number;
  threshold?: number;
  /** Impurity decrease achieved by this split (for impurity-based importance). */
  gain?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export interface TreeOptions {
  maxDepth?: number;
  minSamplesLeaf?: number;
  /** Number of features considered at each split (random forests); default = all. */
  mtry?: number;
  rng?: Rng;
}

const gini = (pos: number, n: number) => {
  if (n === 0) return 0;
  const p = pos / n;
  return 2 * p * (1 - p);
};

/** Per-feature row orders sorted by value (rows may repeat, e.g. bootstrap samples). */
function presort(X: number[][], rows: number[]): Int32Array[] {
  const p = X[0].length;
  return Array.from({ length: p }, (_, j) => Int32Array.from([...rows].sort((a, b) => X[a][j] - X[b][j])));
}

/** Stable partition of every feature order into left/right children in O(p · n). */
function partition(orders: Int32Array[], goLeft: Uint8Array, nLeft: number) {
  const L: Int32Array[] = [];
  const R: Int32Array[] = [];
  for (const ord of orders) {
    const l = new Int32Array(nLeft);
    const r = new Int32Array(ord.length - nLeft);
    let a = 0, b = 0;
    for (let k = 0; k < ord.length; k++) {
      const i = ord[k];
      if (goLeft[i]) l[a++] = i;
      else r[b++] = i;
    }
    L.push(l);
    R.push(r);
  }
  return [L, R] as const;
}

/**
 * CART classification tree with Gini impurity (Breiman et al., 1984).
 * Splits are x_j ≤ t with t at the midpoint between adjacent distinct values.
 */
export function fitTree(X: number[][], y: number[], opts: TreeOptions = {}, rows?: number[]): TreeNode {
  const { maxDepth = 4, minSamplesLeaf = 5, mtry, rng } = opts;
  const p = X[0].length;
  const goLeft = new Uint8Array(X.length);
  let nextId = 0;
  const build = (orders: Int32Array[], depth: number): TreeNode => {
    const idx = orders[0];
    const n = idx.length;
    let nPos = 0;
    for (let k = 0; k < n; k++) nPos += y[idx[k]];
    const node: TreeNode = { id: nextId++, depth, n, nPos, value: nPos / n, impurity: gini(nPos, n) };
    if (depth >= maxDepth || n < 2 * minSamplesLeaf || nPos === 0 || nPos === n) return node;
    let features = Array.from({ length: p }, (_, j) => j);
    if (mtry && mtry < p && rng) features = rng.shuffle(features).slice(0, mtry);
    let best = { gain: 1e-12, feature: -1, threshold: 0, nLeft: 0 };
    const parent = node.impurity * n;
    for (const j of features) {
      const order = orders[j];
      let lPos = 0;
      for (let k = 0; k < n - 1; k++) {
        lPos += y[order[k]];
        const nl = k + 1;
        const v = X[order[k]][j];
        const vNext = X[order[k + 1]][j];
        if (v === vNext || nl < minSamplesLeaf || n - nl < minSamplesLeaf) continue;
        const child = gini(lPos, nl) * nl + gini(nPos - lPos, n - nl) * (n - nl);
        const gain = (parent - child) / n;
        if (gain > best.gain) best = { gain, feature: j, threshold: (v + vNext) / 2, nLeft: nl };
      }
    }
    if (best.feature < 0) return node;
    for (let k = 0; k < n; k++) goLeft[idx[k]] = X[idx[k]][best.feature] <= best.threshold ? 1 : 0;
    const [L, R] = partition(orders, goLeft, best.nLeft);
    node.feature = best.feature;
    node.threshold = best.threshold;
    node.gain = best.gain * n;
    node.left = build(L, depth + 1);
    node.right = build(R, depth + 1);
    return node;
  };
  return build(presort(X, rows ?? Array.from({ length: y.length }, (_, i) => i)), 0);
}

export function predictTree(node: TreeNode, x: number[]): number {
  let cur = node;
  while (cur.left && cur.right && cur.feature !== undefined) cur = x[cur.feature] <= cur.threshold! ? cur.left : cur.right;
  return cur.value;
}

export function countLeaves(node: TreeNode): number {
  return node.left && node.right ? countLeaves(node.left) + countLeaves(node.right) : 1;
}

/**
 * Regression tree on gradients for logistic gradient boosting.
 * Split criterion: gain G_L²/n_L + G_R²/n_R − G²/n; leaf value: Newton step Σg / Σh.
 * `globalOrders` are presorted orders of all rows; `inSample` marks the rows used this round.
 */
export function fitBoostTree(
  X: number[][],
  g: number[],
  h: number[],
  globalOrders: Int32Array[],
  inSample: Uint8Array,
  nIn: number,
  maxDepth: number,
  minSamplesLeaf: number
): TreeNode {
  const p = X[0].length;
  const goLeft = new Uint8Array(X.length);
  let nextId = 0;
  const orders0 = globalOrders.map((ord) => {
    const out = new Int32Array(nIn);
    let a = 0;
    for (let k = 0; k < ord.length; k++) if (inSample[ord[k]]) out[a++] = ord[k];
    return out;
  });
  const build = (orders: Int32Array[], depth: number): TreeNode => {
    const idx = orders[0];
    const n = idx.length;
    let G = 0, Hs = 0;
    for (let k = 0; k < n; k++) {
      G += g[idx[k]];
      Hs += h[idx[k]];
    }
    const node: TreeNode = { id: nextId++, depth, n, nPos: 0, value: Math.max(-4, Math.min(4, G / Math.max(Hs, 1e-9))), impurity: 0 };
    if (depth >= maxDepth || n < 2 * minSamplesLeaf) return node;
    let best = { gain: 1e-12, feature: -1, threshold: 0, nLeft: 0 };
    const parentScore = (G * G) / n;
    for (let j = 0; j < p; j++) {
      const order = orders[j];
      let GL = 0;
      for (let k = 0; k < n - 1; k++) {
        GL += g[order[k]];
        const nl = k + 1;
        const v = X[order[k]][j];
        const vNext = X[order[k + 1]][j];
        if (v === vNext || nl < minSamplesLeaf || n - nl < minSamplesLeaf) continue;
        const GR = G - GL;
        const gain = (GL * GL) / nl + (GR * GR) / (n - nl) - parentScore;
        if (gain > best.gain) best = { gain, feature: j, threshold: (v + vNext) / 2, nLeft: nl };
      }
    }
    if (best.feature < 0) return node;
    for (let k = 0; k < n; k++) goLeft[idx[k]] = X[idx[k]][best.feature] <= best.threshold ? 1 : 0;
    const [L, R] = partition(orders, goLeft, best.nLeft);
    node.feature = best.feature;
    node.threshold = best.threshold;
    node.gain = best.gain;
    node.left = build(L, depth + 1);
    node.right = build(R, depth + 1);
    return node;
  };
  return build(orders0, 0);
}

export { presort };
