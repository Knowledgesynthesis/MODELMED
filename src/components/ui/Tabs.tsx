import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export function Tabs({ tabs, initial, className }: { tabs: { id: string; label: React.ReactNode; content: React.ReactNode }[]; initial?: string; className?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  return (
    <div className={className}>
      <div role="tablist" className="scrollbar-thin -mx-1 flex gap-1 overflow-x-auto border-b px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
