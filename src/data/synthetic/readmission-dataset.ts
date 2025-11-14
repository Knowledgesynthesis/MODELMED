import type { SyntheticDataset } from '@/types';

export const readmissionDataset: SyntheticDataset = {
  id: 'hospital-readmission',
  name: '30-Day Hospital Readmission Dataset',
  description: 'Synthetic dataset for predicting 30-day hospital readmission risk',
  features: [
    {
      name: 'age',
      type: 'continuous',
      description: 'Patient age in years',
      unit: 'years',
      range: [18, 95]
    },
    {
      name: 'lengthOfStay',
      type: 'continuous',
      description: 'Initial hospital length of stay',
      unit: 'days',
      range: [1, 30]
    },
    {
      name: 'numDiagnoses',
      type: 'continuous',
      description: 'Number of diagnoses',
      range: [1, 10]
    },
    {
      name: 'numProcedures',
      type: 'continuous',
      description: 'Number of procedures performed',
      range: [0, 8]
    },
    {
      name: 'numMedications',
      type: 'continuous',
      description: 'Number of medications at discharge',
      range: [1, 20]
    },
    {
      name: 'admissionType',
      type: 'categorical',
      description: 'Type of admission',
      categories: ['Emergency', 'Urgent', 'Elective']
    },
    {
      name: 'hasFollowup',
      type: 'binary',
      description: 'Follow-up appointment scheduled',
      categories: ['No', 'Yes']
    }
  ],
  target: {
    name: 'readmitted',
    type: 'binary',
    description: 'Readmitted within 30 days'
  },
  samples: 400,
  data: generateReadmissionData()
};

function generateReadmissionData() {
  const data = [];
  const admissionTypes = ['Emergency', 'Urgent', 'Elective'];

  for (let i = 0; i < 400; i++) {
    const age = Math.random() * 77 + 18;
    const hasFollowup = Math.random() > 0.4 ? 1 : 0;
    const admissionType = admissionTypes[Math.floor(Math.random() * 3)];

    // Readmission more likely with: older age, longer stay, more diagnoses, no followup
    const readmissionRisk =
      (age > 70 ? 0.25 : 0) +
      (hasFollowup ? -0.2 : 0.2) +
      (admissionType === 'Emergency' ? 0.2 : 0) +
      Math.random() * 0.35;

    const readmitted = readmissionRisk > 0.45 ? 1 : 0;

    const lengthOfStay = readmitted
      ? Math.random() * 15 + 5    // 5-20 days
      : Math.random() * 8 + 1;    // 1-9 days

    const numDiagnoses = readmitted
      ? Math.random() * 6 + 4     // 4-10
      : Math.random() * 4 + 1;    // 1-5

    const numProcedures = Math.floor(Math.random() * 9);
    const numMedications = readmitted
      ? Math.random() * 12 + 8    // 8-20
      : Math.random() * 10 + 1;   // 1-11

    data.push({
      id: `encounter-${i + 1}`,
      age: Math.round(age),
      lengthOfStay: Math.round(lengthOfStay * 10) / 10,
      numDiagnoses: Math.round(numDiagnoses),
      numProcedures,
      numMedications: Math.round(numMedications),
      admissionType,
      hasFollowup,
      readmitted
    });
  }
  return data;
}
