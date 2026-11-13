import { Building2 } from 'lucide-react';

const CATEGORY_LABEL = { 'big-tech': 'Big Tech', product: 'Product-based', service: 'Service-based' };
const CHIP_ON = 'border-brand-600 bg-brand-600 text-white';
const CHIP_OFF = 'border-slate-300 bg-white text-slate-600 hover:border-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500';

/** Chip selector for the target company; shows the chosen rubric's values below. */
export default function CompanySelector({ companies, value, onChange }) {
  const selected = companies.find((c) => c.slug === value);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange('')} className={`min-h-[2rem] rounded-full border px-3 py-1 text-xs font-semibold ${!value ? CHIP_ON : CHIP_OFF}`}>
          No preference
        </button>
        {companies.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.slug === value ? '' : c.slug)}
            title={CATEGORY_LABEL[c.category]}
            className={`inline-flex min-h-[2rem] items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${value === c.slug ? CHIP_ON : CHIP_OFF}`}
          >
            <Building2 size={12} /> {c.name}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-3 rounded-xl bg-brand-50 p-3 text-xs text-slate-700 dark:bg-brand-500/10 dark:text-slate-300">
          <p className="font-semibold text-brand-700 dark:text-brand-100">{selected.tagline}</p>
          <p className="mt-1 flex flex-wrap gap-1">
            {selected.values.map((v) => (
              <span key={v.name} className="rounded-md bg-white px-1.5 py-0.5 ring-1 ring-brand-100 dark:bg-slate-800 dark:ring-slate-700">{v.name}</span>
            ))}
          </p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{selected.sourceNote}</p>
        </div>
      )}
    </div>
  );
}
