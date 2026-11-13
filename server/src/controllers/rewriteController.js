const { rewriteBullet } = require('../services/analysisService');
const { findOwned } = require('./analysisController');
const { AppError, asyncHandler } = require('../utils/AppError');

/** Shared implementation for both routes. */
async function doRewrite(res, userId, analysisId, weakPointId, instructions = '') {
  if (typeof instructions !== 'string' || instructions.length > 500) throw new AppError('Instructions too long (max 500 characters)', 400);
  if (!analysisId || !weakPointId) throw new AppError('analysisId and weakPointId are required', 400);

  const analysis = await findOwned(analysisId, userId); // {_id, user} lookup => IDOR-safe
  // The bullet text comes from the stored analysis, not the client, so users can't
  // use this endpoint as a free general-purpose LLM proxy.
  const wp = (analysis.result.weakPoints || []).find((w) => w.id === weakPointId);
  if (!wp) throw new AppError('Weak point not found in this analysis', 404);

  const out = await rewriteBullet({
    original: wp.original,
    section: wp.section,
    issue: wp.issue,
    resumeText: analysis.resumeText,
    jobDescription: analysis.jobDescription,
    instructions,
  });

  analysis.rewrites.push({ weakPointId, original: wp.original, ...out });
  await analysis.save();

  res.json({ weakPointId, original: wp.original, ...out });
}

// POST /api/rewrite-bullet  { analysisId, weakPointId, instructions? }   — "Fix with AI" (STAR rewrite)
exports.rewriteBullet = asyncHandler(async (req, res) => {
  const { analysisId, weakPointId, instructions } = req.body || {};
  await doRewrite(res, req.user.id, analysisId, weakPointId, instructions);
});

// POST /api/analyses/:id/rewrite  { weakPointId, instructions? }   — kept for backwards compatibility
exports.rewrite = asyncHandler(async (req, res) => {
  const { weakPointId, instructions } = req.body || {};
  await doRewrite(res, req.user.id, req.params.id, weakPointId, instructions);
});
