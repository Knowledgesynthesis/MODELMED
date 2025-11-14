import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface EpochData {
  epoch: number;
  trainAccuracy: number;
  testAccuracy: number;
}

export const OverfittingVisualizer: React.FC = () => {
  const [modelComplexity, setModelComplexity] = useState(5);
  const [dataSize, setDataSize] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [learningData, setLearningData] = useState<EpochData[]>([]);

  const maxEpochs = 50;

  useEffect(() => {
    // Generate learning curves based on complexity and data size
    generateLearningCurves();
  }, [modelComplexity, dataSize]);

  useEffect(() => {
    if (isPlaying && currentEpoch < maxEpochs) {
      const timer = setTimeout(() => {
        setCurrentEpoch(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    } else if (currentEpoch >= maxEpochs) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentEpoch]);

  const generateLearningCurves = () => {
    const data: EpochData[] = [];

    // Complexity affects overfitting potential
    const overfittingFactor = modelComplexity / 10;
    const dataSizeFactor = dataSize / 200;

    for (let epoch = 0; epoch <= maxEpochs; epoch++) {
      // Training accuracy increases with epochs
      const trainProgress = 1 - Math.exp(-0.15 * epoch);
      const trainNoise = (Math.random() - 0.5) * 0.02;
      let trainAccuracy = 0.5 + trainProgress * 0.48 + trainNoise;

      // Test accuracy plateaus and may decrease with overfitting
      const testProgress = 1 - Math.exp(-0.1 * epoch);
      const overfitPenalty = Math.max(0, epoch - 20) * 0.003 * overfittingFactor / dataSizeFactor;
      const testNoise = (Math.random() - 0.5) * 0.03;
      let testAccuracy = 0.5 + testProgress * 0.40 - overfitPenalty + testNoise;

      // More data reduces overfitting
      const dataBonus = dataSizeFactor * 0.05;
      testAccuracy += dataBonus;

      // Clamp values
      trainAccuracy = Math.min(0.99, Math.max(0.5, trainAccuracy));
      testAccuracy = Math.min(0.95, Math.max(0.5, testAccuracy));

      data.push({
        epoch,
        trainAccuracy,
        testAccuracy,
      });
    }

    setLearningData(data);
  };

  const handleReset = () => {
    setCurrentEpoch(0);
    setIsPlaying(false);
    generateLearningCurves();
  };

  const visibleData = learningData.slice(0, currentEpoch + 1);
  const currentData = learningData[currentEpoch];
  const gap = currentData ? currentData.trainAccuracy - currentData.testAccuracy : 0;
  const isOverfitting = gap > 0.1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overfitting Visualizer</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Watch how training and test accuracy diverge as a model overfits
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="space-y-4">
            <Slider
              label="Model Complexity"
              value={modelComplexity}
              onChange={(value) => {
                setModelComplexity(value);
                handleReset();
              }}
              min={1}
              max={10}
              step={1}
            />
            <div className="text-sm text-muted-foreground">
              {modelComplexity <= 3 && 'Simple model - may underfit'}
              {modelComplexity > 3 && modelComplexity <= 7 && 'Moderate complexity - balanced'}
              {modelComplexity > 7 && 'Complex model - prone to overfitting'}
            </div>

            <Slider
              label="Training Data Size"
              value={dataSize}
              onChange={(value) => {
                setDataSize(value);
                handleReset();
              }}
              min={50}
              max={500}
              step={50}
            />
            <div className="text-sm text-muted-foreground">
              {dataSize} samples (more data reduces overfitting)
            </div>
          </div>

          {/* Animation Controls */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={currentEpoch >= maxEpochs}
            >
              {isPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {currentEpoch >= maxEpochs ? 'Finished' : 'Play'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Current Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">Epoch</div>
              <div className="text-2xl font-bold">{currentEpoch}</div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-xs text-muted-foreground">Train Accuracy</div>
              <div className="text-2xl font-bold">
                {currentData ? (currentData.trainAccuracy * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-xs text-muted-foreground">Test Accuracy</div>
              <div className="text-2xl font-bold">
                {currentData ? (currentData.testAccuracy * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
          </div>

          {currentData && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Performance Gap</span>
                <Badge variant={isOverfitting ? 'warning' : 'success'}>
                  {(gap * 100).toFixed(1)}%
                </Badge>
              </div>
              {isOverfitting ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  ⚠️ Overfitting detected! Training accuracy is significantly higher than test accuracy.
                  The model is memorizing the training data rather than learning generalizable patterns.
                </p>
              ) : (
                <p className="text-sm text-green-600 dark:text-green-500">
                  ✓ Model is generalizing well. Train and test accuracy are similar.
                </p>
              )}
            </div>
          )}

          {/* Learning Curves */}
          <div>
            <h4 className="font-semibold mb-4">Learning Curves</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={visibleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="epoch"
                  label={{ value: 'Training Epoch', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis
                  label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  domain={[0.4, 1]}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="trainAccuracy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Training Accuracy"
                />
                <Line
                  type="monotone"
                  dataKey="testAccuracy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Test Accuracy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Understanding Overfitting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>What is overfitting?</strong>
            <p>When a model learns the training data too well, including noise and random fluctuations, leading to poor performance on new data.</p>
          </div>
          <div>
            <strong>Signs of overfitting:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>Training accuracy continues to improve while test accuracy plateaus or decreases</li>
              <li>Large gap (&gt;10%) between training and test performance</li>
              <li>Model performs excellently on training data but poorly on real-world data</li>
            </ul>
          </div>
          <div>
            <strong>Solutions:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>Collect more training data</li>
              <li>Reduce model complexity</li>
              <li>Use regularization techniques</li>
              <li>Apply early stopping</li>
              <li>Use cross-validation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
