/**
 * Multer config: in-memory storage (files are parsed immediately and never
 * written to disk, so there is nothing to clean up and no PII at rest as a file).
 */
const multer = require('multer');
const { MAX_FILE_MB, MAX_BATCH_FILES } = require('../config/env');
const { AppError } = require('../utils/AppError');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const okType = file.mimetype === 'application/pdf';
  const okExt = /\.pdf$/i.test(file.originalname);
  if (okType && okExt) return cb(null, true);
  cb(new AppError('Only PDF files are accepted', 400));
};

const limits = { fileSize: MAX_FILE_MB * 1024 * 1024 };

/** Single resume: field name "resume" */
const uploadSingle = multer({ storage, fileFilter, limits: { ...limits, files: 1 } }).single('resume');

/** Batch of resumes: field name "resumes" */
const uploadBatch = multer({ storage, fileFilter, limits: { ...limits, files: MAX_BATCH_FILES } }).array('resumes', MAX_BATCH_FILES);

module.exports = { uploadSingle, uploadBatch };
