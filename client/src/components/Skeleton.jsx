import { Loader2 } from 'lucide-react';
import { useCyclingMessage } from '../lib/hooks';

/** Base shimmering block: <Skeleton className="h-4 w-32" /> */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function SkeletonLines({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}
    </div>
  );
}

const CANDIDATE_STEPS = ['Uploading your resume…', 'Extracting text from the PDF…', 'Scoring skills & ATS readiness…', 'Checking culture fit & seniority…', 'Finding weak bullet points…', 'Almost there…'];
const RECRUITER_STEPS = ['Uploading resumes…', 'Reading each resume…', 'Matching candidates to the job description…', 'Ranking candidates…', 'Almost there…'];

function StatusLine({ steps }) {
  const msg = useCyclingMessage(steps, true);
  return (
    <p role="status" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
      <Loader2 size={15} className="animate-spin text-brand-600" /> {msg}
    </p>
  );
}

/** Placeholder that mirrors the candidate results layout while the AI works. */
export function AnalysisSkeleton({ steps = CANDIDATE_STEPS }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Analyzing resume">
      <StatusLine steps={steps} />
      <div className="space-y-2"><Skeleton className="h-6 w-48 sm:w-64" /><Skeleton className="h-4 w-64 max-w-full sm:w-80" /></div>
      <Skeleton className="h-10 w-full !rounded-xl" />
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col items-center gap-3 p-3 sm:p-4">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="aspect-square w-16 !rounded-full sm:w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-4"><Skeleton className="mb-3 h-4 w-24" /><Skeleton className="mx-auto aspect-square w-full max-w-[16rem] !rounded-full" /></div>
        <div className="card space-y-3 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full" /><SkeletonLines lines={3} /><Skeleton className="h-8 w-48" /><SkeletonLines lines={2} /></div>
      </div>
      <div className="card p-4"><Skeleton className="mb-3 h-4 w-20" /><SkeletonLines lines={4} /></div>
    </div>
  );
}

/** Placeholder for the recruiter ranking table. */
export function BoardSkeleton({ rows = 5, steps = RECRUITER_STEPS }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Screening candidates">
      <StatusLine steps={steps} />
      <div className="flex flex-col gap-2 sm:flex-row"><Skeleton className="h-10 w-full sm:w-44 !rounded-xl" /><Skeleton className="h-10 w-full sm:w-44 !rounded-xl" /></div>
      <div className="card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 shrink-0 !rounded-full" />
            <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /></div>
            <Skeleton className="h-10 w-10 shrink-0 !rounded-full" />
            <Skeleton className="hidden h-6 w-20 !rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small card skeleton (e.g. while a rewrite or cover letter is generating) */
export function CardSkeleton({ lines = 4 }) {
  return <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700" aria-busy="true"><Skeleton className="h-4 w-1/3" /><SkeletonLines lines={lines} /></div>;
}

export default Skeleton;
