import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Activity,
  TrendingUp,
  GitBranch,
  Brain,
  Target,
  Gauge,
  Eye,
  Scale,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useAppStore } from '@/stores/useAppStore';
import { modulesData } from '@/data/modules/modules-data';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
  GitBranch: <GitBranch className="h-6 w-6" />,
  Brain: <Brain className="h-6 w-6" />,
  Target: <Target className="h-6 w-6" />,
  Gauge: <Gauge className="h-6 w-6" />,
  Eye: <Eye className="h-6 w-6" />,
  Scale: <Scale className="h-6 w-6" />,
  FlaskConical: <FlaskConical className="h-6 w-6" />,
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const userProgress = useAppStore((state) => state.userProgress);
  const completedModules = userProgress.completedModules;

  const totalModules = modulesData.length;
  const completedCount = completedModules.length;
  const overallProgress = (completedCount / totalModules) * 100;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to ModelMed
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Master predictive modeling and machine learning for clinical decision-making.
          Build, validate, and interpret models with confidence.
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            {completedCount} of {totalModules} modules completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(overallProgress)}% Complete</span>
              <span>{userProgress.totalTimeSpent || 0} minutes spent learning</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">of {totalModules} modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProgress.totalTimeSpent || 0}</div>
            <p className="text-xs text-muted-foreground">minutes of learning</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(userProgress.assessmentScores).length}
            </div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Modules */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Learning Modules</h2>
          <p className="text-muted-foreground">
            Comprehensive curriculum from foundations to advanced topics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modulesData.map((module) => {
            const progress = userProgress.moduleProgress[module.id] || 0;
            const isCompleted = completedModules.includes(module.id);

            return (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/module/${module.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {iconMap[module.icon]}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {module.estimatedTime} min
                      </span>
                      {module.prerequisites.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {module.prerequisites.length} prerequisite
                          {module.prerequisites.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {progress > 0 && !isCompleted && (
                      <Progress value={progress} className="h-2" />
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => navigate(`/module/${module.id}`)}
                    >
                      {isCompleted ? 'Review' : progress > 0 ? 'Continue' : 'Start'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Ready to Build Models?</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Jump into the Model Sandbox to train and evaluate your first predictive model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/module/sandbox')}
          >
            Launch Model Sandbox
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
