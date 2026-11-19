import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/screens/HomePage';
import { useResolvedTheme } from '@/hooks/useTheme';

const CurriculumPage = lazy(() => import('@/screens/CurriculumPage').then((m) => ({ default: m.CurriculumPage })));
const ModulePage = lazy(() => import('@/screens/ModulePage').then((m) => ({ default: m.ModulePage })));
const LabsPage = lazy(() => import('@/screens/LabsPage').then((m) => ({ default: m.LabsPage })));
const LabPage = lazy(() => import('@/screens/LabsPage').then((m) => ({ default: m.LabPage })));
const SandboxPage = lazy(() => import('@/screens/SandboxPage').then((m) => ({ default: m.SandboxPage })));
const ExamPage = lazy(() => import('@/screens/ExamPage').then((m) => ({ default: m.ExamPage })));
const GlossaryPage = lazy(() => import('@/screens/GlossaryPage').then((m) => ({ default: m.GlossaryPage })));
const AppraisalPage = lazy(() => import('@/screens/AppraisalPage').then((m) => ({ default: m.AppraisalPage })));
const ReferencesPage = lazy(() => import('@/screens/ReferencesPage').then((m) => ({ default: m.ReferencesPage })));
const SettingsPage = lazy(() => import('@/screens/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFound = lazy(() => import('@/screens/NotFound').then((m) => ({ default: m.NotFound })));

function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function App() {
  useResolvedTheme();
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/curriculum" element={<CurriculumPage />} />
            <Route path="/module/:moduleId" element={<ModulePage />} />
            <Route path="/labs" element={<LabsPage />} />
            <Route path="/labs/:labId" element={<LabPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/module/sandbox" element={<SandboxPage />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/assessment" element={<ExamPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/appraise" element={<AppraisalPage />} />
            <Route path="/references" element={<ReferencesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
