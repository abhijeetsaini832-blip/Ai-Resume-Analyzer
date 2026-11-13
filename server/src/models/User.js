const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Candidate vs. Recruiter is a UI *mode* (toggle), not a permission level,
 * so one account can use both dashboards.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12);
userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
