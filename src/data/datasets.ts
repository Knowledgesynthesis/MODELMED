import { Rng } from '@/lib/stats/random';
import { clamp, expit } from '@/lib/stats/core';

export interface FeatureSpec {
  key: string;
  label: string;
  unit?: string;
  type: 'continuous' | 'count' | 'binary';
  description: string;
}

export interface Dataset {
  id: string;
  name: string;
  short: string;
  outcome: string;
  description: string;
  /** Plain-language description of the true data-generating model (what a perfect model would learn). */
  truth: string;
  features: FeatureSpec[];
  rows: Record<string, number>[];
  /** Subgroup variable available for fairness audits (not used as a predictor by default). */
  group: { key: string; labels: [string, string] };
}

const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

/** Bisection on the intercept so the population event rate hits a target prevalence. */
function calibrateIntercept(lps: number[], target: number) {
  let lo = -15, hi = 15;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    const m = lps.reduce((s, v) => s + expit(v + mid), 0) / lps.length;
    if (m < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const hinge = (x: number) => Math.max(0, x);

/** True log-odds (without intercept) for the sepsis dataset — nonlinear in temperature and WBC. */
export function sepsisTrueLp(r: Record<string, number>) {
  return (
    0.02 * (r.age - 63) +
    0.6 * r.immunocompromised +
    2.0 * hinge(r.temperature - 37.8) +
    2.6 * hinge(36.2 - r.temperature) +
    0.022 * (r.heartRate - 85) +
    0.09 * (r.respRate - 18) -
    0.012 * (r.sbp - 125) +
    1.4 * hinge((r.wbc - 11) / 4) +
    2.2 * hinge((4.5 - r.wbc) / 1.5) +
    0.9 * Math.log(r.lactate / 1.2)
  );
}

function makeSepsis(n = 1800, seed = 2024): Dataset {
  const rng = new Rng(seed);
  const rows: Record<string, number>[] = [];
  for (let i = 0; i < n; i++) {
    const sev = rng.normal();
    const female = rng.bernoulli(0.5);
    const age = clamp(rng.normal(63, 17), 18, 98);
    const immunocompromised = rng.bernoulli(0.15);
    const febrile = rng.next() < 0.7 ? 1 : -1.5;
    const temperature = clamp(37.0 + rng.normal(0, 0.45) + (sev > 0 ? 0.6 * sev * febrile : 0), 34, 41.5);
    const heartRate = clamp(84 + 9 * sev + rng.normal(0, 12), 40, 180);
    const respRate = clamp(18 + 2.2 * sev + rng.normal(0, 3), 8, 44);
    const sbp = clamp(126 - 8 * sev + rng.normal(0, 17) - (female ? 4 : 0), 60, 210);
    const wbcDir = rng.next() < 0.7 ? 1 : -1.8;
    const wbc = clamp(Math.exp(Math.log(8) + 0.32 * rng.normal() + (sev > 0 ? 0.28 * sev * wbcDir : 0)), 0.5, 40);
    const lactate = clamp(Math.exp(Math.log(1.2) + 0.33 * rng.normal() + 0.22 * sev), 0.3, 15);
    rows.push({
      age: round(age, 0),
      temperature: round(temperature, 1),
      heartRate: round(heartRate, 0),
      respRate: round(respRate, 0),
      sbp: round(sbp, 0),
      wbc: round(wbc, 1),
      lactate: round(lactate, 1),
      immunocompromised,
      female,
    });
  }
  const lps = rows.map(sepsisTrueLp);
  const b0 = calibrateIntercept(lps, 0.12);
  rows.forEach((r, i) => {
    r.trueRisk = expit(lps[i] + b0);
    r.outcome = rng.bernoulli(r.trueRisk);
  });
  return {
    id: 'sepsis',
    name: 'Ward sepsis within 48 h',
    short: 'Sepsis',
    outcome: 'Sepsis (Sepsis-3 criteria) within 48 h of the observation set',
    description:
      'Adult medical-ward patients at a routine observation round. Vital signs and labs are correlated through a hidden illness-severity variable. Event rate ≈ 12%.',
    truth:
      'True log-odds rise with age, immunosuppression, heart rate, respiratory rate, falling blood pressure and log-lactate, and are **U-shaped** in temperature (fever *or* hypothermia) and white-cell count (leukocytosis *or* leukopenia), echoing SIRS/qSOFA physiology. A linear-in-predictors logistic model cannot represent the U-shapes; splines or trees can.',
    features: [
      { key: 'age', label: 'Age', unit: 'years', type: 'continuous', description: 'Age at observation' },
      { key: 'temperature', label: 'Temperature', unit: '°C', type: 'continuous', description: 'Core temperature' },
      { key: 'heartRate', label: 'Heart rate', unit: '/min', type: 'continuous', description: 'Pulse rate' },
      { key: 'respRate', label: 'Respiratory rate', unit: '/min', type: 'continuous', description: 'Breaths per minute' },
      { key: 'sbp', label: 'Systolic BP', unit: 'mmHg', type: 'continuous', description: 'Systolic blood pressure' },
      { key: 'wbc', label: 'WBC', unit: '×10⁹/L', type: 'continuous', description: 'White-cell count' },
      { key: 'lactate', label: 'Lactate', unit: 'mmol/L', type: 'continuous', description: 'Venous lactate' },
      { key: 'immunocompromised', label: 'Immunocompromised', type: 'binary', description: 'Chemotherapy, transplant, or high-dose steroids' },
    ],
    rows,
    group: { key: 'female', labels: ['Male', 'Female'] },
  };
}

export function readmissionTrueLp(r: Record<string, number>) {
  return (
    0.42 * Math.min(r.priorAdmissions, 5) +
    0.14 * r.comorbidity +
    0.35 * Math.log(r.lengthOfStay) +
    0.04 * r.medications +
    0.35 * r.emergency -
    0.5 * r.followUp7d +
    0.35 * r.dischargeFacility +
    0.008 * (r.age - 68)
  );
}

function makeReadmission(n = 2400, seed = 77): Dataset {
  const rng = new Rng(seed);
  const rows: Record<string, number>[] = [];
  for (let i = 0; i < n; i++) {
    const frailZ = rng.normal();
    const frail = Math.exp(0.6 * frailZ);
    const female = rng.bernoulli(0.52);
    const age = clamp(rng.normal(68 + 4 * frailZ, 14), 18, 100);
    const priorAdmissions = Math.min(10, rng.poisson(0.3 * frail));
    const comorbidity = Math.min(12, rng.poisson(1.4 * frail));
    const lengthOfStay = clamp(Math.exp(Math.log(4) + 0.55 * rng.normal() + 0.2 * frailZ), 1, 60);
    const medications = Math.min(25, rng.poisson(5 + 2.5 * frail));
    const emergency = rng.bernoulli(0.62);
    const followUp7d = rng.bernoulli(0.55);
    const dischargeFacility = rng.bernoulli(expit(-2 + 0.05 * (age - 68) + 0.5 * frailZ));
    rows.push({
      age: round(age, 0),
      priorAdmissions,
      comorbidity,
      lengthOfStay: round(lengthOfStay, 0) || 1,
      medications,
      emergency,
      followUp7d,
      dischargeFacility,
      female,
    });
  }
  const lps = rows.map(readmissionTrueLp);
  const b0 = calibrateIntercept(lps, 0.15);
  rows.forEach((r, i) => {
    r.trueRisk = expit(lps[i] + b0);
    r.outcome = rng.bernoulli(r.trueRisk);
  });
  return {
    id: 'readmission',
    name: '30-day unplanned readmission',
    short: 'Readmission',
    outcome: 'Unplanned readmission within 30 days of discharge',
    description:
      'Adults discharged from medicine. Predictors are measured at discharge. Event rate ≈ 15%. The signal is weak and mostly linear, as in real readmission models (published AUCs typically 0.6–0.7).',
    truth:
      'True log-odds are approximately **linear and additive**: prior admissions, comorbidity burden, log length of stay, medication count, emergency admission and discharge to a facility raise risk; a follow-up visit within 7 days lowers it. Flexible ML has little to find here — logistic regression should match it.',
    features: [
      { key: 'age', label: 'Age', unit: 'years', type: 'continuous', description: 'Age at discharge' },
      { key: 'priorAdmissions', label: 'Prior admissions (12 mo)', type: 'count', description: 'Hospitalisations in the previous year' },
      { key: 'comorbidity', label: 'Charlson index', type: 'count', description: 'Charlson comorbidity index' },
      { key: 'lengthOfStay', label: 'Length of stay', unit: 'days', type: 'continuous', description: 'Index admission length of stay' },
      { key: 'medications', label: 'Discharge medications', type: 'count', description: 'Number of medications at discharge' },
      { key: 'emergency', label: 'Emergency admission', type: 'binary', description: 'Index admission via emergency department' },
      { key: 'followUp7d', label: 'Follow-up ≤ 7 days', type: 'binary', description: 'Clinic visit booked within 7 days' },
      { key: 'dischargeFacility', label: 'Discharged to facility', type: 'binary', description: 'Skilled nursing or rehabilitation facility' },
    ],
    rows,
    group: { key: 'female', labels: ['Male', 'Female'] },
  };
}

let cache: Dataset[] | null = null;
export function getDatasets(): Dataset[] {
  if (!cache) cache = [makeSepsis(), makeReadmission()];
  return cache;
}
export const getDataset = (id: string) => getDatasets().find((d) => d.id === id)!;
