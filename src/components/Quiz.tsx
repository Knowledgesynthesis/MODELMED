import { useMemo, useState } from 'react';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import type { Question } from '@/content/types';
import { referenceMap } from '@/content/references';
import { useProgress, MASTERY } from '@/stores/progress';
import { Markdown } from './Markdown';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';
import { Rng } from '@/lib/stats/random';
import { Link } from 'react-router-dom';

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Options are shuffled deterministically per question (and per attempt) so answer position carries no signal. */
function useOrder(q: Question, salt = 0) {
  return useMemo(() => new Rng(hash(q.id) + salt * 977).shuffle(q.options.map((_, i) => i)), [q, salt]);
}

export function QuestionCard({
  q,
  index,
  onAnswered,
  salt = 0,
  compact,
}: {
  q: Question;
  index?: number;
  onAnswered?: (correct: boolean) => void;
  salt?: number;
  compact?: boolean;
}) {
  const order = useOrder(q, salt);
  const [picked, setPicked] = useState<number | null>(null);
  const record = useProgress((s) => s.recordAnswer);
  const done = picked !== null;
  const correct = picked === q.answer;
  const choose = (i: number) => {
    if (done) return;
    setPicked(i);
    record(q.id, i === q.answer);
    onAnswered?.(i === q.answer);
  };
  return (
    <div className={cn('rounded-xl border bg-card p-4 sm:p-5', compact && 'bg-muted/30')}>
      <div className="mb-3 flex items-start gap-2">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="text-[15px] font-medium leading-6">
          {index !== undefined && <span className="mr-1 text-muted-foreground">{index + 1}.</span>}
          {q.stem}
        </div>
      </div>
      <div className="grid gap-2" role="radiogroup" aria-label="Answer options">
        {order.map((oi, k) => {
          const isAns = oi === q.answer;
          const isPicked = oi === picked;
          return (
            <button
              key={oi}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={done}
              onClick={() => choose(oi)}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                !done && 'hover:border-primary hover:bg-accent',
                done && isAns && 'border-success bg-success/10',
                done && isPicked && !isAns && 'border-destructive bg-destructive/10',
                done && !isAns && !isPicked && 'opacity-60'
              )}
            >
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">{String.fromCharCode(65 + k)}</span>
              <span className="flex-1">{q.options[oi]}</span>
              {done && isAns && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="correct answer" />}
              {done && isPicked && !isAns && <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-label="your answer" />}
            </button>
          );
        })}
      </div>
      {done && (
        <div className={cn('mt-3 rounded-lg p-3 text-sm', correct ? 'bg-success/10' : 'bg-destructive/10')} aria-live="polite">
          <div className="mb-1 font-semibold">{correct ? 'Correct.' : 'Not quite.'}</div>
          <Markdown md={q.explanation} className="text-sm leading-6" />
          {q.refs?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {q.refs.map((r) => (
                <Link key={r} to={`/references#${r}`} className="cite">
                  {referenceMap[r]?.short ?? r}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function QuizSet({ questions, moduleId, title = 'Mastery check' }: { questions: Question[]; moduleId?: string; title?: string }) {
  const [attempt, setAttempt] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const best = useProgress((s) => (moduleId ? s.quizzes[moduleId]?.best : undefined));
  const answered = Object.keys(results).length;
  const score = answered ? Object.values(results).filter(Boolean).length / questions.length : 0;
  const finished = answered === questions.length;
  const onAnswer = (id: string, ok: boolean) => {
    setResults((r) => {
      const next = { ...r, [id]: ok };
      if (Object.keys(next).length === questions.length && moduleId) recordQuiz(moduleId, Object.values(next).filter(Boolean).length / questions.length);
      return next;
    });
  };
  return (
    <section aria-label={title} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {questions.length} questions · mastery = {Math.round(MASTERY * 100)}%{best !== undefined ? ` · your best ${Math.round(best * 100)}%` : ''}
          </p>
        </div>
        {answered > 0 && (
          <div className="text-sm font-medium tabular">
            {answered}/{questions.length} answered
          </div>
        )}
      </div>
      {questions.map((q, i) => (
        <QuestionCard key={`${q.id}-${attempt}`} q={q} index={i} salt={attempt} onAnswered={(ok) => onAnswer(q.id, ok)} />
      ))}
      {finished && (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4', score >= MASTERY ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10')}>
          <div>
            <div className="text-lg font-semibold">
              Score {Math.round(score * 100)}% — {score >= MASTERY ? 'mastered' : 'review and retry'}
            </div>
            <p className="text-sm text-muted-foreground">{score >= MASTERY ? 'This module is marked as mastered.' : 'Re-read the sections behind the questions you missed, then retry (options are reshuffled).'}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setResults({});
              setAttempt((a) => a + 1);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}
    </section>
  );
}
