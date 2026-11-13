/**
 * Orchestrates prompt → AI → normalisation for each feature.
 * Normalisation matters: never trust model output blindly (clamp numbers,
 * add IDs, recompute derived values deterministically).
 */
const crypto = require('crypto');
const { generateJSON } = require('./aiService');
const prompts = require('../prompts');
const schemas = require('../schemas');

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const RADAR_KEYS = ['technicalSkills', 'toolProficiency', 'experience', 'softSkills', 'cultureFit'];
// Weights for the deterministic overall score
const RADAR_WEIGHTS = { technicalSkills: 0.3, toolProficiency: 0.15, experience: 0.25, softSkills: 0.1, cultureFit: 0.2 };

function normalizeRadar(radar = {}) {
  return Object.fromEntries(RADAR_KEYS.map((k) => [k, clamp(radar[k])]));
}

function normalizeSeniority(s = {}) {
  const level = ['Junior', 'Mid-level', 'Senior'].includes(s.level) ? s.level : 'Junior';
  return { ...s, level, confidence: clamp(s.confidence), yearsOfExperience: Math.max(0, Number(s.yearsOfExperience) || 0) };
}

/** Full candidate analysis */
async function analyzeCandidate({ resumeText, jobDescription, targetRole, location, rubric }) {
  const raw = await generateJSON({
    system: prompts.analysis.system,
    user: prompts.analysis.buildUser({ resumeText, jobDescription, targetRole, location, rubric }),
    schema: schemas.ANALYSIS_SCHEMA,
    toolName: prompts.analysis.toolName,
    toolDescription: prompts.analysis.toolDescription,
    maxTokens: 8000,
  });

  const radar = normalizeRadar(raw.radar);
  // Deterministic overall score so it is consistent with the radar chart
  const weighted = RADAR_KEYS.reduce((sum, k) => sum + radar[k] * RADAR_WEIGHTS[k], 0);
  const overallScore = clamp(weighted * 0.6 + clamp(raw.matchScore) * 0.4);

  const min = Number(raw.salary?.min) || 0;
  const max = Number(raw.salary?.max) || 0;

  return {
    ...raw,
    radar,
    overallScore,
    matchScore: clamp(raw.matchScore),
    atsScore: clamp(raw.atsScore),
    seniority: normalizeSeniority(raw.seniority),
    salary: { ...raw.salary, min: Math.min(min, max), max: Math.max(min, max) },
    weakPoints: (raw.weakPoints || [])
      .map((w) => ({ ...w, id: crypto.randomUUID() }))
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)),
    culture: {
      ...raw.culture,
      principles: (raw.culture?.principles || []).map((p) => ({ ...p, score: clamp(p.score) })),
    },
    skillGaps: raw.skillGaps || [],
    strengths: raw.strengths || [],
    matchedSkills: raw.matchedSkills || [],
  };
}

/** Lean recruiter screening of one resume */
async function screenCandidate({ resumeText, jobDescription, targetRole }) {
  const raw = await generateJSON({
    system: prompts.screening.system,
    user: prompts.screening.buildUser({ resumeText, jobDescription, targetRole }),
    schema: schemas.SCREENING_SCHEMA,
    toolName: prompts.screening.toolName,
    toolDescription: prompts.screening.toolDescription,
    maxTokens: 3000,
  });
  return {
    ...raw,
    radar: normalizeRadar(raw.radar),
    matchScore: clamp(raw.matchScore),
    seniority: normalizeSeniority(raw.seniority),
    pros: raw.pros || [],
    cons: raw.cons || [],
    redFlags: raw.redFlags || [],
  };
}

async function rewriteBullet(args) {
  return generateJSON({
    system: prompts.rewrite.system,
    user: prompts.rewrite.buildUser(args),
    schema: schemas.REWRITE_SCHEMA,
    toolName: prompts.rewrite.toolName,
    toolDescription: prompts.rewrite.toolDescription,
    maxTokens: 1500,
  });
}

async function writeCoverLetter(args) {
  const raw = await generateJSON({
    system: prompts.coverLetter.system,
    user: prompts.coverLetter.buildUser(args),
    schema: schemas.COVER_LETTER_SCHEMA,
    toolName: prompts.coverLetter.toolName,
    toolDescription: prompts.coverLetter.toolDescription,
    maxTokens: 2500,
  });
  const text = [raw.greeting, '', ...raw.paragraphs.flatMap((p) => [p, '']), raw.signOff, args.candidateName || '']
    .join('\n')
    .trim();
  return { ...raw, text };
}

module.exports = { analyzeCandidate, screenCandidate, rewriteBullet, writeCoverLetter };
