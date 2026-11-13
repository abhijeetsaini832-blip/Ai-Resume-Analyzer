/**
 * Recruiter mode: batch-screen many resumes against ONE job description,
 * then rank them. Each resume is stored as its own Analysis (grouped by batchId)
 * so recruiters can open any candidate and chat with that resume.
 *
 * NOTE for scale: this runs synchronously with bounded concurrency, which is
 * fine for ~20 resumes. For hundreds, move to a job queue (BullMQ/SQS) and poll
 * GET /batches/:batchId for progress.
 */
const crypto = require('crypto');
const Analysis = require('../models/Analysis');
const { extractResumeText } = require('../services/pdfService');
const { screenCandidate } = require('../services/analysisService');
const { mapLimit } = require('../utils/pool');
const { BATCH_CONCURRENCY } = require('../config/env');
const { AppError, asyncHandler } = require('../utils/AppError');

const MAX_JD_CHARS = 8000;
const REC_ORDER = { strong_yes: 0, yes: 1, maybe: 2, no: 3 };

const radarAvg = (r = {}) => {
  const v = Object.values(r);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

/** Sort: matchScore desc, then radar average desc, then recommendation. */
function rankDocs(docs) {
  return [...docs].sort(
    (a, b) =>
      b.result.matchScore - a.result.matchScore ||
      radarAvg(b.result.radar) - radarAvg(a.result.radar) ||
      (REC_ORDER[a.result.recommendation] ?? 4) - (REC_ORDER[b.result.recommendation] ?? 4)
  );
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
/** Best-effort contact email pulled from the resume text (used to pre-fill interview invites). */
const findEmail = (text = '') => (text.match(EMAIL_RE) || [''])[0];

const summary = (d) => ({
  id: d._id,
  rank: d.rank,
  fileName: d.fileName,
  email: findEmail(d.resumeText),
  candidateName: d.result.candidateName,
  headline: d.result.headline,
  matchScore: d.result.matchScore,
  radar: d.result.radar,
  seniority: d.result.seniority,
  recommendation: d.result.recommendation,
  summary: d.result.summary,
  pros: d.result.pros,
  cons: d.result.cons,
  matchedSkills: d.result.matchedSkills,
  missingSkills: d.result.missingSkills,
  redFlags: d.result.redFlags,
  suggestedInterviewQuestions: d.result.suggestedInterviewQuestions || [],
});

// POST /api/recruiter/batches  (multipart: resumes[], jobDescription, targetRole?)
exports.createBatch = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const { jobDescription = '', targetRole = '' } = req.body;

  if (!files.length) throw new AppError('Upload at least one PDF (field name "resumes")', 400);
  if (jobDescription.trim().length < 30) throw new AppError('Provide a job description (min 30 characters) to rank against', 400);
  if (jobDescription.length > MAX_JD_CHARS) throw new AppError(`Job description too long (max ${MAX_JD_CHARS} characters)`, 400);

  const batchId = crypto.randomUUID();

  const outcomes = await mapLimit(files, BATCH_CONCURRENCY, async (file) => {
    try {
      const parsed = await extractResumeText(file.buffer, file.originalname);
      const result = await screenCandidate({ resumeText: parsed.text, jobDescription, targetRole });
      const doc = await Analysis.create({
        user: req.user.id,
        mode: 'recruiter',
        batchId,
        fileName: file.originalname,
        resumeText: parsed.text,
        jobDescription,
        targetRole,
        result: { ...result, parseStats: parsed.stats },
      });
      return { ok: true, doc };
    } catch (err) {
      return { ok: false, fileName: file.originalname, error: err.message };
    }
  });

  const ranked = rankDocs(outcomes.filter((o) => o.ok).map((o) => o.doc));
  await Promise.all(ranked.map((d, i) => { d.rank = i + 1; return Analysis.updateOne({ _id: d._id }, { rank: i + 1 }); }));

  res.status(201).json({
    batchId,
    targetRole,
    candidates: ranked.map(summary),
    failed: outcomes.filter((o) => !o.ok).map(({ fileName, error }) => ({ fileName, error })),
  });
});

// GET /api/recruiter/batches/:batchId
exports.getBatch = asyncHandler(async (req, res) => {
  const docs = await Analysis.find({ user: req.user.id, batchId: req.params.batchId, mode: 'recruiter' }).sort({ rank: 1 });
  if (!docs.length) throw new AppError('Batch not found', 404);
  res.json({ batchId: req.params.batchId, jobDescription: docs[0].jobDescription, targetRole: docs[0].targetRole, candidates: docs.map(summary) });
});

// GET /api/recruiter/batches  (recent batches)
exports.listBatches = asyncHandler(async (req, res) => {
  const batches = await Analysis.aggregate([
    { $match: { user: new (require('mongoose').Types.ObjectId)(req.user.id), mode: 'recruiter' } },
    { $group: { _id: '$batchId', count: { $sum: 1 }, createdAt: { $max: '$createdAt' }, targetRole: { $first: '$targetRole' } } },
    { $sort: { createdAt: -1 } },
    { $limit: 20 },
  ]);
  res.json({ batches: batches.map((b) => ({ batchId: b._id, count: b.count, createdAt: b.createdAt, targetRole: b.targetRole })) });
});
