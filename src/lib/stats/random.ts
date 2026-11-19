/** Deterministic, seedable pseudo-random numbers so every lab is reproducible. */
export class Rng {
  private s: number;
  private spare: number | null = null;

  constructor(seed = 42) {
    this.s = seed >>> 0 || 1;
  }

  /** Uniform [0, 1) — mulberry32. */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  uniform(a = 0, b = 1): number {
    return a + (b - a) * this.next();
  }

  /** Standard normal via Marsaglia polar method. */
  normal(mean = 0, sd = 1): number {
    if (this.spare !== null) {
      const v = this.spare;
      this.spare = null;
      return mean + sd * v;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = this.next() * 2 - 1;
      v = this.next() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    this.spare = v * m;
    return mean + sd * u * m;
  }

  bernoulli(p: number): 0 | 1 {
    return this.next() < p ? 1 : 0;
  }

  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  poisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > L);
    return k - 1;
  }

  exponential(rate: number): number {
    return -Math.log(1 - this.next()) / rate;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
