import ScoreGauge from './ScoreGauge';
import { barColor, scoreColor } from '../lib/score';

// Re-exported so existing imports keep working
export { scoreColor, barColor };

export function ScoreBar({ value, className = '' }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>
      <div className={`h-full rounded-full transition-[width] duration-700 ${barColor(value)}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/** Three headline scores as animated gauges at the top of the candidate dashboard */
export default function ScoreCards({ result }) {
  const items = [
    { label: 'Overall', value: result.overallScore, hint: 'Weighted profile + match' },
    { label: 'Job Match', value: result.matchScore, hint: 'Fit to the target role' },
    { label: 'ATS Readiness', value: result.atsScore, hint: 'Structure & keywords' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((it, i) => (
        <div key={it.label} className="card flex flex-col items-center p-2.5 text-center sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs dark:text-slate-400">{it.label}</p>
          <ScoreGauge value={it.value} label={it.label} delay={i * 120} className="mt-2 w-full max-w-[5rem] sm:max-w-[7.5rem]" />
          <p className="mt-2 hidden text-[11px] text-slate-500 sm:block dark:text-slate-400">{it.hint}</p>
        </div>
      ))}
    </div>
  );
}
