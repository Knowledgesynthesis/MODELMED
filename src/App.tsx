import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/screens/home/HomePage';
import { ModulePage } from '@/screens/modules/ModulePage';
import { AssessmentPage } from '@/screens/assessment/AssessmentPage';
import { GlossaryPage } from '@/screens/glossary/GlossaryPage';
import { SettingsPage } from '@/screens/settings/SettingsPage';
import { useTheme } from '@/hooks/useTheme';
import { useOffline } from '@/hooks/useOffline';

function App() {
  useTheme(); // Initialize theme
  useOffline(); // Initialize offline detection

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/module/:moduleId" element={<ModulePage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
