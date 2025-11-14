import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { CalibrationPoint } from '@/types';
import { formatPercentage } from '@/lib/utils';

interface CalibrationPlotProps {
  data: CalibrationPoint[];
  brierScore: number;
  className?: string;
}

export const CalibrationPlot: React.FC<CalibrationPlotProps> = ({ data, brierScore, className }) => {
  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Calibration Plot</h3>
        <p className="text-sm text-muted-foreground">
          Brier Score = {brierScore.toFixed(3)}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="predictedProbability"
            label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -5 }}
            tickFormatter={(value) => formatPercentage(value, 0)}
            domain={[0, 1]}
            className="text-xs"
          />
          <YAxis
            dataKey="observedProbability"
            label={{ value: 'Observed Frequency', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => formatPercentage(value, 0)}
            domain={[0, 1]}
            className="text-xs"
          />
          <Tooltip
            formatter={(value: number) => formatPercentage(value)}
            labelFormatter={(label) => `Predicted: ${formatPercentage(label as number)}`}
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
          />
          <Legend />
          <ReferenceLine
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            label="Perfect Calibration"
          />
          <Line
            type="monotone"
            dataKey="observedProbability"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Model Calibration"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
