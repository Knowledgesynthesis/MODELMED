import type { Module } from '../types';
const md = String.raw;

export const neural: Module = {
  id: 'neural',
  number: 6,
  track: 'build',
  title: 'Neural networks and deep learning',
  tagline: 'Neurons, backpropagation, regularisation, architectures for images and signals, and shortcut learning.',
  minutes: 40,
  objectives: [
    'Describe a feed-forward network, its activation functions and how backpropagation trains it.',
    'Name the main regularisation methods and the calibration behaviour of modern networks.',
    'Match architectures to data types and cite examples of validated clinical deep-learning systems.',
    'Recognise shortcut learning and why it defeats internal validation.',
  ],
  sections: [
    {
      id: 'mechanics',
      title: 'How a network computes and learns',
      blocks: [
        {
          type: 'md',
          md: md`A neuron computes a weighted sum of its inputs plus a bias, then applies a nonlinear **activation**, such as ReLU $\max(0,z)$, tanh, or the sigmoid at the output. Stacking layers of neurons gives a function that can approximate essentially any continuous relationship given enough hidden units [@hornik1989]. Logistic regression is a network with no hidden layer.

**Training** minimises a loss, the cross-entropy (log-loss) for binary outcomes. **Backpropagation** applies the chain rule to compute the gradient of the loss with respect to every weight [@rumelhart1986]. Optimisers such as stochastic gradient descent or Adam then step the weights downhill, over many passes (epochs) through the data.`,
        },
        { type: 'lab', lab: 'neural' },
      ],
    },
    {
      id: 'regularisation',
      title: 'Regularisation and calibration',
      blocks: [
        {
          type: 'md',
          md: md`Networks have many parameters and will memorise small datasets. Standard defences:

- **Weight decay** (an L2 penalty on the weights)
- **Early stopping**: stop when validation loss stops improving
- **Dropout**: randomly silence units during training
- **Data augmentation** (images, signals) and, above all, more and more diverse data

Modern deep networks tend to be **over-confident**: their predicted probabilities are more extreme than observed frequencies. Simple post-hoc **temperature scaling**, which divides the logits by a constant fitted on validation data, largely fixes this [@guo2017calib]. Check calibration before using a network's outputs as risks.`,
        },
        { type: 'check', id: 'n-calib' },
      ],
    },
    {
      id: 'architectures',
      title: 'Architectures and where they work',
      blocks: [
        {
          type: 'md',
          md: md`| Data | Architecture | Clinical examples |
|---|---|---|
| Images | Convolutional networks, vision transformers | Diabetic retinopathy grading from fundus photographs [@gulshan2016]; the first FDA-authorised autonomous AI diagnostic system, evaluated in a prospective pivotal trial in primary care [@abramoff2018] |
| Signals (ECG, EEG) | 1-D convolutions, recurrent networks, transformers | ECG detection of left-ventricular systolic dysfunction [@attia2019], later tested in a pragmatic cluster-randomised trial that increased new diagnoses of low ejection fraction [@yao2021eagle] |
| Text | Transformers / large language models | See the LLM module |
| Tabular EHR | Multilayer perceptrons, tabular transformers | Usually no better than boosted trees or regression [@grinsztajn2022] |

Deep learning earns its complexity when the raw input is high-dimensional and the features are not known in advance [@lecun2015]. For tabular risk factors, the burden of proof is on the network.`,
        },
      ],
    },
    {
      id: 'shortcuts',
      title: 'Shortcut learning',
      blocks: [
        {
          type: 'md',
          md: md`Networks exploit any signal that predicts the label, including ones clinicians would reject:

- A pneumonia model learned to recognise **which hospital** a chest radiograph came from, and the radiograph markers that identify it. Performance dropped at external hospitals [@zech2018].
- COVID-19 radiograph classifiers relied on laterality markers, text and positioning instead of lung pathology [@degrave2021]. A systematic review of 62 COVID-19 imaging models found none ready for clinical use [@roberts2021covid].
- Models can identify patients' self-reported race from radiographs even when clinicians cannot, so demographic shortcuts are available to any imaging model [@gichoya2022].

Shortcuts survive random train–test splits from the same source, because the shortcut is present in both. Only external validation, saliency checks (with caution) and deliberate stress tests reveal them.`,
        },
        { type: 'check', id: 'n-shortcut' },
      ],
    },
  ],
  takeaways: [
    'A network is stacked weighted sums and nonlinearities trained by backpropagated gradients; logistic regression is the zero-hidden-layer case.',
    'Regularise with weight decay, early stopping, dropout and augmentation; recalibrate over-confident outputs.',
    'Deep learning is the right tool for images, signals and text; for tabular data, benchmark against boosted trees and regression.',
    'Shortcut learning passes internal validation; insist on external validation and stress tests.',
  ],
};
