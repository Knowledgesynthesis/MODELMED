import { create } from 'zustand';
import type { SyntheticDataset, ModelConfig, ModelResult } from '@/types';

interface ModelState {
  // Current dataset
  currentDataset: SyntheticDataset | null;
  setCurrentDataset: (dataset: SyntheticDataset | null) => void;

  // Current model configuration
  currentModel: ModelConfig | null;
  setCurrentModel: (model: ModelConfig | null) => void;

  // Model results
  modelResults: ModelResult[];
  addModelResult: (result: ModelResult) => void;
  clearResults: () => void;

  // Training parameters
  trainTestSplit: number;
  setTrainTestSplit: (split: number) => void;

  // Threshold for binary classification
  threshold: number;
  setThreshold: (threshold: number) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  currentDataset: null,
  setCurrentDataset: (dataset) => set({ currentDataset: dataset }),

  currentModel: null,
  setCurrentModel: (model) => set({ currentModel: model }),

  modelResults: [],
  addModelResult: (result) =>
    set((state) => ({
      modelResults: [...state.modelResults, result],
    })),
  clearResults: () => set({ modelResults: [] }),

  trainTestSplit: 0.7,
  setTrainTestSplit: (split) => set({ trainTestSplit: split }),

  threshold: 0.5,
  setThreshold: (threshold) => set({ threshold }),
}));
