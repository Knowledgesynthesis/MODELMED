/**
 * Simplified SHAP value calculation for educational purposes
 * This is a demonstration version, not a full SHAP implementation
 */

import type { ShapValue } from '@/types';

/**
 * Calculate approximate SHAP values using a simplified approach
 * For educational purposes - shows the concept of feature contributions
 */
export function calculateShapValues(
  model: (x: number[]) => number,
  sample: number[],
  featureNames: string[],
  baseline: number
): ShapValue[] {
  const shapValues: ShapValue[] = [];
  const basePrediction = model(sample);

  for (let i = 0; i < sample.length; i++) {
    // Create a version with this feature "removed" (set to 0, as features are normalized)
    const sampleWithoutFeature = [...sample];
    sampleWithoutFeature[i] = 0;

    const predWithoutFeature = model(sampleWithoutFeature);
    const contribution = basePrediction - predWithoutFeature;

    shapValues.push({
      feature: featureNames[i],
      value: sample[i],
      baseValue: baseline,
      contribution: contribution,
    });
  }

  return shapValues;
}

/**
 * Calculate feature importance from model
 * Uses permutation importance approach
 */
export function calculatePermutationImportance(
  model: (X: number[][]) => number[],
  X: number[][],
  y: number[],
  featureNames: string[]
): { feature: string; importance: number; rank: number }[] {
  // Baseline score
  const basePredictions = model(X);
  const baseScore = calculateScore(basePredictions, y);

  const importances: { feature: string; importance: number; rank: number }[] = [];

  // Permute each feature
  for (let featureIdx = 0; featureIdx < X[0].length; featureIdx++) {
    // Save original values
    const originalValues = X.map(row => row[featureIdx]);

    // Shuffle this feature
    const shuffled = [...originalValues].sort(() => Math.random() - 0.5);
    X.forEach((row, i) => {
      row[featureIdx] = shuffled[i];
    });

    // Calculate new score
    const permutedPredictions = model(X);
    const permutedScore = calculateScore(permutedPredictions, y);

    // Importance is the drop in performance
    const importance = Math.max(0, baseScore - permutedScore);

    importances.push({
      feature: featureNames[featureIdx],
      importance,
      rank: 0,
    });

    // Restore original values
    X.forEach((row, i) => {
      row[featureIdx] = originalValues[i];
    });
  }

  // Normalize importances
  const total = importances.reduce((sum, item) => sum + item.importance, 0);
  if (total > 0) {
    importances.forEach(item => {
      item.importance = item.importance / total;
    });
  }

  // Sort and rank
  importances.sort((a, b) => b.importance - a.importance);
  importances.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return importances;
}

function calculateScore(predictions: number[], actual: number[]): number {
  // Use accuracy for binary classification
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i] >= 0.5 ? 1 : 0;
    if (pred === actual[i]) correct++;
  }
  return correct / predictions.length;
}
