/**
 * Simple ML algorithm implementations for educational purposes
 * These are simplified versions to demonstrate concepts, not production-ready
 */

import type { SyntheticDataset, ModelMetrics, Prediction, Coefficient } from '@/types';

/**
 * Logistic Regression using gradient descent
 */
export class LogisticRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.01;
  private iterations: number = 1000;

  constructor(learningRate = 0.01, iterations = 1000) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  train(X: number[][], y: number[]): void {
    const numSamples = X.length;
    const numFeatures = X[0].length;

    // Initialize weights
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    // Gradient descent
    for (let iter = 0; iter < this.iterations; iter++) {
      let dw = new Array(numFeatures).fill(0);
      let db = 0;

      for (let i = 0; i < numSamples; i++) {
        const z = X[i].reduce((sum, x, j) => sum + x * this.weights[j], 0) + this.bias;
        const pred = this.sigmoid(z);
        const error = pred - y[i];

        for (let j = 0; j < numFeatures; j++) {
          dw[j] += error * X[i][j];
        }
        db += error;
      }

      // Update weights
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= (this.learningRate * dw[j]) / numSamples;
      }
      this.bias -= (this.learningRate * db) / numSamples;
    }
  }

  predict(X: number[][]): number[] {
    return X.map(x => {
      const z = x.reduce((sum, val, j) => sum + val * this.weights[j], 0) + this.bias;
      return this.sigmoid(z);
    });
  }

  getCoefficients(featureNames: string[]): Coefficient[] {
    return this.weights.map((weight, i) => ({
      feature: featureNames[i],
      value: weight,
      oddsRatio: Math.exp(weight),
      confidenceInterval: [Math.exp(weight - 1.96 * 0.1), Math.exp(weight + 1.96 * 0.1)],
    }));
  }
}

/**
 * Simple Decision Tree (single tree, not forest)
 */
export class DecisionTree {
  private tree: TreeNode | null = null;
  private maxDepth: number = 5;
  private minSamplesSplit: number = 10;

  constructor(maxDepth = 5, minSamplesSplit = 10) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  private giniImpurity(y: number[]): number {
    if (y.length === 0) return 0;
    const p1 = y.filter(val => val === 1).length / y.length;
    return 2 * p1 * (1 - p1);
  }

  private findBestSplit(X: number[][], y: number[], featureIdx: number): { threshold: number; gain: number } {
    const values = X.map(row => row[featureIdx]);
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

    let bestThreshold = uniqueValues[0];
    let bestGain = 0;

    const parentGini = this.giniImpurity(y);

    for (let i = 0; i < uniqueValues.length - 1; i++) {
      const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

      const leftY: number[] = [];
      const rightY: number[] = [];

      for (let j = 0; j < X.length; j++) {
        if (X[j][featureIdx] <= threshold) {
          leftY.push(y[j]);
        } else {
          rightY.push(y[j]);
        }
      }

      if (leftY.length === 0 || rightY.length === 0) continue;

      const leftGini = this.giniImpurity(leftY);
      const rightGini = this.giniImpurity(rightY);
      const weightedGini = (leftY.length * leftGini + rightY.length * rightGini) / y.length;
      const gain = parentGini - weightedGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestThreshold = threshold;
      }
    }

    return { threshold: bestThreshold, gain: bestGain };
  }

  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const numSamples = y.length;
    const numFeatures = X[0].length;

    // Leaf node conditions
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || new Set(y).size === 1) {
      const prediction = y.filter(val => val === 1).length / y.length;
      return { value: prediction, isLeaf: true };
    }

    // Find best split
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestGain = 0;

    for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
      const { threshold, gain } = this.findBestSplit(X, y, featureIdx);
      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = featureIdx;
        bestThreshold = threshold;
      }
    }

    if (bestGain === 0) {
      const prediction = y.filter(val => val === 1).length / y.length;
      return { value: prediction, isLeaf: true };
    }

    // Split data
    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    for (let i = 0; i < X.length; i++) {
      if (X[i][bestFeature] <= bestThreshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return {
      featureIdx: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1),
      isLeaf: false,
    };
  }

  train(X: number[][], y: number[]): void {
    this.tree = this.buildTree(X, y, 0);
  }

  private predictSample(x: number[], node: TreeNode): number {
    if (node.isLeaf) {
      return node.value!;
    }

    if (x[node.featureIdx!] <= node.threshold!) {
      return this.predictSample(x, node.left!);
    } else {
      return this.predictSample(x, node.right!);
    }
  }

  predict(X: number[][]): number[] {
    if (!this.tree) return [];
    return X.map(x => this.predictSample(x, this.tree!));
  }
}

interface TreeNode {
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number;
  isLeaf: boolean;
}

/**
 * Random Forest (ensemble of decision trees)
 */
export class RandomForest {
  private trees: DecisionTree[] = [];
  private numTrees: number = 10;
  private maxDepth: number = 5;

