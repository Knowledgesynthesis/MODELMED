import React, { useEffect } from 'react';
import { Lightbulb, MousePointerClick } from 'lucide-react';
import { useProgress } from '@/stores/progress';
import { Markdown } from '@/components/Markdown';
import { cn } from '@/lib/utils';

export function LabFrame({
  id,
  title,
  goal,
  tryThis,
  insight,
  children,
  compact,
}: {
  id: string;
  title: string;
  goal: string;
  tryThis?: string[];
  insight?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const visit = useProgress((s) => s.visitLab);
  useEffect(() => visit(id), [id, visit]);
  return (
    <section className={cn('rounded-2xl border bg-card shadow-sm', compact ? '' : '')} aria-labelledby={`lab-${id}`}>
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Interactive lab</div>
        <h3 id={`lab-${id}`} className="mt-0.5 text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{goal}</p>
      </header>
      <div className="space-y-6 p-4 sm:p-6">{children}</div>
      {(tryThis?.length || insight) && (
        <footer className="grid gap-4 border-t bg-muted/30 px-4 py-4 sm:px-6 md:grid-cols-2">
          {tryThis?.length ? (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MousePointerClick className="h-4 w-4 text-primary" aria-hidden /> Try this
              </div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm marker:font-semibold marker:text-primary">
                {tryThis.map((t) => (
                  <li key={t}>
                    <Markdown md={t} className="text-sm leading-6 [&>*+*]:mt-1" />
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {insight && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-warning" aria-hidden /> What this shows
              </div>
              <Markdown md={insight} className="text-sm leading-6" />
            </div>
          )}
        </footer>
      )}
    </section>
  );
}

export function Panel({ title, children, className }: { title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-background/50 p-4', className)}>
      {title && <div className="mb-3 text-sm font-semibold">{title}</div>}
      {children}
    </div>
  );
}

export function Presets<T>({ presets, onPick }: { presets: { label: string; value: T }[]; onPick: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="self-center text-xs font-medium text-muted-foreground">Scenarios:</span>
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.value)}
          className="rounded-full border bg-background px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function ConfusionGrid({ tp, fp, fn, tn, scaleTo }: { tp: number; fp: number; fn: number; tn: number; scaleTo?: number }) {
  const n = tp + fp + fn + tn;
  const k = scaleTo ? scaleTo / n : 1;
  const f = (v: number) => (scaleTo ? Math.round(v * k).toLocaleString() : v.toLocaleString());
  const cell = 'rounded-lg p-3 text-center';
  return (
    <div className="text-sm">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5">
        <div />
        <div className="text-center text-xs font-medium text-muted-foreground">Has outcome</div>
        <div className="text-center text-xs font-medium text-muted-foreground">No outcome</div>
        <div className="flex items-center pr-1 text-xs font-medium text-muted-foreground">Flagged</div>
        <div className={cn(cell, 'bg-success/15')}>
          <div className="tabular text-lg font-semibold">{f(tp)}</div>
          <div className="text-xs text-muted-foreground">True positive</div>
        </div>
        <div className={cn(cell, 'bg-warning/15')}>
          <div className="tabular text-lg font-semibold">{f(fp)}</div>
          <div className="text-xs text-muted-foreground">False positive</div>
        </div>
        <div className="flex items-center pr-1 text-xs font-medium text-muted-foreground">Not flagged</div>
        <div className={cn(cell, 'bg-destructive/15')}>
          <div className="tabular text-lg font-semibold">{f(fn)}</div>
          <div className="text-xs text-muted-foreground">False negative</div>
        </div>
        <div className={cn(cell, 'bg-info/10')}>
          <div className="tabular text-lg font-semibold">{f(tn)}</div>
          <div className="text-xs text-muted-foreground">True negative</div>
        </div>
      </div>
      {scaleTo && <p className="mt-2 text-xs text-muted-foreground">Counts per {scaleTo.toLocaleString()} patients.</p>}
    </div>
  );
}
