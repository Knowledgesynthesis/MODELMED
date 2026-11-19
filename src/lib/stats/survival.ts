import { chiSq1P, normInv } from './core';

export interface KmStep {
  time: number;
  atRisk: number;
  events: number;
  censored: number;
  survival: number;
  se: number;
  lo: number;
  hi: number;
}

/**
 * Kaplan–Meier product-limit estimator (Kaplan & Meier, JASA 1958) with Greenwood variance and
 * log(−log) confidence limits. Censored at time t are assumed still at risk at t (standard convention).
 */
export function kaplanMeier(times: number[], events: (0 | 1)[], level = 0.95): KmStep[] {
  const z = normInv(1 - (1 - level) / 2);
  const uniq = [...new Set(times)].sort((a, b) => a - b);
  let S = 1;
  let greenwood = 0;
  const steps: KmStep[] = [{ time: 0, atRisk: times.length, events: 0, censored: 0, survival: 1, se: 0, lo: 1, hi: 1 }];
  for (const t of uniq) {
    let d = 0, c = 0, atRisk = 0;
    for (let i = 0; i < times.length; i++) {
      if (times[i] >= t) atRisk++;
      if (times[i] === t) (events[i] ? d++ : c++);
    }
    if (d > 0) {
      S *= 1 - d / atRisk;
      if (atRisk > d) greenwood += d / (atRisk * (atRisk - d));
    }
    const se = S * Math.sqrt(greenwood);
    let lo = S, hi = S;
    if (S > 0 && S < 1) {
      const sll = Math.sqrt(greenwood) / Math.abs(Math.log(S));
      lo = Math.pow(S, Math.exp(z * sll));
      hi = Math.pow(S, Math.exp(-z * sll));
    }
    steps.push({ time: t, atRisk, events: d, censored: c, survival: S, se, lo, hi });
  }
  return steps;
}

export function medianSurvival(steps: KmStep[]): number | null {
  const s = steps.find((x) => x.survival <= 0.5);
  return s ? s.time : null;
}

export function survivalAt(steps: KmStep[], t: number): number {
  let s = 1;
  for (const st of steps) if (st.time <= t) s = st.survival;
  return s;
}

/** Two-group log-rank test (Mantel 1966). */
export function logRank(times: number[], events: (0 | 1)[], group: (0 | 1)[]) {
  const uniq = [...new Set(times.filter((_, i) => events[i]))].sort((a, b) => a - b);
  let O1 = 0, E1 = 0, V = 0;
  for (const t of uniq) {
    let n = 0, n1 = 0, d = 0, d1 = 0;
    for (let i = 0; i < times.length; i++) {
      if (times[i] >= t) {
        n++;
        if (group[i]) n1++;
      }
      if (times[i] === t && events[i]) {
        d++;
        if (group[i]) d1++;
      }
    }
    O1 += d1;
    E1 += (d * n1) / n;
    if (n > 1) V += (d * (n1 / n) * (1 - n1 / n) * (n - d)) / (n - 1);
  }
  const chi2 = V > 0 ? (O1 - E1) ** 2 / V : 0;
  return { observed: O1, expected: E1, chi2, p: chiSq1P(chi2) };
}

/** Harrell's C-index for right-censored data (Harrell et al., JAMA 1982). Higher risk score = earlier event. */
export function harrellC(times: number[], events: (0 | 1)[], risk: number[]): number {
  let conc = 0, usable = 0;
  for (let i = 0; i < times.length; i++) {
    if (!events[i]) continue;
    for (let j = 0; j < times.length; j++) {
      if (times[j] > times[i]) {
        usable++;
        if (risk[i] > risk[j]) conc++;
        else if (risk[i] === risk[j]) conc += 0.5;
      }
    }
  }
  return usable ? conc / usable : NaN;
}
