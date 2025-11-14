import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getRandomQuestions } from '@/data/assessments/questions';
import { useAppStore } from '@/stores/useAppStore';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const updateAssessmentScore = useAppStore((state) => state.updateAssessmentScore);

  const [selectedQuestions] = useState(() => getRandomQuestions(10));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(10).fill(null));
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmitAnswer = () => {
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1]);
      setShowExplanation(false);
    } else {
      // Calculate score
      const correctCount = selectedQuestions.reduce((count, q, index) => {
        return count + (answers[index] === q.correctAnswer ? 1 : 0);
      }, 0);
      const score = (correctCount / selectedQuestions.length) * 100;
      updateAssessmentScore(`assessment-${Date.now()}`, score);
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1]);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers(new Array(10).fill(null));
    setIsComplete(false);
  };

  if (isComplete) {
    const correctCount = selectedQuestions.reduce((count, q, index) => {
      return count + (answers[index] === q.correctAnswer ? 1 : 0);
    }, 0);
    const score = (correctCount / selectedQuestions.length) * 100;

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Assessment Complete!</CardTitle>
            <CardDescription>Here's how you performed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-primary">
                {Math.round(score)}%
              </div>
              <p className="text-xl text-muted-foreground">
                {correctCount} out of {selectedQuestions.length} correct
              </p>

              {score >= 80 && (
                <Badge variant="success" className="text-lg px-4 py-2">
                  Excellent Work!
                </Badge>
              )}
              {score >= 60 && score < 80 && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Good Job!
                </Badge>
              )}
              {score < 60 && (
                <Badge variant="warning" className="text-lg px-4 py-2">
                  Keep Learning!
                </Badge>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={handleRestart}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Assessment Hub</h1>
          <p className="text-muted-foreground">
            Test your understanding of predictive modeling concepts
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {selectedQuestions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{currentQuestion.moduleId}</Badge>
            <Badge>{currentQuestion.bloomLevel}</Badge>
          </div>
          <CardTitle className="text-xl mt-4">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showResult = showExplanation;

                return (
                  <button
                    key={index}
                    onClick={() => !showExplanation && handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      showResult
                        ? isCorrect
                          ? 'border-green-500 bg-green-500/10'
                          : isSelected
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-border'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showExplanation && (
            <Card className="bg-muted">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Explanation:</h4>
                <p className="text-sm">{currentQuestion.explanation}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            {!showExplanation ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {currentQuestionIndex === selectedQuestions.length - 1 ? 'Finish' : 'Next'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
