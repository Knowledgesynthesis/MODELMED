import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { modules } from '@/content/modules';
import { TRACKS, type Track } from '@/content/types';
import { useProgress, moduleStatus } from '@/stores/progress';
import { Badge } from '@/components/ui/Badge';

export function CurriculumPage() {
  const st = useProgress();
  const total = modules.reduce((s, m) => s + m.minutes, 0);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
      <p className="mt-2 text-muted-foreground">
        {modules.length} modules · about {Math.round(total / 60)} hours of focused study plus labs. Objectives are written so you can test yourself against them.
      </p>
      {(Object.keys(TRACKS) as Track[]).map((t, i) => (
        <section key={t} className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Track {i + 1}</div>
          <h2 className="text-xl font-semibold">{TRACKS[t].title}</h2>
          <div className="mt-4 space-y-4">
            {modules
              .filter((m) => m.track === t)
              .map((m) => {
                const s = moduleStatus(m.id, m.sections.length, st);
                return (
                  <Link key={m.id} to={`/module/${m.id}`} className="block rounded-xl border bg-card p-5 transition-colors hover:border-primary">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Module {m.number}</span>
                      {s.mastered ? (
                        <Badge tone="success">
                          <CheckCircle2 className="h-3 w-3" /> Mastered
                        </Badge>
                      ) : s.started ? (
                        <Badge tone="primary">{Math.round(s.pctRead * 100)}% read</Badge>
                      ) : null}
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {m.minutes} min
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">{m.title}</h3>
                    <p className="text-sm text-muted-foreground">{m.tagline}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                      {m.objectives.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
