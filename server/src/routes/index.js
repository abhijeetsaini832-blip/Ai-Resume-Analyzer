const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { uploadSingle, uploadBatch } = require('../middleware/upload');

const auth = require('../controllers/authController');
const companies = require('../controllers/companyController');
const analyses = require('../controllers/analysisController');
const recruiter = require('../controllers/recruiterController');
const chat = require('../controllers/chatController');
const rewrite = require('../controllers/rewriteController');
const coverLetter = require('../controllers/coverLetterController');

const router = express.Router();

// AI endpoints cost money — limit them per user/IP more tightly than the global limiter.
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many AI requests, slow down.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts, try again later.' } });

router.get('/health', (_req, res) => res.json({ ok: true }));

// --- Auth ---
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);

// --- Company rubrics ---
router.get('/companies', protect, companies.list);
router.get('/companies/:slug', protect, companies.get);

// --- Candidate analyses ---
router.post('/analyses', protect, aiLimiter, uploadSingle, analyses.create);
router.get('/analyses', protect, analyses.list);
router.get('/analyses/:id', protect, analyses.get);
router.delete('/analyses/:id', protect, analyses.remove);

// --- Per-analysis AI features ---
router.post('/analyses/:id/chat', protect, aiLimiter, chat.send);
router.get('/analyses/:id/chat', protect, chat.history);
router.delete('/analyses/:id/chat', protect, chat.clear);
router.post('/analyses/:id/rewrite', protect, aiLimiter, rewrite.rewrite); // legacy path
router.post('/rewrite-bullet', protect, aiLimiter, rewrite.rewriteBullet);   // One-click AI bullet rewriter (STAR)
router.post('/analyses/:id/cover-letter', protect, aiLimiter, coverLetter.generate);

// --- Recruiter batches ---
router.post('/recruiter/batches', protect, aiLimiter, uploadBatch, recruiter.createBatch);
router.get('/recruiter/batches', protect, recruiter.listBatches);
router.get('/recruiter/batches/:batchId', protect, recruiter.getBatch);

module.exports = router;
