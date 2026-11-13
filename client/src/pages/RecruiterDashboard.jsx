import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, History, Loader2, Users } from 'lucide-react';
import { errMsg, recruiterApi } from '../lib/api';
import { useToast } from '../context/ToastContext';
import UploadZone from '../components/UploadZone';
import RecruiterBoard from '../components/RecruiterBoard';
import { BoardSkeleton } from '../components/Skeleton';

/**
 * Recruiter mode: screen many resumes against ONE job description,
 * auto-rank, compare and interrogate each candidate.
 */
export default function RecruiterDashboard() {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [board, setBoard] = useState(null); // { batchId, targetRole, candidates, failed }
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const resultsRef = useRef(null);

  const loadBatches = useCallback(() => recruiterApi.listBatches().then(setBatches).catch(() => {}), []);
  useEffect(() => { loadBatches(); }, [loadBatches]);

  const showResults = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setFormOpen(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

  const run = async () => {
    setLoading(true);
    setBoard(null);
    showResults();
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('resumes', f));
      fd.append('jobDescription', jobDescription);
      fd.append('targetRole', targetRole);
      const data = await recruiterApi.createBatch(fd);
      setBoard({ ...data, targetRole: data.targetRole ?? targetRole });
      setFiles([]);
      loadBatches();
      if (data.candidates.length) toast.success(`Ranked ${data.candidates.length} candidate${data.candidates.length === 1 ? '' : 's'}.`);
      if (data.failed?.length) toast.error(`${data.failed.length} file(s) could not be processed.`);
    } catch (e) {
      toast.error(errMsg(e));
      setFormOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const openBatch = async (id) => {
    setOpening(true);
    showResults();
    try {
      const b = await recruiterApi.getBatch(id);
      setJobDescription(b.jobDescription || '');
      setTargetRole(b.targetRole || '');
      setBoard({ ...b, failed: [] });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setOpening(false);
    }
  };

  const ready = files.length > 0 && jobDescription.trim().length >= 30;
  const busy = loading || opening;

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[22rem_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:space-y-4 lg:self-start lg:overflow-y-auto lg:pr-1">
        <button onClick={() => setFormOpen((o) => !o)} className="btn-ghost w-full justify-between lg:hidden" aria-expanded={formOpen}>
          <span className="flex items-center gap-2"><Users size={16} className="text-brand-600" /> Screen candidates</span>
          <ChevronDown size={16} className={`transition-transform ${formOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`${formOpen ? 'block' : 'hidden'} space-y-4 lg:block`}>
          <div className="card space-y-4 p-4">
            <h2 className="hidden items-center gap-2 font-semibold lg:flex"><Users size={18} className="text-brand-600 dark:text-brand-500" /> Screen candidates</h2>
            <div><label className="label">Job title</label><input className="input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Backend Engineer" /></div>
            <div>
              <label className="label">Job description</label>
              <textarea className="input h-40 resize-y" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} maxLength={8000} placeholder="Paste the full job description (min 30 characters)…" />
            </div>
            <div><label className="label">Resumes</label><UploadZone files={files} onChange={setFiles} multiple maxFiles={20} disabled={loading} /></div>

            <button onClick={run} disabled={!ready || loading} className="btn-primary w-full">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Screening {files.length} resume(s)…</> : `Rank ${files.length || ''} candidate${files.length === 1 ? '' : 's'}`}
            </button>
            <p className="text-[11px] text-slate-400">Scoring uses job-relevant criteria only. AI output is decision support — a human should make the hiring decision.</p>
          </div>

          {batches.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><History size={13} /> Recent batches</h3>
              <ul className="space-y-1">
                {batches.map((b) => (
                  <li key={b.batchId}>
                    <button onClick={() => openBatch(b.batchId)} disabled={busy} className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${board?.batchId === b.batchId ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                      <p className="truncate font-medium">{b.targetRole || 'Untitled role'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{b.count} candidates · {new Date(b.createdAt).toLocaleDateString()}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>

      <section ref={resultsRef} className="min-w-0 scroll-mt-20">
        {busy ? (
          <BoardSkeleton rows={Math.min(Math.max(files.length, 4), 8)} />
        ) : board ? (
          <div className="animate-fade-up">
            <RecruiterBoard key={board.batchId} candidates={board.candidates} failed={board.failed} targetRole={board.targetRole || targetRole} />
          </div>
        ) : (
          <div className="card grid min-h-[20rem] place-items-center p-6 text-center text-slate-500 sm:min-h-[24rem] sm:p-8 dark:text-slate-400">
            <div>
              <Users className="mx-auto mb-3 text-brand-500" size={32} />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Bulk-rank resumes against one job description</p>
              <p className="mt-1 max-w-sm text-sm">Upload up to 20 PDFs. You'll get an automatic ranking, side-by-side radar comparison, red flags, interview questions, and a chat for each resume.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
