import type { Module } from '@/types';

export const modulesData: Module[] = [
  {
    id: 'foundations',
    title: 'Foundations of Predictive Modeling',
    description: 'Understand what predictive models are, how they work, and their role in clinical decision-making.',
    icon: 'BookOpen',
    prerequisites: [],
    bloomLevel: ['remember', 'understand'],
    estimatedTime: 30,
    topics: [
      {
        id: 'what-is-model',
        title: 'What is a Predictive Model?',
        bloomLevel: 'understand',
        content: `A predictive model is a mathematical framework that learns patterns from historical data to make predictions about future or unknown outcomes.

**Key Components:**
- **Inputs (Features):** Patient characteristics, lab values, vital signs, medical history
- **Output (Target):** The outcome we want to predict (e.g., disease diagnosis, readmission, mortality)
- **Algorithm:** The mathematical method that learns the relationship between inputs and outputs

**Clinical Context:**
Predictive models help clinicians estimate risk, guide treatment decisions, and allocate resources. Unlike traditional statistical models used for understanding causal relationships, predictive models prioritize accurate forecasting.`,
      },
      {
        id: 'supervised-learning',
        title: 'Supervised Learning Basics',
        bloomLevel: 'understand',
        content: `Most clinical prediction models use supervised learning, where the model learns from labeled examples.

**Process:**
1. **Training:** Model learns patterns from historical data where outcomes are known
2. **Validation:** Model performance is tested on held-out data
3. **Deployment:** Model makes predictions on new cases

**Types of Prediction:**
- **Classification:** Predicting categories (e.g., sepsis vs. no sepsis)
- **Regression:** Predicting continuous values (e.g., length of stay)
- **Time-to-event:** Predicting when something will occur (e.g., survival analysis)`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'logistic-regression',
    title: 'Logistic Regression & Linear Models',
    description: 'Learn how logistic regression models probability and interpretable coefficients.',
    icon: 'Activity',
    prerequisites: ['foundations'],
    bloomLevel: ['understand', 'apply'],
    estimatedTime: 45,
    topics: [
      {
        id: 'logistic-basics',
        title: 'Logistic Regression Fundamentals',
        bloomLevel: 'understand',
        content: `Logistic regression is a fundamental method for binary classification that models the probability of an outcome.

**The Logistic Function:**
Transforms a linear combination of features into a probability between 0 and 1.

**Interpretation:**
- **Coefficients:** Represent the change in log-odds for each unit increase in the feature
- **Odds Ratios:** exp(coefficient) gives the multiplicative change in odds
- **P-values:** Indicate statistical significance, but not clinical importance

**Strengths:**
- Interpretable coefficients
- Well-established statistical theory
- Performs well with appropriate features
- Provides probability estimates

**Limitations:**
- Assumes linear relationship in log-odds
- Cannot capture complex interactions without explicit specification
- May underfit complex patterns`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'survival-models',
    title: 'Survival Analysis',
    description: 'Understand time-to-event modeling with Kaplan-Meier and Cox proportional hazards.',
    icon: 'TrendingUp',
    prerequisites: ['foundations'],
    bloomLevel: ['understand', 'apply'],
    estimatedTime: 50,
    topics: [
      {
        id: 'survival-basics',
        title: 'Introduction to Survival Analysis',
        bloomLevel: 'understand',
        content: `Survival analysis models the time until an event occurs, properly handling censored observations.

**Key Concepts:**
- **Event:** The outcome of interest (death, readmission, disease recurrence)
- **Time:** Duration from a starting point until event or last follow-up
- **Censoring:** When event status is unknown (usually right-censored)

**Why Survival Analysis?**
- Properly handles incomplete follow-up
- Accounts for time-varying risk
- Provides hazard ratios for interpretation

**Clinical Applications:**
- Time to hospital readmission
- Disease-free survival
- Time to treatment failure
- Patient prognosis estimation`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'tree-models',
    title: 'Tree-Based Models',
    description: 'Explore decision trees, random forests, and gradient boosting for complex pattern recognition.',
    icon: 'GitBranch',
    prerequisites: ['foundations', 'logistic-regression'],
    bloomLevel: ['understand', 'apply', 'analyze'],
    estimatedTime: 55,
    topics: [
      {
        id: 'decision-trees',
        title: 'Decision Trees',
        bloomLevel: 'understand',
        content: `Decision trees split data based on feature values to create a flowchart-like structure for prediction.

**How Trees Split:**
- **Gini Impurity:** Measures how mixed the classes are in a node
- **Information Gain:** Reduction in entropy from a split
- **Recursive Partitioning:** Continues splitting until stopping criteria met

**Strengths:**
- Intuitive and interpretable
- Handles non-linear relationships
- Requires minimal data preprocessing
- Captures feature interactions automatically

**Weaknesses:**
- Prone to overfitting
- High variance (small data changes → different tree)
- Biased toward features with more levels`,
      },
      {
        id: 'random-forests',
        title: 'Random Forests',
        bloomLevel: 'apply',
        content: `Random forests combine multiple decision trees to improve prediction accuracy and reduce overfitting.

**Key Techniques:**
- **Bagging:** Each tree trained on a random sample of data (bootstrap)
- **Feature Randomness:** Each split considers only a random subset of features
- **Ensemble Averaging:** Final prediction is the average (regression) or vote (classification)

**Why Random Forests Work:**
- Individual trees may overfit, but errors cancel out
- Feature randomness decorrelates trees
- More stable and generalizable than single trees

**Clinical Use:**
Random forests excel when relationships are complex and non-linear, making them popular for sepsis prediction, readmission risk, and mortality forecasting.`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks in Clinical Context',
    description: 'Understand neural network basics and their application in healthcare prediction.',
    icon: 'Brain',
    prerequisites: ['foundations', 'tree-models'],
    bloomLevel: ['understand', 'analyze'],
    estimatedTime: 50,
    topics: [
      {
        id: 'neural-basics',
        title: 'Neural Network Fundamentals',
        bloomLevel: 'understand',
        content: `Neural networks are flexible models inspired by brain structure, capable of learning complex patterns.

**Architecture:**
- **Input Layer:** Features (patient data)
- **Hidden Layers:** Intermediate transformations
- **Output Layer:** Predictions
- **Activation Functions:** Introduce non-linearity (ReLU, sigmoid)

**Training:**
- **Backpropagation:** Adjusts weights to minimize prediction error
- **Gradient Descent:** Optimization algorithm
- **Epochs:** Number of passes through training data

**When to Use Neural Networks:**
- Large datasets (thousands of samples)
- Complex, non-linear relationships
- High-dimensional data (imaging, text, time series)

**Cautions in Healthcare:**
- Require more data than traditional methods
- Less interpretable ("black box")
- Prone to overfitting without regularization
- Need careful validation`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'training-validation',
    title: 'Model Training & Validation',
    description: 'Master train-test splits, cross-validation, and detecting overfitting.',
    icon: 'Target',
    prerequisites: ['foundations'],
    bloomLevel: ['apply', 'analyze'],
    estimatedTime: 40,
    topics: [
      {
        id: 'train-test-split',
        title: 'Train-Test Split',
        bloomLevel: 'apply',
        content: `Proper data splitting is essential for honest model evaluation.

**Standard Approach:**
- **Training Set (70-80%):** Used to fit the model
- **Test Set (20-30%):** Used only for final evaluation
- **Never:** Use test data during training

**Why Split?**
Models can memorize training data (overfitting) but fail on new cases. Testing on held-out data reveals true generalization performance.

**Best Practices:**
- Random splitting (unless time-series)
- Stratified splitting (preserve outcome proportions)
- Document the split for reproducibility
- Consider temporal splits for deployment realism`,
      },
      {
        id: 'overfitting',
        title: 'Overfitting and Underfitting',
        bloomLevel: 'analyze',
        content: `Finding the right model complexity is crucial for clinical prediction.

**Overfitting:**
Model too complex → learns noise → poor generalization
- Training performance ≫ test performance
- Too many features relative to sample size
- Model too flexible (deep trees, many parameters)

**Underfitting:**
Model too simple → misses patterns → poor performance everywhere
- Both training and test performance poor
- Model assumptions violated
- Missing important features

**Solutions:**
- Cross-validation for model selection
- Regularization (L1, L2 penalties)
- Feature selection
- Ensemble methods
- More data`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'metrics',
    title: 'Model Performance Metrics',
    description: 'Evaluate models using ROC curves, AUC, calibration, and clinical metrics.',
    icon: 'Gauge',
    prerequisites: ['training-validation'],
    bloomLevel: ['apply', 'analyze', 'evaluate'],
    estimatedTime: 60,
    topics: [
      {
        id: 'confusion-matrix',
        title: 'Confusion Matrix and Basic Metrics',
        bloomLevel: 'apply',
        content: `The confusion matrix breaks down predictions into four categories:

| | Predicted Positive | Predicted Negative |
|---|---|---|
| **Actually Positive** | True Positive (TP) | False Negative (FN) |
| **Actually Negative** | False Positive (FP) | True Negative (TN) |

**Derived Metrics:**
- **Sensitivity (Recall):** TP / (TP + FN) - Proportion of actual positives detected
- **Specificity:** TN / (TN + FP) - Proportion of actual negatives detected
- **PPV (Precision):** TP / (TP + FP) - Proportion of positive predictions that are correct
- **NPV:** TN / (TN + FN) - Proportion of negative predictions that are correct
- **Accuracy:** (TP + TN) / Total - Overall correct predictions

**Clinical Interpretation:**
Choose metrics based on clinical context. For sepsis screening, high sensitivity is crucial (don't miss cases). For confirmatory tests, high PPV matters (avoid unnecessary treatment).`,
      },
      {
        id: 'roc-auc',
        title: 'ROC Curves and AUC',
        bloomLevel: 'analyze',
        content: `ROC curves show model performance across all possible decision thresholds.

**ROC Curve:**
- X-axis: False Positive Rate (1 - Specificity)
- Y-axis: True Positive Rate (Sensitivity)
- Each point represents a different threshold

**AUC (Area Under ROC Curve):**
- Ranges from 0.5 (random) to 1.0 (perfect)
- Interpretation: Probability model ranks random positive case higher than random negative case
- 0.7-0.8: Acceptable
- 0.8-0.9: Excellent
- >0.9: Outstanding (rare in clinical practice)

**Limitations:**
- AUC only measures discrimination, not calibration
- Can be misleading with class imbalance
- Doesn't tell you which threshold to use clinically`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'interpretability',
    title: 'Model Interpretability & Explainability',
    description: 'Use SHAP, LIME, and feature importance to understand model decisions.',
    icon: 'Eye',
    prerequisites: ['metrics'],
    bloomLevel: ['analyze', 'evaluate'],
    estimatedTime: 55,
    topics: [
      {
        id: 'why-interpretability',
        title: 'Why Interpretability Matters',
        bloomLevel: 'understand',
        content: `Interpretability is crucial for clinical adoption and patient safety.

**Clinical Needs:**
- **Trust:** Clinicians need to understand model reasoning
- **Debugging:** Detect when models fail or use spurious correlations
- **Fairness:** Ensure predictions aren't based on protected attributes
- **Regulatory:** Many jurisdictions require explainability for medical AI
- **Learning:** Help clinicians understand disease patterns

**Types of Interpretability:**
- **Global:** Overall model behavior across all patients
- **Local:** Why a specific prediction was made for one patient
- **Feature-based:** Which features matter most`,
      },
      {
        id: 'shap-explanation',
        title: 'SHAP Values',
        bloomLevel: 'analyze',
        content: `SHAP (SHapley Additive exPlanations) provides theoretically grounded feature contributions.

**How SHAP Works:**
Based on game theory, SHAP assigns each feature a value representing its contribution to the prediction, considering all possible feature combinations.

**Interpretation:**
- Base value: Average model prediction
- SHAP value: How much a feature increases/decreases prediction from base
- Final prediction: Base value + sum of all SHAP values

**Example:**
For a patient with predicted sepsis risk of 0.75:
- Base value: 0.20 (population average)
- Lactate: +0.30 (high lactate increases risk)
- Age: +0.15 (older age increases risk)
- Temperature: +0.10
- Blood pressure: -0.05 (normal BP slightly decreases risk)

**Advantages:**
- Theoretically sound
- Works with any model type
- Provides both local and global explanations`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'bias-fairness',
    title: 'Bias & Fairness in Clinical Models',
    description: 'Identify and mitigate bias, ensure fairness across patient populations.',
    icon: 'Scale',
    prerequisites: ['metrics', 'interpretability'],
    bloomLevel: ['analyze', 'evaluate'],
    estimatedTime: 50,
    topics: [
      {
        id: 'sources-of-bias',
        title: 'Sources of Algorithmic Bias',
        bloomLevel: 'analyze',
        content: `Bias in clinical prediction models can harm patients and perpetuate healthcare disparities.

**Types of Bias:**

**1. Selection Bias**
- Training data not representative of deployment population
- Example: Model trained at academic centers deployed at community hospitals

**2. Measurement Bias**
- Outcomes measured differently across groups
- Example: Pain scores documented less thoroughly for some demographics

**3. Historical Bias**
- Data reflects historical inequities in care
- Example: Underdocumented comorbidities in underserved populations

**4. Label Bias**
- Outcome labels reflect biased human decisions
- Example: Healthcare cost as proxy for health need (famous case: cost influenced by access, not just severity)

**5. Aggregation Bias**
- Single model for heterogeneous populations
- Example: Disease progression differs by age/sex but model ignores this`,
      },
      {
        id: 'fairness-metrics',
        title: 'Evaluating Fairness',
        bloomLevel: 'evaluate',
        content: `Fairness is multifaceted and context-dependent.

**Fairness Criteria:**

**Demographic Parity:**
Positive prediction rate equal across groups
- May conflict with accuracy if base rates differ

**Equalized Odds:**
Sensitivity and specificity equal across groups
- Ensures equal error rates

**Calibration Fairness:**
Predicted probabilities accurate within each group
- Ensures predictions mean the same thing for everyone

**Clinical Approach:**
- No single fairness metric is always right
- Consider clinical context and stakeholder input
- Test model performance stratified by demographics
- Report disaggregated performance metrics
- Involve affected communities in evaluation`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'calibration',
    title: 'Clinical Calibration & Thresholding',
    description: 'Align predicted probabilities with observed outcomes and choose clinically appropriate thresholds.',
    icon: 'Gauge',
    prerequisites: ['metrics'],
    bloomLevel: ['apply', 'analyze', 'evaluate'],
    estimatedTime: 45,
    topics: [
      {
        id: 'calibration-concepts',
        title: 'Understanding Calibration',
        bloomLevel: 'understand',
        content: `Calibration measures whether predicted probabilities match observed frequencies.

**Well-Calibrated Model:**
When the model predicts 30% risk, approximately 30% of those patients experience the outcome.

**Why Calibration Matters:**
- Supports clinical decision-making (risk thresholds)
- Enables cost-effectiveness analysis
- Required for shared decision-making with patients
- Distinct from discrimination (AUC)

**Calibration vs. Discrimination:**
- **Discrimination (AUC):** Can the model rank patients by risk?
- **Calibration:** Are the probability estimates accurate?
- A model can discriminate well but be poorly calibrated!

**Assessment:**
- **Calibration plot:** Predicted vs. observed probabilities
- **Brier score:** Mean squared error of probability predictions (lower is better)
- **Calibration-in-the-large:** Overall agreement
- **Calibration slope:** Should be close to 1`,
      },
      {
        id: 'threshold-selection',
        title: 'Clinical Threshold Selection',
        bloomLevel: 'evaluate',
        content: `Choosing the right decision threshold requires clinical judgment and stakeholder input.

**Threshold Trade-offs:**
- **Lower threshold:** More sensitive, fewer missed cases, more false alarms
- **Higher threshold:** More specific, fewer false alarms, more missed cases

**Selection Approaches:**

**1. Clinical Consensus:**
What risk level justifies action? (e.g., >10% risk → intervention)

**2. Cost-Benefit Analysis:**
Weight costs of false positives vs. false negatives

**3. Decision Curve Analysis:**
Compare net benefit across thresholds and strategies

**4. Resource Constraints:**
Align threshold with available capacity

**Example:**
For sepsis screening, clinicians might choose a low threshold (high sensitivity) because missing sepsis is catastrophic, and false alarms are manageable.`,
      }
    ],
    completed: false,
    progress: 0,
  },
  {
    id: 'sandbox',
    title: 'Integrated Model Sandbox',
    description: 'Build, train, evaluate, and interpret your own models with synthetic clinical data.',
    icon: 'FlaskConical',
    prerequisites: ['training-validation', 'metrics', 'interpretability'],
    bloomLevel: ['apply', 'analyze', 'create'],
    estimatedTime: 90,
    topics: [
      {
        id: 'sandbox-intro',
        title: 'Model Sandbox Overview',
        bloomLevel: 'understand',
        content: `The Model Sandbox lets you experiment with the complete ML pipeline using synthetic clinical datasets.

**What You Can Do:**
1. **Select a dataset:** Sepsis risk, hospital readmission, or others
2. **Choose a model:** Logistic regression, random forest, etc.
3. **Configure training:** Set train/test split, adjust parameters
4. **Train and evaluate:** See ROC curves, calibration plots, confusion matrices
5. **Interpret:** Explore SHAP values and feature importance
6. **Experiment:** Adjust thresholds, compare models

**Learning Objectives:**
- Experience the full modeling workflow
- Understand trade-offs in model selection
- Practice interpreting model outputs
- Recognize overfitting and underfitting
- Apply clinical reasoning to model evaluation

**Safe Experimentation:**
All data is synthetic. Predictions are for educational purposes only.`,
      }
    ],
    completed: false,
    progress: 0,
  },
];

export function getModuleById(id: string): Module | undefined {
  return modulesData.find(module => module.id === id);
}

export function checkPrerequisites(moduleId: string, completedModules: string[]): boolean {
  const module = getModuleById(moduleId);
  if (!module) return false;
  return module.prerequisites.every(prereq => completedModules.includes(prereq));
}
