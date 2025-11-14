import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { FeatureImportance } from '@/types';

interface FeatureImportanceChartProps {
  data: FeatureImportance[];
  className?: string;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ data, className }) => {
  // Sort by importance
  const sortedData = [...data].sort((a, b) => b.importance - a.importance);

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Feature Importance</h3>
        <p className="text-sm text-muted-foreground">
          Relative contribution of each feature to model predictions
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tickFormatter={(value) => value.toFixed(2)} className="text-xs" />
          <YAxis dataKey="feature" type="category" className="text-xs" width={90} />
          <Tooltip
            formatter={(value: number) => value.toFixed(3)}
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="importance" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
