import type { AssessmentQuestion } from '@/types';

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'q1',
    moduleId: 'metrics',
    type: 'multiple-choice',
    bloomLevel: 'understand',
    question: 'A sepsis prediction model has an AUC of 0.85. What does this mean?',
    options: [
      'The model is 85% accurate',
      'There is an 85% chance the model will rank a random sepsis patient higher than a random non-sepsis patient',
      '85% of patients will be correctly classified',
      'The model has 85% sensitivity'
    ],
    correctAnswer: 1,
    explanation: 'AUC represents the probability that the model will rank a randomly chosen positive case higher than a randomly chosen negative case. It is a measure of discrimination, not accuracy. An AUC of 0.85 means there is an 85% probability of correct ranking.',
    references: ['https://doi.org/10.1148/radiology.143.1.7063747']
  },
  {
    id: 'q2',
    moduleId: 'calibration',
    type: 'case-based',
    bloomLevel: 'analyze',
    question: 'A readmission risk model predicts 30% risk for 100 patients, but 45 are actually readmitted. What calibration issue exists?',
    options: [
      'The model is well-calibrated',
      'The model underestimates risk',
      'The model overestimates risk',
      'Cannot determine from this information'
    ],
    correctAnswer: 1,
    explanation: 'The model predicted 30% risk but 45% were actually readmitted, meaning the model systematically underestimated the risk of readmission. A well-calibrated model would have approximately 30 readmissions when predicting 30% risk for 100 patients.',
  },
  {
    id: 'q3',
    moduleId: 'interpretability',
    type: 'multiple-choice',
    bloomLevel: 'apply',
    question: 'SHAP values for a patient show: Age (+0.2), Lactate (+0.3), Temperature (-0.1). What does the Temperature contribution mean?',
    options: [
      'Temperature increased the sepsis risk prediction',
      'Temperature decreased the sepsis risk prediction',
      'Temperature is not important for this patient',
      'The model is poorly calibrated for temperature'
    ],
    correctAnswer: 1,
    explanation: 'Negative SHAP values indicate that a feature decreased the predicted risk compared to the baseline. In this case, the patient\'s temperature reading decreased their predicted sepsis risk by 0.1.',
  },
  {
    id: 'q4',
    moduleId: 'training-validation',
    type: 'multiple-choice',
    bloomLevel: 'analyze',
    question: 'A model achieves 95% accuracy on training data but only 68% on test data. What is the most likely issue?',
    options: [
      'The model is underfitting',
      'The model is overfitting',
      'The test data is biased',
      'The model needs more features'
    ],
    correctAnswer: 1,
    explanation: 'This is a classic sign of overfitting. The model has learned the training data too well, including noise and specific patterns that don\'t generalize to new data. The large gap between training and test performance indicates the model is not generalizing well.',
  },
  {
    id: 'q5',
    moduleId: 'bias-fairness',
    type: 'case-based',
    bloomLevel: 'evaluate',
    question: 'A model trained primarily on data from academic medical centers is deployed at a community hospital. What is the primary concern?',
    options: [
      'The model will be too accurate',
      'The model may not generalize to the community hospital population',
      'The model will need retraining every month',
      'The model will be too slow'
    ],
    correctAnswer: 1,
    explanation: 'Models can suffer from dataset shift and selection bias. Academic medical centers often have different patient populations, disease severity, and practice patterns compared to community hospitals. A model trained on one population may not perform well on another due to these differences.',
  },
  {
    id: 'q6',
    moduleId: 'logistic-regression',
    type: 'multiple-choice',
    bloomLevel: 'understand',
    question: 'In logistic regression, an odds ratio of 2.5 for age means:',
    options: [
      'Older patients are 2.5 times more likely to have the outcome',
      'Each unit increase in age multiplies the odds by 2.5',
      'Age explains 2.5% of the variance',
      'The model is 2.5 times better than random'
    ],
    correctAnswer: 1,
    explanation: 'An odds ratio represents the multiplicative change in odds for each unit increase in the predictor. An OR of 2.5 for age means that for each additional year of age, the odds of the outcome are multiplied by 2.5.',
  },
  {
    id: 'q7',
    moduleId: 'metrics',
    type: 'multiple-choice',
    bloomLevel: 'apply',
    question: 'For a screening test where missing cases is dangerous, which metric should be prioritized?',
    options: [
      'Specificity',
      'Sensitivity',
      'Positive Predictive Value',
      'Accuracy'
    ],
    correctAnswer: 1,
    explanation: 'Sensitivity (recall) measures the proportion of actual positive cases that are correctly identified. For screening where missing cases (false negatives) is dangerous, high sensitivity is crucial to ensure most true cases are detected, even at the cost of more false positives.',
  },
  {
    id: 'q8',
    moduleId: 'tree-models',
    type: 'multiple-choice',
    bloomLevel: 'understand',
    question: 'What is the main advantage of random forests over single decision trees?',
    options: [
      'Random forests are faster to train',
      'Random forests are easier to interpret',
      'Random forests reduce overfitting through ensemble averaging',
      'Random forests require less data'
    ],
    correctAnswer: 2,
    explanation: 'Random forests combine multiple decision trees trained on different subsets of data and features. This ensemble approach reduces overfitting because the individual trees\' errors tend to cancel out, leading to more stable and generalizable predictions.',
  },
  {
    id: 'q9',
    moduleId: 'survival-models',
    type: 'multiple-choice',
    bloomLevel: 'understand',
    question: 'What does "censoring" mean in survival analysis?',
    options: [
      'Removing outliers from the dataset',
      'When we know a patient did not experience the event by a certain time, but do not know if/when it occurred after',
      'Excluding certain patient groups from analysis',
      'Adjusting for confounding variables'
    ],
    correctAnswer: 1,
    explanation: 'Censoring occurs when we have incomplete information about the event time. Right-censoring (most common) means we know the patient had not experienced the event by the last follow-up time, but we don\'t know if or when it occurred afterward. Survival models can properly account for this incomplete information.',
  },
  {
    id: 'q10',
    moduleId: 'calibration',
    type: 'true-false',
    bloomLevel: 'analyze',
    question: 'A model can have high AUC but poor calibration.',
    correctAnswer: 0,
    explanation: 'True. AUC measures discrimination (the ability to rank patients correctly) while calibration measures whether predicted probabilities match observed frequencies. A model might rank patients perfectly (high AUC) but systematically over- or under-estimate actual risk (poor calibration). Both metrics are important for clinical use.',
  }
];

export function getQuestionsByModule(moduleId: string): AssessmentQuestion[] {
  return assessmentQuestions.filter(q => q.moduleId === moduleId);
}

export function getRandomQuestions(count: number): AssessmentQuestion[] {
  const shuffled = [...assessmentQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
