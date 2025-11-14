import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ROCPoint } from '@/types';
import { formatPercentage } from '@/lib/utils';

interface ROCCurveProps {
  data: ROCPoint[];
  auc: number;
  className?: string;
}

export const ROCCurve: React.FC<ROCCurveProps> = ({ data, auc, className }) => {
  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">ROC Curve</h3>
        <p className="text-sm text-muted-foreground">
          AUC = {auc.toFixed(3)}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="fpr"
            label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5 }}
            tickFormatter={(value) => formatPercentage(value, 0)}
            className="text-xs"
          />
          <YAxis
            dataKey="tpr"
            label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => formatPercentage(value, 0)}
            className="text-xs"
          />
          <Tooltip
            formatter={(value: number) => formatPercentage(value)}
            labelFormatter={(label) => `FPR: ${formatPercentage(label as number)}`}
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
          />
          <Legend />
          <ReferenceLine
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            label="Random Classifier"
          />
          <Line
            type="monotone"
            dataKey="tpr"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            name="Model ROC"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
