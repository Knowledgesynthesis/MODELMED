import { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { useProgress, type ThemeMode } from '@/stores/progress';
import { Segmented } from '@/components/ui/controls';
import { Button } from '@/components/ui/Button';

export function SettingsPage() {
  const st = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const exportProgress = () => {
    const { read, answers, quizzes, labs, exams } = useProgress.getState();
    const blob = new Blob([JSON.stringify({ app: 'modelmed', version: 2, read, answers, quizzes, labs, exams }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelmed-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importProgress = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'modelmed') throw new Error('Not a ModelMed progress file');
      useProgress.setState({ read: data.read ?? {}, answers: data.answers ?? {}, quizzes: data.quizzes ?? {}, labs: data.labs ?? [], exams: data.exams ?? [] });
      setMsg('Progress imported.');
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`);
    }
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <section className="mt-8 space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Appearance</h2>
        <Segmented<ThemeMode>
          value={st.theme}
          onChange={st.setTheme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </section>
      <section className="mt-6 space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Your progress</h2>
        <p className="text-sm text-muted-foreground">Progress is stored only in this browser. Nothing is sent to a server. Export it to move between devices.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportProgress}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => file.current?.click()}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importProgress(e.target.files[0])} />
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone.')) {
                st.reset();
                setMsg('Progress reset.');
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Reset
          </Button>
        </div>
        {msg && <p className="text-sm" role="status">{msg}</p>}
      </section>
      <section className="mt-6 space-y-2 rounded-xl border bg-card p-5 text-sm">
        <h2 className="font-semibold">About</h2>
        <p>ModelMed runs entirely in your browser and works offline after the first visit. All patient data are synthetic and generated from published, transparent data-generating models (see the sandbox).</p>
        <p className="text-muted-foreground">Content current to November 2026. Regulatory summaries change; follow the linked primary sources.</p>
      </section>
    </div>
  );
}
