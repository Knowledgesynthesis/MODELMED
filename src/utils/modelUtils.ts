import type { ConfusionMatrix, ROCPoint, CalibrationPoint, FeatureImportance } from '@/types';

/**
 * Generate synthetic ROC curve data
 */
export function generateROCCurve(auc: number): ROCPoint[] {
  const points: ROCPoint[] = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const fpr = i / steps;
    // Generate TPR based on desired AUC
    // This is a simplified approximation
    let tpr: number;
    if (auc >= 0.9) {
      tpr = Math.min(1, fpr * 0.1 + Math.sqrt(fpr) * 0.95);
    } else if (auc >= 0.8) {
      tpr = Math.min(1, fpr * 0.2 + Math.sqrt(fpr) * 0.85);
    } else if (auc >= 0.7) {
      tpr = Math.min(1, fpr * 0.3 + Math.sqrt(fpr) * 0.75);
    } else {
      tpr = Math.min(1, fpr * 0.5 + Math.sqrt(fpr) * 0.6);
    }

    points.push({
      fpr,
      tpr,
      threshold: 1 - i / steps,
    });
  }

  return points;
}

/**
 * Generate calibration curve data
 */
export function generateCalibrationCurve(brierScore: number): CalibrationPoint[] {
  const points: CalibrationPoint[] = [];
  const bins = 10;

  for (let i = 0; i < bins; i++) {
    const predictedProbability = (i + 0.5) / bins;

    // Well-calibrated model would have observed ≈ predicted
    // Add some deviation based on Brier score
    const deviation = (Math.random() - 0.5) * brierScore * 2;
    const observedProbability = Math.max(0, Math.min(1, predictedProbability + deviation));

    points.push({
      predictedProbability,
      observedProbability,
      count: Math.floor(Math.random() * 50) + 10,
    });
  }

  return points;
}

/**
 * Calculate confusion matrix from predictions
 */
export function calculateConfusionMatrix(
  predictions: number[],
  actuals: number[],
  threshold: number
): ConfusionMatrix {
  let tp = 0, tn = 0, fp = 0, fn = 0;

  for (let i = 0; i < predictions.length; i++) {
    const predicted = predictions[i] >= threshold ? 1 : 0;
    const actual = actuals[i];

    if (predicted === 1 && actual === 1) tp++;
    else if (predicted === 0 && actual === 0) tn++;
    else if (predicted === 1 && actual === 0) fp++;
    else if (predicted === 0 && actual === 1) fn++;
  }

  return {
    truePositive: tp,
    trueNegative: tn,
    falsePositive: fp,
    falseNegative: fn,
  };
}

/**
 * Generate synthetic feature importance
 */
export function generateFeatureImportance(features: string[]): FeatureImportance[] {
  const importances = features.map((feature, index) => {
    // Generate decreasing importance with some randomness
    const baseImportance = 1 / (index + 1);
    const randomFactor = 0.8 + Math.random() * 0.4;
    return {
      feature,
      importance: baseImportance * randomFactor,
      rank: 0,
    };
  });

  // Normalize to sum to 1
  const total = importances.reduce((sum, item) => sum + item.importance, 0);
  importances.forEach(item => {
    item.importance = item.importance / total;
  });

  // Sort and assign ranks
  importances.sort((a, b) => b.importance - a.importance);
  importances.forEach((item, index) => {
    item.rank = index + 1;
  });

  return importances;
}

/**
 * Calculate model metrics from confusion matrix
 */
export function calculateMetrics(matrix: ConfusionMatrix) {
  const { truePositive: tp, trueNegative: tn, falsePositive: fp, falseNegative: fn } = matrix;
  const total = tp + tn + fp + fn;

  return {
    accuracy: (tp + tn) / total,
    sensitivity: tp / (tp + fn),
    specificity: tn / (tn + fp),
    ppv: tp / (tp + fp),
    npv: tn / (tn + fn),
    prevalence: (tp + fn) / total,
  };
}
