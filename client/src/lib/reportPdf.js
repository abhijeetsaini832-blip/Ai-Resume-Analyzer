import { jsPDF } from 'jspdf';

/**
 * Branded PDF report, generated entirely in the browser with jsPDF
 * (no server round-trip, and the resume text never leaves the user's device again).
 */

const BRAND = [79, 70, 229];
const INK = [30, 41, 59];
const MUTED = [100, 116, 139];
const TRACK = [226, 232, 240];

/** jsPDF's built-in fonts only cover Latin-1: normalise typographic characters, drop the rest. */
export const pdfSafe = (t = '') =>
  String(t ?? '')
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/[•●▪·]/g, '-')
    .replace(/₹/g, 'INR ')
    .replace(/€/g, 'EUR ')
    .replace(/[   ]/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ]/g, '');

const scoreRGB = (n) => (n > 75 ? [16, 185, 129] : n >= 50 ? [245, 158, 11] : [239, 68, 68]);

const money = (n, currency) => {
  const v = Math.round(Number(n) || 0);
  return `${currency || ''} ${v.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')}`.trim();
};

const AXES = [
  ['technicalSkills', 'Technical skills'],
  ['toolProficiency', 'Tool proficiency'],
  ['experience', 'Experience'],
  ['softSkills', 'Soft skills'],
  ['cultureFit', 'Culture fit'],
];

