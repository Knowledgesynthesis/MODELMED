import type { Module } from '../types';
const md = String.raw;

export const calibration: Module = {
  id: 'calibration',
  number: 9,
  track: 'evaluate',
  title: 'Calibration: can the numbers be trusted?',
  tagline: 'The calibration hierarchy, intercept and slope, flexible curves, why models miscalibrate, and how to recalibrate.',
  minutes: 40,
  objectives: [
    'Define calibration and explain why it matters more than AUC for decisions about individual patients.',
    'Compute and interpret calibration-in-the-large, the calibration slope, flexible curves and the ICI.',
    'Identify the main causes of miscalibration, including overfitting, setting differences, ML methods and class rebalancing.',
    'Choose and apply a recalibration method on appropriate data.',
  ],
  sections: [
    {
      id: 'why',
      title: 'Why calibration is the Achilles heel',
      blocks: [
        {
          type: 'md',
          md: md`A model is calibrated if, among patients given a predicted risk of 20%, about 20% have the outcome. Treatment thresholds, shared decisions and counselling all use the *number*. Miscalibrated risks can lead to systematic over- or under-treatment even when ranking is excellent. Calibration is the performance measure most often unreported, and the one most often lost when a model moves to a new setting [@vancalster2019achilles].`,
        },
      ],
    },
    {
      id: 'hierarchy',
      title: 'The calibration hierarchy and its measures',
      blocks: [
        {
          type: 'md',
          md: md`Van Calster et al. defined increasingly strict levels [@vancalster2016hierarchy]:

1. **Mean calibration** (calibration-in-the-large): average predicted risk = observed event rate. Measured by the **O/E ratio** or the **calibration intercept**, $\alpha$, in $\text{logit}\,P(y=1) = \alpha + \text{logit}(\hat p)$ (offset). Target $\alpha = 0$; $\alpha < 0$ means over-prediction.
2. **Weak calibration**: intercept 0 and **calibration slope** 1 in $\text{logit}\,P(y=1) = a + b\cdot\text{logit}(\hat p)$. A slope < 1 means predictions are too extreme, the signature of overfitting; > 1 means too modest.
3. **Moderate calibration**: the flexible calibration curve (loess or splines of observed outcome on predicted risk) lies on the diagonal across the range. Summarise its distance from the diagonal with the **Integrated Calibration Index** (ICI, mean absolute difference) or E50/E90 [@austin2019ici].
4. **Strong calibration** (correct for every predictor pattern) is utopian.

Plot the flexible curve with a confidence band and a histogram of predictions. Grouped (decile) points with confidence intervals help for small samples.

The **Hosmer–Lemeshow test** is not recommended. Its result depends on an arbitrary grouping, it has low power in small samples, it flags trivial deviations in large ones, and a p-value says nothing about the size or direction of miscalibration [@steyerberg2019book].

The **Brier score** (mean squared error of the probabilities) reflects both calibration and discrimination, and its value depends on prevalence. The scaled Brier, 1 − Brier / [$\bar y(1-\bar y)$], compares it with a model that predicts the prevalence for everyone [@steyerberg2010framework].`,
        },
        { type: 'lab', lab: 'calibration' },
        { type: 'check', id: 'cal-slope' },
      ],
    },
    {
      id: 'causes',
      title: 'Why models are miscalibrated',
      blocks: [
        {
          type: 'md',
          md: md`- **Overfitting** in development leads to a slope < 1 at validation.
- **Different baseline risk** in the new setting leads to intercept miscalibration, e.g., a tertiary-centre model over-predicts in primary care.
- **Different case mix or measurement**: new assays, documentation practices, definitions of the outcome.
- **The learning algorithm**: SVMs, boosting and naive Bayes push probabilities toward the extremes or the middle [@niculescu2005]; deep networks are over-confident [@guo2017calib]; random forests are often too modest.
- **Class-imbalance corrections** (undersampling, oversampling, SMOTE) inflate predicted risks for everyone [@vandengoorbergh2022].
- **Drift over time**, even within one hospital [@davis2017drift].`,
        },
        { type: 'check', id: 'cal-imbalance' },
      ],
    },
    {
      id: 'recalibration',
      title: 'Recalibration',
      blocks: [
        {
          type: 'md',
          md: md`Always recalibrate on data **separate** from those used to fit the model, and report calibration again on new data.

| Method | Parameters | When |
|---|---|---|
| Intercept update | 1 | Baseline risk differs; slope fine |
| Logistic recalibration (Platt scaling) | 2 | Overfitting or systematic over/under-confidence |
| Temperature scaling | 1 | Neural networks (multi-class) |
| Isotonic regression | many (monotone step function) | Large samples; arbitrary monotone distortions |

None of these changes the ranking, so AUC is preserved. Recalibration cannot fix a model that ranks badly or uses the wrong predictors.`,
        },
        {
          type: 'callout',
          tone: 'clinical',
          title: 'Questions to ask of any risk tool',
          md: md`1. Was calibration reported in a population like mine, with a calibration plot, not just a Hosmer–Lemeshow p-value?
2. What is the O/E ratio here? Is our event rate similar to the development cohort's?
3. Has the tool been recalibrated locally, and is calibration being monitored?`,
        },
      ],
    },
  ],
  takeaways: [
    'Calibration — agreement between predicted and observed risk — determines whether a model’s numbers can guide individual decisions.',
    'Report the intercept (target 0), the slope (target 1) and a flexible calibration curve with uncertainty; avoid the Hosmer–Lemeshow test.',
    'Overfitting gives slope < 1; a different baseline risk shifts the intercept; ML algorithms and class rebalancing distort probabilities.',
    'Recalibrate on separate data; it preserves AUC and is the first fix at a new site.',
  ],
};
