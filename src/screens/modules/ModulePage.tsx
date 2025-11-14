import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useAppStore } from '@/stores/useAppStore';
import { getModuleById } from '@/data/modules/modules-data';
import type { ModuleId } from '@/types';

export const ModulePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const userProgress = useAppStore((state) => state.userProgress);
  const completeModule = useAppStore((state) => state.completeModule);
  const setCurrentModule = useAppStore((state) => state.setCurrentModule);

  const module = moduleId ? getModuleById(moduleId) : null;

  useEffect(() => {
    if (moduleId) {
      setCurrentModule(moduleId as ModuleId);
    }
    return () => setCurrentModule(null);
  }, [moduleId, setCurrentModule]);

  if (!module) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">Module not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = userProgress.moduleProgress[module.id] || 0;
  const isCompleted = userProgress.completedModules.includes(module.id);

  const handleComplete = () => {
    completeModule(module.id);
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      {/* Module Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{module.title}</h1>
            <p className="text-xl text-muted-foreground">{module.description}</p>
          </div>
          {isCompleted && (
            <Badge variant="success" className="flex items-center">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Completed
            </Badge>
          )}
        </div>

        {/* Module Metadata */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {module.estimatedTime} minutes
          </span>
          <span className="flex items-center">
            <BookOpen className="mr-1 h-4 w-4" />
            {module.topics.length} topics
          </span>
        </div>

        {/* Progress Bar */}
        {!isCompleted && progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* Prerequisites */}
        {module.prerequisites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prerequisites</CardTitle>
              <CardDescription>
                Complete these modules first for the best learning experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {module.prerequisites.map((prereqId) => (
                  <Badge
                    key={prereqId}
                    variant={userProgress.completedModules.includes(prereqId) ? 'success' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => navigate(`/module/${prereqId}`)}
                  >
                    {userProgress.completedModules.includes(prereqId) && (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {prereqId}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Topics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Topics</h2>
        <div className="space-y-4">
          {module.topics.map((topic, index) => (
            <Card key={topic.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {index + 1}. {topic.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {topic.bloomLevel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  {topic.content.split('\n').map((paragraph, i) => {
                    // Handle headers
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
                          {paragraph.replace(/\*\*/g, '')}
                        </h3>
                      );
                    }
                    // Handle bullet points
                    if (paragraph.startsWith('- ')) {
                      return (
                        <li key={i} className="ml-4 text-foreground">
                          {paragraph.substring(2)}
                        </li>
                      );
                    }
                    // Regular paragraphs
                    if (paragraph.trim()) {
                      return (
                        <p key={i} className="mb-4 text-foreground">
                          {paragraph}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              {isCompleted ? (
                <p className="text-sm text-muted-foreground">
                  You've completed this module. Great work!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Mark as complete when you're ready to move on
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {!isCompleted && (
                <Button onClick={handleComplete}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/assessment')}>
                Take Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
