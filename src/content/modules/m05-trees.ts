import type { Module } from '../types';
const md = String.raw;

export const trees: Module = {
  id: 'trees',
  number: 5,
  track: 'build',
  title: 'Trees, random forests and gradient boosting',
  tagline: 'How recursive partitioning works, why ensembles beat single trees, what the hyperparameters do, and when trees are worth it.',
  minutes: 45,
  objectives: [
    'Describe how CART chooses splits using impurity and why single trees are unstable.',
    'Explain bagging and feature subsampling in random forests, and sequential gradient fitting in boosting.',
    'Tune the key hyperparameters without contaminating the test set.',
    'Recognise the calibration and importance pitfalls specific to tree ensembles.',
  ],
  sections: [
    {
      id: 'cart',
      title: 'Decision trees (CART)',
      blocks: [
        {
          type: 'md',
          md: md`A classification tree [@breiman1984cart] repeatedly splits the data on one predictor at a time, choosing the split that most reduces node **impurity**. For binary outcomes the Gini impurity of a node with event proportion $p$ is $G = 2p(1-p)$, which is 0 for a pure node and 0.5 at most. Entropy, $-p\log p - (1-p)\log(1-p)$, behaves similarly. A split's gain is the parent impurity minus the size-weighted impurity of the children. Splitting stops at a maximum depth, a minimum leaf size, or when no split helps; cost-complexity pruning then cuts back branches that do not improve validation performance.

**Strengths:** captures thresholds and interactions automatically, handles mixed predictor types, and is easy to read when shallow.
**Weaknesses:** predictions are step functions, smooth effects need many splits, and trees have **high variance**: a slightly different sample can produce a completely different tree.`,
        },
        { type: 'lab', lab: 'tree' },
      ],
    },
    {
      id: 'forests',
      title: 'Random forests',
      blocks: [
        {
          type: 'md',
          md: md`Averaging many noisy but unbiased estimators reduces variance, and the reduction is larger when the estimators are less correlated. Random forests [@breiman2001rf] decorrelate trees in two ways:

1. **Bagging**: each tree is grown on a bootstrap sample of patients. The roughly 37% of patients left out of each tree give an *out-of-bag* error estimate for free.
2. **Feature subsampling**: each split considers only a random subset of $m_{try}$ predictors (default about $\sqrt{p}$ for classification).

Trees are grown deep and the predicted probability is the average leaf proportion. Forests are robust to their hyperparameters, but their probabilities tend to be **pulled toward the middle** (too modest at the extremes). Expect a calibration slope above 1 and recalibrate before using absolute risks [@niculescu2005].`,
        },
      ],
    },
    {
      id: 'boosting',
      title: 'Gradient boosting',
      blocks: [
        {
          type: 'md',
          md: md`Boosting builds trees **sequentially**, each fitted to the errors of the current ensemble [@friedman2001gbm]. For the logistic loss, the negative gradient for patient $i$ is simply $y_i - \hat p_i$. Each small tree nudges the log-odds:

$$F_m(x) = F_{m-1}(x) + \nu \cdot \text{tree}_m(x)$$

| Hyperparameter | Effect | Typical range |
|---|---|---|
| Learning rate $\nu$ | Smaller = more rounds needed, usually better generalisation | 0.01–0.1 |
| Number of rounds | Too many → overfitting; choose by early stopping on validation data | 100s–1000s |
| Tree depth | Order of interactions captured | 2–6 |
| Min leaf size / min child weight | Regularises leaves | data-dependent |
| Row/column subsampling | Stochastic boosting reduces variance | 0.5–0.9 |

XGBoost [@chen2016xgboost], LightGBM and CatBoost add explicit regularisation, efficient histogram splits and native missing-value handling. On typical tabular benchmarks, tuned boosted trees remain the strongest general-purpose learners, often ahead of deep learning [@grinsztajn2022]. On clinical data the gain over a well-specified regression is frequently small [@christodoulou2019].`,
        },
        {
          type: 'callout',
          tone: 'pitfall',
          title: 'Tuning without cheating',
          md: md`Hyperparameters are part of the model. Tune them by cross-validation within the training data (nested CV if you also report CV performance), choose the number of rounds by early stopping on a validation fold, and touch the test set **once**. Report the search space and the final values [@collins2024tripodai].`,
        },
        { type: 'check', id: 't-boost' },
      ],
    },
    {
      id: 'importance',
      title: 'Importance measures and their traps',
      blocks: [
        {
          type: 'md',
          md: md`- **Impurity-based ("Gini") importance** is biased toward continuous predictors and predictors with many categories, because they offer more candidate split points [@strobl2007]. Do not use it to rank predictors.
- **Permutation importance** (the drop in performance when a predictor is shuffled in validation data) is less biased. With correlated predictors, though, shuffling creates impossible patients and importance gets split between them [@hooker2021permute].
- **SHAP** gives local and global attributions consistent with the model; see the Interpretability module.

Importance describes what *this model* relies on. It is not a causal ranking, and two equally accurate models can rely on very different predictors [@fisher2019mcr].`,
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'Choosing a model family',
          md: md`| Situation | Sensible first choice |
|---|---|
| Small–moderate n, mostly smooth effects, need for transparency | Logistic/Cox regression with splines |
| Large n, many predictors, suspected interactions | Gradient boosting, benchmarked against regression |
| Images, waveforms, free text | Deep learning (next module) |
| Any choice | Validate externally, check calibration, and recalibrate if needed |`,
        },
      ],
    },
  ],
  takeaways: [
    'CART splits greedily to reduce impurity; single trees are readable but unstable.',
    'Random forests average decorrelated deep trees; boosting adds shallow trees sequentially with a small learning rate.',
    'Tune depth, leaf size, rounds and learning rate inside the training data; use the test set once.',
    'Tree-ensemble probabilities often need recalibration; impurity importance is biased.',
    'Boosting is the strongest generic tabular learner, but on clinical data it often only matches well-specified regression.',
  ],
};
