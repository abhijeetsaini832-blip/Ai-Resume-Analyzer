const multer = require('multer');
const { MAX_FILE_MB } = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err instanceof multer.MulterError) {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = `File too large (max ${MAX_FILE_MB}MB)`;
    else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Too many files uploaded';
  } else if (err.name === 'ValidationError') {
    status = 400;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Resource already exists';
  }

  if (status >= 500) console.error(err);
  // Never leak internals for unexpected errors in production
  if (status >= 500 && !err.isOperational && process.env.NODE_ENV === 'production') message = 'Internal server error';

  res.status(status).json({ error: message, ...(err.details ? { details: err.details } : {}) });
}

module.exports = { notFound, errorHandler };
