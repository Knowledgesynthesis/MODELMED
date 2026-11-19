import { useMemo, useState } from 'react';
import { GraduationCap, RotateCcw } from 'lucide-react';
import { questions } from '@/content/questions';
import { modules } from '@/content/modules';
import { QuestionCard } from '@/components/Quiz';
import { Button } from '@/components/ui/Button';
import { Segmented, Select } from '@/components/ui/controls';
import { Stat } from '@/components/ui/Stat';
import { useProgress, MASTERY, moduleStatus } from '@/stores/progress';
import { Rng } from '@/lib/stats/random';
import type { Question } from '@/content/types';
import { cn } from '@/lib/utils';

type Mode = 'mixed' | 'module' | 'review';

export function ExamPage() {
  const st = useProgress();
  const [mode, setMode] = useState<Mode>('mixed');
  const [mod, setMod] = useState(modules[0].id);
  const [length, setLength] = useState<'10' | '20' | '40'>('20');
  const [run, setRun] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const missed = questions.filter((q) => st.answers[q.id] === false);

  const set: Question[] = useMemo(() => {
    const rng = new Rng(1000 + run);
    if (mode === 'module') return questions.filter((q) => q.module === mod);
    if (mode === 'review') return missed;
    return rng.shuffle(questions).slice(0, Number(length));
  }, [mode, mod, length, run]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;
  const done = set.length > 0 && answered === set.length;
  const restart = () => {
    setResults({});
    setRun((r) => r + 1);
  };
  const onAnswer = (id: string, ok: boolean) =>
    setResults((r) => {
      const next = { ...r, [id]: ok };
      if (Object.keys(next).length === set.length && mode === 'mixed') st.recordExam(Object.values(next).filter(Boolean).length / set.length, set.length);
      if (Object.keys(next).length === set.length && mode === 'module') st.recordQuiz(mod, Object.values(next).filter(Boolean).length / set.length);
      return next;
    });

  const firstTry = Object.values(st.answers);
  const firstTryRate = firstTry.length ? firstTry.filter(Boolean).length / firstTry.length : NaN;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <GraduationCap className="h-4 w-4" /> Assessment
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Exam & review</h1>
      <p className="mt-2 text-muted-foreground">Case-based questions spanning calculation, interpretation and critical appraisal. Every answer comes with a rationale and the evidence behind it.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Questions answered" value={`${firstTry.length}/${questions.length}`} />
        <Stat label="Correct first time" value={Number.isFinite(firstTryRate) ? `${Math.round(firstTryRate * 100)}%` : '—'} />
        <Stat label="Modules mastered" value={`${modules.filter((m) => moduleStatus(m.id, m.sections.length, st).mastered).length}/${modules.length}`} />
      </div>

      <div className="mt-6 space-y-4 rounded-xl border bg-card p-5">
        <Segmented
          label="Mode"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setResults({});
          }}
          options={[
            { value: 'mixed', label: 'Mixed exam' },
            { value: 'module', label: 'By module' },
            { value: 'review', label: `Review missed (${missed.length})` },
          ]}
        />
        {mode === 'mixed' && (
          <Segmented label="Length" size="sm" value={length} onChange={(v) => { setLength(v); setResults({}); }} options={[{ value: '10', label: '10' }, { value: '20', label: '20' }, { value: '40', label: '40' }]} />
        )}
        {mode === 'module' && (
          <Select label="Module" value={mod} onChange={(v) => { setMod(v); setResults({}); }} options={modules.map((m) => ({ value: m.id, label: `${m.number}. ${m.title}` }))} />
        )}
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw className="h-4 w-4" /> New set
        </Button>
      </div>

      {st.exams.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Recent mixed exams: {st.exams.slice(-5).map((e) => `${Math.round(e.score * 100)}%`).join(' · ')}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {set.length === 0 && <p className="rounded-xl border p-6 text-center text-muted-foreground">Nothing to review — questions you get wrong on the first attempt will appear here.</p>}
        {set.map((q, i) => (
          <QuestionCard key={`${q.id}-${run}-${mode}`} q={q} index={i} salt={run} onAnswered={(ok) => onAnswer(q.id, ok)} />
        ))}
      </div>

      {done && (
        <div className={cn('sticky bottom-4 mt-6 rounded-xl border p-4 shadow-lg', correct / set.length >= MASTERY ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold">
              {correct}/{set.length} correct ({Math.round((correct / set.length) * 100)}%)
            </div>
            <Button onClick={restart}>
              <RotateCcw className="h-4 w-4" /> Another set
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
