import type { Module } from '../types';
const md = String.raw;

export const validation: Module = {
  id: 'validation',
  number: 7,
  track: 'evaluate',
  title: 'Overfitting, validation and leakage',
  tagline: 'Optimism, internal validation done right, the ways information leaks, and external validation as the real test.',
  minutes: 50,
  objectives: [
    'Explain optimism and the bias–variance trade-off.',
    'Choose between split-sample, cross-validation and bootstrap internal validation, and repeat the whole modelling process inside each.',
    'Identify leakage from preprocessing, selection, tuning, duplicate patients and post-index predictors.',
    'Design an external validation and choose an appropriate model-updating strategy.',
  ],
  sections: [
    {
      id: 'optimism',
      title: 'Apparent performance is optimistic',
      blocks: [
        {
          type: 'md',
          md: md`A model evaluated on the data used to fit it has **apparent** performance. It is optimistic because the model has partly fitted the noise in that sample. The more flexible the model, and the smaller the sample relative to the number of parameters, the larger this **optimism**. Expected error on new data decomposes into bias² + variance + irreducible noise; flexibility trades bias for variance [@hastie2009esl].`,
        },
        { type: 'lab', lab: 'overfitting' },
      ],
    },
    {
      id: 'internal',
      title: 'Internal validation',
      blocks: [
        {
          type: 'md',
          md: md`| Method | How | Verdict |
|---|---|---|
| **Split sample** (e.g., 70/30) | Fit on one part, test on the other | Wastes data, and the estimate depends heavily on the random split; acceptable only for very large n [@steyerberg2001internal] |
| **k-fold cross-validation** | Fit k times, each time predicting the held-out fold | Good; repeat (e.g., 10 × 10-fold) to reduce variance |
| **Bootstrap optimism correction** | Refit in bootstrap samples, measure optimism on the original data, subtract | Efficient and recommended for regression models [@harrell2015rms; @steyerberg2019book] |

The non-negotiable rule: **every data-driven step is repeated inside each resample**, including variable selection, imputation models, spline knot placement, scaling, class-balancing and hyperparameter tuning. Otherwise the "validation" grades a process that has already seen the answers.

When cross-validation is used *both* to tune and to report performance, use **nested** cross-validation: an inner loop tunes and an outer loop evaluates [@varma2006nested].`,
        },
        { type: 'check', id: 'v-bootstrap' },
      ],
    },
    {
      id: 'leakage',
      title: 'Leakage',
      blocks: [
        {
          type: 'md',
          md: md`Leakage is any route by which information that would not be available at prediction time, or information from the test data, reaches the model during development [@kaufman2012leakage]. It is common: a review found leakage-related errors affecting hundreds of papers across 17 scientific fields [@kapoor2023leakage].

Common clinical forms:
1. **Preprocessing or selection on the full dataset** before splitting (demonstrated below).
2. **The same patient in train and test** (multiple admissions, multiple images per patient): split by patient, not by record.
3. **Temporal leakage**: future information, for example a random split across years when the model will predict forward in time; predictors timestamped after the index time.
4. **Outcome-process proxies**: orders, consults and treatments triggered by suspicion of the outcome.
5. **Tuning on the test set**: trying many models and reporting the best test result.`,
        },
        { type: 'lab', lab: 'leakage' },
      ],
    },
    {
      id: 'external',
      title: 'External validation and updating',
      blocks: [
        {
          type: 'md',
          md: md`External validation applies the *frozen* model, with its original intercept and coefficients, to new patients [@riley2024eval2]:

- **Temporal**: later patients at the same centres. This tests robustness to drift.
- **Geographic**: other centres or countries. This tests transportability across case mix and practice.
- **Internal–external cross-validation**: in multicentre data, leave one centre (or period) out at a time to see how much performance varies across settings [@steyerberg2016validation].

Validate in the population and setting where the model is meant to be used (**targeted validation**) [@sperrin2022targeted]. Report discrimination, calibration and clinical utility, each with confidence intervals, and examine heterogeneity across sites.

When calibration fails, **update before you rebuild** [@janssen2008updating; @moons2012external]:
1. **Recalibration-in-the-large**: re-estimate the intercept. This fixes differences in baseline risk.
2. **Logistic recalibration**: re-estimate intercept and a single slope on the linear predictor. This also fixes overfitting.
3. **Model revision**: re-estimate selected coefficients.
4. **Extension**: add new predictors. This needs the most data.`,
        },
        {
          type: 'callout',
          tone: 'evidence',
          title: 'Case study: a widely deployed sepsis model',
          md: md`A proprietary sepsis model was implemented in hundreds of US hospitals. In an independent external validation of 27,697 patients across 38,455 hospitalisations, it had an AUC of 0.63, well below the developer-reported 0.76–0.83. At the recommended alert threshold it detected 33% of sepsis cases with a PPV of 12%, and alerted on 18% of all hospitalised patients. It added little to clinicians: only 183 of 2,552 sepsis cases (7%) were flagged by the model without already having received timely antibiotics [@wong2021epic]. Developer-reported performance from internal or retrospective data is no substitute for independent, setting-specific validation.`,
        },
        { type: 'check', id: 'v-update' },
      ],
    },
  ],
  takeaways: [
    'Apparent performance is optimistic; the gap grows with flexibility and shrinks with sample size.',
    'Use bootstrap or repeated cross-validation, repeating every data-driven step inside each resample; nest tuning inside evaluation.',
    'Split by patient, respect time, and audit every predictor for post-index information.',
    'External validation of the frozen model in the intended setting is the real test; update by recalibration before rebuilding.',
  ],
};
