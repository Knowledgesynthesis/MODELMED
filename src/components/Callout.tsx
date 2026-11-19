import { AlertTriangle, BookMarked, FlaskConical, KeyRound, Sigma, Stethoscope } from 'lucide-react';
import type { CalloutTone } from '@/content/types';
import { Markdown } from './Markdown';
import { cn } from '@/lib/utils';

const META: Record<CalloutTone, { icon: typeof KeyRound; cls: string; label: string }> = {
  key: { icon: KeyRound, cls: 'border-primary/30 bg-primary/5', label: 'Key idea' },
  pitfall: { icon: AlertTriangle, cls: 'border-warning/40 bg-warning/5', label: 'Pitfall' },
  clinical: { icon: Stethoscope, cls: 'border-info/30 bg-info/5', label: 'At the bedside' },
  evidence: { icon: BookMarked, cls: 'border-success/30 bg-success/5', label: 'Evidence' },
  example: { icon: FlaskConical, cls: 'border-border bg-muted/40', label: 'Worked example' },
  formula: { icon: Sigma, cls: 'border-border bg-muted/40', label: 'Formula' },
};

export function Callout({ tone, title, md }: { tone: CalloutTone; title: string; md: string }) {
  const m = META[tone];
  const Icon = m.icon;
  return (
    <aside className={cn('rounded-xl border p-4 sm:p-5', m.cls)}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only">{m.label}: </span>
        {title}
      </div>
      <Markdown md={md} className="text-[15px]" />
    </aside>
  );
}
