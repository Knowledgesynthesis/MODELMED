import type { GlossaryTerm } from '@/types';

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: 'auc',
    term: 'AUC (Area Under the Curve)',
    definition: 'A measure of model discrimination - the probability that the model ranks a random positive case higher than a random negative case. Ranges from 0.5 (no discrimination) to 1.0 (perfect discrimination).',
    relatedTerms: ['roc-curve', 'sensitivity', 'specificity'],
    moduleId: 'metrics',
    example: 'An AUC of 0.85 means there is an 85% chance the model will rank a randomly chosen patient who develops sepsis higher than a randomly chosen patient who does not.'
  },
  {
    id: 'roc-curve',
    term: 'ROC Curve (Receiver Operating Characteristic)',
    definition: 'A plot showing the trade-off between sensitivity (true positive rate) and 1-specificity (false positive rate) across different classification thresholds.',
    relatedTerms: ['auc', 'sensitivity', 'specificity', 'threshold'],
    moduleId: 'metrics',
    example: 'The ROC curve helps visualize how changing the decision threshold affects the balance between detecting true positives and avoiding false positives.'
  },
  {
    id: 'calibration',
    term: 'Calibration',
    definition: 'The agreement between predicted probabilities and observed outcomes. A well-calibrated model predicts 30% probability for events that actually occur 30% of the time.',
    relatedTerms: ['brier-score', 'calibration-plot'],
    moduleId: 'calibration',
    example: 'If a model predicts 20% risk for 100 patients, about 20 of them should actually experience the outcome for good calibration.'
  },
  {
    id: 'brier-score',
    term: 'Brier Score',
    definition: 'A measure of the accuracy of probabilistic predictions. Calculated as the mean squared difference between predicted probabilities and actual outcomes. Lower is better (0 = perfect, 1 = worst).',
    relatedTerms: ['calibration'],
    moduleId: 'metrics',
    example: 'A Brier score of 0.15 indicates better calibration than a score of 0.25.'
  },
  {
    id: 'shap',
    term: 'SHAP (SHapley Additive exPlanations)',
    definition: 'A unified approach to explain model predictions by computing the contribution of each feature to a prediction, based on game theory.',
    relatedTerms: ['feature-importance', 'lime', 'interpretability'],
    moduleId: 'interpretability',
    example: 'SHAP values show that for this patient, high lactate (+0.3) and low blood pressure (+0.2) increased sepsis risk, while normal temperature (-0.1) decreased it.'
  },
  {
    id: 'lime',
    term: 'LIME (Local Interpretable Model-agnostic Explanations)',
    definition: 'A technique that explains individual predictions by approximating the model locally with an interpretable model.',
    relatedTerms: ['shap', 'interpretability'],
    moduleId: 'interpretability'
  },
  {
    id: 'overfitting',
    term: 'Overfitting',
    definition: 'When a model learns the training data too well, including noise and random fluctuations, leading to poor performance on new data.',
    relatedTerms: ['underfitting', 'cross-validation', 'regularization'],
    moduleId: 'training-validation',
    example: 'A model with 99% accuracy on training data but only 65% on test data is overfitting.'
  },
  {
    id: 'underfitting',
    term: 'Underfitting',
    definition: 'When a model is too simple to capture the underlying patterns in the data, resulting in poor performance on both training and test data.',
    relatedTerms: ['overfitting', 'model-complexity'],
    moduleId: 'training-validation'
  },
  {
    id: 'cross-validation',
    term: 'Cross-Validation',
    definition: 'A resampling technique that divides data into multiple folds, training on some folds and validating on others, to assess model performance more reliably.',
    relatedTerms: ['overfitting', 'train-test-split'],
    moduleId: 'training-validation',
    example: '5-fold cross-validation divides data into 5 parts, trains on 4, tests on 1, and repeats 5 times.'
  },
  {
    id: 'sensitivity',
    term: 'Sensitivity (Recall, True Positive Rate)',
    definition: 'The proportion of actual positive cases that are correctly identified by the model. Sensitivity = TP / (TP + FN).',
    relatedTerms: ['specificity', 'ppv', 'npv'],
    moduleId: 'metrics',
    example: 'A sensitivity of 90% means the model correctly identifies 90% of patients who actually have the condition.'
  },
  {
    id: 'specificity',
    term: 'Specificity (True Negative Rate)',
    definition: 'The proportion of actual negative cases that are correctly identified by the model. Specificity = TN / (TN + FP).',
    relatedTerms: ['sensitivity', 'ppv', 'npv'],
    moduleId: 'metrics',
    example: 'A specificity of 85% means the model correctly identifies 85% of patients who do not have the condition.'
  },
  {
    id: 'ppv',
    term: 'PPV (Positive Predictive Value)',
    definition: 'The proportion of positive predictions that are correct. PPV = TP / (TP + FP). Depends on disease prevalence.',
    relatedTerms: ['npv', 'sensitivity', 'specificity'],
    moduleId: 'metrics',
    example: 'A PPV of 70% means that 70% of patients predicted to have the disease actually have it.'
  },
  {
    id: 'feature-importance',
    term: 'Feature Importance',
    definition: 'A measure of how much each input feature contributes to model predictions. Different methods exist for different model types.',
    relatedTerms: ['shap', 'permutation-importance'],
    moduleId: 'interpretability',
    example: 'In a readmission model, age might have importance of 0.35, indicating it is the most influential feature.'
  },
  {
    id: 'algorithmic-bias',
    term: 'Algorithmic Bias',
    definition: 'Systematic errors in model predictions that disadvantage certain groups, often arising from biased training data or inappropriate problem framing.',
    relatedTerms: ['fairness', 'disparate-impact'],
    moduleId: 'bias-fairness',
    example: 'A model trained on data from one hospital system may perform poorly for patients from different demographic backgrounds.'
  },
  {
    id: 'cox-model',
    term: 'Cox Proportional Hazards Model',
    definition: 'A regression model for time-to-event data that estimates the effect of covariates on the hazard rate while assuming proportional hazards over time.',
    relatedTerms: ['survival-analysis', 'hazard-ratio', 'kaplan-meier'],
    moduleId: 'survival-models',
    example: 'A Cox model can predict time to hospital readmission while accounting for censored observations (patients still at risk).'
  }
];

export function getTermById(id: string): GlossaryTerm | undefined {
  return glossaryTerms.find(term => term.id === id);
}

export function searchTerms(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return glossaryTerms.filter(term =>
    term.term.toLowerCase().includes(lowerQuery) ||
    term.definition.toLowerCase().includes(lowerQuery)
  );
}