/** analysis = the DTO from the API; rewrites = { [weakPointId]: { rewritten, ... } } (optional) */
export function downloadReport(analysis, rewrites = {}) {
  const r = analysis.result;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const CW = W - M * 2;
  const BOTTOM = H - 46;
  let y = 0;

  const setText = (rgb, size, style = 'normal') => {
    doc.setTextColor(...rgb);
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
  };

  /* ---------- page furniture ---------- */
  const cover = () => {
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, W, 64, 'F');
    // logo mark
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 18, 28, 28, 7, 7, 'F');
    setText(BRAND, 15, 'bold');
    doc.text('IQ', M + 14, 37, { align: 'center' });
    setText([255, 255, 255], 18, 'bold');
    doc.text('ResumeIQ', M + 38, 39);
    setText([224, 231, 255], 10);
    doc.text('AI Resume Analysis Report', W - M, 39, { align: 'right' });
    y = 64 + 28;
  };
  const newPage = () => {
    doc.addPage();
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, W, 8, 'F');
    y = M + 8;
  };
  const ensure = (h) => { if (y + h > BOTTOM) newPage(); };

  /* ---------- text helpers ---------- */
  const para = (text, { size = 10, color = INK, style = 'normal', indent = 0, gap = 0 } = {}) => {
    setText(color, size, style);
    const lh = size * 1.45;
    doc.splitTextToSize(pdfSafe(text), CW - indent).forEach((line) => {
      ensure(lh);
      doc.text(line, M + indent, y + size);
      y += lh;
    });
    y += gap;
  };

  const heading = (title) => {
    ensure(40);
    y += 8;
    setText(BRAND, 12.5, 'bold');
    doc.text(pdfSafe(title), M, y + 12);
    doc.setDrawColor(...TRACK);
    doc.setLineWidth(1);
    doc.line(M, y + 19, W - M, y + 19);
    y += 30;
  };

  const bullets = (items = []) => {
    items.forEach((it) => {
      const lines = doc.splitTextToSize(pdfSafe(it), CW - 14);
      setText(INK, 10);
      lines.forEach((line, i) => {
        ensure(14.5);
        if (i === 0) { doc.setFillColor(...BRAND); doc.circle(M + 3.5, y + 7, 1.7, 'F'); }
        doc.text(line, M + 14, y + 10);
        y += 14.5;
      });
      y += 2;
    });
    y += 2;
  };

  const chips = (items = [], rgb = [5, 150, 105], bg = [236, 253, 245]) => {
    setText(rgb, 9, 'bold');
    let x = M;
    const h = 18;
    ensure(h + 4);
    items.forEach((it) => {
      const label = pdfSafe(it);
      const w = doc.getTextWidth(label) + 14;
      if (x + w > W - M) { x = M; y += h + 5; ensure(h + 4); }
      doc.setFillColor(...bg);
      doc.roundedRect(x, y, w, h, 5, 5, 'F');
      setText(rgb, 9, 'bold');
      doc.text(label, x + 7, y + 12.3);
      x += w + 6;
    });
    y += h + 10;
  };

  const barRow = (label, value) => {
    ensure(20);
    const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    setText(INK, 10);
    doc.text(pdfSafe(label), M, y + 10);
    const bx = M + 120;
    const bw = CW - 120 - 34;
    doc.setFillColor(...TRACK);
    doc.roundedRect(bx, y + 3, bw, 8, 4, 4, 'F');
    if (v > 0) {
      doc.setFillColor(...scoreRGB(v));
      doc.roundedRect(bx, y + 3, Math.max(8, (bw * v) / 100), 8, 4, 4, 'F');
    }
    setText(scoreRGB(v), 10, 'bold');
    doc.text(String(v), W - M, y + 10, { align: 'right' });
    y += 20;
  };

  /** Circular progress ring built from short line segments. */
  const gauge = (cx, cy, radius, value, label) => {
    const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    doc.setLineWidth(8);
    doc.setDrawColor(...TRACK);
    doc.circle(cx, cy, radius, 'S');
    if (v > 0) {
      doc.setDrawColor(...scoreRGB(v));
      doc.setLineCap('round');
      const sweep = (v / 100) * 359.9;
      const pt = (deg) => [cx + radius * Math.cos(((deg - 90) * Math.PI) / 180), cy + radius * Math.sin(((deg - 90) * Math.PI) / 180)];
      for (let a = 0; a < sweep; a += 4) {
        const [x1, y1] = pt(a);
        const [x2, y2] = pt(Math.min(a + 4, sweep));
        doc.line(x1, y1, x2, y2);
      }
      doc.setLineCap('butt');
    }
    setText(scoreRGB(v), 20, 'bold');
    doc.text(String(v), cx, cy + 7, { align: 'center' });
    setText(MUTED, 9, 'bold');
    doc.text(pdfSafe(label).toUpperCase(), cx, cy + radius + 20, { align: 'center' });
  };

  /* ================= Build the document ================= */
  cover();

  // Title block
  setText(INK, 22, 'bold');
  doc.text(pdfSafe(r.candidateName || 'Candidate'), M, y + 16);
  y += 26;
  if (r.headline) para(r.headline, { size: 11, color: MUTED, gap: 2 });
  const meta = [
    analysis.targetRole && `Target role: ${analysis.targetRole}`,
    analysis.company?.name && `Target company: ${analysis.company.name}`,
    `Generated ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`,
  ].filter(Boolean).join('   |   ');
  para(meta, { size: 9, color: MUTED, gap: 6 });

  // Score gauges
  ensure(130);
  const colW = CW / 3;
  const gy = y + 36;
  gauge(M + colW * 0.5, gy, 32, r.overallScore, 'Overall');
  gauge(M + colW * 1.5, gy, 32, r.matchScore, 'Job match');
  gauge(M + colW * 2.5, gy, 32, r.atsScore, 'ATS readiness');
  y = gy + 32 + 34;

  if (r.summary) { heading('Summary'); para(r.summary, { gap: 4 }); }

  heading('Skill profile');
  AXES.forEach(([k, label]) => barRow(label, r.radar?.[k]));

  if (r.seniority) {
    heading('Seniority & salary estimate');
    para(`${r.seniority.level} - about ${r.seniority.yearsOfExperience} years of relevant experience (${r.seniority.confidence}% confidence)`, { style: 'bold' });
    if (r.seniority.reasoning) para(r.seniority.reasoning, { color: MUTED, gap: 4 });
  }
  if (r.salary) {
    para(`Estimated market salary: ${money(r.salary.min, r.salary.currency)} - ${money(r.salary.max, r.salary.currency)} / ${r.salary.period || 'year'}`, { style: 'bold' });
    if (r.salary.rationale) para(r.salary.rationale, { color: MUTED });
    if (r.salary.caveat) para(r.salary.caveat, { size: 8.5, color: MUTED, style: 'italic', gap: 4 });
  }

  if (r.strengths?.length) { heading('Strengths'); bullets(r.strengths); }
  if (r.matchedSkills?.length) { heading('Matched skills'); chips(r.matchedSkills); }

  if (r.skillGaps?.length) {
    heading('Skill gaps');
    r.skillGaps.forEach((g) => {
      para(`${g.skill}  [${String(g.importance || '').toUpperCase()}]`, { style: 'bold', size: 10 });
      para(g.suggestion, { color: MUTED, size: 9.5, gap: 5 });
    });
  }

  if (analysis.company?.name && r.culture?.principles?.length) {
    heading(`${analysis.company.name} culture alignment`);
    if (r.culture.summary) para(r.culture.summary, { gap: 6 });
    [...r.culture.principles].sort((a, b) => b.score - a.score).forEach((p) => {
      barRow(p.name, p.score);
      if (p.gap) para(`To strengthen: ${p.gap}`, { size: 9, color: MUTED, indent: 0, gap: 4 });
    });
  }

  if (r.weakPoints?.length) {
    heading('Weak bullet points & AI rewrites');
    r.weakPoints.forEach((w) => {
      para(`[${String(w.severity || '').toUpperCase()}] ${w.section || ''}`.trim(), { size: 8.5, color: MUTED, style: 'bold' });
      para(`Original: ${w.original}`, { size: 9.5 });
      if (w.issue) para(`Issue: ${w.issue}`, { size: 9, color: MUTED });
      const fix = rewrites[w.id];
      if (fix?.rewritten) para(`Rewrite (STAR): ${fix.rewritten}`, { size: 9.5, color: [4, 120, 87], style: 'bold' });
      y += 6;
    });
    if (!Object.keys(rewrites).length) para('Tip: use "Fix with AI" in the app before exporting to include rewritten bullets here.', { size: 8.5, color: MUTED, style: 'italic' });
  }

  ensure(40);
  y += 8;
  para('This report was generated by AI and is intended as guidance. Salary figures are estimates, not market data. Placeholders such as [X%] in rewrites must be replaced with your real numbers.', { size: 8, color: MUTED, style: 'italic' });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...TRACK);
    doc.setLineWidth(0.7);
    doc.line(M, H - 34, W - M, H - 34);
    setText(MUTED, 8);
    doc.text('ResumeIQ  |  AI Resume Analyzer & Career Coach', M, H - 20);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 20, { align: 'right' });
  }

  const base = pdfSafe(r.candidateName || 'resume').trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'resume';
  doc.save(`ResumeIQ-Report-${base}.pdf`);
}
