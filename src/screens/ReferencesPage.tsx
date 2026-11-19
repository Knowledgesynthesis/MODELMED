import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink, Search } from 'lucide-react';
import { references, refUrl, type Reference } from '@/content/references';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const KINDS: Record<Reference['kind'], string> = {
  guideline: 'Reporting & appraisal standards',
  methods: 'Methods',
  evidence: 'Empirical evidence & case studies',
  regulation: 'Regulation & policy (status as of November 2026)',
  book: 'Textbooks',
};

export function ReferencesPage() {
  const [q, setQ] = useState('');
  const { hash } = useLocation();
  const target = hash.slice(1);
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    return () => clearTimeout(t);
  }, [target]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return references.filter((r) => !s || `${r.title} ${r.citation} ${r.note ?? ''}`.toLowerCase().includes(s));
  }, [q]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Evidence base</h1>
      <p className="mt-2 text-muted-foreground">
        Every claim in the curriculum is tied to one of these {references.length} sources. DOIs were checked against Crossref; regulatory entries summarise the position as of November 2026 and change — follow the links for the current text.
      </p>
      <label className="relative mt-6 block">
        <span className="sr-only">Search references</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by author, title or topic…" className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm" />
      </label>
      {(Object.keys(KINDS) as Reference['kind'][]).map((k) => {
        const rs = filtered.filter((r) => r.kind === k);
        if (!rs.length) return null;
        return (
          <section key={k} className="mt-10">
            <h2 className="text-lg font-semibold">{KINDS[k]}</h2>
            <ul className="mt-3 space-y-2">
              {rs.map((r) => (
                <li key={r.id} id={r.id} className={cn('scroll-mt-24 rounded-xl border p-4 transition-colors', target === r.id && 'border-primary bg-primary/5 ring-2 ring-primary/30')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{r.short}</Badge>
                  </div>
                  <a href={refUrl(r)} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-start gap-1 font-medium hover:text-primary">
                    {r.title} <ExternalLink className="mt-1 h-3 w-3 shrink-0" />
                  </a>
                  <div className="text-sm text-muted-foreground">
                    {r.citation}
                    {r.doi && <span> doi:{r.doi}</span>}
                  </div>
                  {r.note && <p className="mt-1 text-sm">{r.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
