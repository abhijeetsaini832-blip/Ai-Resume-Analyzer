import { CheckCircle2, Target } from 'lucide-react';

const IMPORTANCE = {
  high: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

/** Matched skills + prioritised skill gaps with how to close each */
export default function SkillGaps({ result }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> Matched skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {result.matchedSkills.map((s) => <span key={s} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{s}</span>)}
        </div>
        <h3 className="mb-2 mt-5 text-sm font-semibold">Strengths</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">{result.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Target size={16} className="text-red-500" /> Skill gaps</h3>
        {result.skillGaps.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No significant gaps identified.</p>}
        <ul className="space-y-3">
          {result.skillGaps.map((g) => (
            <li key={g.skill}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{g.skill}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${IMPORTANCE[g.importance]}`}>{g.importance}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{g.suggestion}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
