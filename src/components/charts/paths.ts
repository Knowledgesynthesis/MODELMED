import type { Scales } from './Plot';

export const linePath = (pts: [number, number][], s: Pick<Scales, 'x' | 'y'>) =>
  pts.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)).map(([a, b], i) => `${i ? 'L' : 'M'}${s.x(a).toFixed(1)},${s.y(b).toFixed(1)}`).join('');

export const stepPath = (pts: [number, number][], s: Pick<Scales, 'x' | 'y'>) => {
  let d = '';
  pts.forEach(([a, b], i) => {
    if (i === 0) d += `M${s.x(a)},${s.y(b)}`;
    else d += `H${s.x(a)}V${s.y(b)}`;
  });
  return d;
};
