const mongoose = require('mongoose');

/**
 * Hiring rubric for a target company / company archetype.
 * Injected into the analysis prompt so culture-fit scoring is rubric-driven
 * instead of the model free-associating about a brand.
 * Rubrics are editable data — keep them current via the seed file or an admin UI.
 */
const valueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    // What evidence on a resume demonstrates this value
    resumeSignals: [String],
  },
  { _id: false }
);

const companyRubricSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['big-tech', 'product', 'service'], required: true },
    tagline: String,
    values: [valueSchema],
    hiringStyle: { type: String, required: true }, // how candidates are evaluated
    resumeTips: [String],
    sourceNote: String, // provenance / disclaimer shown in UI
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyRubric', companyRubricSchema);
