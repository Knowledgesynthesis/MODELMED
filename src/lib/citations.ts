import { referenceMap } from '@/content/references';

/** Turn [@key] or [@key1; @key2] into markdown links pointing at the bibliography. */
export function linkCitations(md: string) {
  return md.replace(/\[@([\w-]+(?:\s*;\s*@[\w-]+)*)\]/g, (_, group: string) =>
    group
      .split(/\s*;\s*/)
      .map((k) => {
        const key = k.replace(/^@/, '');
        const r = referenceMap[key];
        return r ? `[${r.short}](/references#${key} "cite")` : `[?${key}]`;
      })
      .join(' ')
  );
}

export function citedKeys(md: string): string[] {
  const out = new Set<string>();
  for (const m of md.matchAll(/@([\w-]+)/g)) if (referenceMap[m[1]]) out.add(m[1]);
  return [...out];
}
