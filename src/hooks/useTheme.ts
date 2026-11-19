import { useEffect, useState } from 'react';
import { useProgress } from '@/stores/progress';

/** Applies the theme class to <html> and reports the resolved theme. */
export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useProgress((s) => s.theme);
  const [system, setSystem] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  const resolved = mode === 'system' ? system : mode;
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b1120' : '#f8fafc');
  }, [resolved]);
  return resolved;
}
