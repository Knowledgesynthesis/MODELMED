import type { Module } from '../types';
const md = String.raw;

export const causal: Module = {
  id: 'causal',
  number: 15,
  track: 'causal',
  title: 'Causal inference and target trial emulation',
  tagline: 'Potential outcomes, causal diagrams, emulating the trial you cannot run, estimating effects, and judging whether to believe them.',
  minutes: 60,
  objectives: [
    'Define a causal effect with potential outcomes and state the identification conditions: exchangeability, positivity and consistency.',
    'Use a causal diagram to decide which variables to adjust for, and recognise confounders, colliders and mediators.',
    'Specify a target trial protocol and emulate it with observational data, aligning time zero to avoid immortal time and prevalent-user bias.',
    'Choose and diagnose an estimator (standardisation, propensity-score weighting, doubly robust methods, g-methods) and run sensitivity analyses.',
    'Explain where prediction and causation meet: treatment decisions, counterfactual prediction and treatment-effect heterogeneity.',
  ],
  sections: [
    {
      id: 'potential-outcomes',
      title: 'Causal questions need causal methods',
      blocks: [
        {
          type: 'md',
          md: md`Prediction asks *what will happen*; causal inference asks *what would happen if we intervened* (Module 1) [@hernan2019]. Each patient has two **potential outcomes**: $Y^{a=1}$ if treated and $Y^{a=0}$ if not. We only ever observe one of them. A causal effect compares them in a population, for example the average treatment effect

$$\text{ATE} = E[Y^{a=1}] - E[Y^{a=0}]$$

on the risk-difference scale. Ratios such as the risk ratio and hazard ratio are also used.

Randomisation makes treated and untreated groups comparable on average. With observational data, an association equals the causal effect only under three **identification conditions** [@hernanrobins2020]:

1. **Exchangeability** (no unmeasured confounding): given the measured covariates $L$, treatment assignment is independent of the potential outcomes.
2. **Positivity**: every type of patient (every level of $L$) has a non-zero chance of receiving each treatment.
3. **Consistency**: the treatment is well defined. "Statin use" is vague; "initiate atorvastatin 40 mg within 30 days of MI and continue" is a well-defined intervention.

None of these can be fully verified from the data. They are defended with subject-matter knowledge, design and sensitivity analysis. Words like "associated with" do not make an implicitly causal question non-causal. State the causal question explicitly and then defend the assumptions [@hernan2018cword].`,
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'Why prediction models cannot answer "should I treat?"',
          md: md`A prediction model estimates risk under the treatments patients *happened to receive*. Deciding whether to treat needs risk under each option, $P(Y^{a=1}=1\mid x)$ and $P(Y^{a=0}=1\mid x)$, which is **counterfactual prediction**. It needs the same assumptions and data as any causal analysis [@dickerman2020cfpred; @vangeloven2020].`,
        },
        { type: 'check', id: 'cau-cfpred' },
      ],
    },
    {
      id: 'dags',
      title: 'Causal diagrams: what to adjust for',
      blocks: [
        {
          type: 'md',
          md: md`A **directed acyclic graph** (DAG) encodes assumed causal relationships as arrows [@greenland1999dag]. Bias arises from open **back-door paths**, i.e., non-causal paths from treatment to outcome:

- **Confounder** ($A \leftarrow L \rightarrow Y$): a common cause of treatment and outcome, e.g., disease severity driving both prescription and death (confounding by indication). **Adjust** for it.
- **Collider** ($A \rightarrow C \leftarrow Y$): a common *effect*. The path is closed until you condition on $C$, by adjustment, restriction or selection. Conditioning opens it and creates bias. Selection bias is collider bias [@hernan2004selection]. In the classic "birth-weight paradox", maternal smoking appears protective among low-birth-weight infants because the analysis conditions on birth weight, which smoking and other, more lethal causes both affect [@hernandezdiaz2006].
- **Mediator** ($A \rightarrow M \rightarrow Y$): lies on the causal pathway. Adjusting for it removes part of the effect you want (the total effect). Never adjust for anything affected by the treatment when you want a total effect.

Practical confounder selection: adjust for pre-treatment variables that cause the treatment, the outcome, or both. Include good proxies of unmeasured common causes. Exclude variables that cause only the treatment (instruments), because adjusting for them can amplify bias [@vanderweele2019confounder]. Never select confounders by p-values, stepwise procedures or "importance" in a prediction model.

**The Table 2 fallacy.** In a model built to estimate the effect of $A$, the coefficients of the *covariates* are not their causal effects; some of them are partially adjusted for their own mediators [@westreich2013table2].`,
        },
        { type: 'lab', lab: 'confounding' },
        { type: 'check', id: 'cau-collider' },
      ],
    },
    {
      id: 'target-trial',
      title: 'Target trial emulation',
      blocks: [
        {
          type: 'md',
          md: md`The most effective protection against avoidable bias is to first write the protocol of the **randomised trial you would like to run** (the *target trial*), then emulate each component with observational data [@hernan2016target; @matthews2022tte]:

| Protocol component | Target trial | Emulation with observational data |
|---|---|---|
| Eligibility | Who would be enrolled | Apply the same criteria, using only information available *at time zero* |
| Treatment strategies | Precisely defined, including dose, timing and continuation | Same definitions; prefer **new users** and an **active comparator** [@lund2015acnu] |
| Assignment | Randomised | Assume exchangeability conditional on measured baseline confounders |
| Time zero | Eligibility, assignment and start of follow-up coincide | **Align all three**, e.g., at the date criteria are first met |
| Outcomes | Defined and ascertained | Same definitions, ascertained equally across groups |
| Causal contrast | Intention-to-treat and/or per-protocol | Observational analogue of ITT; per-protocol needs adjustment for post-baseline factors that drive deviations |
| Analysis plan | Pre-specified | Pre-specified, with sensitivity analyses |

**Time zero is where most observational studies go wrong** [@hernan2016immortal]:
- **Immortal time bias**: classifying patients as "treated" based on what happens after time zero (e.g., "any statin prescription in the year after discharge") credits treated patients with the time they had to survive in order to start [@suissa2008immortal].
- **Prevalent-user bias**: comparing current users with non-users includes only people who tolerated and survived early treatment, and misses early harms.

When strategies involve a grace period ("start within 3 months"), patients are compatible with several strategies at time zero. The **clone–censor–weight** method copies each patient into every compatible strategy, censors each copy when it deviates, and uses inverse-probability weights to correct the informative censoring this creates [@hernan2018duration].`,
        },
        { type: 'lab', lab: 'immortal-time' },
        {
          type: 'callout',
          tone: 'evidence',
          title: 'Does emulation work?',
          md: md`- **Hormone therapy.** Observational studies suggested that postmenopausal hormone therapy prevented coronary heart disease; the WHI trial did not. Re-analysing the Nurses' Health Study as an emulated trial of *initiators* vs non-initiators, with aligned time zero, gave estimates compatible with the trial. The apparent discrepancy came largely from comparing prevalent users and from differences in time since starting therapy [@hernan2008hrt].
- **Statins and cancer.** In UK electronic records, the strong protective associations reported in earlier observational studies reappeared only when prevalent users or immortal time were introduced. A properly emulated trial found essentially no effect, consistent with randomised evidence [@dickerman2019statins].
- **RCT-DUPLICATE.** Database emulations of 32 trials, with protocols registered before analysis, agreed reasonably with the trial results (Pearson r = 0.82). In a post-hoc subset of 16 trials whose design could be emulated closely, agreement was higher (r = 0.93). Divergence reflected trial features that databases struggle to reproduce (placebo comparators, run-in periods, in-trial adherence), chance and residual confounding, which are hard to disentangle [@wang2023rctduplicate].

Report emulations with the **TARGET** guideline (2025) [@cashin2025target].`,
        },
        { type: 'check', id: 'cau-immortal' },
      ],
    },
    {
      id: 'estimation',
      title: 'Estimating the effect',
      blocks: [
        {
          type: 'md',
          md: md`Under the same assumptions, several estimators target the same marginal effect. They differ in which model must be correct:

- **Standardisation / parametric g-formula**: fit an outcome model $E[Y\mid A, L]$, predict everyone's outcome under $A=1$ and under $A=0$, and average. This needs a correct outcome model.
- **Propensity score** $e(L)=P(A=1\mid L)$ [@rosenbaum1983], used for matching, stratification or **inverse probability of treatment weighting (IPTW)** with weights $1/e(L)$ for the treated and $1/(1-e(L))$ for the untreated, usually stabilised [@austin2011ps; @cole2008weights]. This needs a correct treatment model.
- **Doubly robust** estimators (augmented IPW, targeted maximum likelihood [@vanderlaan2006tmle]) are consistent if *either* model is correct. With cross-fitting, they let flexible machine learning estimate both models while keeping valid confidence intervals (double/debiased ML) [@chernozhukov2018dml].

**Diagnostics that matter:**
- **Balance**: standardised mean differences below about 0.1 after matching or weighting, for every confounder and important interactions.
- **Overlap and positivity**: inspect propensity-score distributions. Extreme weights and a small effective sample size signal that some patients almost always or never receive treatment. Respond by restricting the population or changing the estimand, e.g., overlap weights, rather than blindly trimming weights [@petersen2012positivity].
- A propensity model is **not** judged by its AUC. A near-perfect C-statistic is a warning about positivity, not a success.

**Time-varying treatments and confounders.** When a confounder, such as kidney function, is affected by earlier treatment and also drives later treatment, standard regression adjustment is biased whether or not you adjust. Use **g-methods**: inverse-probability-weighted marginal structural models, the g-formula, or g-estimation [@robins2000msm].

Machine learning improves *estimation* of the nuisance models. It does nothing for *identification*: no algorithm recovers an unmeasured confounder.`,
        },
        { type: 'check', id: 'cau-balance' },
        { type: 'check', id: 'cau-positivity' },
      ],
    },
    {
      id: 'believe',
      title: 'Should you believe it? Sensitivity, falsification and other designs',
      blocks: [
        {
          type: 'md',
          md: md`- **E-value** [@vanderweele2017evalue]: the minimum strength of association, on the risk-ratio scale, that an unmeasured confounder would need with *both* treatment and outcome to explain away an estimate:

$$E = RR + \sqrt{RR\,(RR-1)}$$

using $1/RR$ for protective effects. Report it for the point estimate and for the confidence limit closest to the null. Compare it with the strength of known measured confounders.
- **Negative controls** [@lipsitch2010negctrl]: an outcome the treatment cannot plausibly affect (e.g., influenza vaccination and hip fracture), or an exposure that cannot affect the outcome. A non-null association reveals residual confounding or bias.
- **Quantitative bias analysis** models plausible misclassification, selection or confounding explicitly.
- **Designs that use other assumptions:**
  - *Instrumental variables*, including Mendelian randomisation, which uses genetic variants as instruments and requires strong assumptions about how the variants act [@davies2018mr].
  - *Regression discontinuity*, which compares patients just either side of a treatment threshold.
  - *Difference-in-differences and interrupted time series*, for policies and service changes.
- **Triangulation**: confidence grows when designs with *different* sources of bias agree.`,
        },
        {
          type: 'callout',
          tone: 'clinical',
          title: 'Reading an observational treatment-effect study',
          md: md`1. Is the causal question explicit, with well-defined treatment strategies?
2. Can you reconstruct the target trial? Do eligibility, assignment and time zero coincide? New users? Active comparator?
3. Which confounders were adjusted for, and were they chosen by causal reasoning? Any adjustment for mediators or colliders?
4. Balance and overlap shown? Weights reasonable?
5. Sensitivity analyses: E-value, negative controls, alternative definitions?
6. Does the magnitude make sense next to trial evidence and biology?`,
        },
        {
          type: 'callout',
          tone: 'example',
          title: 'Try it',
          md: md`The **E-value** tab of the confounding lab above computes E-values for any estimate. The worked example from the original paper, RR 3.9 (95% CI 1.8–8.7), gives 7.26 for the estimate and 3.0 for the lower confidence limit.`,
        },
        { type: 'check', id: 'cau-evalue' },
      ],
    },
    {
      id: 'prediction-meets-causation',
      title: 'Where prediction meets causation',
      blocks: [
        {
          type: 'md',
          md: md`- **Risk-based treatment decisions.** If a treatment's *relative* effect is roughly constant, its *absolute* benefit grows with baseline risk (Module 3). Predicting baseline risk well, then applying trial-based relative effects, is the approach recommended by the PATH statement for personalising treatment from trial data [@kent2020path].
- **Predicting individual treatment effects** ("causal ML", heterogeneous treatment effects) is much harder than predicting risk. Effect modifiers are estimated noisily, and the predictions must be validated against randomised data, e.g., with calibration-for-benefit or the c-for-benefit [@vanklaveren2018cben].
- **Treatment in the development data** changes what a prediction model means. If high-risk patients were treated effectively, the model under-estimates untreated risk: the treatment paradox [@vangeloven2020].
- **Evaluating a deployed model is a causal question**: does using it change outcomes (Module 10)? Randomised or quasi-experimental designs answer it; accuracy studies cannot.`,
        },
      ],
    },
  ],
  takeaways: [
    'A causal effect compares potential outcomes; observational data identify it only under exchangeability, positivity and consistency.',
    'Choose adjustment variables from a causal diagram: adjust for confounders, never for colliders or (for total effects) mediators; never by p-values.',
    'Write the target trial protocol first and align eligibility, assignment and follow-up at time zero — this alone prevents immortal-time and prevalent-user bias.',
    'Standardisation, IPTW and doubly robust estimators share the same assumptions; check balance, overlap and weights; use g-methods for time-varying confounding.',
    'No method fixes unmeasured confounding. Use E-values, negative controls, alternative designs and triangulation, and report with TARGET.',
  ],
};
