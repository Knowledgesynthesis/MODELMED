import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Activity,
  GitBranch,
  Brain,
  Target,
  TrendingUp,
  Eye,
  Scale,
  Gauge,
  FlaskConical,
  GraduationCap,
  BookMarked,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { useAppStore } from '@/stores/useAppStore';
import type { ModuleId } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  moduleId?: ModuleId;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" />, path: '/' },
  { id: 'foundations', label: 'Foundations', icon: <BookOpen className="h-5 w-5" />, path: '/module/foundations', moduleId: 'foundations' },
  { id: 'logistic', label: 'Logistic Regression', icon: <Activity className="h-5 w-5" />, path: '/module/logistic-regression', moduleId: 'logistic-regression' },
  { id: 'survival', label: 'Survival Models', icon: <TrendingUp className="h-5 w-5" />, path: '/module/survival-models', moduleId: 'survival-models' },
  { id: 'trees', label: 'Tree Models', icon: <GitBranch className="h-5 w-5" />, path: '/module/tree-models', moduleId: 'tree-models' },
  { id: 'neural', label: 'Neural Networks', icon: <Brain className="h-5 w-5" />, path: '/module/neural-networks', moduleId: 'neural-networks' },
  { id: 'training', label: 'Training & Validation', icon: <Target className="h-5 w-5" />, path: '/module/training-validation', moduleId: 'training-validation' },
  { id: 'metrics', label: 'Performance Metrics', icon: <Gauge className="h-5 w-5" />, path: '/module/metrics', moduleId: 'metrics' },
  { id: 'interpretability', label: 'Interpretability', icon: <Eye className="h-5 w-5" />, path: '/module/interpretability', moduleId: 'interpretability' },
  { id: 'bias', label: 'Bias & Fairness', icon: <Scale className="h-5 w-5" />, path: '/module/bias-fairness', moduleId: 'bias-fairness' },
  { id: 'calibration', label: 'Calibration', icon: <Gauge className="h-5 w-5" />, path: '/module/calibration', moduleId: 'calibration' },
  { id: 'sandbox', label: 'Model Sandbox', icon: <FlaskConical className="h-5 w-5" />, path: '/module/sandbox', moduleId: 'sandbox' },
  { id: 'assessment', label: 'Assessment Hub', icon: <GraduationCap className="h-5 w-5" />, path: '/assessment' },
  { id: 'glossary', label: 'Glossary', icon: <BookMarked className="h-5 w-5" />, path: '/glossary' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userProgress = useAppStore((state) => state.userProgress);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-background transition-transform md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4 overflow-y-auto h-[calc(100%-4rem)] md:h-full scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const progress = item.moduleId ? userProgress.moduleProgress[item.moduleId] || 0 : 0;
            const hasProgress = item.moduleId && progress > 0;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
                {hasProgress && !isActive && (
                  <Progress value={progress} className="h-1 mx-3" />
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
