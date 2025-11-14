import React from 'react';
import { ArrowLeft, Moon, Sun, Monitor, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/stores/useAppStore';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const userProgress = useAppStore((state) => state.userProgress);

  const handleThemeChange = (mode: 'light' | 'dark', systemPreference: boolean) => {
    setTheme({ mode, systemPreference });
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      // This would reset the store - for now just reload
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your ModelMed experience
        </p>
      </div>

      <div className="space-y-4">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose your preferred color theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <button
                onClick={() => handleThemeChange('light', false)}
                className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                  !theme.systemPreference && theme.mode === 'light'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Sun className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Light</div>
                  <div className="text-sm text-muted-foreground">
                    Use light theme
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('dark', false)}
                className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                  !theme.systemPreference && theme.mode === 'dark'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Dark</div>
                  <div className="text-sm text-muted-foreground">
                    Use dark theme
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange(theme.mode, true)}
                className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                  theme.systemPreference
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Monitor className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">System</div>
                  <div className="text-sm text-muted-foreground">
                    Use system preference
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Overview of your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Modules Completed</div>
                <div className="text-2xl font-bold">
                  {userProgress.completedModules.length}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Time</div>
                <div className="text-2xl font-bold">
                  {userProgress.totalTimeSpent || 0} min
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Assessments Taken</div>
                <div className="text-2xl font-bold">
                  {Object.keys(userProgress.assessmentScores).length}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Active</div>
                <div className="text-sm font-medium">
                  {new Date(userProgress.lastAccessed).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your learning data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Reset All Progress</div>
                  <div className="text-sm text-muted-foreground">
                    Clear all module progress, assessments, and settings
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleResetProgress}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About ModelMed</CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Version</div>
              <div className="text-muted-foreground">1.0.0</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Description</div>
              <div className="text-muted-foreground">
                Interactive predictive modeling education for clinicians.
                Learn to build, validate, and interpret machine learning models
                for healthcare applications.
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Features</div>
              <div className="text-muted-foreground">
                Offline support, dark mode, comprehensive curriculum,
                interactive assessments, and hands-on model building.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
