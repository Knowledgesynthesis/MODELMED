import type { Module } from '../types';
const md = String.raw;

export const utility: Module = {
  id: 'utility',
  number: 10,
  track: 'evaluate',
  title: 'Clinical utility: thresholds, net benefit and impact',
  tagline: 'Translating harms and benefits into a threshold, decision curve analysis, workload, and evidence that a model improves care.',
  minutes: 40,
  objectives: [
    'Derive a decision threshold from the relative harm of unnecessary vs missed intervention.',
    'Compute and interpret net benefit and read a decision curve.',
    'Account for workload, capacity and alert fatigue in a deployment decision.',
    'Distinguish accuracy studies from impact studies and appraise evidence that a model improves outcomes.',
  ],
  sections: [
    {
      id: 'threshold',
      title: 'A threshold encodes values',
      blocks: [
        {
          type: 'md',
          md: md`If acting on a patient who does **not** have the outcome costs harm $H$, and acting on a patient who **does** gains benefit $B$, then acting is worthwhile when $p \cdot B > (1-p) \cdot H$, i.e., when

$$p > p_t = \frac{H}{H+B}, \qquad \frac{p_t}{1-p_t} = \frac{H}{B}$$

A threshold of 10% therefore says "I would accept treating 9 patients unnecessarily to treat 1 who needs it." Low thresholds suit cheap, safe, highly effective actions (an extra senior review for possible sepsis); high thresholds suit invasive or scarce ones (ICU transfer, surgery). Different clinicians and patients may reasonably hold different thresholds, which is why a *range* matters.`,
        },
        { type: 'check', id: 'u-threshold' },
      ],
    },
    {
      id: 'net-benefit',
      title: 'Net benefit and decision curves',
      blocks: [
        {
          type: 'md',
          md: md`**Net benefit** at threshold $p_t$ puts true and false positives on a common scale [@vickers2006dca]:

$$\text{NB}(p_t) = \frac{TP}{n} - \frac{FP}{n}\cdot\frac{p_t}{1-p_t}$$

It is measured in "net true positives per patient": NB = 0.05 is equivalent to finding 5 true cases per 100 patients with no false positives. Compare the model with the default strategies **treat all**, $\text{NB} = \text{prev} - (1-\text{prev})\,p_t/(1-p_t)$, and **treat none**, NB = 0.

A **decision curve** plots NB across the range of reasonable thresholds. A model is clinically useful over the thresholds where it beats both defaults [@vickers2016nb; @vickers2019guide]. Because net benefit uses the predicted *probabilities* at the threshold, miscalibration lowers it directly.`,
        },
        { type: 'lab', lab: 'dca' },
        { type: 'check', id: 'u-nb' },
      ],
    },
    {
      id: 'workflow',
      title: 'Workload, capacity and alert fatigue',
      blocks: [
        {
          type: 'md',
          md: md`A model changes care only when someone acts on it. Before deployment, quantify:

- **Alert volume**: flags per day per ward, and the number needed to evaluate (1/PPV).
- **Lead time**: how far ahead of clinician recognition does a true alert arrive? An alert after antibiotics have started adds nothing (see the sepsis case in Module 7).
- **Actionability**: is there a defined, effective response, and capacity to deliver it?
- **Alert fatigue**: repeated, low-value alerts reduce response to all alerts [@ancker2017alerts].

When capacity is fixed, evaluate the model as a ranking: sensitivity and PPV among the top-k patients that the team can review.`,
        },
      ],
    },
    {
      id: 'impact',
      title: 'Does using the model improve outcomes?',
      blocks: [
        {
          type: 'md',
          md: md`Accuracy is necessary but not sufficient. Impact depends on what clinicians do with the output, so it needs comparative evaluation [@kappen2018impact; @moons2012external]:

- **Cluster-randomised or stepped-wedge trials** are the strongest designs. An AI-ECG tool for low ejection fraction, tested in a pragmatic cluster RCT across primary care teams, increased new diagnoses [@yao2021eagle].
- **Observational before–after or adoption studies** are vulnerable to secular trends and confounding by who responds to alerts. In a prospective multisite study of a sepsis early-warning system, patients whose alerts were confirmed within 3 hours had lower mortality, an observational comparison that cannot fully separate the tool's effect from the clinicians' [@adams2022trews].
- Impact is a causal question. When randomisation is impossible, design the comparison as an emulated target trial ([Module 15](/module/causal)).
- RCTs of ML interventions remain few, often single-centre, and inconsistently reported [@plana2022rct]. Use **DECIDE-AI** for early live evaluation and **CONSORT-AI** for trials [@vasey2022decideai; @liu2020consortai].`,
        },
      ],
    },
  ],
  takeaways: [
    'A threshold p_t implies a harm:benefit ratio of p_t/(1 − p_t); choose it from consequences, not from the ROC curve.',
    'Net benefit = TP/n − FP/n × p_t/(1 − p_t); a model is useful where its decision curve beats treat-all and treat-none.',
    'Plan for alert volume, lead time, actionability and capacity.',
    'Only comparative impact studies show that a model improves care.',
  ],
};
