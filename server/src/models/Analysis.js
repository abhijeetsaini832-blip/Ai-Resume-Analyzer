const mongoose = require('mongoose');
const { RETENTION_DAYS } = require('../config/env');

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const rewriteSchema = new mongoose.Schema(
  {
    weakPointId: String,
    original: String,
    rewritten: String,
    star: { situation: String, task: String, action: String, result: String },
    metricPlaceholders: [{ placeholder: String, whatToFill: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const coverLetterSchema = new mongoose.Schema(
  {
    company: String,
    tone: String,
    jobDescription: String,
    text: String,
    highlightsUsed: [String],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * One document per analysed resume.
 * - Candidate mode: one doc per upload.
 * - Recruiter mode: one doc per resume, grouped by `batchId` and ranked.
 * `result` holds the AI JSON (see schemas/index.js) — kept as Mixed so the
 * schema can evolve without migrations.
 */
const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
    batchId: { type: String, index: true },
    rank: Number,

    fileName: String,
    resumeText: { type: String, required: true }, // cleaned text (PII — see expiresAt)
    jobDescription: String,
    targetRole: String,
    location: String,
    company: { slug: String, name: String },

    result: { type: mongoose.Schema.Types.Mixed, required: true },

    chat: [chatMessageSchema],
    rewrites: [rewriteSchema],
    coverLetters: [coverLetterSchema],

    // TTL: Mongo deletes the document at this time (resume text is personal data)
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true }
);

analysisSchema.pre('validate', function (next) {
  if (!this.expiresAt && RETENTION_DAYS > 0) {
    this.expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Analysis', analysisSchema);
