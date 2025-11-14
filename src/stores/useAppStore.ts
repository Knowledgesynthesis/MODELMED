import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleId, UserProgress, ThemeConfig } from '@/types';

interface AppState {
  // Theme
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  toggleTheme: () => void;

  // User Progress
  userProgress: UserProgress;
  updateModuleProgress: (moduleId: ModuleId, progress: number) => void;
  completeModule: (moduleId: ModuleId) => void;
  updateAssessmentScore: (assessmentId: string, score: number) => void;
  incrementTimeSpent: (minutes: number) => void;

  // Navigation
  currentModule: ModuleId | null;
  setCurrentModule: (moduleId: ModuleId | null) => void;

  // Offline status
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme defaults
      theme: {
        mode: 'dark',
        systemPreference: false,
      },
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: {
            ...state.theme,
            mode: state.theme.mode === 'dark' ? 'light' : 'dark',
          },
        })),

      // User Progress defaults
      userProgress: {
        moduleProgress: {} as Record<ModuleId, number>,
        completedModules: [],
        assessmentScores: {},
        totalTimeSpent: 0,
        lastAccessed: new Date(),
      },
      updateModuleProgress: (moduleId, progress) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            moduleProgress: {
              ...state.userProgress.moduleProgress,
              [moduleId]: progress,
            },
            lastAccessed: new Date(),
          },
        })),
      completeModule: (moduleId) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            completedModules: state.userProgress.completedModules.includes(moduleId)
              ? state.userProgress.completedModules
              : [...state.userProgress.completedModules, moduleId],
            moduleProgress: {
              ...state.userProgress.moduleProgress,
              [moduleId]: 100,
            },
            lastAccessed: new Date(),
          },
        })),
      updateAssessmentScore: (assessmentId, score) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            assessmentScores: {
              ...state.userProgress.assessmentScores,
              [assessmentId]: score,
            },
            lastAccessed: new Date(),
          },
        })),
      incrementTimeSpent: (minutes) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            totalTimeSpent: state.userProgress.totalTimeSpent + minutes,
          },
        })),

      // Navigation
      currentModule: null,
      setCurrentModule: (moduleId) => set({ currentModule: moduleId }),

      // Offline
      isOffline: !navigator.onLine,
      setOfflineStatus: (status) => set({ isOffline: status }),
    }),
    {
      name: 'modelmed-storage',
      partialize: (state) => ({
        theme: state.theme,
        userProgress: state.userProgress,
      }),
    }
  )
);
