/**
 * Candidate-mode analysis: upload PDF → extract → AI analysis → persist.
 */
const Analysis = require('../models/Analysis');
const CompanyRubric = require('../models/CompanyRubric');
const { extractResumeText } = require('../services/pdfService');
const { analyzeCandidate } = require('../services/analysisService');
const { AppError, asyncHandler } = require('../utils/AppError');

const MAX_JD_CHARS = 8000;

/** Load an analysis owned by the current user or 404 (prevents IDOR). */
async function findOwned(id, userId) {
  const doc = await Analysis.findOne({ _id: id, user: userId });
  if (!doc) throw new AppError('Analysis not found', 404);
  return doc;
}

/** Shared by candidate + recruiter flows. */
async function resolveRubric(slug) {
  if (!slug) return null;
  const rubric = await CompanyRubric.findOne({ slug, active: true }).lean();
  if (!rubric) throw new AppError(`Unknown company "${slug}"`, 400);
  return rubric;
}

exports.findOwned = findOwned;
exports.resolveRubric = resolveRubric;

// POST /api/analyses  (multipart: resume, jobDescription?, targetRole?, companySlug?, location?)
exports.create = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload a PDF resume (field name "resume")', 400);

  const { jobDescription = '', targetRole = '', companySlug = '', location = '' } = req.body;
  if (jobDescription.length > MAX_JD_CHARS) throw new AppError(`Job description too long (max ${MAX_JD_CHARS} characters)`, 400);

  const rubric = await resolveRubric(companySlug);
  const parsed = await extractResumeText(req.file.buffer, req.file.originalname);

  const result = await analyzeCandidate({
    resumeText: parsed.text,
    jobDescription,
    targetRole,
    location,
    rubric,
  });

  const doc = await Analysis.create({
    user: req.user.id,
    mode: 'candidate',
    fileName: req.file.originalname,
    resumeText: parsed.text,
    jobDescription,
    targetRole,
    location,
    company: rubric ? { slug: rubric.slug, name: rubric.name } : undefined,
    result: { ...result, parseStats: parsed.stats, pages: parsed.pages },
  });

  res.status(201).json({ analysis: toDTO(doc) });
});

// GET /api/analyses?mode=candidate
exports.list = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (['candidate', 'recruiter'].includes(req.query.mode)) filter.mode = req.query.mode;
  const items = await Analysis.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .select('fileName mode company createdAt result.candidateName result.overallScore result.matchScore')
    .lean();
  res.json({ analyses: items });
});

// GET /api/analyses/:id
exports.get = asyncHandler(async (req, res) => {
  res.json({ analysis: toDTO(await findOwned(req.params.id, req.user.id)) });
});

// DELETE /api/analyses/:id  (privacy: users can erase their data)
exports.remove = asyncHandler(async (req, res) => {
  const doc = await findOwned(req.params.id, req.user.id);
  await doc.deleteOne();
  res.status(204).end();
});

/** Shape returned to the client (omits raw resume text) */
function toDTO(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const { resumeText, ...rest } = o;
  return { ...rest, resumeChars: resumeText?.length || 0 };
}
exports.toDTO = toDTO;
