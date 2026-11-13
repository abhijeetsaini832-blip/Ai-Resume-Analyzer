const CompanyRubric = require('../models/CompanyRubric');
const { AppError, asyncHandler } = require('../utils/AppError');

exports.list = asyncHandler(async (_req, res) => {
  const companies = await CompanyRubric.find({ active: true }).sort({ category: 1, name: 1 }).lean();
  res.json({ companies });
});

exports.get = asyncHandler(async (req, res) => {
  const company = await CompanyRubric.findOne({ slug: req.params.slug, active: true }).lean();
  if (!company) throw new AppError('Company not found', 404);
  res.json({ company });
});
