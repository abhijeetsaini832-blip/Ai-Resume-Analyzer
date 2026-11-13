import { useState } from 'react';
import { FileDown, FileText, Loader2, Mail } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { analysisApi, errMsg } from '../lib/api';
import { pdfSafe } from '../lib/reportPdf';
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from './Skeleton';

const TONES = ['professional', 'enthusiastic', 'concise', 'creative'];

/** Download helpers (client-side, no server round trip) */
function downloadText(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${name}.txt` });
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(text, name) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 64;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal').setFontSize(11);
  let y = margin;
  // Paragraph-by-paragraph so we can paginate cleanly
  pdfSafe(text).split('\n').forEach((para) => {
    const lines = para.trim() ? doc.splitTextToSize(para, width) : [''];
    lines.forEach((line) => {
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 16;
    });
  });
  doc.save(`${name}.pdf`);
}

export default function CoverLetter({ analysis }) {
  const toast = useToast();
  const [form, setForm] = useState({
    jobDescription: analysis.jobDescription || '',
    companyName: analysis.company?.name || '',
    role: analysis.targetRole || '',
    tone: 'professional',
  });
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fileBase = `cover-letter-${(form.companyName || 'company').toLowerCase().replace(/\W+/g, '-')}`;

  const generate = async () => {
    setLoading(true);
    try {
      setLetter(await analysisApi.coverLetter(analysis._id, {
        ...form,
        companySlug: analysis.company?.slug, // reuses rubric values when a company was chosen
      }));
      toast.success('Cover letter ready — edit it below.');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Mail size={16} className="text-brand-600 dark:text-brand-500" /> Tailor your cover letter</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Company</label><input className="input" value={form.companyName} onChange={set('companyName')} placeholder="e.g. Adobe" /></div>
          <div><label className="label">Role</label><input className="input" value={form.role} onChange={set('role')} placeholder="e.g. SDE II" /></div>
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={form.tone} onChange={set('tone')}>{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </div>
        <div>
          <label className="label">Job description</label>
          <textarea className="input h-40 resize-y sm:h-44" value={form.jobDescription} onChange={set('jobDescription')} maxLength={8000} placeholder="Paste the job description…" />
        </div>
        <button onClick={generate} disabled={loading || (!form.jobDescription.trim() && !form.companyName.trim())} className="btn-primary w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} {letter ? 'Regenerate' : 'Generate cover letter'}
        </button>
      </div>

      <div className="card flex flex-col p-4">
        {loading ? (
          <CardSkeleton lines={9} />
        ) : !letter ? (
          <p className="m-auto py-10 text-sm text-slate-400">Your letter will appear here.</p>
        ) : (
          <>
            <textarea
              className="input min-h-[20rem] flex-1 resize-y font-serif leading-relaxed sm:min-h-[22rem]"
              value={letter.text}
              onChange={(e) => setLetter({ ...letter, text: e.target.value })}
              aria-label="Cover letter (editable)"
            />
            {letter.highlightsUsed?.length > 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400"><b>Drawn from your resume:</b> {letter.highlightsUsed.join(' · ')}</p>
            )}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button className="btn-ghost flex-1" onClick={() => { downloadPdf(letter.text, fileBase); toast.success('PDF downloaded.'); }}><FileDown size={16} /> PDF</button>
              <button className="btn-ghost flex-1" onClick={() => { downloadText(letter.text, fileBase); toast.success('Text file downloaded.'); }}><FileDown size={16} /> Text</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
