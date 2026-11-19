import { Rng } from '../stats/random';
import { expit } from '../stats/core';

export type Activation = 'relu' | 'tanh';

/** A tiny 2-layer neural network (inputs → hidden → sigmoid) trained with full-batch Adam. */
export class TinyMLP {
  W1: number[][];
  b1: number[];
  W2: number[];
  b2 = 0;
  private m: number[] = [];
  private v: number[] = [];
  private t = 0;

  constructor(public nIn: number, public nHidden: number, public act: Activation = 'tanh', seed = 1) {
    const rng = new Rng(seed);
    const s1 = Math.sqrt(2 / (nIn + nHidden));
    this.W1 = Array.from({ length: nHidden }, () => Array.from({ length: nIn }, () => rng.normal(0, s1)));
    this.b1 = new Array(nHidden).fill(0);
    this.W2 = Array.from({ length: nHidden }, () => rng.normal(0, Math.sqrt(1 / nHidden)));
  }

  private a(z: number) {
    return this.act === 'relu' ? Math.max(0, z) : Math.tanh(z);
  }
  private da(z: number, a: number) {
    return this.act === 'relu' ? (z > 0 ? 1 : 0) : 1 - a * a;
  }

  predictOne(x: number[]): number {
    let out = this.b2;
    for (let h = 0; h < this.nHidden; h++) {
      let z = this.b1[h];
      for (let i = 0; i < this.nIn; i++) z += this.W1[h][i] * x[i];
      out += this.W2[h] * this.a(z);
    }
    return expit(out);
  }

  predict(X: number[][]) {
    return X.map((x) => this.predictOne(x));
  }

  /** One Adam step on mean log-loss + L2 penalty. Returns the training loss before the step. */
  step(X: number[][], y: number[], lr = 0.03, l2 = 0) {
    const H = this.nHidden, I = this.nIn, n = X.length;
    const gW1 = Array.from({ length: H }, () => new Array(I).fill(0));
    const gb1 = new Array(H).fill(0);
    const gW2 = new Array(H).fill(0);
    let gb2 = 0;
    let loss = 0;
    const z = new Array(H);
    const a = new Array(H);
    for (let k = 0; k < n; k++) {
      const x = X[k];
      let o = this.b2;
      for (let h = 0; h < H; h++) {
        let s = this.b1[h];
        for (let i = 0; i < I; i++) s += this.W1[h][i] * x[i];
        z[h] = s;
        a[h] = this.a(s);
        o += this.W2[h] * a[h];
      }
      const p = expit(o);
      loss -= y[k] * Math.log(Math.max(p, 1e-12)) + (1 - y[k]) * Math.log(Math.max(1 - p, 1e-12));
      const d = p - y[k];
      gb2 += d;
      for (let h = 0; h < H; h++) {
        gW2[h] += d * a[h];
        const dh = d * this.W2[h] * this.da(z[h], a[h]);
        gb1[h] += dh;
        for (let i = 0; i < I; i++) gW1[h][i] += dh * x[i];
      }
    }
    // flatten params & grads
    const params: number[] = [];
    const grads: number[] = [];
    for (let h = 0; h < H; h++) {
      for (let i = 0; i < I; i++) {
        params.push(this.W1[h][i]);
        grads.push(gW1[h][i] / n + l2 * this.W1[h][i]);
      }
      params.push(this.b1[h]);
      grads.push(gb1[h] / n);
      params.push(this.W2[h]);
      grads.push(gW2[h] / n + l2 * this.W2[h]);
    }
    params.push(this.b2);
    grads.push(gb2 / n);
    if (!this.m.length) {
      this.m = new Array(params.length).fill(0);
      this.v = new Array(params.length).fill(0);
    }
    this.t++;
    const b1 = 0.9, b2 = 0.999;
    for (let k = 0; k < params.length; k++) {
      this.m[k] = b1 * this.m[k] + (1 - b1) * grads[k];
      this.v[k] = b2 * this.v[k] + (1 - b2) * grads[k] ** 2;
      const mh = this.m[k] / (1 - b1 ** this.t);
      const vh = this.v[k] / (1 - b2 ** this.t);
      params[k] -= (lr * mh) / (Math.sqrt(vh) + 1e-8);
    }
    let k = 0;
    for (let h = 0; h < H; h++) {
      for (let i = 0; i < I; i++) this.W1[h][i] = params[k++];
      this.b1[h] = params[k++];
      this.W2[h] = params[k++];
    }
    this.b2 = params[k];
    return loss / n;
  }
}
