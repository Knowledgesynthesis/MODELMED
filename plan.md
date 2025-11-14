# **MODELMED — OPTIMIZED MASTER PROMPT FOR EDUCATIONAL APP GENERATION**  
A clinically rigorous, evidence-based master prompt for generating a **mobile-first, offline-capable, dark-mode educational app** that teaches clinicians how predictive modeling and machine learning pipelines work in healthcare—from logistic regression → survival analysis → tree models → ensembles → neural networks → interpretability → calibration → ethics.

---

# **MASTER PROMPT — ModelMed Educational App Generator (SPECIALIZED VERSION)**

## **Role & Mission**
You are a cross-functional product team (PM + Staff Engineer + Senior Instructional Designer + Biostatistics SME + ML/AI-in-Healthcare SME + Clinical Reasoning SME + UX Writer + QA).  
Your mission is to design an **interactive predictive modeling education environment** that teaches:

**ModelMed: Predictive Modeling Sandbox for Clinicians**  
—A complete system for understanding how ML models are built, validated, interpreted, and applied in clinical reasoning, using safe, synthetic examples and clear visual explanations.

This app must:
- Support **all learner levels:** MS2 → MS4 → residents → fellows → clinicians → clinical researchers  
- Cover **all clinical contexts:** model interpretation, clinical decision support, study design, risk prediction evaluation  
- Maintain full **scientific and ML rigor** with zero algorithmic hallucination  
- Provide **explanatory visualizations** (interactive where possible, static when required)  
- Use **synthetic datasets only**, never real patient data  
- Provide **clinical interpretability & ethical framing**, not algorithm deployment  
- Be mobile-first, offline-ready, and safe for educational use  

Your output must be **logically consistent** across machine learning, statistics, and clinical reasoning.

---

## **Inputs (Fill These)**
- **Primary Topic(s):**  
  Always centered on **predictive modeling in healthcare**, including:  
  - Logistic regression & linear models  
  - Survival models (Kaplan–Meier, Cox proportional hazards)  
  - Decision trees  
  - Random forests  
  - Gradient boosting (e.g., XGBoost, LightGBM—conceptual only)  
  - Neural networks (simple MLP; conceptual CNN/RNN overview)  
  - Data preprocessing steps (splitting, normalization, one-hot encoding)  
  - Training/validation/testing  
  - Metrics (ROC, AUC, calibration curves, Brier score)  
  - Confusion matrices, sensitivity, specificity  
  - Interpretability (SHAP, LIME, feature importance)  
  - Bias & fairness checks  
  - Clinical calibration & decision thresholding  
  - Ethical considerations and regulatory context  
- **Target Learner Levels:** {{LEVELS}}  
  - e.g., “Clinicians, residents, fellows, medical students, QI researchers, informatics trainees”
- **Learner Context:** {{CONTEXT}}  
  - e.g., “Model interpretation, research design, QI projects, CDS tool evaluation”
- **Learning Outcomes (SMART + Bloom):** {{LEARNING_OBJECTIVES}}  
  - e.g., “Interpret curves; understand training/validation; read model outputs; detect bias; explain SHAP values; understand clinical calibration”
- **Constraints/Preferences:**  
  Always include:  
  - *Mobile-first; dark mode; offline-ready; synthetic datasets only; concept-focused, safe; no real patient-level predictions*  
- **References/Standards:** {{REFERENCES}}  
  - e.g., “FDA SaMD, TRIPOD guidelines, PROBAST, AI-Medicine literature”
- **Brand/Voice:** {{VOICE_TONE}}  
  - e.g., “Clinically intuitive, research-grade, visually engaging”
- **Localization/Regional Frameworks:** {{LOCALE}}

---

# **Required Deliverables (Produce All)**

---

## **1. Executive Summary**
- Describe challenges clinicians face interpreting ML models and understanding validation metrics.  
- Introduce ModelMed as a **predictive modeling sandbox + interpretability lab + ethical reasoning guide**.  
- Provide 2–3 alternate names + crisp value propositions.

---

## **2. Learner Personas & Use Cases**
Examples:
- Resident evaluating a risk prediction algorithm  
- Clinician interpreting model outputs in CDS tools  
- QI team using predictive modeling for readmission risk  
- Researcher designing clinical prediction models  
Use cases: exam prep, CDS tool review, model evaluation, bias auditing.

---

## **3. Curriculum Map & Knowledge Graph**
Everything must connect **Biostatistics ↔ ML ↔ Clinical reasoning ↔ Ethics**.

### **Prerequisites**
- Variable types  
- Probability theory basics  
- Regression foundations  
- Clinical risk interpretation (sensitivity, specificity, PPV, NPV)  

### **Modules**
1. **Foundations of Predictive Modeling**  
   - What is a model? Inputs/outputs  
   - Linear vs non-linear models  
   - Training vs validation vs testing  

2. **Logistic Regression & Linear Models**  
   - Coefficients, odds ratios  
   - Link functions  
   - Model assumptions & diagnostics  

3. **Survival Models**  
   - KM curves, censoring  
   - Cox model & proportional hazards assumption  
   - Time-to-event applications  

4. **Tree-Based Models**  
   - Decision trees (splitting, entropy, Gini)  
   - Random forests (bagging, feature randomness)  
   - Gradient boosting (conceptual XGBoost)  

5. **Neural Networks (Clinical Context)**  
   - Perceptrons, hidden layers, gradients  
   - Clinical examples (risk scoring, imaging—concept only)  
   - Strengths/limits in healthcare  

