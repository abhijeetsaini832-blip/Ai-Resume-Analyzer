const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { AppError, asyncHandler } = require('../utils/AppError');

const sign = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim()) throw new AppError('Name is required', 400);
  if (!EMAIL_RE.test(email || '')) throw new AppError('A valid email is required', 400);
  if (typeof password !== 'string' || password.length < 8) throw new AppError('Password must be at least 8 characters', 400);

  if (await User.exists({ email: email.toLowerCase() })) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, passwordHash: await User.hashPassword(password) });
  res.status(201).json({ token: sign(user._id), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+passwordHash');
  // Same message for unknown email / wrong password (no account enumeration)
  if (!user || !(await user.verifyPassword(password || ''))) throw new AppError('Invalid email or password', 401);
  res.json({ token: sign(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);
  res.json({ user: publicUser(user) });
});
