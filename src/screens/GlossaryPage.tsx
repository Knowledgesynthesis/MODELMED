import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { glossary } from '@/content/glossary';
import { moduleById } from '@/content/modules';
import { Markdown } from '@/components/Markdown';

export function GlossaryPage() {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...glossary].sort((a, b) => a.term.localeCompare(b.term)).filter((g) => !s || g.term.toLowerCase().includes(s) || g.definition.toLowerCase().includes(s));
  }, [q]);
  const letters = [...new Set(items.map((i) => i.term[0].toUpperCase()))];
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Glossary</h1>
      <p className="mt-2 text-muted-foreground">{glossary.length} terms with formulas, each linked to the module that teaches it.</p>
      <div className="sticky top-14 z-10 -mx-4 mt-6 bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <label className="relative block">
          <span className="sr-only">Search glossary</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms or definitions…" className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="rounded px-1.5 py-0.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              {l}
            </a>
          ))}
        </div>
      </div>
      <dl className="mt-4 divide-y">
        {items.map((g, i) => {
          const m = g.module ? moduleById(g.module) : undefined;
          const first = i === 0 || items[i - 1].term[0].toUpperCase() !== g.term[0].toUpperCase();
          return (
            <div key={g.term} id={first ? `letter-${g.term[0].toUpperCase()}` : undefined} className="scroll-mt-40 py-4">
              <dt className="font-semibold">{g.term}</dt>
              <dd className="mt-1 text-[15px] text-foreground/90">
                {g.definition}
                {g.formula && <Markdown md={`$$${g.formula}$$`} className="mt-1" />}
                <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {m && (
                    <Link to={`/module/${m.id}`} className="font-medium text-primary">
                      Module {m.number}: {m.title}
                    </Link>
                  )}
                  {g.see?.length ? <span>See also: {g.see.join(', ')}</span> : null}
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
      {items.length === 0 && <p className="py-10 text-center text-muted-foreground">No matching terms.</p>}
    </div>
  );
}
