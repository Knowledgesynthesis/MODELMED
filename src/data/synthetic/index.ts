import { sepsisDataset } from './sepsis-dataset';
import { readmissionDataset } from './readmission-dataset';
import type { SyntheticDataset } from '@/types';

export const syntheticDatasets: Record<string, SyntheticDataset> = {
  'sepsis-risk': sepsisDataset,
  'hospital-readmission': readmissionDataset,
};

export function getDataset(id: string): SyntheticDataset | undefined {
  return syntheticDatasets[id];
}

export function getAllDatasets(): SyntheticDataset[] {
  return Object.values(syntheticDatasets);
}
