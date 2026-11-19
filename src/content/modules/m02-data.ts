import type { Module } from '../types';
const md = String.raw;

export const dataDesign: Module = {
  id: 'data-design',
  number: 2,
  track: 'frame',
  title: 'Data, outcomes and sample size',
  tagline: 'Where data come from, how labels and timing go wrong, handling missing values, and how many patients you really need.',
  minutes: 40,
  objectives: [
    'Recognise how data source and design (cohort, trial, registry, EHR, case–control) affect absolute risk estimates.',
    'Identify label problems and predictors that are measured after the moment of prediction.',
    'Choose a missing-data strategy that can also be applied at deployment.',
    'Calculate the minimum sample size for model development and explain why "10 events per variable" is not enough.',
  ],
  sections: [
    {
      id: 'sources',
      title: 'Data sources and what they distort',
      blocks: [
        {
          type: 'md',
          md: md`- **Prospective cohorts** designed for the question give the cleanest predictor and outcome measurement, at high cost.
- **Randomised trial data** have excellent measurement but selected participants (strict eligibility, motivated sites), which limits applicability; treatment assignment must be handled.
- **Registries** are large and representative but often lack predictors and have variable outcome ascertainment.
- **Electronic health records** reflect *care processes*, not just biology. Whether and when a test is ordered carries information. In one large study, for about two-thirds of laboratory tests the *timing* of the order predicted 3-year survival better than the result itself [@agniel2018]. This "informative presence" helps prediction only while ordering habits stay the same.
- **Case–control samples** fix the outcome proportion by design, so predicted absolute risks are wrong unless they are re-weighted to the true prevalence.`,
        },
      ],
    },
    {
      id: 'labels-timing',
      title: 'Labels and timing',
      blocks: [
        {
          type: 'md',
          md: md`**Outcome definition.** Prefer an objective outcome that is ascertained the same way in everyone, ideally by people blind to the predictors. Proxy labels encode whatever produces them: billing codes encode coding practice, "antibiotics started" encodes clinician suspicion, and healthcare cost encodes access to care [@obermeyer2019].

**Predictor timing.** Every predictor must be known at the index time, recorded the way it will be at deployment. Retrospective EHR extracts often contain values that were entered or corrected later, or variables that only exist *because* the outcome was suspected (a repeat lactate, an ICU consult). Including them produces spectacular retrospective AUCs that disappear in real time. This is **leakage**.`,
        },
        {
          type: 'callout',
          tone: 'pitfall',
          title: 'Quick leakage screen for every predictor',
          md: md`1. Could this value be known at the moment of prediction in real time, not just in the retrospective extract?
2. Is it a consequence of the outcome or of the clinician suspecting it (orders, consults, transfers, treatments)?
3. Was it measured differently in patients who had the outcome?

Try it in the [Model sandbox](/sandbox): switch on the post-prediction-time variable and see what happens.`,
        },
        { type: 'check', id: 'd-leak' },
      ],
    },
    {
      id: 'missing',
      title: 'Missing data',
      blocks: [
        {
          type: 'md',
          md: md`Complete-case analysis discards information and biases estimates unless data are missing completely at random. For **prediction**, there is one extra constraint: whatever you do during development must be possible at the moment of prediction [@sperrin2020missing].

- **Multiple imputation** is the standard for *developing* and *validating* models when missingness depends on observed data (MAR). The imputation model should include the outcome.
- At **deployment**, a model cannot use the outcome to impute. Options include imputing from predictors only, or building missingness into the model with missing indicators or submodels. Simulation work suggests that single regression imputation (without the outcome) combined with missing indicators can perform as well as multiple imputation for prediction, provided missingness patterns are the same in development and deployment [@sisk2023missing].
- When missingness is **informative** (a lactate is not measured because the patient looks well), it is a signal. It is also fragile: a new order set that measures lactate on everyone changes what "missing" means.

Report the amount of missing data for each predictor and the strategy used for both development and deployment [@collins2024tripodai].`,
        },
      ],
    },
    {
      id: 'sample-size',
      title: 'How many patients?',
      blocks: [
        {
          type: 'md',
          md: md`The "10 events per variable" (EPV) rule came from simulations of regression *coefficient* bias [@peduzzi1996]. It does not guarantee accurate *predictions*. The required size depends on the number of candidate parameters, the outcome prevalence and the expected model strength, and in many realistic cases 10 EPV is far too few [@vansmeden2019epv].

Riley et al. proposed criteria that the development sample should meet at the same time [@riley2020samplesize]:

1. Small overfitting: expected uniform shrinkage $S \ge 0.9$
2. A small difference (≤ 0.05) between apparent and adjusted Nagelkerke $R^2$
3. Precise estimation of overall risk (±0.05)

For a binary outcome, criterion 1 gives

$$n = \frac{P}{(S-1)\,\ln\!\left(1 - R^2_{CS}/S\right)}$$

where $P$ is the number of candidate predictor **parameters**: every spline term, every category level beyond the reference, every interaction, counting all that were *considered*, not just those retained. $R^2_{CS}$ (Cox–Snell) can be anticipated from a previously reported C-statistic [@riley2021r2c].

Flexible machine-learning methods need substantially more data than regression to reach stable performance; in one simulation, random forests, support vector machines and neural networks needed over ten times as many events per variable as logistic regression to keep optimism small [@vanderploeg2014].`,
        },
        { type: 'lab', lab: 'sample-size' },
        {
          type: 'callout',
          tone: 'evidence',
          title: 'Validation studies need size too',
          md: md`External validation needs enough events to estimate calibration and net benefit precisely. Rules of thumb such as "at least 100, preferably 200 events" [@collins2016extval] have been superseded by explicit calculations based on the target precision of the C-statistic, calibration slope and O/E ratio [@riley2024eval3].`,
        },
        { type: 'check', id: 'd-params' },
      ],
    },
  ],
  takeaways: [
    'Data reflect care processes as well as biology. Informative ordering and proxy labels help retrospectively and fail when practice changes.',
    'Every predictor must be available at the index time; anything recorded later is leakage.',
    'Use a missing-data strategy that can be executed at the bedside; multiple imputation is standard for development and validation.',
    'Size development studies with the Riley criteria, counting all candidate parameters; flexible ML needs more data than regression.',
  ],
};
