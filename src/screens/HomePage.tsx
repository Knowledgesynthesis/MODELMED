import { ArrowRight, BookOpenCheck, ClipboardCheck, FlaskConical, GraduationCap, Library, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { modules } from '@/content/modules';
import { TRACKS, type Track } from '@/content/types';
import { LABS } from '@/labs/registry';
import { questions } from '@/content/questions';
import { references } from '@/content/references';
import { useProgress, moduleStatus } from '@/stores/progress';
import { LinkButton } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const TEN_QUESTIONS = [
  ['Question', 'Is the population, moment of prediction, outcome and horizon clearly defined — and is it my question?'],
  ['Data', 'Do the data resemble my patients and how we measure things? Was anything recorded after the prediction time?'],
  ['Size', 'Was the sample large enough for the number of candidate parameters (Riley criteria)?'],
  ['Methods', 'Were continuous predictors kept continuous, missing data handled properly, and selection avoided or penalised?'],
  ['Validation', 'Was optimism corrected with every step repeated, and was the model externally validated — temporally or geographically?'],
  ['Discrimination', 'What is the AUC with its CI, and how does the model perform at the threshold I would use?'],
  ['Calibration', 'Are the risks right? Calibration plot, intercept and slope — in a population like mine?'],
  ['Utility', 'Does it add net benefit over treat-all/treat-none across sensible thresholds? What is the alert burden?'],
  ['Equity', 'Is performance (calibration and errors) consistent across relevant subgroups? Is the label itself fair?'],
  ['Impact & monitoring', 'Is there evidence that using it improves outcomes, and a plan to monitor and update it?'],
];

export function HomePage() {
  const st = useProgress();
  const mastered = modules.filter((m) => moduleStatus(m.id, m.sections.length, st).mastered).length;
  const next = modules.find((m) => !moduleStatus(m.id, m.sections.length, st).mastered) ?? modules[0];
  const started = modules.some((m) => moduleStatus(m.id, m.sections.length, st).started);
  const tracks = Object.keys(TRACKS) as Track[];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-10 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Clinical prediction models & machine learning, for clinicians</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Understand, build and critically appraise the models that are reshaping clinical decisions.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {modules.length} evidence-based modules — from prediction to causal inference — {LABS.length} live labs that compute everything from real data, and a full development-to-validation sandbox. Built on TRIPOD+AI, PROBAST+AI, TARGET and the methods literature — current to 2026.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton to={`/module/${next.id}`} size="lg">
              {started ? 'Continue' : 'Start learning'} <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton to="/sandbox" variant="outline" size="lg">
              <FlaskConical className="h-4 w-4" /> Open the sandbox
            </LinkButton>
          </div>
          {started && (
            <p className="mt-4 text-sm text-muted-foreground">
              {mastered} of {modules.length} modules mastered · next: <Link className="font-medium text-primary underline" to={`/module/${next.id}`}>{next.number}. {next.title}</Link>
            </p>
          )}
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Modules', modules.length],
            ['Interactive labs', LABS.length],
            ['Assessment items', questions.length],
            ['Cited sources', references.length],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-card p-4">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-6">
        <h2 className="text-2xl font-bold tracking-tight">The learning path</h2>
        <p className="mt-1 text-muted-foreground">Each module ends with a mastery check (≥ 80%). Modules can be taken in any order, but the sequence builds.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {tracks.map((t, ti) => (
            <div key={t} className="rounded-2xl border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Track {ti + 1}</div>
              <h3 className="mt-0.5 text-lg font-semibold">{TRACKS[t].title}</h3>
              <p className="text-sm text-muted-foreground">{TRACKS[t].blurb}</p>
              <ul className="mt-4 space-y-2">
                {modules
                  .filter((m) => m.track === t)
                  .map((m) => {
                    const s = moduleStatus(m.id, m.sections.length, st);
                    return (
                      <li key={m.id}>
                        <Link to={`/module/${m.id}`} className="group flex items-start gap-3 rounded-xl p-2 hover:bg-muted">
                          <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', s.mastered ? 'bg-success text-white' : s.started ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>{m.number}</span>
                          <span className="min-w-0">
                            <span className="block font-medium group-hover:text-primary">{m.title}</span>
                            <span className="block text-sm text-muted-foreground">{m.tagline}</span>
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{m.minutes} min</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BookOpenCheck className="h-4 w-4" /> The bedside appraisal
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Ten questions for any clinical prediction model</h2>
          <p className="mt-1 max-w-3xl text-muted-foreground">Whether it is a published score, a vendor’s sepsis alert or an LLM tool, these questions — each taught in the curriculum — decide whether its numbers deserve your trust.</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {TEN_QUESTIONS.map(([k, v], i) => (
              <li key={k} className="flex gap-3 rounded-xl bg-background/70 p-3">
                <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span className="text-sm">
                  <b>{k}.</b> {v}
                </span>
              </li>
            ))}
          </ol>
          <LinkButton to="/appraise" variant="outline" className="mt-6">
            <ClipboardCheck className="h-4 w-4" /> Appraise a real model with the checklist
          </LinkButton>
        </div>
      </section>

      <section className="py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Learn by doing</h2>
            <p className="mt-1 text-muted-foreground">Every chart is computed live from data — move a slider and the mathematics updates.</p>
          </div>
          <Link to="/labs" className="hidden text-sm font-medium text-primary sm:block">
            All labs →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LABS.filter((l) => ['leakage', 'calibration', 'dca', 'fairness', 'shap', 'drift'].includes(l.id)).map((l) => (
            <Link key={l.id} to={`/labs/${l.id}`} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary">
              <Wrench className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold group-hover:text-primary">{l.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{l.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 py-10 sm:grid-cols-3">
        {[
          { to: '/sandbox', icon: FlaskConical, t: 'Model sandbox', d: 'Develop five model types on synthetic cohorts with known true risk; validate, calibrate, explain, audit.' },
          { to: '/exam', icon: GraduationCap, t: 'Exam & review', d: `${questions.length} case-based items with rationales and citations. Mixed exams and targeted review.` },
          { to: '/references', icon: Library, t: 'Evidence base', d: `${references.length} sources — reporting standards, methods papers, landmark evaluations and 2026 regulation.` },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-xl border bg-card p-5 hover:border-primary">
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-semibold group-hover:text-primary">{c.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
