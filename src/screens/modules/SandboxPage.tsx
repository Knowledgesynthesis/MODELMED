import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ModelBuilder } from '@/components/interactives/ModelBuilder';
import { ShapExplorer } from '@/components/interactives/ShapExplorer';
import { ROCPlayground } from '@/components/interactives/ROCPlayground';
import { OverfittingVisualizer } from '@/components/interactives/OverfittingVisualizer';

export const SandboxPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Model Sandbox</h1>
        <p className="text-xl text-muted-foreground">
          Build, train, evaluate, and interpret your own predictive models with interactive tools
        </p>
      </div>

      {/* Interactive Tabs */}
      <Tabs
        tabs={[
          {
            id: 'model-builder',
            label: 'Model Builder',
            content: (
              <div className="pt-4">
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Build Your First Model</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a dataset, choose a model type, configure parameters, and train a complete predictive model.
                    Evaluate performance with ROC curves, calibration plots, and confusion matrices.
                  </p>
                </div>
                <ModelBuilder />
              </div>
            ),
          },
          {
            id: 'roc-playground',
            label: 'ROC Playground',
            content: (
              <div className="pt-4">
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Explore ROC Curves</h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust the decision threshold and see how it affects sensitivity, specificity, and the confusion matrix.
                    Understand the trade-offs in clinical decision-making.
                  </p>
                </div>
                <ROCPlayground />
              </div>
            ),
          },
          {
            id: 'shap-explorer',
            label: 'SHAP Explorer',
            content: (
              <div className="pt-4">
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Understand Model Predictions</h3>
                  <p className="text-sm text-muted-foreground">
                    Use SHAP values to see exactly how each feature contributes to individual predictions.
                    Learn which features increase or decrease risk for specific patients.
                  </p>
                </div>
                <ShapExplorer />
              </div>
            ),
          },
          {
            id: 'overfitting',
            label: 'Overfitting Demo',
            content: (
              <div className="pt-4">
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Watch Overfitting in Action</h3>
                  <p className="text-sm text-muted-foreground">
                    See how model complexity and training data size affect overfitting.
                    Watch training and test accuracy diverge as the model memorizes rather than learns.
                  </p>
                </div>
                <OverfittingVisualizer />
              </div>
            ),
          },
        ]}
      />

      {/* Learning Objectives */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-3">What You'll Learn</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>How to train and evaluate classification models</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Interpreting ROC curves, AUC, and calibration metrics</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Using SHAP values for model interpretability</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Recognizing and preventing overfitting</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Choosing appropriate decision thresholds</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Balancing sensitivity and specificity for clinical contexts</span>
            </li>
          </ul>
        </div>

        <div className="p-6 border rounded-lg bg-primary/5">
          <h3 className="font-semibold mb-3">Safety & Ethics</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">🔒</span>
              <span><strong>Synthetic Data Only:</strong> All datasets are computer-generated, never real patients</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📚</span>
              <span><strong>Educational Purpose:</strong> Models are for learning, not clinical decision-making</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚖️</span>
              <span><strong>No Real Predictions:</strong> Never apply these models to actual patient care</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span><strong>Concept Focus:</strong> Simplified implementations to demonstrate principles</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
