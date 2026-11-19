import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, CheckCircle2, ClipboardCheck, FlaskConical, GraduationCap, Library, Menu, Moon, Sun, SunMoon, Wrench, X } from 'lucide-react';
import { modules } from '@/content/modules';
import { TRACKS, type Track } from '@/content/types';
import { useProgress, moduleStatus, type ThemeMode } from '@/stores/progress';
import { cn } from '@/lib/utils';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="ModelMed home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
        <path d="M6 22 L11 14 L15 18 L20 9 L26 16" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="9" r="2.2" fill="hsl(var(--primary-foreground))" />
      </svg>
      <span className="text-[17px]">ModelMed</span>
    </Link>
  );
}

const NAV = [
  { to: '/labs', label: 'Labs', icon: Wrench },
  { to: '/sandbox', label: 'Sandbox', icon: FlaskConical },
  { to: '/appraise', label: 'Appraise', icon: ClipboardCheck },
  { to: '/exam', label: 'Exam', icon: GraduationCap },
  { to: '/glossary', label: 'Glossary', icon: BookOpen },
  { to: '/references', label: 'Evidence', icon: Library },
];

function ThemeToggle() {
  const theme = useProgress((s) => s.theme);
  const setTheme = useProgress((s) => s.setTheme);
  const next: Record<ThemeMode, ThemeMode> = { system: 'light', light: 'dark', dark: 'system' };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : SunMoon;
  return (
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
      aria-label={`Theme: ${theme}. Switch to ${next[theme]}`}
      title={`Theme: ${theme}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

function Curriculum({ onNavigate }: { onNavigate?: () => void }) {
  const st = useProgress();
  const tracks = Object.keys(TRACKS) as Track[];
  return (
    <nav aria-label="Curriculum" className="space-y-5 text-sm">
      {tracks.map((t) => (
        <div key={t}>
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{TRACKS[t].title}</div>
          <ul className="space-y-0.5">
            {modules
              .filter((m) => m.track === t)
              .map((m) => {
                const s = moduleStatus(m.id, m.sections.length, st);
                return (
                  <li key={m.id}>
                    <NavLink
                      to={`/module/${m.id}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn('flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors', isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground/80 hover:bg-muted')
                      }
                    >
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', s.mastered ? 'bg-success text-white' : s.started ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                        {s.mastered ? <CheckCircle2 className="h-3.5 w-3.5" /> : m.number}
                      </span>
                      <span className="line-clamp-1">{m.title}</span>
                    </NavLink>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
      <div>
        <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Practice</div>
        <ul className="space-y-0.5">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} onClick={onNavigate} className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-2 py-1.5', isActive ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground/80 hover:bg-muted')}>
                <n.icon className="h-4 w-4 shrink-0" /> {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    setOpen(false);
    if (!hash) window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  const showSidebar = pathname.startsWith('/module/');

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
            <NavLink to="/curriculum" className={({ isActive }) => cn('rounded-lg px-3 py-1.5 text-sm font-medium', isActive || pathname.startsWith('/module') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
              Curriculum
            </NavLink>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => cn('rounded-lg px-3 py-1.5 text-sm font-medium', isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent" aria-label="Close navigation">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Link to="/curriculum" className="mb-4 block rounded-lg bg-muted px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
              Curriculum overview
            </Link>
            <Curriculum onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className={cn('mx-auto max-w-7xl', showSidebar && 'lg:grid lg:grid-cols-[260px_minmax(0,1fr)]')}>
        {showSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-r px-3 py-6 lg:block">
            <Curriculum />
          </aside>
        )}
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>

      <footer className="mt-16 border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>All datasets are synthetic. Models built here are for learning, not for patient care.</p>
          <p>
            Content reviewed against the literature as of November 2026 · <Link to="/references" className="underline">Evidence base</Link> · <Link to="/settings" className="underline">Settings</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
