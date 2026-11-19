import type { Module } from '../types';
import { foundations } from './m01-foundations';
import { dataDesign } from './m02-data';
import { logistic } from './m03-logistic';
import { survival } from './m04-survival';
import { trees } from './m05-trees';
import { neural } from './m06-neural';
import { validation } from './m07-validation';
import { discrimination } from './m08-discrimination';
import { calibration } from './m09-calibration';
import { utility } from './m10-utility';
import { interpretability } from './m11-interpretability';
import { fairness } from './m12-fairness';
import { deployment } from './m13-deployment';
import { llm } from './m14-llm';
import { causal } from './m15-causal';

export const modules: Module[] = [foundations, dataDesign, logistic, survival, trees, neural, validation, discrimination, calibration, utility, interpretability, fairness, deployment, llm, causal];

export const moduleById = (id: string) => modules.find((m) => m.id === id);
export const nextModule = (id: string) => modules[modules.findIndex((m) => m.id === id) + 1];
export const prevModule = (id: string) => modules[modules.findIndex((m) => m.id === id) - 1];
