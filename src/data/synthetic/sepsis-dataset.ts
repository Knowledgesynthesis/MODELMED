import type { SyntheticDataset } from '@/types';

export const sepsisDataset: SyntheticDataset = {
  id: 'sepsis-risk',
  name: 'Sepsis Risk Prediction Dataset',
  description: 'Synthetic dataset for predicting sepsis risk in hospitalized patients',
  features: [
    {
      name: 'age',
      type: 'continuous',
      description: 'Patient age in years',
      unit: 'years',
      range: [18, 95]
    },
    {
      name: 'temperature',
      type: 'continuous',
      description: 'Body temperature',
      unit: '°C',
      range: [35.5, 40.5]
    },
    {
      name: 'heartRate',
      type: 'continuous',
      description: 'Heart rate',
      unit: 'bpm',
      range: [50, 150]
    },
    {
      name: 'wbcCount',
      type: 'continuous',
      description: 'White blood cell count',
      unit: 'x10^9/L',
      range: [2, 25]
    },
    {
      name: 'lactate',
      type: 'continuous',
      description: 'Serum lactate level',
      unit: 'mmol/L',
      range: [0.5, 8]
    },
    {
      name: 'immunocompromised',
      type: 'binary',
      description: 'Patient is immunocompromised',
      categories: ['No', 'Yes']
    },
    {
      name: 'recentSurgery',
      type: 'binary',
      description: 'Surgery within past 30 days',
      categories: ['No', 'Yes']
    }
  ],
  target: {
    name: 'sepsis',
    type: 'binary',
    description: 'Development of sepsis within 24 hours'
  },
  samples: 500,
  data: generateSepsisData()
};

function generateSepsisData() {
  const data = [];
  for (let i = 0; i < 500; i++) {
    const age = Math.random() * 77 + 18;
    const immunocompromised = Math.random() > 0.7 ? 1 : 0;
    const recentSurgery = Math.random() > 0.6 ? 1 : 0;

    // Sepsis more likely with: older age, high temp, high HR, high/low WBC, high lactate
    const sepsisRisk =
      (age > 65 ? 0.2 : 0) +
      (immunocompromised ? 0.3 : 0) +
      (recentSurgery ? 0.2 : 0) +
      Math.random() * 0.3;

    const hasSepsis = sepsisRisk > 0.5 ? 1 : 0;

    const temperature = hasSepsis
      ? Math.random() * 3 + 37.5  // 37.5-40.5
      : Math.random() * 2 + 36;   // 36-38

    const heartRate = hasSepsis
      ? Math.random() * 50 + 90   // 90-140
      : Math.random() * 40 + 60;  // 60-100

    const wbcCount = hasSepsis
      ? (Math.random() > 0.5 ? Math.random() * 15 + 12 : Math.random() * 3 + 2) // High or low
      : Math.random() * 7 + 4;    // 4-11 normal

    const lactate = hasSepsis
      ? Math.random() * 5 + 2     // 2-7
      : Math.random() * 1.5 + 0.5; // 0.5-2

    data.push({
      id: `patient-${i + 1}`,
      age: Math.round(age * 10) / 10,
      temperature: Math.round(temperature * 10) / 10,
      heartRate: Math.round(heartRate),
      wbcCount: Math.round(wbcCount * 10) / 10,
      lactate: Math.round(lactate * 10) / 10,
      immunocompromised,
      recentSurgery,
      sepsis: hasSepsis
    });
  }
  return data;
}
