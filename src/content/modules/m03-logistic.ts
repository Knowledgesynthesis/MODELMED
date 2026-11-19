import type { Module } from '../types';
const md = String.raw;

export const logistic: Module = {
  id: 'logistic',
  number: 3,
  track: 'build',
  title: 'Logistic regression, done properly',
  tagline: 'Log-odds, odds ratios vs absolute risk, nonlinearity with splines, penalisation, and why regression is still the baseline to beat.',
  minutes: 45,
  objectives: [
    'Write the logistic model and convert a linear predictor into a probability.',
    'Interpret coefficients as odds ratios per unit, per SD or per category, and translate them into absolute risk changes.',
    'Model continuous predictors flexibly with restricted cubic splines instead of categorising them.',
    'Explain what penalisation and variable selection can and cannot fix, and what the comparative evidence says about logistic regression vs ML.',
  ],
  sections: [
    {
      id: 'model',
      title: 'The model',
      blocks: [
        {
          type: 'md',
          md: md`Logistic regression models the log-odds of the outcome as a linear combination of predictors:

$$\ln\frac{p}{1-p} = \beta_0 + \beta_1 x_1 + \dots + \beta_k x_k = \text{LP}, \qquad p = \frac{1}{1+e^{-\text{LP}}}$$

Coefficients are estimated by maximum likelihood (iteratively reweighted least squares). Interpretation:

- $\beta_0$ is the log-odds for a patient with all predictors at 0 (or at their reference/centred values). It sets the overall risk level and is the first thing to update when a model moves to a new setting.
- $e^{\beta_j}$ is the **odds ratio** for a one-unit increase in $x_j$, holding the other predictors fixed. Report it per clinically meaningful unit (per 10 years, per SD, per IQR) so that ORs are comparable.
- To predict for a patient, add up their LP and apply the inverse logit. Always report the intercept: a published model without one cannot produce probabilities.`,
        },
        {
          type: 'callout',
          tone: 'example',
          title: 'Worked example',
          md: md`$\text{LP} = -4.2 + 0.03\times\text{age} + 0.9\times\ln(\text{lactate}) + 0.6\times\text{immunosuppressed}$

For a 70-year-old with lactate 3.0 mmol/L who is immunosuppressed: LP = −4.2 + 2.1 + 0.9×1.099 + 0.6 = −0.51, so $p = 1/(1+e^{0.51}) = 0.375$ (37.5%).
Without immunosuppression: LP = −1.11, p = 24.8%. The OR is $e^{0.6} = 1.82$, but the absolute difference is 12.7 percentage points, and it would be much smaller for a low-risk patient.`,
        },
      ],
    },
    {
      id: 'or-vs-risk',
      title: 'Odds ratios vs absolute risks',
      blocks: [
        {
          type: 'md',
          md: md`Effects are additive on the log-odds scale, so the same OR shifts every patient by $\ln(\text{OR})$. On the probability scale, the change is largest near 50% risk and small near 0% or 100%. The OR approximates the risk ratio only when the outcome is rare (roughly < 10%). Patients and clinicians reason in absolute risks; give them absolute risks.`,
        },
        { type: 'lab', lab: 'logistic-curve' },
        { type: 'check', id: 'l-or' },
      ],
    },
    {
      id: 'assumptions',
      title: 'Assumptions that actually matter',
      blocks: [
        {
          type: 'md',
          md: md`| Assumption | Matters? | What to do |
|---|---|---|
| Linearity of continuous predictors **in the log-odds** | Yes — the commonest misspecification | Restricted cubic splines (3–5 knots) or fractional polynomials [@harrell2015rms] |
| Additivity (no interactions unless specified) | Yes, when interactions are strong and plausible | Pre-specify a few clinically motivated interactions; each costs parameters |
| Independent observations | Yes | Account for clustering (repeated admissions, centres), e.g., with mixed models or cluster-robust methods |
| No (quasi-)complete separation | Yes | Diverging coefficients signal it; use penalisation (e.g., Firth) or rethink the predictor |
| Normally distributed predictors | **No** | Not required |
| Low multicollinearity | Only for interpreting individual coefficients | Predictions are unaffected; do not drop predictors just for collinearity |

**Do not dichotomise continuous predictors.** Turning lactate into "> 2 vs ≤ 2" throws away information, assumes a step in risk at an arbitrary cut-point, and treats 2.1 and 9.0 the same. It costs about as much power as discarding a third of the data, and data-driven cut-points are biased [@royston2006dichot].`,
        },
        {
          type: 'callout',
          tone: 'formula',
          title: 'Restricted cubic splines in one line',
          md: md`A spline with $k$ knots replaces $x$ with $k-1$ basis terms: piecewise cubic between knots, joined smoothly, and linear beyond the outer knots. Place knots at fixed quantiles (for $k=4$: 5th, 35th, 65th, 95th). This uses $k-2$ extra parameters per predictor; count them in the sample-size calculation. In the [sandbox](/sandbox), compare linear and spline logistic regression on the sepsis cohort, where temperature and WBC have U-shaped effects.`,
        },
      ],
    },
    {
      id: 'penalisation',
      title: 'Variable selection and penalisation',
      blocks: [
        {
          type: 'md',
          md: md`**Stepwise selection** by p-values overestimates the retained coefficients (a "winner's curse"), underestimates their standard errors, and is unstable from sample to sample [@harrell2015rms; @steyerberg2019book]. Prefer predictors chosen in advance from clinical knowledge and the literature, with a sample size that supports them.

**Penalised regression** shrinks coefficients toward zero to reduce overfitting:
- **Ridge** (L2) shrinks all coefficients and keeps every predictor.
- **Lasso** (L1) [@tibshirani1996lasso] shrinks some coefficients exactly to zero, performing selection.
- **Elastic net** mixes the two.

The penalty strength is tuned by cross-validation, and that tuning must sit *inside* any outer validation loop. Penalisation is not a licence for small samples. The amount of shrinkage is itself estimated with large uncertainty when $n$ is small, so penalised models can be just as miscalibrated in new data [@vancalster2020shrink; @riley2021penal].`,
        },
        { type: 'check', id: 'l-step' },
      ],
    },
    {
      id: 'vs-ml',
      title: 'Logistic regression vs machine learning: the evidence',
      blocks: [
        {
          type: 'md',
          md: md`A systematic review of 71 studies comparing ML with logistic regression for clinical prediction found **no average difference in AUC** among comparisons at low risk of bias. Apparent ML advantages were concentrated in comparisons at high risk of bias, such as unequal tuning or flawed validation [@christodoulou2019]. Typical tabular clinical data have modest signal-to-noise ratios, where flexible models have little extra structure to find.

ML can help when relationships are strongly nonlinear or interactive and the data are large, or when the inputs are images, waveforms or text. The practical rule: fit a well-specified regression baseline (splines and plausible interactions) first, and require a flexible model to beat it on external data, on calibration and on net benefit, not just on AUC.`,
        },
        {
          type: 'callout',
          tone: 'clinical',
          title: 'Points-based scores',
          md: md`Bedside scores (CURB-65, CHA₂DS₂-VASc and similar) are often rounded versions of regression models. Rounding sacrifices accuracy for usability. When a points score is mapped back to risks, check the calibration of those risks in your population; the original derivation cohort may have had a very different baseline risk.`,
        },
      ],
    },
  ],
  takeaways: [
    'Logit(p) = LP; probabilities come from the inverse logit; the intercept sets overall risk and must be reported.',
    'An OR is constant on the log-odds scale; absolute effects depend on baseline risk. Communicate absolute risks.',
    'Keep continuous predictors continuous and model nonlinearity with splines; never categorise to "simplify".',
    'Avoid stepwise selection. Penalisation helps but does not rescue small samples.',
    'In low-bias comparisons ML has not outperformed logistic regression on typical clinical tabular data; a well-specified regression is the baseline to beat.',
  ],
};
