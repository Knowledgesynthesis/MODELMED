import { useProgress } from '@/stores/progress';
import { useEffect, useState } from 'react';

/** Concrete colours for SVG charts (SVG presentation attributes cannot read CSS variables). */
const LIGHT = {
  fg: '#0f172a', muted: '#64748b', grid: '#e2e8f0', bg: '#ffffff',
  a: '#0e7490', b: '#c2410c', c: '#7c3aed', d: '#15803d', e: '#be123c', ref: '#94a3b8',
  pos: '#c2410c', neg: '#0e7490',
};
const DARK = {
  fg: '#e2e8f0', muted: '#94a3b8', grid: '#1e293b', bg: '#0f172a',
  a: '#22d3ee', b: '#fb923c', c: '#a78bfa', d: '#4ade80', e: '#fb7185', ref: '#64748b',
  pos: '#fb923c', neg: '#22d3ee',
};
export type Palette = typeof LIGHT;

export function usePalette(): Palette {
  const mode = useProgress((s) => s.theme);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [mode]);
  return dark ? DARK : LIGHT;
}
