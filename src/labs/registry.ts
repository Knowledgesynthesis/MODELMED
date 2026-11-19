import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { LabId } from '@/content/types';

export interface LabMeta {
  id: LabId;
  title: string;
  summary: string;
  module: string;
  component: LazyExoticComponent<ComponentType>;
}

export const LABS: LabMeta[] = [
  { id: 'bayes', title: 'Prevalence & predictive values', summary: 'Why PPV collapses when a condition is rare — with natural-frequency icon arrays.', module: 'foundations', component: lazy(() => import('./BayesLab')) },
  { id: 'sample-size', title: 'Sample-size calculator', summary: 'Riley criteria (pmsampsize) vs the 10-events-per-variable myth.', module: 'data-design', component: lazy(() => import('./SampleSizeLab')) },
  { id: 'logistic-curve', title: 'Odds ratios vs absolute risk', summary: 'A constant OR produces very different absolute effects at different baseline risks.', module: 'logistic', component: lazy(() => import('./LogisticCurveLab')) },
  { id: 'km', title: 'Censoring & Kaplan–Meier', summary: 'Compare KM with naive estimates under heavy and informative censoring.', module: 'survival', component: lazy(() => import('./KaplanMeierLab')) },
  { id: 'tree', title: 'Grow a decision tree', summary: 'CART splits, depth, leaf size and the train–test gap on real synthetic cohorts.', module: 'trees', component: lazy(() => import('./TreeLab')) },
  { id: 'neural', title: 'Neural network playground', summary: 'Hidden units, activation, weight decay and overfitting — live backpropagation.', module: 'neural', component: lazy(() => import('./NeuralLab')) },
  { id: 'overfitting', title: 'Overfitting & optimism', summary: 'Bias–variance trade-off with error on 2,000 unseen patients.', module: 'validation', component: lazy(() => import('./OverfittingLab')) },
  { id: 'leakage', title: 'The wrong way to cross-validate', summary: 'Feature selection before CV makes pure noise look like a great model.', module: 'validation', component: lazy(() => import('./LeakageLab')) },
  { id: 'roc', title: 'ROC, PR & thresholds', summary: 'Move the threshold along a fixed ROC curve; see PPV depend on prevalence.', module: 'discrimination', component: lazy(() => import('./RocLab')) },
  { id: 'calibration', title: 'Calibration & recalibration', summary: 'Distort a perfect model; AUC stays put while the risks become wrong.', module: 'calibration', component: lazy(() => import('./CalibrationLab')) },
  { id: 'dca', title: 'Decision curve analysis', summary: 'Net benefit across thresholds; same AUC, different clinical value.', module: 'utility', component: lazy(() => import('./DcaLab')) },
  { id: 'shap', title: 'SHAP explainer', summary: 'Exact Shapley values for logistic vs boosted-tree sepsis models.', module: 'interpretability', component: lazy(() => import('./ShapLab')) },
  { id: 'fairness', title: 'Bias & fairness trade-offs', summary: 'Label-choice bias (cost vs need) and the base-rate impossibility result.', module: 'fairness', component: lazy(() => import('./FairnessLab')) },
  { id: 'drift', title: 'Monitoring after go-live', summary: 'Prior shift, case-mix shift, assay change, concept drift and feedback loops.', module: 'deployment', component: lazy(() => import('./DriftLab')) },
];

export const labById = (id: string) => LABS.find((l) => l.id === id);
