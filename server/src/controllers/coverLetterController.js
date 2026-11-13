const { writeCoverLetter } = require('../services/analysisService');
const { findOwned, resolveRubric } = require('./analysisController');
const { AppError, asyncHandler } = require('../utils/AppError');

const TONES = ['professional', 'enthusiastic', 'concise', 'creative'];

// POST /api/analyses/:id/cover-letter  { jobDescription?, companySlug?, companyName?, role?, tone? }
exports.generate = asyncHandler(async (req, res) => {
  const { jobDescription, companySlug, companyName, role = '', tone = 'professional' } = req.body || {};
  if (!TONES.includes(tone)) throw new AppError(`tone must be one of: ${TONES.join(', ')}`, 400);
  if ((jobDescription || '').length > 8000) throw new AppError('Job description too long (max 8000 characters)', 400);

  const analysis = await findOwned(req.params.id, req.user.id);
  const slug = companySlug || analysis.company?.slug;
  const rubric = await resolveRubric(slug);

  const jd = jobDescription?.trim() || analysis.jobDescription || '';
  const company = companyName?.trim() || rubric?.name || analysis.company?.name || '';
  if (!jd && !company) throw new AppError('Provide a job description or a company name', 400);

  const letter = await writeCoverLetter({
    resumeText: analysis.resumeText,
    jobDescription: jd,
    companyName: company,
    role: role || analysis.targetRole,
    tone,
    rubric,
    candidateName: analysis.result.candidateName !== 'Unknown' ? analysis.result.candidateName : '',
  });

  analysis.coverLetters.push({ company, tone, jobDescription: jd, text: letter.text, highlightsUsed: letter.highlightsUsed });
  await analysis.save();

  res.json({ letter });
});