  constructor(numTrees = 10, maxDepth = 5) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
  }

  private bootstrapSample(X: number[][], y: number[]): { X: number[][], y: number[] } {
    const n = X.length;
    const indices = Array.from({ length: n }, () => Math.floor(Math.random() * n));
    return {
      X: indices.map(i => X[i]),
      y: indices.map(i => y[i]),
    };
  }

  train(X: number[][], y: number[]): void {
    this.trees = [];
    for (let i = 0; i < this.numTrees; i++) {
      const { X: bootX, y: bootY } = this.bootstrapSample(X, y);
      const tree = new DecisionTree(this.maxDepth);
      tree.train(bootX, bootY);
      this.trees.push(tree);
    }
  }

  predict(X: number[][]): number[] {
    const predictions = this.trees.map(tree => tree.predict(X));

    // Average predictions from all trees
    return X.map((_, i) => {
      const treePreds = predictions.map(p => p[i]);
      return treePreds.reduce((sum, p) => sum + p, 0) / treePreds.length;
    });
  }
}

/**
 * Prepare data from dataset
 */
export function prepareData(dataset: SyntheticDataset, trainRatio = 0.7): {
  trainX: number[][];
  trainY: number[];
  testX: number[][];
  testY: number[];
  featureNames: string[];
} {
  const data = dataset.data;
  const features = dataset.features;
  const target = dataset.target.name;

  // Shuffle data
  const shuffled = [...data].sort(() => Math.random() - 0.5);

  // Extract features and target
  const X: number[][] = [];
  const y: number[] = [];
  const featureNames: string[] = features.map(f => f.name);

  for (const row of shuffled) {
    const featureVals: number[] = [];
    for (const feature of features) {
      let val = row[feature.name];

      // Handle categorical/binary features
      if (feature.type === 'binary' || feature.type === 'categorical') {
        val = val === 'Yes' || val === 1 ? 1 : 0;
      }

      featureVals.push(Number(val));
    }
    X.push(featureVals);
    y.push(Number(row[target]));
  }

  // Normalize features
  const normalized = normalizeFeatures(X);

  // Split train/test
  const trainSize = Math.floor(X.length * trainRatio);

  return {
    trainX: normalized.slice(0, trainSize),
    trainY: y.slice(0, trainSize),
    testX: normalized.slice(trainSize),
    testY: y.slice(trainSize),
    featureNames,
  };
}

function normalizeFeatures(X: number[][]): number[][] {
  const numFeatures = X[0].length;
  const means: number[] = [];
  const stds: number[] = [];

  // Calculate mean and std for each feature
  for (let j = 0; j < numFeatures; j++) {
    const values = X.map(row => row[j]);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    means.push(mean);
    stds.push(std || 1); // Avoid division by zero
  }

  // Normalize
  return X.map(row =>
    row.map((val, j) => (val - means[j]) / stds[j])
  );
}

/**
 * Calculate model metrics
 */
export function calculateModelMetrics(predictions: number[], actual: number[], threshold = 0.5): ModelMetrics {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  let brierSum = 0;

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i] >= threshold ? 1 : 0;
    const act = actual[i];

    if (pred === 1 && act === 1) tp++;
    else if (pred === 0 && act === 0) tn++;
    else if (pred === 1 && act === 0) fp++;
    else if (pred === 0 && act === 1) fn++;

    // Brier score
    brierSum += Math.pow(predictions[i] - act, 2);
  }

  const accuracy = (tp + tn) / predictions.length;
  const sensitivity = tp / (tp + fn) || 0;
  const specificity = tn / (tn + fp) || 0;
  const ppv = tp / (tp + fp) || 0;
  const npv = tn / (tn + fn) || 0;
  const brierScore = brierSum / predictions.length;

  // Calculate AUC using trapezoidal rule
  const auc = calculateAUC(predictions, actual);

  return {
    accuracy,
    sensitivity,
    specificity,
    ppv,
    npv,
    auc,
    brierScore,
  };
}

function calculateAUC(predictions: number[], actual: number[]): number {
  // Sort by prediction score
  const sorted = predictions
    .map((pred, i) => ({ pred, actual: actual[i] }))
    .sort((a, b) => b.pred - a.pred);

  let auc = 0;
  let tpCount = 0;
  const numPositive = actual.filter(a => a === 1).length;
  const numNegative = actual.length - numPositive;

  if (numPositive === 0 || numNegative === 0) return 0.5;

  for (const item of sorted) {
    if (item.actual === 1) {
      tpCount++;
    } else {
      auc += tpCount;
    }
  }

  return auc / (numPositive * numNegative);
}

/**
 * Generate predictions with IDs
 */
export function generatePredictions(
  predictions: number[],
  actual: number[],
  threshold = 0.5
): Prediction[] {
  return predictions.map((prob, i) => ({
    id: `pred-${i}`,
    actual: actual[i],
    predicted: prob >= threshold ? 1 : 0,
    probability: prob,
    correct: (prob >= threshold ? 1 : 0) === actual[i],
  }));
}
