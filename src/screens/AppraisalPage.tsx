import { useMemo, useState } from 'react';
import { ClipboardCheck, ClipboardCopy, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Answer = 'yes' | 'no' | 'unclear' | 'na';
interface Item {
  id: string;
  q: string;
  why: string;
  fix: string;
  module: string;
}
interface Domain {
  id: string;
  title: string;
  items: Item[];
}

// Signalling questions paraphrased and condensed from PROBAST+AI domains, TRIPOD+AI and the evaluation literature.
const DOMAINS: Domain[] = [
  {
    id: 'participants',
    title: 'Participants & data sources',
    items: [
      { id: 'p1', q: 'Was the data source appropriate (cohort, trial or registry with defined inclusion), or were case–control data re-weighted to true prevalence?', why: 'Sampling on the outcome distorts absolute risks.', fix: 'Treat absolute risks as uninterpretable until recalibrated to your prevalence.', module: 'data-design' },
      { id: 'p2', q: 'Were inclusions and exclusions appropriate and consistent with the intended-use population?', why: 'Excluding hard cases (e.g., missing data, transfers, palliative patients who would be scored in practice) inflates performance.', fix: 'Check whether your patients would have been excluded.', module: 'data-design' },
      { id: 'p3', q: 'Do the setting, period and case mix resemble where you would use it?', why: 'Performance is setting-specific; prevalence and case mix drive calibration and PPV.', fix: 'Plan local validation before use.', module: 'validation' },
    ],
  },
  {
    id: 'predictors',
    title: 'Predictors',
    items: [
      { id: 'pr1', q: 'Were predictors defined and measured the same way for all participants, as they would be at deployment?', why: 'Different assays, documentation or timing shift predictions.', fix: 'Map each predictor to your local data source and timing.', module: 'data-design' },
      { id: 'pr2', q: 'Were all predictors available at the intended moment of prediction (no post-index information)?', why: 'Post-index predictors are leakage: excellent retrospective, useless live.', fix: 'Remove or re-time leaky predictors and re-validate.', module: 'validation' },
      { id: 'pr3', q: 'Were predictors assessed without knowledge of the outcome?', why: 'Outcome knowledge biases subjective predictors.', fix: 'Prefer objective predictors.', module: 'data-design' },
    ],
  },
  {
    id: 'outcome',
    title: 'Outcome',
    items: [
      { id: 'o1', q: 'Was the outcome clinically meaningful, objectively defined and determined the same way for all?', why: 'Inconsistent ascertainment creates differential error.', fix: 'Confirm the definition matches the decision you care about.', module: 'foundations' },
      { id: 'o2', q: 'Is the outcome free of proxies that encode care processes or access (cost, orders, billing codes)?', why: 'Proxy labels import bias (e.g., cost vs need).', fix: 'Audit performance by group; consider a better label.', module: 'fairness' },
      { id: 'o3', q: 'Was the time horizon appropriate and fixed from a defined index time?', why: 'Variable horizons make predictions uninterpretable.', fix: 'Re-express risk at a fixed horizon.', module: 'foundations' },
    ],
  },
  {
    id: 'analysis',
    title: 'Analysis',
    items: [
      { id: 'a1', q: 'Was the sample size adequate (development: Riley criteria for all candidate parameters; validation: precise calibration and C)?', why: 'Small samples → overfitting and imprecise, unstable estimates.', fix: 'Expect optimism; demand external validation.', module: 'data-design' },
      { id: 'a2', q: 'Were missing data handled appropriately (e.g., multiple imputation), with a strategy usable at deployment?', why: 'Complete-case analysis biases and wastes data.', fix: 'Ask how missing inputs are handled in real time.', module: 'data-design' },
      { id: 'a3', q: 'Were continuous predictors kept continuous, with nonlinearity considered (e.g., splines)?', why: 'Dichotomising loses information and misrepresents risk.', fix: 'Prefer models that keep continuous predictors.', module: 'logistic' },
      { id: 'a4', q: 'Were predictors pre-specified or selected with appropriate methods (not univariable screening or stepwise p-values)?', why: 'Data-driven selection inflates effects and optimism.', fix: 'Expect shrinkage of effects in new data.', module: 'logistic' },
      { id: 'a5', q: 'Was optimism addressed with internal validation repeating all steps (incl. tuning), with no data leakage?', why: 'Otherwise reported performance is apparent performance.', fix: 'Discount reported performance.', module: 'validation' },
      { id: 'a6', q: 'Were both discrimination and calibration reported (calibration plot, intercept, slope) with uncertainty?', why: 'AUC alone cannot certify risks.', fix: 'Request calibration in your setting before use.', module: 'calibration' },
      { id: 'a7', q: 'Was class imbalance handled without resampling that distorts risks (or were risks recalibrated afterward)?', why: 'Undersampling/oversampling/SMOTE inflate predicted risks.', fix: 'Recalibrate before using absolute risks.', module: 'calibration' },
      { id: 'a8', q: 'Was clinical utility assessed (e.g., net benefit) at clinically relevant thresholds, with alert burden reported?', why: 'Good AUC does not imply clinical value.', fix: 'Do a decision-curve or workload analysis locally.', module: 'utility' },
    ],
  },
  {
    id: 'applicability',
    title: 'Equity, transportability & usability',
    items: [
      { id: 'f1', q: 'Was performance (calibration and threshold metrics) reported for relevant subgroups?', why: 'Average performance can hide harmful subgroup failure.', fix: 'Run a subgroup audit locally.', module: 'fairness' },
      { id: 'f2', q: 'Has the model been externally validated (temporally and/or geographically) in a setting like yours?', why: 'Internal validation cannot show transportability.', fix: 'Treat as unvalidated for your setting.', module: 'validation' },
      { id: 'f3', q: 'Is the full model available (equation with intercept / baseline survival, or code) for independent validation?', why: 'Unavailable models cannot be checked or recalibrated.', fix: 'Require access as a condition of procurement.', module: 'deployment' },
      { id: 'f4', q: 'Is there evidence of impact on decisions or outcomes, and a monitoring and updating plan?', why: 'Accuracy ≠ benefit; performance drifts.', fix: 'Plan a silent trial, impact evaluation and monitoring.', module: 'deployment' },
    ],
  },
];

const OPTS: { v: Answer; label: string }[] = [
  { v: 'yes', label: 'Yes' },
  { v: 'no', label: 'No' },
  { v: 'unclear', label: 'Unclear' },
  { v: 'na', label: 'N/A' },
];

type Rating = 'high' | 'unclear' | 'low' | 'pending';

function rating(ans: Record<string, Answer>, d: Domain): Rating {
  const a = d.items.map((i) => ans[i.id]);
  if (a.some((x) => x === 'no')) return 'high';
  if (a.some((x) => x === 'unclear' || x === undefined)) return a.every((x) => x === undefined) ? 'pending' : 'unclear';
  return 'low';
}

const TONE = { high: 'danger', unclear: 'warning', low: 'success', pending: 'neutral' } as const;
const LABEL = { high: 'High concern', unclear: 'Unclear', low: 'Low concern', pending: 'Not assessed' } as const;

export function AppraisalPage() {
  const [name, setName] = useState('');
  const [ans, setAns] = useState<Record<string, Answer>>({});
  const [copied, setCopied] = useState(false);
  const total = DOMAINS.reduce((s, d) => s + d.items.length, 0);
  const done = Object.keys(ans).length;
  const ratings = DOMAINS.map((d) => ({ d, r: rating(ans, d) }));
  const overall: Rating = ratings.some((x) => x.r === 'high') ? 'high' : ratings.some((x) => x.r === 'unclear' || x.r === 'pending') ? 'unclear' : 'low';
  const concerns = DOMAINS.flatMap((d) => d.items.filter((i) => ans[i.id] === 'no' || ans[i.id] === 'unclear').map((i) => ({ d, i, a: ans[i.id] })));
  const summary = useMemo(
    () =>
      [`Appraisal: ${name || 'unnamed model'}`, `Overall: ${LABEL[overall]}`, ...ratings.map((x) => `• ${x.d.title}: ${LABEL[x.r]}`), '', 'Concerns:', ...concerns.map((c) => `• [${c.a === 'no' ? 'NO' : 'UNCLEAR'}] ${c.i.q} → ${c.i.fix}`)].join('\n'),
    [name, overall, ratings, concerns]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <ClipboardCheck className="h-4 w-4" /> Critical appraisal
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Appraise a prediction model</h1>
      <p className="mt-2 text-muted-foreground">
        Work through a published model, a vendor tool or your own study. The questions condense the domains of PROBAST+AI with reporting items from TRIPOD+AI and the evaluation literature. For formal systematic reviews, use the full published tools.
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Model or paper being appraised (e.g., vendor sepsis score v2)" className="mt-6 h-11 w-full rounded-xl border bg-background px-3 text-sm" aria-label="Model name" />

      <div className="mt-8 space-y-8">
        {DOMAINS.map((d, di) => {
          const r = rating(ans, d);
          return (
            <section key={d.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  {di + 1}. {d.title}
                </h2>
                <Badge tone={TONE[r]}>{LABEL[r]}</Badge>
              </div>
              <ol className="mt-4 space-y-5">
                {d.items.map((it) => (
                  <li key={it.id}>
                    <p className="text-[15px] font-medium">{it.q}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {it.why}{' '}
                      <Link className="text-primary underline" to={`/module/${it.module}`}>
                        Learn
                      </Link>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={it.q}>
                      {OPTS.map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          role="radio"
                          aria-checked={ans[it.id] === o.v}
                          onClick={() => setAns((a) => ({ ...a, [it.id]: o.v }))}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            ans[it.id] === o.v && o.v === 'yes' && 'border-success bg-success/15 text-success',
                            ans[it.id] === o.v && o.v === 'no' && 'border-destructive bg-destructive/15 text-destructive',
                            ans[it.id] === o.v && o.v === 'unclear' && 'border-warning bg-warning/15 text-warning',
                            ans[it.id] === o.v && o.v === 'na' && 'bg-muted',
                            ans[it.id] !== o.v && 'hover:border-primary'
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="sticky bottom-4 mt-8 rounded-2xl border bg-card/95 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">
              {done}/{total} answered
            </div>
            <div className="text-lg font-semibold">
              Overall: <Badge tone={TONE[overall]}>{LABEL[overall]}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(summary);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              <ClipboardCopy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy summary'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAns({})}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
        {concerns.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium">{concerns.length} concern(s) and what to do</summary>
            <ul className="mt-2 max-h-60 space-y-1.5 overflow-y-auto text-sm">
              {concerns.map((c) => (
                <li key={c.i.id}>
                  <b className={c.a === 'no' ? 'text-destructive' : 'text-warning'}>{c.a === 'no' ? 'No' : 'Unclear'}:</b> {c.i.q} <span className="text-muted-foreground">→ {c.i.fix}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
