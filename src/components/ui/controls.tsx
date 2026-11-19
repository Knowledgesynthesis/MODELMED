import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v) => String(v),
  hint,
  className,
}: {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  hint?: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="min-w-0 text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="tabular max-w-full rounded-md bg-muted px-2 py-0.5 text-sm font-semibold">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <div className="text-sm font-medium">{label}</div>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              value === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: React.ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-input')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </label>
    </div>
  );
}
