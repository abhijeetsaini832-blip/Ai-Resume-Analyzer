import { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Loader2, Mail, MessageSquare, Pencil, Radar as RadarIcon, ScanSearch, Sparkles, Trash2 } from 'lucide-react';
import { analysisApi, companyApi, errMsg } from '../lib/api';
import { downloadReport } from '../lib/reportPdf';
import { useToast } from '../context/ToastContext';
import UploadZone from '../components/UploadZone';
import CompanySelector from '../components/CompanySelector';
import ScoreCards from '../components/ScoreCards';
import SkillRadar from '../components/SkillRadar';
import SeniorityCard from '../components/SeniorityCard';
import SkillGaps from '../components/SkillGaps';
import WeakPoints from '../components/WeakPoints';
import CultureFit from '../components/CultureFit';
import ChatPanel from '../components/ChatPanel';
import CoverLetter from '../components/CoverLetter';
import { AnalysisSkeleton } from '../components/Skeleton';

const TABS = [
  { id: 'overview', label: 'Overview', icon: RadarIcon },
  { id: 'fix', label: 'Fix Weak Points', icon: Pencil },
  { id: 'culture', label: 'Culture Fit', icon: Building2 },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'cover', label: 'Cover Letter', icon: Mail },
];

/** Latest saved rewrite per weak point -> { [weakPointId]: rewrite } */
const rewritesMap = (list = []) => list.reduce((m, r) => ({ ...m, [r.weakPointId]: r }), {});

/**
 * Candidate mode: optimise MY resume.
 * Desktop: inputs on the left, results on the right.
 * Phone/tablet: stacked; the input panel collapses once results are showing.
 */
