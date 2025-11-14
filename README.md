# ModelMed - Predictive Modeling for Clinicians

An interactive educational web application that teaches clinicians how to build, validate, and interpret predictive models and machine learning pipelines in healthcare.

## Features

- 🎓 **Comprehensive Curriculum**: 11 modules covering foundations to advanced topics
- 📱 **Mobile-First Design**: Optimized for learning on any device
- 🌙 **Dark Mode**: Easy on the eyes with full dark mode support
- 📴 **Offline Ready**: Progressive Web App with offline capabilities
- 🧪 **Interactive Sandbox**: Build and evaluate models with synthetic datasets
- 📊 **Rich Visualizations**: ROC curves, calibration plots, confusion matrices
- 🎯 **Assessments**: Test your knowledge with interactive quizzes
- 📚 **Glossary**: Comprehensive ML and statistics terminology

## Modules

1. **Foundations of Predictive Modeling** - Core concepts and terminology
2. **Logistic Regression & Linear Models** - Interpretable statistical models
3. **Survival Models** - Time-to-event analysis with Kaplan-Meier and Cox models
4. **Tree-Based Models** - Decision trees, random forests, gradient boosting
5. **Neural Networks** - Deep learning in clinical context
6. **Training & Validation** - Cross-validation, overfitting, underfitting
7. **Performance Metrics** - ROC, AUC, calibration, confusion matrices
8. **Interpretability** - SHAP, LIME, feature importance
9. **Bias & Fairness** - Identifying and mitigating algorithmic bias
10. **Calibration & Thresholding** - Clinical decision-making with ML
11. **Model Sandbox** - Hands-on model building and evaluation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components following shadcn/ui patterns
- **State Management**: Zustand
- **Routing**: React Router v6
- **Visualizations**: Recharts + D3
- **Offline Support**: Vite PWA Plugin + IndexedDB
- **Build Tool**: Vite

## Educational Philosophy

ModelMed emphasizes:

- **Clinically Relevant**: All examples use healthcare scenarios
- **Scientifically Rigorous**: No algorithmic hallucinations or oversimplifications
- **Safe Learning**: Synthetic datasets only, no real patient data
- **Practical Focus**: From theory to clinical interpretation
- **Ethical Awareness**: Bias, fairness, and responsible AI use

## Data Privacy

- All datasets are **synthetic** - no real patient data
- All processing happens **client-side** - no data sent to servers
- Progress stored **locally** in browser storage
- Fully functional **offline** after initial load

## License

Educational use only. All rights reserved.

## Contributing

This is an educational application. For issues or suggestions, please contact the development team.

## Acknowledgments

Built following evidence-based machine learning education principles and clinical informatics best practices.
