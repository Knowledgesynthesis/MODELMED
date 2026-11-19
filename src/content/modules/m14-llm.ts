import type { Module } from '../types';
const md = String.raw;

export const llm: Module = {
  id: 'llm',
  number: 14,
  track: 'trust',
  title: 'Large language models and foundation models',
  tagline: 'How LLMs differ from risk models, what the clinical evidence shows, their failure modes, and how to evaluate an LLM application.',
  minutes: 40,
  objectives: [
    'Explain how LLMs are trained and why their outputs are not calibrated risk estimates by default.',
    'Summarise the gap between benchmark performance and clinical evidence.',
    'List the characteristic failure modes of LLM applications.',
    'Design an evaluation of an LLM-based clinical tool using TRIPOD-LLM principles.',
  ],
  sections: [
    {
      id: 'what',
      title: 'What is different about LLMs',
      blocks: [
        {
          type: 'md',
          md: md`Large language models are transformer networks pretrained to predict the next token on vast text corpora, then tuned with instructions and human feedback. **Foundation models** apply the same recipe to images, waveforms or EHR event sequences and are then adapted to many tasks.

Compared with a classical prediction model:
- The **task is often generative** (summaries, letters, answers), so "accuracy" has to be defined per task, and errors are open-ended.
- **Outputs vary** with prompt wording, the order of information, the sampling temperature and the model version.
- **Stated confidence is unreliable**: verbalised confidence tends to be over-confident and poorly calibrated [@xiong2024uncertainty].
- **Training data are opaque**, so benchmark contamination and representativeness are hard to rule out.

When an LLM is used to *predict* a clinical outcome, every principle in this course applies unchanged: a clear index time, no leakage, discrimination, calibration, net benefit, external validation and monitoring, benchmarked against a simple model.`,
        },
      ],
    },
    {
      id: 'evidence',
      title: 'What the evidence shows',
      blocks: [
        {
          type: 'md',
          md: md`- **Exams.** LLMs reached passing and then expert-level scores on licensing-style questions [@singhal2023]. Multiple-choice benchmarks do not test history-taking, judging what information is missing, or acting safely over time.
- **Realistic decision-making.** Given real patient cases from MIMIC, leading LLMs diagnosed less accurately than physicians, often failed to follow guidelines, ordered tests poorly, and were sensitive to the order and quantity of information [@hager2024].
- **Human + LLM.** In a randomised trial, giving physicians access to an LLM did not significantly improve their diagnostic reasoning compared with conventional resources, although the LLM alone scored higher than either group [@goh2024]. Benefits depend on integration and training, not just model capability.
- **The evaluation literature.** A systematic review of 519 studies found that only 5% evaluated LLMs on real patient-care data; most tested exam-style questions on accuracy alone [@bedi2025].
- **Bias.** LLMs have reproduced debunked race-based medical claims [@omiye2023].`,
        },
        { type: 'check', id: 'llm-evidence' },
      ],
    },
    {
      id: 'failure',
      title: 'Failure modes to design against',
      blocks: [
        {
          type: 'md',
          md: md`| Failure | Example | Mitigation |
|---|---|---|
| Fabrication ("hallucination") | Invented medication, citation or exam finding | Ground outputs in source documents; require citations to the record; human verification |
| Omission | Summary drops an allergy or a critical result | Task-specific checklists; measure omission rates, not just errors |
| Sycophancy and anchoring | Agrees with the user's wrong premise | Neutral prompting; ask for alternatives |
| Prompt and version sensitivity | Different answers to rephrased questions; silent vendor updates | Pin versions; regression-test prompts; monitor |
| Bias | Different recommendations by patient demographics | Counterfactual testing (swap demographics) |
| Privacy and security | Protected health information sent to external services; prompt injection | Approved deployments, data agreements, input sanitisation |
| Automation bias | Plausible prose is over-trusted | Training; interface design; audits |`,
        },
      ],
    },
    {
      id: 'evaluate',
      title: 'Evaluating an LLM application',
      blocks: [
        {
          type: 'md',
          md: md`Follow **TRIPOD-LLM** for reporting [@gallifant2025tripodllm]:

1. **Define the task and intended use** precisely: input, output, user, decision and setting.
2. **Use representative real inputs** from the deployment setting, including messy, incomplete and atypical cases, never only curated vignettes.
3. **Specify the reference standard** and a human evaluation protocol: blinded raters with clinical expertise, a severity-graded error taxonomy (harmful vs harmless), and inter-rater agreement.
4. **Measure task-specific outcomes**: factual accuracy, omissions, harm potential, time saved, and comparison with current practice.
5. **Test robustness**: prompt paraphrases, input order, demographic counterfactuals, out-of-distribution cases.
6. **Report the model version, date, prompts and settings**, and plan monitoring for version changes.
7. **Evaluate in workflow** before claiming benefit, using the staged approach in Module 13.`,
        },
        {
          type: 'callout',
          tone: 'key',
          title: 'The same rules apply',
          md: md`A new model class does not change the questions: *What exactly is the task? Is the evaluation data like my patients? How often is it wrong, and how badly? Is it better than what we do now? Who checks it, and how will we know when it drifts?*`,
        },
        { type: 'check', id: 'llm-eval' },
      ],
    },
  ],
  takeaways: [
    'LLMs are generative and prompt-sensitive, and their stated confidence is poorly calibrated; risk-prediction uses must meet the same validation standards as any model.',
    'High exam scores have not translated into better clinical decisions; integration and human factors decide benefit.',
    'Design against fabrication, omission, sycophancy, version drift, bias and automation bias.',
    'Evaluate on real deployment-setting inputs with blinded, severity-graded human review, and report per TRIPOD-LLM.',
  ],
};
