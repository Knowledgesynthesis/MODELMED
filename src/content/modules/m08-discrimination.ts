import type { Module } from '../types';
const md = String.raw;

export const discrimination: Module = {
  id: 'discrimination',
  number: 8,
  track: 'evaluate',
  title: 'Discrimination and classification',
  tagline: 'Confusion matrices, ROC and AUC, precision–recall under imbalance, and choosing thresholds.',
  minutes: 45,
  objectives: [
    'Compute sensitivity, specificity, PPV, NPV, likelihood ratios and flag rate from a confusion matrix.',
    'Interpret AUC correctly, with its confidence interval and its limits.',
    'Decide when precision–recall analysis adds information, and when it misleads.',
    'Justify a threshold clinically rather than statistically.',
  ],
  sections: [
    {
      id: 'confusion',
      title: 'The confusion matrix',
      blocks: [
        {
          type: 'md',
          md: md`At a chosen threshold, every patient is flagged or not:

| | Outcome | No outcome |
|---|---|---|
| **Flagged** | True positive (TP) | False positive (FP) |
| **Not flagged** | False negative (FN) | True negative (TN) |

- Sensitivity (recall, TPR) = TP / (TP + FN); specificity = TN / (TN + FP)
- PPV (precision) = TP / (TP + FP); NPV = TN / (TN + FN). These depend on prevalence.
- LR⁺ = sens / (1 − spec); LR⁻ = (1 − sens) / spec
- **Flag rate** = (TP + FP) / n, and **number needed to evaluate** = 1 / PPV (alerts per true case). These drive workload and alert fatigue.

**Accuracy** is rarely useful: at 5% prevalence, flagging nobody scores 95%. Classification metrics also discard information, because a predicted risk of 49% and one of 51% end up in different boxes.`,
        },
        { type: 'check', id: 'c-acc' },
      ],
    },
    {
      id: 'roc',
      title: 'ROC curves and AUC',
      blocks: [
        {
          type: 'md',
          md: md`The ROC curve plots sensitivity against 1 − specificity at every threshold. The **AUC** (c-statistic) equals the probability that a randomly chosen patient with the outcome has a higher predicted risk than a randomly chosen patient without it [@hanley1982]: 0.5 is chance and 1.0 is perfect ranking.

What AUC does **not** tell you:
- whether the probabilities are correct (calibration). Any monotone transformation leaves AUC unchanged.
- how the model performs at the threshold you will actually use
- whether using the model helps patients

Report AUC with a 95% CI (DeLong or bootstrap) [@delong1988]. Verbal labels ("0.7–0.8 acceptable, > 0.8 excellent") are arbitrary. A 0.70 can be valuable for a common outcome with a cheap intervention, and a 0.90 useless if badly calibrated [@dehond2022auc]. A small AUC gain from a new marker can still matter clinically; judge it by calibration and net benefit. Avoid the net reclassification index (NRI), which can reward miscalibrated models [@kerr2014nri].`,
        },
        { type: 'lab', lab: 'roc' },
      ],
    },
    {
      id: 'pr',
      title: 'Precision–recall and class imbalance',
      blocks: [
        {
          type: 'md',
          md: md`With a rare outcome, the ROC curve can look excellent while PPV is dismal, because a small false-positive *rate* applied to a huge negative group is still a large *number* of false alarms. The precision–recall curve makes that visible [@saito2015pr].

Two cautions:
1. AUPRC depends on prevalence (its chance baseline *is* the prevalence), so it cannot be compared across populations with different event rates.
2. AUPRC is not automatically "better" for imbalanced data. It weights the high-score region and can favour improvements in high-prevalence subgroups, which raises fairness concerns [@mcdermott2024auprc].

Do **not** "fix" imbalance by undersampling, oversampling or SMOTE when you need risk estimates. These corrections distort calibration, typically producing gross over-prediction, without improving AUC [@vandengoorbergh2022]. Instead, choose an appropriate threshold on well-calibrated risks.`,
        },
        { type: 'check', id: 'c-smote' },
      ],
    },
    {
      id: 'thresholds',
      title: 'Choosing a threshold',
      blocks: [
        {
          type: 'md',
          md: md`Statistical rules such as Youden's index (maximising sensitivity + specificity) or "closest to the top-left corner" weigh a missed case and a false alarm equally. Clinically they rarely are.

A threshold should come from the consequences of acting:
- **Harm–benefit**: act when risk exceeds $p_t$, where $p_t/(1-p_t)$ = harm of unnecessary action / benefit of necessary action (next modules).
- **Capacity**: if a team can review 20 patients a day, the threshold is effectively "top 20". Report the resulting sensitivity and PPV.
- **Report several thresholds**, with flag rate and number needed to evaluate, so users can judge workload.`,
        },
      ],
    },
  ],
  takeaways: [
    'Sensitivity/specificity are conditional on the true state; PPV/NPV and alert burden depend on prevalence.',
    'AUC is ranking ability across all thresholds; it says nothing about calibration or clinical value. Report it with a CI; ignore verbal labels.',
    'Use precision–recall to expose alert burden, but do not compare AUPRC across prevalences.',
    'Never rebalance classes when you need probabilities; choose thresholds from clinical consequences and capacity.',
  ],
};
