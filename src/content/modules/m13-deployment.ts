import type { Module } from '../types';
const md = String.raw;

export const deployment: Module = {
  id: 'deployment',
  number: 13,
  track: 'trust',
  title: 'Deployment, monitoring and regulation',
  tagline: 'Silent trials, human factors and automation bias, dataset shift and feedback loops, documentation, and the 2026 regulatory landscape.',
  minutes: 45,
  objectives: [
    'Plan a staged deployment, including a silent trial and a monitoring and updating plan.',
    'Recognise automation bias and design for appropriate reliance.',
    'Classify dataset shift and choose a response to each type, including feedback loops.',
    'Summarise current US and EU regulatory requirements relevant to clinical prediction software.',
  ],
  sections: [
    {
      id: 'staging',
      title: 'From validated model to working tool',
      blocks: [
        {
          type: 'md',
          md: md`1. **Local external validation** on recent retrospective data from the deployment site (calibration, threshold metrics, subgroups).
2. **Silent (shadow) deployment**: run the model in real time without showing outputs, and compare live predictions with outcomes. This catches data-pipeline errors, timing problems and live-vs-retrospective differences, which are the commonest causes of failure.
3. **Workflow design**: who receives the output, through which channel, with what recommended action, and how responses are recorded.
4. **Early live evaluation** reported with DECIDE-AI [@vasey2022decideai], then a comparative **impact evaluation** where feasible.
5. **Monitoring and governance**: named owners, metrics, review frequency, triggers for recalibration or withdrawal [@wiens2019roadmap].`,
        },
        {
          type: 'callout',
          tone: 'pitfall',
          title: 'Automation bias',
          md: md`People over-rely on automated advice, especially when uncertain or inexperienced. When an AI system suggested incorrect BI-RADS categories, mammography readers' accuracy fell sharply, most of all for less experienced readers [@dratsch2023]. Design for *appropriate* reliance: show uncertainty and calibration information, make it easy to disagree, audit overrides, and train users on known failure modes.`,
        },
      ],
    },
    {
      id: 'shift',
      title: 'Dataset shift and feedback loops',
      blocks: [
        {
          type: 'md',
          md: md`Performance belongs to a model *in a setting at a time* [@finlayson2021shift; @subbaswamy2020shift]:

| Shift | What changes | Typical signature | Response |
|---|---|---|---|
| **Prior (label) shift** | Outcome incidence | Intercept miscalibration; AUC stable | Intercept update |
| **Covariate shift** | Case mix | Often little miscalibration if the model is well specified; AUC may change | Verify; often nothing |
| **Measurement / pipeline change** | Assays, units, EHR builds, coding | Abrupt miscalibration | Fix the data mapping; recalibrate |
| **Concept drift** | The predictor–outcome relationship (e.g., new treatment) | Slope and AUC deteriorate | Revise or re-develop |
| **Feedback loop** | Interventions triggered by the model prevent the outcome | The model appears to over-predict for flagged patients | Do **not** naively retrain on post-deployment outcomes |

Calibration drift occurs even within one hospital and differs between modelling methods [@davis2017drift]. Successful models can erase the very associations they learned, because flagged patients are treated: "victims of their own success" [@lenert2019]. Monitoring should track inputs (distributions, missingness), outputs (score distribution, alert rate) and outcomes (O/E, slope, subgroup metrics), with pre-agreed action thresholds.`,
        },
        { type: 'lab', lab: 'drift' },
        { type: 'check', id: 'dep-feedback' },
      ],
    },
    {
      id: 'documentation',
      title: 'Documentation clinicians can use',
      blocks: [
        {
          type: 'md',
          md: md`- **Model facts labels** give a one-page summary for end users: intended use, population, outcome, performance (including calibration) and known limitations, plus warnings about situations where the model should not be used [@sendak2020facts].
- **Model cards** report performance disaggregated by groups and conditions [@mitchell2019modelcards].
- Full methods follow **TRIPOD+AI**, and appraisal of published models uses **PROBAST+AI** (see the [Appraisal checklist](/appraise)).`,
        },
      ],
    },
    {
      id: 'regulation',
      title: 'Regulation in 2026',
      blocks: [
        {
          type: 'md',
          md: md`**United States: FDA.** Software intended to diagnose, treat or prevent disease can be a medical device (Software as a Medical Device). Clinical decision support is excluded from device regulation if it meets four statutory criteria: it does not analyse images or signals; it displays or analyses medical information; it supports a healthcare professional's recommendation; and it lets the professional independently review the basis of the recommendation. FDA's **revised CDS guidance (January 2026)** replaced the 2022 version and widened enforcement discretion, for example for some tools that offer a single recommendation, and removed most language treating time-critical use as automatically device-level. The guidance does not address AI specifically [@fda_cds2026].

- FDA lists more than 1,600 authorised AI-enabled devices as of September 2026, about three-quarters in radiology [@fda_aidevices].
- **Predetermined change control plans** (final guidance December 2024, reissued 2025) let manufacturers pre-authorise specified model updates, such as retraining, with a validation protocol [@fda_pccp].
- Lifecycle guidance for AI-enabled device software functions remains in **draft** (January 2025) [@fda_aidsf2025]. The Good Machine Learning Practice principles apply throughout [@fda_gmlp2021].

**United States: health IT and civil rights.** The 2024 HTI-1 rule required certified EHRs to expose "source attributes" for decision-support interventions. The **HTI-5 final rule (October 2026)** removes those requirements and the predictive-DSI risk-management requirements, mostly from January 2027 [@onc_hti5]. Transparency now depends more on procurement contracts and local governance. Section 1557 non-discrimination duties for decision-support tools remain on the books [@hhs1557].

**European Union.** The AI Act (Regulation 2024/1689) classes AI that is, or is part of, a medical device as **high-risk**, with obligations for risk management, data governance, logging, transparency, human oversight and accuracy, which apply alongside the MDR/IVDR [@euaiact2024]. A 2026 "Digital Omnibus" agreement postpones high-risk obligations, to as late as August 2028 for product-embedded systems such as medical devices. Confirm the final dates in the Official Journal [@eu_omnibus2026].

Regulatory status is not evidence of benefit. Many authorised devices were cleared on retrospective accuracy data; local validation and monitoring remain the deployer's responsibility.`,
        },
        { type: 'check', id: 'dep-cds' },
      ],
    },
  ],
  takeaways: [
    'Deploy in stages: local validation → silent trial → workflow design → live evaluation → monitored use with named owners.',
    'Design against automation bias; explanations alone do not prevent it.',
    'Identify the type of shift before acting; feedback loops contaminate post-deployment labels.',
    'Know the 2026 landscape: FDA’s revised CDS guidance, PCCPs, HTI-5 removing EHR source-attribute requirements, Section 1557, and the EU AI Act with postponed high-risk dates.',
  ],
};
