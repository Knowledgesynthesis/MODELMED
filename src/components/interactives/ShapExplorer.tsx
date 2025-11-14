import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { getAllDatasets } from '@/data/synthetic';
import { LogisticRegression, prepareData } from '@/utils/mlAlgorithms';
import { calculateShapValues } from '@/utils/shapValues';
import type { ShapValue } from '@/types';

export const ShapExplorer: React.FC = () => {
  const datasets = getAllDatasets();
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id || '');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [shapValues, setShapValues] = useState<ShapValue[]>([]);
  const [prediction, setPrediction] = useState(0);
  const [baseValue, setBaseValue] = useState(0);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const dataset = datasets.find(d => d.id === selectedDatasetId);
    if (!dataset) return;

    // Train a simple model
    const { trainX, trainY, testX, featureNames } = prepareData(dataset, 0.8);
    const model = new LogisticRegression(0.01, 1000);
    model.train(trainX, trainY);

    // Get baseline (average prediction)
    const allPredictions = model.predict(trainX);
    const baseline = allPredictions.reduce((sum, p) => sum + p, 0) / allPredictions.length;
    setBaseValue(baseline);

    // Calculate SHAP for selected sample
    if (testX.length > sampleIndex) {
      const sample = testX[sampleIndex];
      const pred = model.predict([sample])[0];
      setPrediction(pred);

      // Create model function for SHAP
      const modelFn = (x: number[]) => model.predict([x])[0];

      const shap = calculateShapValues(modelFn, sample, featureNames, baseline);
      setShapValues(shap);
    }
  }, [selectedDatasetId, sampleIndex]);

  const dataset = datasets.find(d => d.id === selectedDatasetId);
  const maxSamples = dataset ? Math.floor(dataset.samples * 0.2) - 1 : 0;

  const chartData = shapValues.map(sv => ({
    feature: sv.feature,
    contribution: sv.contribution,
    value: sv.value,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SHAP Values Explorer</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Understand how each feature contributes to individual predictions using SHAP (SHapley Additive exPlanations)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Dataset"
            value={selectedDatasetId}
            onChange={setSelectedDatasetId}
            options={datasets.map(d => ({ value: d.id, label: d.name }))}
          />

          <Select
            label="Sample to Explain"
            value={sampleIndex.toString()}
            onChange={(value) => setSampleIndex(parseInt(value))}
            options={Array.from({ length: maxSamples + 1 }, (_, i) => ({
              value: i.toString(),
              label: `Sample ${i + 1}`,
            }))}
          />

          {/* Prediction Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base Value (Population Average)</span>
              <Badge variant="outline">{(baseValue * 100).toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Final Prediction</span>
              <Badge variant={prediction >= 0.5 ? 'warning' : 'success'}>
                {(prediction * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Feature Contribution</span>
              <Badge variant="outline">
                {prediction >= baseValue ? '+' : ''}
                {((prediction - baseValue) * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Contributions</CardTitle>
          <p className="text-sm text-muted-foreground">
            How each feature pushes the prediction higher (positive) or lower (negative) from the baseline
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickFormatter={(value) => value.toFixed(2)}
                className="text-xs"
              />
              <YAxis dataKey="feature" type="category" className="text-xs" width={110} />
              <Tooltip
                formatter={(value: number) => [value.toFixed(4), 'Contribution']}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
              <Bar dataKey="contribution">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.contribution > 0 ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-3">
            <h4 className="font-semibold">Feature Values & Interpretations</h4>
            {shapValues
              .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
              .map((sv, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{sv.feature}</span>
                    <Badge variant={sv.contribution > 0 ? 'destructive' : 'success'}>
                      {sv.contribution > 0 ? '+' : ''}
                      {(sv.contribution * 100).toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Feature value: {sv.value.toFixed(3)} (normalized)
                  </div>
                  <div className="text-sm mt-1">
                    {sv.contribution > 0
                      ? `This feature increases the predicted risk by ${Math.abs(sv.contribution * 100).toFixed(1)}%`
                      : sv.contribution < 0
                      ? `This feature decreases the predicted risk by ${Math.abs(sv.contribution * 100).toFixed(1)}%`
                      : 'This feature has minimal impact on this prediction'}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Understanding SHAP Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>What are SHAP values?</strong> SHAP (SHapley Additive exPlanations) values show how much each feature contributes to pushing the prediction away from the baseline (average) prediction.
          </p>
          <p>
            <strong>How to interpret:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-red-500 font-semibold">Red bars (positive values)</span>: Features that increase the predicted risk</li>
            <li><span className="text-blue-500 font-semibold">Blue bars (negative values)</span>: Features that decrease the predicted risk</li>
            <li>Longer bars = stronger impact on the prediction</li>
          </ul>
          <p>
            <strong>Clinical use:</strong> SHAP values help clinicians understand WHY a model made a specific prediction for a specific patient, enabling trust and clinical reasoning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