export default function CandidateDashboard() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ jobDescription: '', targetRole: '', companySlug: '', location: 'India (INR)' });
  const [analysis, setAnalysis] = useState(null);
  const [rewrites, setRewrites] = useState({});
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formOpen, setFormOpen] = useState(true); // only matters below the lg breakpoint
  const resultsRef = useRef(null);

  const loadHistory = useCallback(() => analysisApi.list('candidate').then(setHistory).catch(() => {}), []);

  useEffect(() => {
    companyApi.list().then(setCompanies).catch((e) => toast.error(errMsg(e)));
    loadHistory();
  }, [loadHistory, toast]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const showResults = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setFormOpen(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

  const analyze = async () => {
    setLoading(true);
    setAnalysis(null);
    showResults();
    try {
      const fd = new FormData();
      fd.append('resume', files[0]);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const a = await analysisApi.create(fd);
      setAnalysis(a); setRewrites(rewritesMap(a.rewrites)); setTab('overview'); loadHistory();
      toast.success('Analysis complete!');
    } catch (e) {
      toast.error(errMsg(e));
      setFormOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const open = async (id) => {
    setOpening(true);
    showResults();
    try {
      const a = await analysisApi.get(id);
      setAnalysis(a); setRewrites(rewritesMap(a.rewrites)); setTab('overview');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setOpening(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this analysis and its resume text?')) return;
    try {
      await analysisApi.remove(id);
      if (analysis?._id === id) setAnalysis(null);
      toast.success('Analysis deleted.');
      loadHistory();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const exportPdf = () => {
    setExporting(true);
    // let the spinner paint before the (synchronous) PDF build
    setTimeout(() => {
      try {
        downloadReport(analysis, rewrites);
        toast.success('PDF report downloaded.');
      } catch (e) {
        toast.error(`Could not create the PDF: ${e.message}`);
      } finally {
        setExporting(false);
      }
    }, 30);
  };

  const result = analysis?.result;
  const busy = loading || opening;

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[22rem_1fr]">
      {/* ---------------- Left: inputs ---------------- */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:space-y-4 lg:self-start lg:overflow-y-auto lg:pr-1">
        <button
          onClick={() => setFormOpen((o) => !o)}
          className="btn-ghost w-full justify-between lg:hidden"
          aria-expanded={formOpen}
        >
          <span className="flex items-center gap-2"><ScanSearch size={16} className="text-brand-600" /> Analyze a resume</span>
          <ChevronDown size={16} className={`transition-transform ${formOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`${formOpen ? 'block' : 'hidden'} space-y-4 lg:block`}>
          <div className="card space-y-4 p-4">
            <h2 className="hidden items-center gap-2 font-semibold lg:flex"><ScanSearch size={18} className="text-brand-600 dark:text-brand-500" /> Analyze a resume</h2>
            <UploadZone files={files} onChange={setFiles} disabled={loading} />
            <div><label className="label">Target role</label><input className="input" value={form.targetRole} onChange={set('targetRole')} placeholder="e.g. Full-Stack Engineer" /></div>
            <div>
              <label className="label">Job description (optional)</label>
              <textarea className="input h-28 resize-y" value={form.jobDescription} onChange={set('jobDescription')} maxLength={8000} placeholder="Paste a job description for a precise match score…" />
            </div>
            <div>
              <label className="label">Target company</label>
              <CompanySelector companies={companies} value={form.companySlug} onChange={(v) => setForm((f) => ({ ...f, companySlug: v }))} />
            </div>
            <div><label className="label">Salary location / currency</label><input className="input" value={form.location} onChange={set('location')} placeholder="e.g. India (INR) or USA (USD)" /></div>

            <button onClick={analyze} disabled={!files.length || loading} className="btn-primary w-full">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing (≈20s)…</> : <><Sparkles size={16} /> Analyze resume</>}
            </button>
          </div>

          {history.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recent analyses</h3>
              <ul className="space-y-1">
                {history.map((h) => (
                  <li key={h._id} className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${analysis?._id === h._id ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                    <button onClick={() => open(h._id)} disabled={busy} className="min-w-0 flex-1 py-1 text-left">
                      <p className="truncate font-medium">{h.result?.candidateName || h.fileName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{h.company?.name || 'General'} · {new Date(h.createdAt).toLocaleDateString()} · {h.result?.overallScore}/100</p>
                    </button>
                    <button onClick={() => remove(h._id)} className="p-2 text-slate-300 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400" aria-label="Delete"><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>

      {/* ---------------- Right: results ---------------- */}
      <section ref={resultsRef} className="min-w-0 scroll-mt-20 space-y-4">
        {busy ? (
          <AnalysisSkeleton />
        ) : !analysis ? (
          <div className="card grid min-h-[20rem] place-items-center p-6 text-center text-slate-500 sm:min-h-[24rem] sm:p-8 dark:text-slate-400">
            <div>
              <Sparkles className="mx-auto mb-3 text-brand-500" size={32} />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Upload a resume to get started</p>
              <p className="mt-1 max-w-sm text-sm">You'll get scores, a skill radar, culture-fit analysis, one-click bullet fixes, salary estimates and a tailored cover letter.</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up space-y-4">
            {/* Result header card with PDF export */}
            <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold sm:text-xl">{result.candidateName}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{result.headline}{analysis.company?.name ? ` · Targeting ${analysis.company.name}` : ''}</p>
              </div>
              <button onClick={exportPdf} disabled={exporting} className="btn-primary w-full shrink-0 sm:w-auto">
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <span aria-hidden>📥</span>} Download PDF Report
              </button>
            </div>

            <nav className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] dark:bg-slate-800 [&::-webkit-scrollbar]:hidden" role="tablist">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`flex min-h-[2.25rem] shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === id ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                  <Icon size={15} /> {label}
                  {id === 'fix' && <span className="rounded-full bg-red-100 px-1.5 text-[10px] text-red-700 dark:bg-red-500/20 dark:text-red-300">{result.weakPoints.length}</span>}
                </button>
              ))}
            </nav>

            {tab === 'overview' && (
              <div className="space-y-4">
                <ScoreCards result={result} />
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="card p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Skill radar</h3>
                    <SkillRadar series={[{ name: result.candidateName, radar: result.radar }]} />
                    {!analysis.company && <p className="text-center text-[11px] text-slate-400">Culture Fit is general (no company selected).</p>}
                  </div>
                  <SeniorityCard seniority={result.seniority} salary={result.salary} />
                </div>
                <div className="card p-4"><h3 className="mb-1 text-sm font-semibold">Summary</h3><p className="text-sm text-slate-700 dark:text-slate-300">{result.summary}</p></div>
                <SkillGaps result={result} />
              </div>
            )}
            {tab === 'fix' && <WeakPoints analysis={analysis} rewrites={rewrites} onRewrite={(id, data) => setRewrites((m) => ({ ...m, [id]: data }))} />}
            {tab === 'culture' && <CultureFit analysis={analysis} />}
            {tab === 'chat' && <ChatPanel analysisId={analysis._id} mode="candidate" />}
            {tab === 'cover' && <CoverLetter analysis={analysis} />}
          </div>
        )}
      </section>
    </div>
  );
}
