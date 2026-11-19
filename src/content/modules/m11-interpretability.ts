import type { Module } from '../types';
const md = String.raw;

export const interpretability: Module = {
  id: 'interpretability',
  number: 11,
  track: 'trust',
  title: 'Interpretability and explanation',
  tagline: 'Interpretable models vs post-hoc explanations, permutation importance, partial dependence, SHAP, LIME — and their limits.',
  minutes: 45,
  objectives: [
    'Distinguish inherently interpretable models from post-hoc explanation of black boxes.',
    'Use and critique global methods: coefficients, permutation importance, PDP/ICE/ALE.',
    'Compute and interpret SHAP values, including the baseline, the output scale and the background data.',
    'Explain why explanations do not establish causality, correctness or safety.',
  ],
  sections: [
    {
      id: 'why',
      title: 'What explanations are for',
      blocks: [
        {
          type: 'md',
          md: md`Explanations serve **developers** (debugging, finding leakage and shortcuts), **regulators and auditors** (transparency) and **clinicians and patients** (contestability, appropriate reliance). Two very different strategies exist:

1. **Inherently interpretable models**: sparse regression, scoring systems, shallow trees, generalised additive models. The model *is* the explanation. For high-stakes decisions on tabular data, these often match black-box accuracy, and they are preferable when they do [@rudin2019].
2. **Post-hoc explanations** of complex models (SHAP, LIME, saliency maps) approximate what the model did. They can be incomplete or unstable.

A sobering finding: explanations do not reliably help clinicians detect when a model is wrong. In a randomised vignette study, a systematically biased model reduced clinicians' diagnostic accuracy, and adding explanations did not significantly mitigate the harm [@jabbour2023]. Explanations are no substitute for rigorous validation [@ghassemi2021].`,
        },
      ],
    },
    {
      id: 'global',
      title: 'Global methods',
      blocks: [
        {
          type: 'md',
          md: md`- **Coefficients / odds ratios** (regression): exact, but conditional on the other predictors and on the scale of each predictor.
- **Permutation importance**: the drop in validation performance when one predictor is shuffled [@fisher2019mcr]. It is model-agnostic. With correlated predictors, shuffling creates impossible combinations, such as a creatinine incompatible with the urea, and the importance is shared or masked [@hooker2021permute].
- **Partial dependence plots (PDP)** show the average prediction as one predictor is varied; **ICE curves** show it for individual patients. Both suffer from the same extrapolation problem. **Accumulated local effects (ALE)** plots are designed for correlated predictors [@apley2020ale].

Importance is a property of a *model*. Many models can be nearly equally accurate yet rely on different predictors, so a low importance does not mean "clinically irrelevant" [@fisher2019mcr].`,
        },
        { type: 'check', id: 'i-perm' },
      ],
    },
    {
      id: 'shap',
      title: 'SHAP values',
      blocks: [
        {
          type: 'md',
          md: md`SHAP assigns each predictor a share of the difference between this patient's prediction and a **baseline** (the average prediction over a background sample), using Shapley values from cooperative game theory [@lundberg2017]:

$$\phi_j = \sum_{S \subseteq N\setminus\{j\}} \frac{|S|!\,(p-|S|-1)!}{p!}\big[v(S\cup\{j\}) - v(S)\big], \qquad f(x) = \phi_0 + \sum_j \phi_j$$

where $v(S)$ is the expected model output when only the predictors in $S$ are fixed to the patient's values. Key points:

- **Efficiency**: contributions add up exactly to the prediction, on the scale where $v$ is computed, usually **log-odds** for classifiers. Percentage-point bars on the probability scale are not additive.
- **Baseline dependence**: changing the background population (e.g., all patients vs ward patients) changes every $\phi_j$.
- **Interventional vs observational** definitions of $v(S)$ give different answers with correlated predictors: "true to the model" vs "true to the data" [@chen2020true]. TreeSHAP computes exact values efficiently for tree ensembles [@lundberg2020tree].
- For a linear-logit model with independent background sampling, $\phi_j = \beta_j(x_j - \bar x_j)$ exactly.`,
        },
        { type: 'lab', lab: 'shap' },
        { type: 'check', id: 'i-shap' },
      ],
    },
    {
      id: 'limits',
      title: 'LIME, counterfactuals and the limits of explanation',
      blocks: [
        {
          type: 'md',
          md: md`**LIME** fits a simple weighted linear model to the black box's predictions on perturbed copies of one patient [@ribeiro2016lime]. Its explanations depend on the perturbation distribution and kernel width and can change from run to run.

**Counterfactual explanations** ("risk would fall below 10% if lactate were 1.5") describe the *model's* response surface, not what would happen if you lowered the lactate.

**Explanations can be gamed.** Classifiers can be built to behave in a discriminatory way while LIME and SHAP report innocuous features [@slack2020fooling].

**Explanations are not causal.** A large SHAP value for "lactate ordered" means the model uses the clinician's suspicion, which is useful to know when auditing for leakage, not a mechanism.`,
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'Practical use of explanations',
          md: md`Use explanations to **audit** models: find leakage, shortcuts, implausible directions and proxies for protected attributes. Do not use them to **certify** a model: safety comes from validation, calibration, subgroup analysis and monitoring. When an interpretable model performs as well, choose it.`,
        },
      ],
    },
  ],
  takeaways: [
    'Prefer inherently interpretable models when they perform comparably; post-hoc explanations approximate, and can mislead.',
    'Permutation importance, PDP and ICE extrapolate with correlated predictors; ALE plots are safer.',
    'SHAP values add up from a baseline on the model’s output scale (log-odds); they depend on the background data and are not causal.',
    'Use explanations to debug and audit, not as evidence of correctness or safety.',
  ],
};
