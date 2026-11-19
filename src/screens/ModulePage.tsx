import { Suspense, useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Target } from 'lucide-react';
import { moduleById, nextModule, prevModule } from '@/content/modules';
import { questionById, questionsByModule } from '@/content/questions';
import { referenceMap, refUrl } from '@/content/references';
import type { Block, Section } from '@/content/types';
import { Markdown } from '@/components/Markdown';
import { citedKeys } from '@/lib/citations';
import { Callout } from '@/components/Callout';
import { QuestionCard, QuizSet } from '@/components/Quiz';
import { labById } from '@/labs/registry';
import { useProgress, moduleStatus } from '@/stores/progress';
import { TRACKS } from '@/content/types';
import { cn } from '@/lib/utils';

function LabSlot({ id }: { id: string }) {
  const lab = labById(id);
  if (!lab) return null;
  const C = lab.component;
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border bg-muted/40" aria-label="Loading lab" />}>
      <C />
    </Suspense>
  );
}

function BlockView({ b }: { b: Block }) {
  if (b.type === 'md') return <Markdown md={b.md} />;
  if (b.type === 'callout') return <Callout tone={b.tone} title={b.title} md={b.md} />;
  if (b.type === 'lab') return <LabSlot id={b.lab} />;
  const q = questionById(b.id);
  return q ? (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check your understanding</div>
      <QuestionCard q={q} compact />
    </div>
  ) : null;
}

function SectionView({ moduleId, s, i }: { moduleId: string; s: Section; i: number }) {
  const markRead = useProgress((st) => st.markRead);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = end.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && markRead(moduleId, s.id), { rootMargin: '0px 0px -20% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [moduleId, s.id, markRead]);
  return (
    <section id={s.id} className="scroll-mt-20">
      <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight sm:text-2xl">
        <span className="tabular text-base font-semibold text-primary">{i + 1}</span>
        {s.title}
      </h2>
      <div className="mt-4 space-y-6">
        {s.blocks.map((b, k) => (
          <BlockView key={k} b={b} />
        ))}
      </div>
      <div ref={end} aria-hidden className="h-px" />
    </section>
  );
}

export function ModulePage() {
  const { moduleId = '' } = useParams();
  const m = moduleById(moduleId);
  const st = useProgress();
  if (!m) return <Navigate to="/curriculum" replace />;
  const status = moduleStatus(m.id, m.sections.length, st);
  const read = st.read[m.id] ?? [];
  const prev = prevModule(m.id);
  const next = nextModule(m.id);
  const allMd = m.sections.flatMap((s) => s.blocks.map((b) => (b.type === 'md' || b.type === 'callout' ? b.md : ''))).join('\n');
  const cites = citedKeys(allMd);
  const quiz = questionsByModule(m.id);

  return (
    <article className="mx-auto max-w-4xl px-4 py-6 sm:px-8 lg:py-10">
      <header>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">
            Module {m.number} · {TRACKS[m.track].title}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {m.minutes} min
          </span>
          {status.mastered && (
            <span className="inline-flex items-center gap-1 font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Mastered
            </span>
          )}
        </div>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{m.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{m.tagline}</p>
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" /> By the end you will be able to
          </div>
          <ul className="list-disc space-y-1 pl-5 text-[15px]">
            {m.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
        <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-2">
          {m.sections.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={cn('rounded-full border px-3 py-1 text-xs font-medium hover:border-primary', read.includes(s.id) && 'border-primary/40 bg-primary/10 text-primary')}>
              {i + 1}. {s.title}
            </a>
          ))}
          <a href="#mastery" className="rounded-full border px-3 py-1 text-xs font-medium hover:border-primary">
            Mastery check
          </a>
        </nav>
      </header>

      <div className="mt-10 space-y-14">
        {m.sections.map((s, i) => (
          <SectionView key={s.id} moduleId={m.id} s={s} i={i} />
        ))}
      </div>

      <section className="mt-14 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Key takeaways</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          {m.takeaways.map((t) => (
            <li key={t} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <div id="mastery" className="mt-14 scroll-mt-20">
        <QuizSet questions={quiz} moduleId={m.id} />
      </div>

      {cites.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">References cited in this module</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {cites.map((k) => {
              const r = referenceMap[k];
              return (
                <li key={k}>
                  <span className="text-muted-foreground">{r.citation}</span>{' '}
                  <a href={refUrl(r)} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                    {r.title}
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <nav className="mt-14 grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Module navigation">
        {prev ? (
          <Link to={`/module/${prev.id}`} className="rounded-xl border p-4 hover:border-primary">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Previous
            </div>
            <div className="font-medium">
              {prev.number}. {prev.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link to={`/module/${next.id}`} className="rounded-xl border p-4 text-right hover:border-primary">
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next <ArrowRight className="h-3 w-3" />
            </div>
            <div className="font-medium">
              {next.number}. {next.title}
            </div>
          </Link>
        ) : (
          <Link to="/sandbox" className="rounded-xl border p-4 text-right hover:border-primary">
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Capstone <ArrowRight className="h-3 w-3" />
            </div>
            <div className="font-medium">Model sandbox</div>
          </Link>
        )}
      </nav>
    </article>
  );
}
