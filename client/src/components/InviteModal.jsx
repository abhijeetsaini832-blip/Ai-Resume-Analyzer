import { useMemo, useState } from 'react';
import { Copy, Mail, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useEscape, useLockBodyScroll } from '../lib/hooks';

const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

/** Pre-formatted interview invitation. Deliberately contains no AI scores or screening details. */
export function buildInvite({ candidate, role, recruiterName }) {
  const first = (candidate.candidateName || '').trim().split(/\s+/)[0] || 'there';
  const skills = (candidate.matchedSkills || []).slice(0, 3);
  const roleText = role?.trim() || 'the open position';
  return {
    to: candidate.email || '',
    subject: `Interview invitation — ${roleText}`,
    body: `Hi ${first},

Thank you for your interest in ${roleText}. We reviewed your profile and were impressed${skills.length ? ` by your experience with ${list(skills)}` : ' by your background'}. We would like to invite you to an interview.

Interview details
- Format: [Video call / On-site]
- Duration: [45 minutes]
- Interviewer(s): [Name, title]

Please reply with 2-3 time slots over the next [week] that work for you, along with your time zone, and we will confirm one.

If you have any accessibility or scheduling needs, just let us know.

Looking forward to speaking with you.

Best regards,
${recruiterName || '[Your name]'}
[Company]`,
  };
}

/** Bottom sheet on phones, centred dialog on larger screens. */
export default function InviteModal({ candidate, role, recruiterName, onClose, onSent }) {
  const toast = useToast();
  const initial = useMemo(() => buildInvite({ candidate, role, recruiterName }), [candidate, role, recruiterName]);
  const [to, setTo] = useState(initial.to);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);

  useEscape(onClose);
  useLockBodyScroll(true);

  const openMail = () => {
    const href = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;
    window.location.href = href;
    toast.success('Draft opened in your email app.');
    onSent?.(candidate.id);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`);
      toast.success('Draft copied to clipboard.');
    } catch {
      toast.error('Could not copy the draft.');
    }
  };

  const hasPlaceholders = /\[[^\]]+\]/.test(body);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send interview invite"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:animate-fade-up sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-bold">✉️ Interview invite</h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">For {candidate.candidateName}</p>
          </div>
          <button onClick={onClose} className="btn-ghost !h-9 !w-9 !p-0" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div>
            <label className="label" htmlFor="inv-to">To</label>
            <input id="inv-to" type="email" className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="candidate@email.com" />
            {!candidate.email && <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">No email address was found on the resume — add it before sending.</p>}
          </div>
          <div>
            <label className="label" htmlFor="inv-sub">Subject</label>
            <input id="inv-sub" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="inv-body">Message</label>
            <textarea id="inv-body" className="input h-64 resize-y leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} />
            {hasPlaceholders && <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">Fill in the [bracketed] details before sending.</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end dark:border-slate-800">
          <button onClick={copy} className="btn-ghost"><Copy size={15} /> Copy draft</button>
          <button onClick={openMail} className="btn-primary"><Mail size={15} /> Open in email app</button>
        </div>
      </div>
    </div>
  );
}
