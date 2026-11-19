export type LabId =
  | 'bayes'
  | 'logistic-curve'
  | 'sample-size'
  | 'km'
  | 'tree'
  | 'neural'
  | 'overfitting'
  | 'leakage'
  | 'roc'
  | 'calibration'
  | 'dca'
  | 'shap'
  | 'fairness'
  | 'drift';

export type CalloutTone = 'key' | 'pitfall' | 'clinical' | 'evidence' | 'example' | 'formula';

export type Block =
  | { type: 'md'; md: string }
  | { type: 'callout'; tone: CalloutTone; title: string; md: string }
  | { type: 'lab'; lab: LabId; intro?: string }
  | { type: 'check'; id: string };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export type Track = 'frame' | 'build' | 'evaluate' | 'trust';

export interface Module {
  id: string;
  number: number;
  track: Track;
  title: string;
  tagline: string;
  minutes: number;
  objectives: string[];
  sections: Section[];
  takeaways: string[];
}

export interface Question {
  id: string;
  module: string;
  /** 'apply' = calculation or case; 'recall' = definition; 'appraise' = judge a claim/study */
  level: 'recall' | 'apply' | 'appraise';
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
  refs?: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  formula?: string;
  module?: string;
  see?: string[];
}

export const TRACKS: Record<Track, { title: string; blurb: string }> = {
  frame: { title: 'Frame the problem', blurb: 'What exactly are we predicting, for whom, and with what data?' },
  build: { title: 'Build models', blurb: 'How each model family works, and when it earns its complexity.' },
  evaluate: { title: 'Evaluate', blurb: 'Discrimination, calibration, clinical utility — and honest validation.' },
  trust: { title: 'Trust & deploy', blurb: 'Explanations, fairness, monitoring, regulation, and LLMs.' },
};
