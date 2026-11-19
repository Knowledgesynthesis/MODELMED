# ModelMed

**An evidence-based, interactive course for clinicians on building, validating, interpreting and appraising clinical prediction models and machine learning — and on causal inference and target trial emulation.**

ModelMed teaches the full lifecycle of a clinical prediction model — from framing the question to monitoring after go-live — through 15 modules, 16 live labs and an end-to-end model sandbox. Every chart is computed in the browser from data or exact formulas; nothing is pre-drawn or faked.

## What's inside

| | |
|---|---|
| **15 modules** in five tracks | *Frame* (foundations; data, outcomes, sample size) · *Build* (logistic regression, survival, trees & boosting, neural networks) · *Evaluate* (validation & leakage, discrimination, calibration, clinical utility) · *Trust & deploy* (interpretability, fairness, deployment & 2026 regulation, LLMs) · *Causal questions* (potential outcomes, DAGs, target trial emulation, propensity scores and g-methods, sensitivity analysis) |
| **16 interactive labs** | Prevalence & PPV · Riley sample size · odds ratios vs absolute risk · Kaplan–Meier & censoring · decision trees · neural-network playground · overfitting · leakage in cross-validation · ROC/PR & thresholds · calibration & recalibration · decision curves · exact SHAP · label bias & fairness trade-offs · drift monitoring · confounders/colliders/mediators, IPTW vs g-formula & E-values · immortal time bias |
| **Model sandbox** | Five model families (logistic, logistic + splines, CART, random forest, gradient boosting) on synthetic cohorts with *known true risk*; AUC with DeLong CI, calibration intercept/slope/ICI, decision curves, permutation importance, subgroup audit, exact per-patient SHAP, leakage detection, auto-generated TRIPOD+AI-style summary |
| **Assessment** | 99 case-based items with rationales and citations; 80% mastery check per module; mixed exams and missed-question review |
| **Appraisal checklist** | Structured appraisal condensed from PROBAST+AI / TRIPOD+AI domains, with a copyable concern summary |
| **Evidence base** | 170 sources (DOIs verified against Crossref), including TRIPOD+AI (2024), PROBAST+AI (2025), TRIPOD-LLM (2025), STARD-AI (2025), TARGET (2025), FDA CDS guidance (Jan 2026), ONC HTI-5 (Oct 2026) and the EU AI Act Digital Omnibus (2026) |

## Scientific integrity

- **Verified numerics.** `src/lib` contains the statistics and ML engine (IRLS logistic regression, restricted cubic splines, CART, random forests, gradient boosting, exact Shapley values, Kaplan–Meier/log-rank/C-index, DeLong AUC CIs, flexible calibration curves, net benefit, Riley sample size, g-formula, IPTW, balance diagnostics, E-values). Unit tests check them against known results — e.g. the Riley calculator reproduces the published pmsampsize example (n = 662) and its C-statistic → R² conversion (0.288), and the E-value calculator reproduces VanderWeele & Ding’s worked example (RR 3.9 → 7.26).
- **Honest synthetic data.** Cohorts are generated from explicit, documented data-generating models with seeded randomness. The sepsis cohort has U-shaped (SIRS-like) effects where splines and ensembles beat linear terms; the readmission cohort is linear and weak, where logistic regression matches flexible ML — mirroring the published evidence. Tests assert both lessons.

## Development

```bash
npm install
npm run dev       # local dev server
npm test          # unit tests (vitest)
npm run lint      # eslint, zero warnings
npm run build     # type-check + production build (PWA, offline-capable)
npm run check     # all of the above
```

Stack: React 18, TypeScript, Vite, Tailwind CSS, Zustand, react-markdown + KaTeX, custom SVG charts, vite-plugin-pwa. Deployed on Vercel (`vercel.json` provides SPA rewrites).

## Privacy

All data are synthetic. Everything runs client-side; progress is stored only in the browser (exportable from Settings).
