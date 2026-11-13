import { useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2 } from 'lucide-react';
import { analysisApi, errMsg } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from './Skeleton';

const SEVERITY_STYLE = {
  high: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  low: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600',
};

/** Highlight [bracketed placeholders] so the user notices numbers they must fill in */
function HighlightPlaceholders({ text }) {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part)
      ? <mark key={i} className="rounded bg-amber-100 px-1 font-semibold text-amber-800 dark:bg-amber-500/25 dark:text-amber-200">{part}</mark>
      : <span key={i}>{part}</span>
  );
}

function WeakPointItem({ analysisId, wp, saved, onRewrite }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const result = saved; // lives in the dashboard so the PDF report can include it

  const fix = async () => {
    setLoading(true);
    try {
      const data = await analysisApi.rewriteBullet(analysisId, wp.id);
      onRewrite(wp.id, data);
      toast.success('Bullet rewritten with the STAR method.');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.rewritten);
      setCopied(true);
      toast.success('Copied to clipboard.', 2000);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — select the text and copy manually.');
    }
  };

  return (
    <li className="card p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ring-1 ${SEVERITY_STYLE[wp.severity]}`}>{wp.severity}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{wp.section}</span>
          </div>
          <p className="break-words text-sm text-slate-800 line-through decoration-red-300 dark:text-slate-200 dark:decoration-red-400/60">{wp.original}</p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />{wp.issue}</p>
        </div>
        <button onClick={fix} disabled={loading} className="btn-primary w-full shrink-0 !py-1.5 sm:w-auto">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <span aria-hidden>✨</span>}
          {result ? 'Redo with AI' : 'Fix with AI'}
        </button>
      </div>

      {loading && <div className="mt-3"><CardSkeleton lines={3} /></div>}

      {!loading && result && (
        <div className="mt-3 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="break-words text-sm font-medium text-slate-900 dark:text-slate-100"><HighlightPlaceholders text={result.rewritten} /></p>
            <button onClick={copy} className="btn-ghost shrink-0 self-start !min-h-0 !px-2 !py-1 text-xs">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button>
          </div>

          {result.metricPlaceholders?.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
              <p className="font-semibold">Replace with your real numbers before using:</p>
              <ul className="mt-1 list-inside list-disc">
                {result.metricPlaceholders.map((m) => <li key={m.placeholder}><b>{m.placeholder}</b> — {m.whatToFill}</li>)}
              </ul>
            </div>
          )}

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {['situation', 'task', 'action', 'result'].map((k) => (
              <div key={k} className="rounded-lg bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <dt className="font-bold uppercase tracking-wide text-brand-600 dark:text-brand-500">{k[0]}  <span className="font-semibold normal-case text-slate-400">{k}</span></dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{result.star[k]}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </li>
  );
}

export default function WeakPoints({ analysis, rewrites = {}, onRewrite }) {
  const wps = analysis.result.weakPoints || [];
  if (!wps.length) return <p className="card p-6 text-sm text-slate-500 dark:text-slate-400">No weak bullet points found — nice work.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">{wps.length} bullets could land harder. Use <b>✨ Fix with AI</b> for a STAR-style rewrite. Metrics shown in <mark className="rounded bg-amber-100 px-1 dark:bg-amber-500/25 dark:text-amber-200">[brackets]</mark> are placeholders for you to verify.</p>
      <ul className="space-y-3">
        {wps.map((wp) => <WeakPointItem key={wp.id} analysisId={analysis._id} wp={wp} saved={rewrites[wp.id]} onRewrite={onRewrite} />)}
      </ul>
    </div>
  );
}
