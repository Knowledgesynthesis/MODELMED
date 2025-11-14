import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ROCCurve } from '@/components/visualizations/ROCCurve';
import { CalibrationPlot } from '@/components/visualizations/CalibrationPlot';
import { ConfusionMatrixViz } from '@/components/visualizations/ConfusionMatrixViz';
import { FeatureImportanceChart } from '@/components/visualizations/FeatureImportanceChart';
import { getAllDatasets } from '@/data/synthetic';
import {
  LogisticRegression,
  DecisionTree,
  RandomForest,
  prepareData,
  calculateModelMetrics,
} from '@/utils/mlAlgorithms';
import {
  generateROCCurve,
  generateCalibrationCurve,
  calculateConfusionMatrix,
} from '@/utils/modelUtils';
import { calculatePermutationImportance } from '@/utils/shapValues';
import type { SyntheticDataset, ModelMetrics, ConfusionMatrix, FeatureImportance } from '@/types';

type ModelType = 'logistic' | 'decision-tree' | 'random-forest';

export const ModelBuilder: React.FC = () => {
  const datasets = getAllDatasets();

  const [selectedDataset, setSelectedDataset] = useState<SyntheticDataset | null>(null);
  const [modelType, setModelType] = useState<ModelType>('logistic');
  const [trainTestSplit, setTrainTestSplit] = useState(0.7);
  const [threshold, setThreshold] = useState(0.5);
  const [isTraining, setIsTraining] = useState(false);
  const [isTrained, setIsTrained] = useState(false);

  // Model results
  const [trainMetrics, setTrainMetrics] = useState<ModelMetrics | null>(null);
  const [testMetrics, setTestMetrics] = useState<ModelMetrics | null>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrix | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);

  // Model parameters
  const [learningRate, setLearningRate] = useState(0.01);
  const [maxDepth, setMaxDepth] = useState(5);
  const [numTrees, setNumTrees] = useState(10);

  const handleTrainModel = async () => {
    if (!selectedDataset) return;

    setIsTraining(true);
    setIsTrained(false);

    // Simulate async training
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Prepare data
      const { trainX, trainY, testX, testY, featureNames } = prepareData(
        selectedDataset,
        trainTestSplit
      );

      // Train model
      let model: LogisticRegression | DecisionTree | RandomForest;
      let trainPredictions: number[];
      let testPredictions: number[];

      if (modelType === 'logistic') {
        model = new LogisticRegression(learningRate, 1000);
        model.train(trainX, trainY);
        trainPredictions = model.predict(trainX);
        testPredictions = model.predict(testX);
      } else if (modelType === 'decision-tree') {
        model = new DecisionTree(maxDepth);
        model.train(trainX, trainY);
        trainPredictions = model.predict(trainX);
        testPredictions = model.predict(testX);
      } else {
        model = new RandomForest(numTrees, maxDepth);
        model.train(trainX, trainY);
        trainPredictions = model.predict(trainX);
        testPredictions = model.predict(testX);
      }

      // Calculate metrics
      const trainMetricsResult = calculateModelMetrics(trainPredictions, trainY, threshold);
      const testMetricsResult = calculateModelMetrics(testPredictions, testY, threshold);

      setTrainMetrics(trainMetricsResult);
      setTestMetrics(testMetricsResult);

      // Calculate confusion matrix
      const cm = calculateConfusionMatrix(testPredictions, testY, threshold);
      setConfusionMatrix(cm);

      // Calculate feature importance
      const importance = calculatePermutationImportance(
        (X: number[][]) => model.predict(X),
        [...testX],
        testY,
        featureNames
      );
      setFeatureImportance(importance);

      setIsTrained(true);
    } catch (error) {
      console.error('Training error:', error);
    } finally {
      setIsTraining(false);
    }
  };

  const handleReset = () => {
    setIsTrained(false);
    setTrainMetrics(null);
    setTestMetrics(null);
    setConfusionMatrix(null);
    setFeatureImportance([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dataset Selection */}
          <Select
            label="Select Dataset"
            value={selectedDataset?.id || ''}
            onChange={(value) => {
              const dataset = datasets.find(d => d.id === value);
              setSelectedDataset(dataset || null);
              handleReset();
            }}
            options={datasets.map(d => ({ value: d.id, label: d.name }))}
            placeholder="Choose a dataset..."
          />

          {selectedDataset && (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{selectedDataset.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedDataset.samples} samples</Badge>
                  <Badge variant="outline">{selectedDataset.features.length} features</Badge>
                </div>
              </div>

              {/* Model Type */}
              <Select
                label="Model Type"
                value={modelType}
                onChange={(value) => {
                  setModelType(value as ModelType);
                  handleReset();
                }}
                options={[
                  { value: 'logistic', label: 'Logistic Regression' },
                  { value: 'decision-tree', label: 'Decision Tree' },
                  { value: 'random-forest', label: 'Random Forest' },
                ]}
              />

              {/* Train/Test Split */}
              <Slider
                label="Train/Test Split"
                value={trainTestSplit}
                onChange={(value) => {
                  setTrainTestSplit(value);
                  handleReset();
                }}
                min={0.5}
                max={0.9}
                step={0.05}
                showValue={false}
              />
              <div className="text-sm text-muted-foreground">
                Train: {Math.round(trainTestSplit * 100)}% | Test: {Math.round((1 - trainTestSplit) * 100)}%
              </div>

              {/* Model-specific parameters */}
              {modelType === 'logistic' && (
                <Slider
                  label="Learning Rate"
                  value={learningRate}
                  onChange={setLearningRate}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                />
              )}

              {(modelType === 'decision-tree' || modelType === 'random-forest') && (
                <Slider
                  label="Max Tree Depth"
                  value={maxDepth}
                  onChange={(value) => setMaxDepth(Math.round(value))}
                  min={2}
                  max={10}
                  step={1}
                />
              )}

              {modelType === 'random-forest' && (
                <Slider
                  label="Number of Trees"
                  value={numTrees}
                  onChange={(value) => setNumTrees(Math.round(value))}
                  min={5}
                  max={50}
                  step={5}
                />
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleTrainModel}
                  disabled={isTraining}
                  className="flex-1"
                >
                  {isTraining ? (
                    'Training...'
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Train Model
                    </>
                  )}
                </Button>
                {isTrained && (
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isTrained && testMetrics && confusionMatrix && (
        <>
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">AUC</div>
                  <div className="text-2xl font-bold">
                    {testMetrics.auc?.toFixed(3) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                  <div className="text-2xl font-bold">
                    {((testMetrics.accuracy || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Sensitivity</div>
                  <div className="text-2xl font-bold">
                    {((testMetrics.sensitivity || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Specificity</div>
                  <div className="text-2xl font-bold">
                    {((testMetrics.specificity || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Overfitting Check */}
              {trainMetrics && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Overfitting Check</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Train Accuracy:</span>{' '}
                      <span className="font-medium">{((trainMetrics.accuracy || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Test Accuracy:</span>{' '}
                      <span className="font-medium">{((testMetrics.accuracy || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {(trainMetrics.accuracy || 0) - (testMetrics.accuracy || 0) > 0.1 && (
                    <Badge variant="warning" className="mt-2">
                      Possible overfitting detected
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualizations */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                tabs={[
                  {
                    id: 'confusion',
                    label: 'Confusion Matrix',
                    content: (
                      <div className="pt-4">
                        <Slider
                          label="Decision Threshold"
                          value={threshold}
                          onChange={setThreshold}
                          min={0.1}
                          max={0.9}
                          step={0.05}
                        />
                        <ConfusionMatrixViz matrix={confusionMatrix} className="mt-6" />
                      </div>
                    ),
                  },
                  {
                    id: 'roc',
                    label: 'ROC Curve',
                    content: (
                      <ROCCurve
                        data={generateROCCurve(testMetrics.auc || 0.5)}
                        auc={testMetrics.auc || 0.5}
                        className="pt-4"
                      />
                    ),
                  },
                  {
                    id: 'calibration',
                    label: 'Calibration',
                    content: (
                      <CalibrationPlot
                        data={generateCalibrationCurve(testMetrics.brierScore || 0.25)}
                        brierScore={testMetrics.brierScore || 0.25}
                        className="pt-4"
                      />
                    ),
                  },
                  {
                    id: 'importance',
                    label: 'Feature Importance',
                    content: (
                      <FeatureImportanceChart data={featureImportance} className="pt-4" />
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* Interpretation Guide */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle>Clinical Interpretation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>AUC {testMetrics.auc?.toFixed(3)}:</strong>{' '}
                {testMetrics.auc && testMetrics.auc >= 0.8
                  ? 'Excellent discrimination. The model ranks positive cases higher than negative cases with high reliability.'
                  : testMetrics.auc && testMetrics.auc >= 0.7
                  ? 'Good discrimination. The model performs reasonably well at distinguishing cases.'
                  : 'Fair discrimination. Consider feature engineering or trying different models.'}
              </p>
              <p>
                <strong>Sensitivity {((testMetrics.sensitivity || 0) * 100).toFixed(1)}%:</strong>{' '}
                The model correctly identifies {((testMetrics.sensitivity || 0) * 100).toFixed(1)}% of actual positive cases.
                {(testMetrics.sensitivity || 0) < 0.7 && ' Consider lowering the threshold to catch more cases.'}
              </p>
              <p>
                <strong>Brier Score {testMetrics.brierScore?.toFixed(3)}:</strong>{' '}
                {testMetrics.brierScore && testMetrics.brierScore < 0.15
                  ? 'Well-calibrated predictions.'
                  : 'Consider calibration adjustments for clinical use.'}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
