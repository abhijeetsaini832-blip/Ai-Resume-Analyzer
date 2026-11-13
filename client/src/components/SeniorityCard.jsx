import { Briefcase, Wallet } from 'lucide-react';

const LEVELS = ['Junior', 'Mid-level', 'Senior'];

/** Format a salary figure in a locale-appropriate compact way (e.g. ₹12L, $95K) */
function fmt(amount, currency) {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

/** Seniority level + estimated salary range */
export default function SeniorityCard({ seniority, salary }) {
  const idx = LEVELS.indexOf(seniority.level);
  return (
    <div className="card space-y-5 p-4 sm:p-5">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Briefcase size={16} className="text-brand-600 dark:text-brand-500" /> Seniority fit</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {LEVELS.map((l, i) => (
            <div key={l} className={`rounded-lg py-2 text-center text-xs font-semibold ${i === idx ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>{l}</div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          ~{seniority.yearsOfExperience} yrs relevant experience · {seniority.confidence}% confidence
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{seniority.reasoning}</p>
      </div>

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wallet size={16} className="text-brand-600 dark:text-brand-500" /> Estimated market salary</h3>
        <p className="flex flex-wrap items-baseline gap-x-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
          <span>{fmt(salary.min, salary.currency)} – {fmt(salary.max, salary.currency)}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ {salary.period}</span>
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{salary.rationale}</p>
        <p className="mt-1 text-xs italic text-slate-400">{salary.caveat}</p>
      </div>
    </div>
  );
}
