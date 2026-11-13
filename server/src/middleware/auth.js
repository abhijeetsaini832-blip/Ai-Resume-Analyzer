const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { AppError } = require('../utils/AppError');

/** Requires `Authorization: Bearer <jwt>`; sets req.user = { id } */
function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Authentication required', 401));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = { protect };
