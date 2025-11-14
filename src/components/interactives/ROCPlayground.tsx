import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { ConfusionMatrixViz } from '@/components/visualizations/ConfusionMatrixViz';
import { generateROCCurve, calculateConfusionMatrix } from '@/utils/modelUtils';
import type { ROCPoint, ConfusionMatrix } from '@/types';

export const ROCPlayground: React.FC = () => {
  const [threshold, setThreshold] = useState(0.5);
  const [auc, setAuc] = useState(0.85);
  const [rocData, setRocData] = useState<ROCPoint[]>([]);
  const [currentPoint, setCurrentPoint] = useState<ROCPoint | null>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrix | null>(null);

  useEffect(() => {
    // Generate ROC curve data
    const roc = generateROCCurve(auc);
    setRocData(roc);

    // Find closest point to threshold
    const point = roc.reduce((prev, curr) =>
      Math.abs(curr.threshold - threshold) < Math.abs(prev.threshold - threshold) ? curr : prev
    );
    setCurrentPoint(point);

    // Generate synthetic predictions for confusion matrix
    const numSamples = 200;
    const predictions: number[] = [];
    const actuals: number[] = [];

    // Generate synthetic data that matches the AUC
    for (let i = 0; i < numSamples; i++) {
      const actual = Math.random() < 0.3 ? 1 : 0; // 30% prevalence
      let pred: number;

      if (actual === 1) {
        // Positive class - higher predictions
        pred = Math.random() * 0.4 + 0.5 * auc;
      } else {
        // Negative class - lower predictions
        pred = Math.random() * 0.4 + 0.1 * (1 - auc);
      }

      predictions.push(Math.min(1, Math.max(0, pred)));
      actuals.push(actual);
    }

    const cm = calculateConfusionMatrix(predictions, actuals, threshold);
    setConfusionMatrix(cm);
  }, [threshold, auc]);

  const sensitivity = currentPoint ? currentPoint.tpr : 0;
  const specificity = currentPoint ? 1 - currentPoint.fpr : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interactive ROC Curve Explorer</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Adjust the decision threshold and AUC to see how they affect model performance
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="space-y-4">
            <Slider
              label="Decision Threshold"
              value={threshold}
              onChange={setThreshold}
              min={0.05}
              max={0.95}
              step={0.05}
            />

            <Slider
              label="Model AUC (Discrimination)"
              value={auc}
              onChange={setAuc}
              min={0.5}
              max={0.99}
              step={0.01}
            />
          </div>

          {/* Current Performance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">Sensitivity (TPR)</div>
              <div className="text-lg font-bold">{(sensitivity * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">Specificity (TNR)</div>
              <div className="text-lg font-bold">{(specificity * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">FPR</div>
              <div className="text-lg font-bold">{((1 - specificity) * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground">AUC</div>
              <div className="text-lg font-bold">{auc.toFixed(3)}</div>
            </div>
          </div>

          {/* ROC Curve */}
          <div>
            <h4 className="font-semibold mb-4">ROC Curve</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={rocData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="fpr"
                  label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5 }}
                  tickFormatter={(value) => (value * 100).toFixed(0)}
                  className="text-xs"
                />
                <YAxis
                  dataKey="tpr"
                  label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => (value * 100).toFixed(0)}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  labelFormatter={(label) => `FPR: ${(label * 100).toFixed(1)}%`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <ReferenceLine
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                {currentPoint && (
                  <Dot
                    cx={currentPoint.fpr * 100}
                    cy={currentPoint.tpr * 100}
                    r={8}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Red dot shows performance at current threshold ({(threshold * 100).toFixed(0)}%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confusion Matrix */}
      {confusionMatrix && (
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix at Threshold {(threshold * 100).toFixed(0)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfusionMatrixViz matrix={confusionMatrix} />
          </CardContent>
        </Card>
      )}

      {/* Educational Content */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Understanding the Trade-offs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Decision Threshold:</strong>
            <p>The probability cutoff for classifying a prediction as positive. Lowering the threshold increases sensitivity but decreases specificity (more false positives).</p>
          </div>
          <div>
            <strong>AUC (Area Under Curve):</strong>
            <p>Measures overall discrimination ability. AUC of 0.5 is random guessing, 1.0 is perfect classification. Higher AUC means better separation between classes.</p>
          </div>
          <div>
            <strong>Clinical Decision-Making:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>For screening tests, prioritize high sensitivity (don't miss cases)</li>
              <li>For confirmatory tests, prioritize high specificity (avoid false alarms)</li>
              <li>Balance depends on costs of false positives vs false negatives</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
