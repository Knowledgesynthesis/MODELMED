import React from 'react';
import type { ConfusionMatrix } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';

interface ConfusionMatrixVizProps {
  matrix: ConfusionMatrix;
  className?: string;
}

export const ConfusionMatrixViz: React.FC<ConfusionMatrixVizProps> = ({ matrix, className }) => {
  const total = matrix.truePositive + matrix.trueNegative + matrix.falsePositive + matrix.falseNegative;
  const sensitivity = matrix.truePositive / (matrix.truePositive + matrix.falseNegative);
  const specificity = matrix.trueNegative / (matrix.trueNegative + matrix.falsePositive);
  const ppv = matrix.truePositive / (matrix.truePositive + matrix.falsePositive);
  const npv = matrix.trueNegative / (matrix.trueNegative + matrix.falseNegative);
  const accuracy = (matrix.truePositive + matrix.trueNegative) / total;

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Confusion Matrix</h3>
        <p className="text-sm text-muted-foreground">
          Performance breakdown of predictions
        </p>
      </div>

      <div className="space-y-4">
        {/* Matrix Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <div className="text-center text-sm font-medium">Predicted Positive</div>
          <div className="text-center text-sm font-medium">Predicted Negative</div>

          <div className="text-sm font-medium flex items-center">Actual Positive</div>
          <Card className="bg-green-500/20 border-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{matrix.truePositive}</div>
              <div className="text-xs text-muted-foreground">True Positive</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/20 border-red-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{matrix.falseNegative}</div>
              <div className="text-xs text-muted-foreground">False Negative</div>
            </CardContent>
          </Card>

          <div className="text-sm font-medium flex items-center">Actual Negative</div>
          <Card className="bg-red-500/20 border-red-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{matrix.falsePositive}</div>
              <div className="text-xs text-muted-foreground">False Positive</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/20 border-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{matrix.trueNegative}</div>
              <div className="text-xs text-muted-foreground">True Negative</div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Accuracy</div>
              <div className="text-lg font-bold">{(accuracy * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Sensitivity</div>
              <div className="text-lg font-bold">{(sensitivity * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Specificity</div>
              <div className="text-lg font-bold">{(specificity * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">PPV</div>
              <div className="text-lg font-bold">{(ppv * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">NPV</div>
              <div className="text-lg font-bold">{(npv * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold">{total}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
