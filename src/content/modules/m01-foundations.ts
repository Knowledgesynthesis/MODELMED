import type { Module } from '../types';
const md = String.raw;

export const foundations: Module = {
  id: 'foundations',
  number: 1,
  track: 'frame',
  title: 'What a clinical prediction model is — and is not',
  tagline: 'Prediction vs causation, the anatomy of a prediction question, absolute risk, and the evidence ladder.',
  minutes: 35,
  objectives: [
    'Distinguish prediction, description and causal (counterfactual) questions, and explain why a good predictor is not a treatment target.',
    'Specify a prediction problem completely: population, moment of prediction, predictors, outcome, horizon, and the action it informs.',
    'Convert test or model characteristics into post-test probabilities using prevalence and likelihood ratios.',
    'Place a model on the evidence ladder from development to impact and monitoring.',
  ],
  sections: [
    {
      id: 'three-tasks',
      title: 'Three different questions',
      blocks: [
        {
          type: 'md',
          md: md`Data science in medicine answers three kinds of question [@hernan2019]:

| Task | Question | Example | Typical method |
|---|---|---|---|
| **Description** | What is the distribution of X? | What proportion of ward patients have a lactate > 2? | Summary statistics |
| **Prediction** | Given what we know now, what is the probability of Y? | What is this patient's risk of sepsis in the next 48 h? | Prediction models (regression, ML) |
| **Counterfactual prediction** (causal inference) | What would happen to Y if we did A rather than B? | Would giving antibiotics now, rather than in 3 h, change mortality? | Trials; causal methods for observational data |

A **clinical prediction model** estimates the probability that an outcome is present (*diagnostic*) or will occur within a time horizon (*prognostic*), $P(Y=1 \mid X=x)$, for a patient with predictor values $x$ at a defined moment. It is judged by how accurate those probabilities are in the people it will be used on, not by whether its coefficients are causal.`,
        },
        {
          type: 'callout',
          tone: 'pitfall',
          title: 'A predictor is not a lever',
          md: md`A model trained on routine data found that patients with asthma had a *lower* risk of dying from pneumonia [@caruana2015]. Asthma is not protective. Asthmatic patients were admitted to intensive care faster, and that treatment lowered their risk. The model learned the care pathway, not the biology. Deploying it to triage would have sent the highest-risk patients home.

Prediction models estimate risk *under current care*, including whatever clinicians currently do for high-risk patients ("treatment-naive" risk is a different, causal quantity) [@vangeloven2020]. Do not read coefficients, feature importance or SHAP values as effects of intervening.`,
        },
        { type: 'check', id: 'f-causal' },
      ],
    },
    {
      id: 'anatomy',
      title: 'The anatomy of a prediction question',
      blocks: [
        {
          type: 'md',
          md: md`Most failed models fail at specification, not at mathematics. Before any data are touched, write the question down in full:

1. **Population and setting.** Who, where, at what point in the care pathway (e.g., adults on medical wards, excluding palliative care).
2. **Moment of prediction (index time).** When the prediction is made, e.g., at each routine observation round, or at the time of ED triage. Everything downstream is anchored to this moment.
3. **Predictors.** Only information *available at the index time*, measured as it will be measured in practice (same assay, same documentation habits, same missingness).
4. **Outcome and horizon.** A clinically meaningful, objectively defined outcome within a fixed horizon (e.g., Sepsis-3 within 48 h [@singer2016sepsis3]), ascertained the same way for everyone and, ideally, blind to the predictors.
5. **Intended use.** Who sees the output, what they do differently at which risk level, and what harm a false alarm or a miss causes.

If any element is vague, performance figures cannot be interpreted. A sepsis model whose outcome label is "blood culture drawn plus antibiotics given" predicts *clinician suspicion*, not sepsis.`,
        },
        {
          type: 'callout',
          tone: 'example',
          title: 'Well-specified vs poorly specified',
          md: md`**Poor:** "An AI model to predict sepsis using EHR data."

**Good:** "In adults admitted to medical wards of three acute hospitals, at every observation set during the first 7 days, estimate the probability of meeting Sepsis-3 criteria within the next 48 h, using vital signs, routine labs available at that time and age, to prompt a rapid-response review when risk ≥ 10%."`,
        },
      ],
    },
    {
      id: 'absolute-risk',
      title: 'Absolute risk is the currency',
      blocks: [
        {
          type: 'md',
          md: md`Clinical decisions turn on **absolute** risk: whether *this* patient's probability crosses the point where acting does more good than harm. Relative measures (odds ratios, hazard ratios, relative risks) are constant across a population only by assumption, and they translate into very different absolute changes for low- and high-risk patients.

The same logic governs tests and models. Sensitivity and specificity describe how the model behaves *conditional on* the true state. What a clinician sees is the predictive value, which also depends on how common the outcome is:

$$\text{PPV} = \frac{\text{sens}\times\text{prev}}{\text{sens}\times\text{prev} + (1-\text{spec})(1-\text{prev})}$$

In odds form, which travels best across settings: **post-test odds = pre-test odds × likelihood ratio**, where $\text{LR}^+ = \text{sens}/(1-\text{spec})$.`,
        },
        { type: 'lab', lab: 'bayes' },
        { type: 'check', id: 'f-ppv' },
      ],
    },
    {
      id: 'evidence-ladder',
      title: 'The evidence ladder',
      blocks: [
        {
          type: 'md',
          md: md`A model earns trust step by step [@collins2024eval1; @steyerberg2019book]:

1. **Development** — the model is fitted, with **internal validation** (bootstrap or cross-validation) to estimate and correct optimism.
2. **External validation** — performance in new patients: later in time (temporal), elsewhere (geographic), or in a different but related population (domain). This is where most models lose discrimination and, above all, calibration.
3. **Impact assessment** — does using the model change decisions and patient outcomes? This needs comparative designs (cluster-randomised, stepped-wedge, or careful before–after studies) [@kappen2018impact].
4. **Implementation and monitoring** — performance drifts as populations, practice and data systems change.

The literature is crowded at step 1. A living review of COVID-19 prediction models appraised hundreds of models and rated almost all at high risk of bias, mostly from small samples, inappropriate exclusions and optimistic evaluation [@wynants2020covid]. Validation is also never "done": performance differs across settings and over time, so the useful question is *validated where, when, and for what decision* [@vancalster2023novalidated].`,
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'Standards to know by name',
          md: md`- **TRIPOD+AI** (2024): what a development or validation study must report, for regression *and* machine learning [@collins2024tripodai].
- **PROBAST+AI** (2025): how to judge risk of bias and applicability of such studies [@moons2025probastai].
- **TRIPOD-LLM** (2025) for large language models [@gallifant2025tripodllm]; **STARD-AI** (2025) for AI diagnostic accuracy studies [@sounderajah2025stardai].
- **DECIDE-AI** for early live clinical evaluation [@vasey2022decideai]; **CONSORT-AI / SPIRIT-AI** for trials of AI interventions [@liu2020consortai].`,
        },
        { type: 'check', id: 'f-ladder' },
      ],
    },
  ],
  takeaways: [
    'A prediction model estimates absolute risk under current care; it is not a causal model, and its predictors are not treatment targets.',
    'Specify population, index time, predictors available at that time, outcome definition and horizon, and the decision the output informs — before modelling.',
    'Predictive values depend on prevalence; likelihood ratios convert pre-test to post-test odds.',
    'Development with internal validation is the first rung. External validation, impact studies and monitoring follow, and "validated" always means validated somewhere, for something.',
  ],
};
