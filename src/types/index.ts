// Core types for ModelMed application

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export type LearnerLevel = 'MS2' | 'MS3' | 'MS4' | 'Resident' | 'Fellow' | 'Clinician' | 'Researcher';

export type ModuleId =
  | 'foundations'
  | 'logistic-regression'
  | 'survival-models'
  | 'tree-models'
  | 'neural-networks'
  | 'training-validation'
  | 'metrics'
  | 'interpretability'
  | 'bias-fairness'
  | 'calibration'
  | 'sandbox';

export interface Module {
  id: ModuleId;
  title: string;
  description: string;
  icon: string;
  prerequisites: ModuleId[];
  bloomLevel: BloomLevel[];
  estimatedTime: number; // in minutes
  topics: Topic[];
  completed: boolean;
  progress: number; // 0-100
}

export interface Topic {
  id: string;
  title: string;
  content: string;
  bloomLevel: BloomLevel;
  examples?: Example[];
  visualizations?: Visualization[];
}

export interface Example {
  id: string;
  title: string;
  scenario: string;
  data?: any;
  explanation: string;
}

export interface Visualization {
  id: string;
  type: 'static' | 'interactive';
  component: string;
  props?: Record<string, any>;
}

export interface SyntheticDataset {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  target: Target;
  samples: number;
  data: Record<string, any>[];
}

export interface Feature {
  name: string;
  type: 'continuous' | 'categorical' | 'binary';
  description: string;
  unit?: string;
  range?: [number, number];
  categories?: string[];
}

export interface Target {
  name: string;
  type: 'binary' | 'continuous' | 'time-to-event';
  description: string;
}

export interface ModelConfig {
  id: string;
  type: 'logistic' | 'tree' | 'forest' | 'gradient-boost' | 'neural-network' | 'cox';
  name: string;
  parameters: Record<string, any>;
}

export interface ModelResult {
  id: string;
  modelId: string;
  datasetId: string;
  trainSize: number;
  testSize: number;
  metrics: ModelMetrics;
  predictions: Prediction[];
  coefficients?: Coefficient[];
  featureImportance?: FeatureImportance[];
  shapValues?: ShapValue[];
}

export interface ModelMetrics {
  accuracy?: number;
  sensitivity?: number;
  specificity?: number;
  ppv?: number;
  npv?: number;
  auc?: number;
  brierScore?: number;
  calibrationSlope?: number;
  calibrationIntercept?: number;
  cIndex?: number; // for survival models
}

export interface Prediction {
  id: string;
  actual: number;
  predicted: number;
  probability?: number;
  correct?: boolean;
}

export interface Coefficient {
  feature: string;
  value: number;
  standardError?: number;
  pValue?: number;
  oddsRatio?: number;
  confidenceInterval?: [number, number];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  rank: number;
}

export interface ShapValue {
  feature: string;
  value: number;
  baseValue: number;
  contribution: number;
}

export interface ROCPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface CalibrationPoint {
  predictedProbability: number;
  observedProbability: number;
  count: number;
}

export interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export interface AssessmentQuestion {
  id: string;
  moduleId: ModuleId;
  type: 'multiple-choice' | 'true-false' | 'case-based';
  bloomLevel: BloomLevel;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  references?: string[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  relatedTerms?: string[];
  moduleId?: ModuleId;
  example?: string;
}

export interface UserProgress {
  moduleProgress: Record<ModuleId, number>;
  completedModules: ModuleId[];
  assessmentScores: Record<string, number>;
  totalTimeSpent: number;
  lastAccessed: Date;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  systemPreference: boolean;
}
