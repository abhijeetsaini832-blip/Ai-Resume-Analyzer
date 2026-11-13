import { User, Users } from 'lucide-react';

const OPTIONS = [
  { value: 'candidate', label: 'Candidate', icon: User },
  { value: 'recruiter', label: 'Recruiter', icon: Users },
];

/** Segmented switch for the dual dashboard (accessible: radiogroup semantics). `full` stretches it on mobile. */
export default function ModeToggle({ mode, onChange, full = false }) {
  return (
    <div role="radiogroup" aria-label="Dashboard mode" className={`relative grid grid-cols-2 rounded-full bg-slate-100 p-1 dark:bg-slate-800 ${full ? 'w-full' : 'w-max'}`}>
      {/* sliding thumb */}
      <span
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow transition-transform duration-200 dark:bg-slate-600 ${
          mode === 'recruiter' ? 'translate-x-full' : 'translate-x-0'
        }`}
        aria-hidden
      />
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={mode === value}
          onClick={() => onChange(value)}
          className={`relative z-10 flex min-h-[2.25rem] items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            mode === value ? 'text-brand-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Icon size={15} /> {label}
        </button>
      ))}
    </div>
  );
}
