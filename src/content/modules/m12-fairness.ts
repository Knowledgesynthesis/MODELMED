import type { Module } from '../types';
const md = String.raw;

export const fairness: Module = {
  id: 'fairness',
  number: 12,
  track: 'trust',
  title: 'Bias, fairness and health equity',
  tagline: 'Where bias enters the pipeline, race in clinical algorithms, competing fairness criteria, and how to audit a model.',
  minutes: 45,
  objectives: [
    'Trace how bias enters through labels, measurements, sampling, missingness and deployment.',
    'Evaluate the use of race and other sensitive attributes in clinical algorithms.',
    'Define the main group fairness criteria and explain why they conflict.',
    'Conduct a subgroup performance audit and propose mitigations.',
  ],
  sections: [
    {
      id: 'sources',
      title: 'Where bias enters',
      blocks: [
        {
          type: 'md',
          md: md`| Stage | Mechanism | Example |
|---|---|---|
| Problem framing & label | A proxy label reflects unequal access | A care-management algorithm predicting **cost** under-selected Black patients, who were sicker at the same score; re-labelling on health need would have raised their share among those flagged for extra help from 17.7% to 46.5% [@obermeyer2019] |
| Measurement | Devices or tests perform differently | Pulse oximetry missed occult hypoxaemia about three times as often in Black as in White patients (11.7% vs 3.6%) [@sjoding2020] |
| Representation | Groups under-represented in development data | Chest-radiograph classifiers under-diagnosed disease more often in under-served groups (female, Black, Hispanic, younger and Medicaid-insured patients) [@seyyedkalantari2021] |
| Missingness & documentation | Less testing or documentation in some groups | "Normal" values are really "not measured" |
| Deployment | Who gets flagged, who responds, what action follows | An accurate model can still widen gaps if the response is unequally available [@paulus2020] |

Bias does not require a sensitive attribute in the model. Proxies (postcode, insurance, utilisation) and the label itself carry it.`,
        },
        { type: 'lab', lab: 'fairness' },
      ],
    },
    {
      id: 'race',
      title: 'Race and sensitive attributes in algorithms',
      blocks: [
        {
          type: 'md',
          md: md`Many clinical equations historically included race "corrections" that steered resources away from minoritised patients, often on weak evidence about biology [@vyas2020]. Recent revisions:

- **Kidney function**: the 2021 CKD-EPI equations estimate GFR without race [@inker2021].
- **Cardiovascular risk**: the 2024 AHA **PREVENT** equations omit race and add kidney and metabolic measures and an optional social-deprivation index [@khan2024prevent].

Removing a sensitive attribute does not guarantee fairness, because proxies remain. Including it can sometimes improve calibration for a group, but it risks encoding social disadvantage as biology. The defensible approach is context-specific: measure the causal factors directly where possible (kidney function, social determinants), test calibration and error rates in each group, and make the choice explicit and reviewable.`,
        },
        { type: 'check', id: 'b-race' },
      ],
    },
    {
      id: 'criteria',
      title: 'Fairness criteria conflict',
      blocks: [
        {
          type: 'md',
          md: md`| Criterion | Requires equal across groups | Clinical meaning |
|---|---|---|
| Calibration within groups | P(Y=1 \| score = s, group) = s | A 20% risk means 20% for everyone |
| Equal opportunity | Sensitivity (TPR) [@hardt2016] | Cases are equally likely to be caught |
| Equalised odds | TPR and FPR | Equal miss and false-alarm rates |
| Demographic parity | Flag rate | Equal share flagged, regardless of need |

When base rates differ between groups and prediction is imperfect, **calibration within groups and equal error rates cannot hold simultaneously** [@kleinberg2017; @chouldechova2017]. Choosing which to prioritise is a value judgement about which errors matter in a given use. For allocation of a beneficial resource, equal opportunity is often emphasised; for risk communication, calibration [@rajkomar2018fair]. Imposing fairness constraints during training often worsens calibration and overall performance without helping the disadvantaged group [@pfohl2021fair].`,
        },
        { type: 'check', id: 'b-impossible' },
      ],
    },
    {
      id: 'audit',
      title: 'Auditing a model',
      blocks: [
        {
          type: 'md',
          md: md`1. **Interrogate the label.** Does the outcome measure what you care about equally well in every group?
2. **Disaggregate performance** by sex, age, race and ethnicity, language, insurance, site, and relevant intersections: AUC, calibration (O/E, slope, curve) and sensitivity/PPV *at the deployment threshold*, with confidence intervals. Small groups need adequate numbers before conclusions are drawn.
3. **Check inputs** for differential measurement and missingness.
4. **Simulate the decision**: who is flagged, who benefits, who bears the false alarms?
5. **Mitigate** by improving labels and data, group-specific recalibration, explicitly justified thresholds, and changing the intervention. Involve affected patients and clinicians.
6. **Monitor** subgroup performance after deployment.

**Regulatory context (US, as of 2026):** the HHS Section 1557 rule requires covered health programmes to make reasonable efforts to identify and mitigate discrimination risks from patient-care decision support tools, including algorithms, with obligations applying from May 2025 [@hhs1557]. Check current enforcement guidance.`,
        },
      ],
    },
  ],
  takeaways: [
    'Bias enters through labels, measurement, representation, missingness and deployment — not only through sensitive variables.',
    'Race-free revisions of kidney and cardiovascular equations show the field moving away from race corrections; proxies still require auditing.',
    'Calibration within groups and equal error rates conflict when base rates differ; choose deliberately and transparently.',
    'Audit with disaggregated calibration and threshold metrics, interrogate the label, and monitor after deployment.',
  ],
};
