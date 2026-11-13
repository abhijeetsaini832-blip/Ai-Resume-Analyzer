/** Operational error carrying an HTTP status. Thrown by controllers/services. */
class AppError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.isOperational = true;
  }
}

/** Wraps async route handlers so rejections reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { AppError, asyncHandler };
