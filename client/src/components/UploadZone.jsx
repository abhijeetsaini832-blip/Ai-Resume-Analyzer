import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const MAX_MB = 5;
const fmtSize = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * Drag-and-drop / tap-to-browse PDF picker. `multiple` switches between the candidate
 * (single file) and recruiter (bulk) experience. Controlled via `files`.
 * Validation problems are surfaced as toasts.
 */
export default function UploadZone({ files, onChange, multiple = false, maxFiles = 20, disabled = false }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const toast = useToast();

  const accept = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;

    const notPdf = incoming.filter((f) => !/\.pdf$/i.test(f.name) || (f.type && f.type !== 'application/pdf'));
    const tooBig = incoming.filter((f) => !notPdf.includes(f) && f.size > MAX_MB * 1024 * 1024);
    const empty = incoming.filter((f) => !notPdf.includes(f) && f.size === 0);

    if (notPdf.length) toast.error(`${notPdf.length === 1 ? `“${notPdf[0].name}” is not a PDF.` : `${notPdf.length} files are not PDFs.`} Only PDF resumes are supported.`);
    if (tooBig.length) toast.error(`${tooBig.length === 1 ? `“${tooBig[0].name}” is` : `${tooBig.length} files are`} larger than ${MAX_MB} MB.`);
    if (empty.length) toast.error(`“${empty[0].name}” is empty.`);

    const valid = incoming.filter((f) => !notPdf.includes(f) && !tooBig.includes(f) && !empty.includes(f));
    if (!valid.length) return;

    if (multiple) {
      const merged = [...files, ...valid].filter((f, i, a) => a.findIndex((x) => x.name === f.name && x.size === f.size) === i);
      if (merged.length < files.length + valid.length) toast.info('Duplicate files were skipped.');
      if (merged.length > maxFiles) toast.error(`Maximum ${maxFiles} resumes per batch — extra files were ignored.`);
      onChange(merged.slice(0, maxFiles));
      if (merged.length > files.length) toast.success(`${Math.min(merged.length, maxFiles) - files.length} resume(s) added.`, 2200);
    } else {
      if (valid.length > 1) toast.info('Only one resume can be analyzed at a time — using the first file.');
      onChange([valid[0]]);
    }
  };

  const remove = (i) => onChange(files.filter((_, idx) => idx !== i));
  const open = () => !disabled && inputRef.current?.click();

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={multiple ? 'Upload resumes (PDF)' : 'Upload resume (PDF)'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) accept(e.dataTransfer.files); }}
        onClick={open}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-3 py-6 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500 sm:px-4 sm:py-8 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${
          drag
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
            : 'border-slate-300 bg-slate-50 hover:border-brand-500 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-brand-500'
        }`}
      >
        <Upload className="text-brand-600 dark:text-brand-500" />
        <p className="text-sm font-semibold">{multiple ? 'Drop resumes (PDF) here' : 'Drop your resume (PDF) here'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="sm:hidden">Tap to choose</span><span className="hidden sm:inline">or click to browse</span> · max {MAX_MB}MB{multiple ? ` · up to ${maxFiles} files` : ''}
        </p>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple={multiple} hidden onChange={(e) => { accept(e.target.files); e.target.value = ''; }} />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 max-h-60 space-y-1.5 overflow-y-auto">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800">
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{fmtSize(f.size)}</span>
              </span>
              <button onClick={() => remove(i)} disabled={disabled} className="-mr-1 rounded p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400" aria-label={`Remove ${f.name}`}><X size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