6. **Model Training & Validation**  
   - Cross-validation  
   - Overfitting & underfitting visualizations  
   - Hyperparameter tuning (conceptual)  

7. **Model Performance Metrics**  
   - ROC, AUC  
   - Calibration curves & Brier score  
   - Confusion matrix, sensitivity/specificity, PPV/NPV  
   - Decision curve analysis (conceptual)  

8. **Interpretability & Explainability**  
   - SHAP (local & global explanations)  
   - LIME  
   - Feature importance pitfalls  
   - Clinical trust & transparency  

9. **Bias & Fairness in Models**  
   - Dataset bias  
   - Outcome mislabeling  
   - Algorithmic bias propagation  
   - Ethical frameworks  

10. **Clinical Calibration & Decision Thresholding**  
   - Aligning predicted probabilities with clinical actions  
   - Threshold selection  
   - Clinical utility analysis  

11. **Integrated Model Sandbox**  
   - Build small models (synthetic data), view metrics, interpret outputs  

Each module: micro-concepts, Bloom tags, prerequisites, cross-links.

---

## **4. Interactives (ModelMed-Specific)**

### **Examples**
- **Model Builder Sandbox**  
  - Choose model type → split data → train → visualize performance  

- **Overfitting Visualizer**  
  - Animate learning curves  

- **ROC & Calibration Playground**  
  - Adjust threshold → see confusion matrix & ROC point update  
  - Compare well-calibrated vs poorly calibrated models  

- **SHAP Explorer**  
  - Synthetic model → SHAP contributions → global/local view  

- **Tree Visualizer**  
  - Steps through split logic (text + static flow diagram)  

- **Cox Model Checker**  
  - Show effect of violating proportional hazards  

- **Bias Propagation Demo**  
  - Show how biased datasets distort predictions  

For each interactive:
- purpose  
- inputs  
- outputs  
- visualization details  
- preset synthetic cases  
- safety guardrails (no real patient predictions)

---

## **5. Assessment & Mastery**
Item types:
- Logistic regression interpretation  
- Survival model cases  
- ROC curve reading  
- Calibration assessment  
- Identify overfitting  
- Explain SHAP values  
- Ethical bias identification  
Provide **10–20 items** with rationales.

---

## **6. Predictive Modeling Reasoning Framework**
Teach stepwise reasoning:
1. Define prediction task  
2. Assess data type & structure  
3. Choose model family  
4. Train & validate properly  
5. Evaluate ROC + calibration  
6. Interpret with SHAP/LIME  
7. Check for bias & fairness  
8. Map findings to clinical context  
9. Consider ethics & safety  

Include pitfalls:
- Over-reliance on AUC  
- Misinterpreting coefficients as causal  
- Ignoring calibration  
- Confusing feature importance with causality  
- Using biased training data  
- Treating ML output as clinical truth

---

## **7. Accessibility & Safety**
- WCAG 2.2 AA  
- Synthetic data only  
- No real-world decision support  
- Clear disclaimers  
- No actual clinical predictions  
- Avoid algorithmic hallucinations  
- Align with FDA/CLIA safety boundaries

---

## **8. Tech Architecture (Mobile-First, Offline)**
- React/TypeScript  
- Tailwind + shadcn/ui  
- Recharts/D3 for plots (ROC, calibration)  
- IndexedDB + Service Worker for offline mode  
- State management via Zustand/Redux  
- Lightweight simulation engines (JS-only)  
- No heavy ML frameworks required for conceptual demonstration

---

## **9. Data Schemas (JSON)**
Schemas for:
- Synthetic datasets  
- Model definitions  
- Training metadata  
- Metrics results  
- SHAP/LIME interpretation structures  
- Bias indicators  
- Case vignettes  
- Glossary terms  

Provide representative examples.

---

## **10. Screen Specs & Text Wireframes**
Screens:
- Home  
- Foundations  
- Model Builder  
- ROC/Calibration Lab  
- Interpretation Lab (SHAP/LIME)  
- Tree/Forest Explorer  
- Survival Models Module  
- Bias & Ethics Module  
- Case Engine  
- Assessment Hub  
- Glossary  
- Settings  

Include text wireframes.

---

## **11. Copy & Content Kit**
Include:
- Microcopy: “What is calibration?”, “What SHAP tells you”, “Overfitting explained”  
- Diagram labels  
- Glossary entries  
- Two complete lessons + one integrated model case  

---

## **12. Analytics & A/B Plan**
UI-only:
- Threshold slider styles  
- SHAP visualization modes  
- Tree visualization navigation  
No experimental statistical tests.

---

## **13. QA Checklist**
- Statistical and ML logic checked against authoritative sources  
- No contradictory model assumptions  
- Calibration definitions correct  
- SHAP/LIME descriptions accurate  
- Ethical content aligned with standards  
- No patient data  

---

## **14. Roadmap**
Prototype → Pilot → Ensemble Expansion → Deep Interpretability Module → Personalized Learning Paths  
Include acceptance criteria & risks.

---

# **Style & Rigor Requirements**
- Clinically intuitive, statistically correct  
- Evidence-based and consistent with ML-in-healthcare literature  
- Visual-first but rigorous  
- Avoid black-box oversimplifications  
- Pathoma-like clarity for ML  

---

# **Acceptance Criteria**
- Learner understands model mechanics, assumptions, metrics, and interpretability  
- No contradictions across modules  
- Outputs consistently reinforce a unified **ModelMed Predictive Modeling Systems Map**

---

# **Now Generate**
Using the inputs above, produce all deliverables in the required order.  
If any inputs are missing, make ML/biostatistics–sound assumptions and label them as defaults.
