import { Suspense } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Wrench } from 'lucide-react';
import { LABS, labById } from '@/labs/registry';
import { moduleById } from '@/content/modules';
import { useProgress } from '@/stores/progress';

export function LabsPage() {
  const visited = useProgress((s) => s.labs);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Interactive labs</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Each lab computes its results from data or exact formulas — nothing is pre-drawn. Every lab has guided experiments and appears inside its module.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((l) => {
          const m = moduleById(l.module);
          return (
            <Link key={l.id} to={`/labs/${l.id}`} className="group flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary">
              <div className="flex items-center justify-between">
                <Wrench className="h-5 w-5 text-primary" />
                {visited.includes(l.id) && <CheckCircle2 className="h-4 w-4 text-success" aria-label="visited" />}
              </div>
              <div className="mt-3 font-semibold group-hover:text-primary">{l.title}</div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{l.summary}</p>
              {m && <div className="mt-3 text-xs text-muted-foreground">Module {m.number} · {m.title}</div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function LabPage() {
  const { labId = '' } = useParams();
  const lab = labById(labId);
  if (!lab) return <Navigate to="/labs" replace />;
  const m = moduleById(lab.module);
  const C = lab.component;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to="/labs" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All labs
        </Link>
        {m && (
          <Link to={`/module/${m.id}`} className="font-medium text-primary">
            Read the lesson: Module {m.number} →
          </Link>
        )}
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border bg-muted/40" />}>
        <C />
      </Suspense>
    </div>
  );
}
