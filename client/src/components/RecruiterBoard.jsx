import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowDownUp, Check, GitCompare, MessageSquare, X } from 'lucide-react';
import SkillRadar from './SkillRadar';
import ChatPanel from './ChatPanel';
import ScoreGauge from './ScoreGauge';
import InviteModal from './InviteModal';
import { useAuth } from '../context/AuthContext';
import { useEscape, useLockBodyScroll } from '../lib/hooks';

const REC = {
  strong_yes: { label: 'Strong yes', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
  yes: { label: 'Yes', cls: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
  maybe: { label: 'Maybe', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  no: { label: 'No', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};
const REC_ORDER = { strong_yes: 0, yes: 1, maybe: 2, no: 3 };
const LEVEL_ORDER = { Senior: 0, 'Mid-level': 1, Junior: 2 };
const avg = (r = {}) => Object.values(r).reduce((a, b) => a + b, 0) / (Object.values(r).length || 1);
/** Candidates the recruiter can invite: shortlisted ("Yes") and "Strong yes" */
const canInvite = (c) => c.recommendation === 'strong_yes' || c.recommendation === 'yes';

const SORTS = {
  rank: { label: 'AI rank', fn: (a, b) => a.rank - b.rank },
  match: { label: 'Match score', fn: (a, b) => b.matchScore - a.matchScore },
  profile: { label: 'Profile average', fn: (a, b) => avg(b.radar) - avg(a.radar) },
  seniority: { label: 'Seniority', fn: (a, b) => LEVEL_ORDER[a.seniority.level] - LEVEL_ORDER[b.seniority.level] },
  recommendation: { label: 'Recommendation', fn: (a, b) => REC_ORDER[a.recommendation] - REC_ORDER[b.recommendation] },
};

/** Ranked table + compare radar + per-candidate detail drawer with chat */
export default function RecruiterBoard({ candidates, failed = [], targetRole = '' }) {
  const { user } = useAuth();
  const [sortKey, setSortKey] = useState('rank');
  const [filter, setFilter] = useState('all');
  const [compare, setCompare] = useState([]); // candidate ids (max 3)
  const [openId, setOpenId] = useState(null);
  const [detailTab, setDetailTab] = useState('summary');
  const [inviteFor, setInviteFor] = useState(null); // candidate object
  const [invited, setInvited] = useState(() => new Set());

  const rows = useMemo(
    () => candidates.filter((c) => filter === 'all' || c.recommendation === filter).sort(SORTS[sortKey].fn),
    [candidates, sortKey, filter]
  );
  const open = candidates.find((c) => c.id === openId);
  const toggleCompare = (id) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));
  const compared = candidates.filter((c) => compare.includes(c.id));
  const markInvited = (id) => setInvited((s) => new Set(s).add(id));

  const InviteButton = ({ c, compact }) => {
    if (!canInvite(c)) return null;
    const done = invited.has(c.id);
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setInviteFor(c); }}
        title="Send interview invite"
        aria-label={`Send interview invite to ${c.candidateName}`}
        className={`btn-ghost !min-h-0 whitespace-nowrap !py-1.5 text-xs ${compact ? '!px-2.5' : ''} ${done ? '!border-emerald-300 !text-emerald-700 dark:!border-emerald-500/40 dark:!text-emerald-300' : ''}`}
      >
        {done ? <Check size={14} /> : <span aria-hidden>✉️</span>}
        <span className={compact ? 'hidden lg:inline' : ''}>{done ? 'Invited' : 'Invite'}</span>
      </button>
    );
  };

  const closeDrawer = () => setOpenId(null);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><ArrowDownUp size={15} className="shrink-0" />
          <select className="input sm:!w-auto sm:!py-1.5" value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort by">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>Sort: {v.label}</option>)}
          </select>
        </label>
        <select className="input sm:!w-auto sm:!py-1.5" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by recommendation">
          <option value="all">All candidates</option>
          {Object.entries(REC).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-slate-500 dark:text-slate-400">{rows.length} of {candidates.length} shown · select up to 3 to compare</span>
      </div>

      {failed.length > 0 && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-200">
          <p className="mb-1 flex items-center gap-1.5 font-semibold"><AlertCircle size={14} /> {failed.length} file(s) could not be processed</p>
          <ul className="list-inside list-disc break-words">{failed.map((f) => <li key={f.fileName}><b>{f.fileName}</b>: {f.error}</li>)}</ul>
        </div>
      )}

      {/* Ranked table (scrolls sideways on very small screens) */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="w-10 py-2 pl-3 pr-1"><span className="sr-only">Compare</span></th>
                <th className="px-1 py-2">#</th>
                <th className="px-2 py-2">Candidate</th>
                <th className="px-2 py-2 text-center">Match</th>
                <th className="hidden px-2 py-2 md:table-cell">Level</th>
                <th className="px-2 py-2">Verdict</th>
                <th className="py-2 pl-2 pr-3 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 pl-3 pr-1">
                    <input type="checkbox" checked={compare.includes(c.id)} onChange={() => toggleCompare(c.id)} aria-label={`Compare ${c.candidateName}`} className="h-4 w-4 accent-brand-600" />
                  </td>
                  <td className="px-1 py-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{c.rank}</span>
                  </td>
                  <td className="max-w-[11rem] px-2 py-2.5 sm:max-w-xs">
                    <button onClick={() => { setOpenId(c.id); setDetailTab('summary'); }} className="block w-full min-w-0 text-left">
                      <p className="truncate font-semibold">{c.candidateName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.headline}</p>
                    </button>
                  </td>
                  <td className="px-2 py-2.5"><ScoreGauge value={c.matchScore} label={`${c.candidateName} match`} strokeWidth={11} className="mx-auto w-10 sm:w-12" /></td>
                  <td className="hidden whitespace-nowrap px-2 py-2.5 text-xs text-slate-600 md:table-cell dark:text-slate-300">{c.seniority.level}</td>
                  <td className="px-2 py-2.5"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${REC[c.recommendation].cls}`}>{REC[c.recommendation].label}</span></td>
                  <td className="py-2.5 pl-2 pr-3 text-right"><InviteButton c={c} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No candidates match this filter.</p>}
      </div>

      {/* Compare radar */}
      {compared.length >= 2 && (
        <div className="card p-3 sm:p-4">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><GitCompare size={16} className="text-brand-600 dark:text-brand-500" /> Candidate comparison</h3>
          <SkillRadar series={compared.map((c) => ({ name: c.candidateName, radar: c.radar }))} height={340} />
        </div>
      )}

      {/* Detail drawer: full-screen on phones, side panel on larger screens */}
      {open && <Drawer onClose={closeDrawer}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{open.candidateName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{open.headline}</p>
          </div>
          <button onClick={closeDrawer} className="btn-ghost !h-10 !w-10 shrink-0 !p-0" aria-label="Close"><X size={16} /></button>
        </div>

        {canInvite(open) && (
          <button onClick={() => setInviteFor(open)} className="btn-primary mb-4 w-full">
            ✉️ Send Interview Invite {invited.has(open.id) && <Check size={15} />}
          </button>
        )}

        <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[['summary', 'Assessment'], ['chat', 'Chat with resume']].map(([id, label]) => (
            <button key={id} onClick={() => setDetailTab(id)} className={`flex min-h-[2.25rem] flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold ${detailTab === id ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              {id === 'chat' && <MessageSquare size={14} />}{label}
            </button>
          ))}
        </div>

        {detailTab === 'summary' ? (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${REC[open.recommendation].cls}`}>{REC[open.recommendation].label}</span>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job match</p>
                </div>
                <ScoreGauge value={open.matchScore} label="Job match" className="w-20 sm:w-24" />
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{open.summary}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{open.seniority.level} · ~{open.seniority.yearsOfExperience} yrs — {open.seniority.reasoning}</p>
            </div>
            <div className="card p-2 sm:p-3"><SkillRadar series={[{ name: open.candidateName, radar: open.radar }]} height={260} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <List title="Pros" items={open.pros} tone="emerald" />
              <List title="Cons" items={open.cons} tone="red" />
              <List title="Matched skills" items={open.matchedSkills} tone="emerald" chips />
              <List title="Missing skills" items={open.missingSkills} tone="amber" chips />
            </div>
            {open.redFlags.length > 0 && <List title="Red flags (objective)" items={open.redFlags} tone="red" />}
            {open.suggestedInterviewQuestions.length > 0 && <List title="Suggested interview questions" items={open.suggestedInterviewQuestions} tone="slate" />}
          </div>
        ) : (
          <ChatPanel analysisId={open.id} mode="recruiter" />
        )}
      </Drawer>}

      {inviteFor && (
        <InviteModal
          candidate={inviteFor}
          role={targetRole}
          recruiterName={user?.name}
          onClose={() => setInviteFor(null)}
          onSent={markInvited}
        />
      )}
    </div>
  );
}

function Drawer({ onClose, children }) {
  useEscape(onClose);
  useLockBodyScroll(true);
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        className="h-full w-full animate-slide-in overflow-y-auto bg-slate-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-xl sm:p-5 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>,
    document.body
  );
}

const TONES = { emerald: 'text-emerald-700 dark:text-emerald-400', red: 'text-red-700 dark:text-red-400', amber: 'text-amber-700 dark:text-amber-400', slate: 'text-slate-700 dark:text-slate-300' };
const CHIP = {
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

function List({ title, items = [], tone, chips }) {
  if (!items.length) return null;
  return (
    <div className="card p-3">
      <h4 className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${TONES[tone]}`}>{title}</h4>
      {chips ? (
        <div className="flex flex-wrap gap-1">{items.map((i) => <span key={i} className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${CHIP[tone]}`}>{i}</span>)}</div>
      ) : (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-700 dark:text-slate-300">{items.map((i) => <li key={i}>{i}</li>)}</ul>
      )}
    </div>
  );
}
