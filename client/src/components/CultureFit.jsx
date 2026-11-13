import { Building2 } from 'lucide-react';
import ScoreGauge from './ScoreGauge';

/** Per-principle breakdown of company culture alignment */
export default function CultureFit({ analysis }) {
  const { culture } = analysis.result;
  if (!analysis.company?.name || !culture?.principles?.length) {
    return (
      <div className="card p-5 text-sm text-slate-600 sm:p-6 dark:text-slate-300">
        <p className="mb-1 flex items-center gap-2 font-semibold"><Building2 size={16} /> No target company selected</p>
        Re-run the analysis with a company (e.g. Amazon, Google, Adobe) to see how your resume maps to its principles.
      </div>
    );
  }
  const sorted = [...culture.principles].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Building2 size={16} className="text-brand-600 dark:text-brand-500" /> {analysis.company.name} culture alignment</h3>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{culture.summary}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {sorted.map((p, i) => (
          <li key={p.name} className="card flex items-start gap-3 p-4">
            <ScoreGauge value={p.score} label={p.name} delay={i * 60} strokeWidth={10} className="w-14 shrink-0 sm:w-16" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400"><b className="text-slate-800 dark:text-slate-200">Evidence:</b> {p.evidence}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400"><b className="text-slate-800 dark:text-slate-200">To strengthen:</b> {p.gap}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
