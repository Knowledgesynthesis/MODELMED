import React from 'react';
import { cn } from '@/lib/utils';

export function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'good' | 'warn' | 'bad';
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-background/60 p-3', className)}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          'tabular mt-0.5 text-xl font-semibold tracking-tight',
          tone === 'good' && 'text-success',
          tone === 'warn' && 'text-warning',
          tone === 'bad' && 'text-destructive'
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
