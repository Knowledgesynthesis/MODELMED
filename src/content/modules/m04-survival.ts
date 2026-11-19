import type { Module } from '../types';
const md = String.raw;

export const survival: Module = {
  id: 'survival',
  number: 4,
  track: 'build',
  title: 'Time-to-event models',
  tagline: 'Censoring, Kaplan–Meier, Cox regression, proportional hazards, competing risks and how to evaluate survival predictions.',
  minutes: 45,
  objectives: [
    'Explain censoring and why ignoring it, or treating censored patients as event-free, biases risk estimates.',
    'Compute and read a Kaplan–Meier curve with its risk table.',
    'Interpret a Cox hazard ratio correctly and obtain an absolute risk at a time horizon.',
    'Check proportional hazards, recognise competing risks, and choose appropriate performance measures.',
  ],
  sections: [
    {
      id: 'censoring',
      title: 'Why survival analysis exists',
      blocks: [
        {
          type: 'md',
          md: md`Prognostic questions are usually "**by when**?": death within 5 years, recurrence within 2 years. Follow-up is incomplete. Some patients are still event-free at the end of the study (administrative censoring) and others leave early (loss to follow-up). Their true event time is only known to exceed their last contact: that is **right censoring**.

Fitting logistic regression to "event by 5 years" either drops censored patients (biasing risk upward, because survivors are the ones who get censored) or counts them as event-free (biasing risk downward). Survival methods use every patient for as long as they were observed.

All standard methods assume **non-informative censoring**: at any time, censored patients have the same future risk as those still under follow-up. If sick patients drop out to hospice care outside the health system, this fails. The data alone cannot test this assumption.`,
        },
      ],
    },
    {
      id: 'km',
      title: 'Kaplan–Meier',
      blocks: [
        {
          type: 'md',
          md: md`The product-limit estimator multiplies conditional survival probabilities at each event time [@kaplan1958]:

$$\hat S(t) = \prod_{t_i \le t}\left(1 - \frac{d_i}{n_i}\right)$$

where $d_i$ events occur among the $n_i$ patients still at risk just before $t_i$. Censored patients leave the risk set without stepping the curve down. Greenwood's formula gives the variance. Always show the **number at risk** below the curve: estimates in the tail rest on few patients. The median survival is the first time $\hat S(t) \le 0.5$.`,
        },
        { type: 'lab', lab: 'km' },
        { type: 'check', id: 's-km' },
      ],
    },
    {
      id: 'cox',
      title: 'Cox proportional hazards',
      blocks: [
        {
          type: 'md',
          md: md`The hazard $h(t)$ is the instantaneous event rate among those still event-free at $t$. The Cox model [@cox1972] assumes

$$h(t \mid x) = h_0(t)\,\exp(\beta_1 x_1 + \dots + \beta_k x_k)$$

with an unspecified baseline hazard $h_0(t)$. The **hazard ratio** $e^{\beta_j}$ compares instantaneous rates and is assumed constant over time. It is not a risk ratio, and its average over follow-up can mislead when hazards change or the population selects itself over time [@hernan2010hazards].

**For prediction you need the baseline.** Absolute risk at horizon $\tau$ is

$$\hat F(\tau \mid x) = 1 - S_0(\tau)^{\exp(\text{LP})}$$

A published Cox model that reports only hazard ratios, without $S_0(\tau)$ and the centring values of the predictors, cannot be used to predict. Established tools such as QRISK3 [@hippisleycox2017] and the AHA PREVENT equations [@khan2024prevent] publish the full equations.`,
        },
        {
          type: 'callout',
          tone: 'formula',
          title: 'Checking proportional hazards',
          md: md`- **Scaled Schoenfeld residuals** against time; a non-zero slope means the effect changes over time [@grambsch1994].
- **Log(−log S(t)) curves** for groups should be roughly parallel.
- Remedies: time-varying coefficients, stratification on the offending variable, or a model that does not assume PH (accelerated failure time, flexible parametric models). Restricted mean survival time is an assumption-light summary of differences between groups.`,
        },
      ],
    },
    {
      id: 'competing',
      title: 'Competing risks',
      blocks: [
        {
          type: 'md',
          md: md`A **competing event** prevents the event of interest: an 85-year-old who dies of cancer can no longer have a stroke. Treating competing deaths as censored violates non-informative censoring. As a result, $1 - \text{KM}$ **overestimates** the cumulative incidence of the event of interest, sometimes by a lot in older or multimorbid populations [@austin2016competing].

- To **estimate or predict absolute risk** in the presence of competing events, use the cumulative incidence function (Aalen–Johansen) and models built for it, such as the Fine–Gray subdistribution hazard model [@fine1999] or combinations of cause-specific hazards models.
- To study **aetiology** (does X increase the rate of the event among those still alive?), cause-specific hazards are usually more interpretable.`,
        },
        { type: 'check', id: 's-competing' },
      ],
    },
    {
      id: 'evaluation',
      title: 'Evaluating survival predictions',
      blocks: [
        {
          type: 'md',
          md: md`- **Discrimination.** Harrell's C-index is the proportion of usable pairs where the patient with the earlier event had the higher predicted risk [@harrell1982c]. It depends on the censoring distribution; Uno's C corrects for this [@uno2011]. A time-dependent AUC at the horizon of clinical interest is often more relevant than a C over all follow-up.
- **Calibration at a horizon.** Compare predicted risk at $\tau$ with observed risk (Kaplan–Meier or, with competing risks, cumulative incidence) in groups, or with flexible calibration curves that handle censoring.
- **Overall accuracy and utility.** Time-dependent Brier score with inverse-probability-of-censoring weights; decision curves at $\tau$.

Machine-learning survival models (random survival forests, gradient-boosted and neural Cox models) exist and are evaluated by the same rules, with the same data-hunger caveats.`,
        },
      ],
    },
  ],
  takeaways: [
    'Censoring is incomplete information, not missing outcomes. Kaplan–Meier and Cox use each patient for as long as they were observed, assuming non-informative censoring.',
    'Hazard ratios are relative instantaneous rates; absolute risk at a horizon needs the baseline survival.',
    'Check proportional hazards; when effects change over time, model that explicitly.',
    'With competing events, 1 − KM overestimates risk: use cumulative incidence methods for prediction.',
    'Evaluate survival models at clinically relevant horizons: time-dependent discrimination, calibration and net benefit.',
  ],
};
