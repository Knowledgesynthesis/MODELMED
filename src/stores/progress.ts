import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface QuizRecord {
  best: number;
  last: number;
  attempts: number;
}

interface ProgressState {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  /** moduleId → section ids read */
  read: Record<string, string[]>;
  markRead: (moduleId: string, sectionId: string) => void;
  /** questionId → answered correctly on first attempt */
  answers: Record<string, boolean>;
  recordAnswer: (qid: string, correct: boolean) => void;
  quizzes: Record<string, QuizRecord>;
  recordQuiz: (moduleId: string, score: number) => void;
  labs: string[];
  visitLab: (id: string) => void;
  exams: { date: string; score: number; n: number }[];
  recordExam: (score: number, n: number) => void;
  reset: () => void;
}

const initial = { read: {}, answers: {}, quizzes: {}, labs: [], exams: [] };

export const MASTERY = 0.8;

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      ...initial,
      markRead: (m, s) =>
        set((st) => (st.read[m]?.includes(s) ? st : { read: { ...st.read, [m]: [...(st.read[m] ?? []), s] } })),
      recordAnswer: (q, c) => set((st) => (q in st.answers ? st : { answers: { ...st.answers, [q]: c } })),
      recordQuiz: (m, score) =>
        set((st) => {
          const prev = st.quizzes[m];
          return { quizzes: { ...st.quizzes, [m]: { best: Math.max(prev?.best ?? 0, score), last: score, attempts: (prev?.attempts ?? 0) + 1 } } };
        }),
      visitLab: (id) => set((st) => (st.labs.includes(id) ? st : { labs: [...st.labs, id] })),
      recordExam: (score, n) => set((st) => ({ exams: [...st.exams, { date: new Date().toISOString(), score, n }].slice(-20) })),
      reset: () => set({ ...initial }),
    }),
    { name: 'modelmed-progress-v2', version: 2 }
  )
);

export function moduleStatus(moduleId: string, sectionCount: number, st: Pick<ProgressState, 'read' | 'quizzes'>) {
  const read = st.read[moduleId]?.length ?? 0;
  const quiz = st.quizzes[moduleId];
  const mastered = !!quiz && quiz.best >= MASTERY;
  const pctRead = sectionCount ? Math.min(1, read / sectionCount) : 0;
  return { read, pctRead, quiz, mastered, started: read > 0 || !!quiz };
}
