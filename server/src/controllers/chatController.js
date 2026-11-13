/**
 * "Chat with your resume".
 * A single resume fits comfortably in the context window, so we use full-context
 * chat (the whole resume is the "retrieved" context) instead of a vector store.
 * The resume block is marked cacheable so follow-up turns are cheaper/faster.
 * If you later support long documents (portfolios, many resumes at once),
 * swap this for chunk + embed + top-k retrieval behind the same endpoint.
 */
const { chatText } = require('../services/aiService');
const prompts = require('../prompts');
const { findOwned } = require('./analysisController');
const { AppError, asyncHandler } = require('../utils/AppError');

const MAX_MESSAGE_CHARS = 2000;
const HISTORY_TURNS = 12; // messages sent back to the model

// POST /api/analyses/:id/chat  { message }
exports.send = asyncHandler(async (req, res) => {
  const message = (req.body?.message || '').trim();
  if (!message) throw new AppError('Message is required', 400);
  if (message.length > MAX_MESSAGE_CHARS) throw new AppError(`Message too long (max ${MAX_MESSAGE_CHARS} characters)`, 400);

  const analysis = await findOwned(req.params.id, req.user.id);

  let history = analysis.chat.slice(-HISTORY_TURNS).map((m) => ({ role: m.role, content: m.content }));
  while (history.length && history[0].role !== 'user') history.shift(); // API requires first turn = user

  const reply = await chatText({
    system: prompts.chat.buildSystem({
      resumeText: analysis.resumeText,
      mode: analysis.mode,
      jobDescription: analysis.jobDescription,
    }),
    messages: [...history, { role: 'user', content: message }],
  });

  analysis.chat.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
  await analysis.save();

  res.json({ reply });
});

// GET /api/analyses/:id/chat
exports.history = asyncHandler(async (req, res) => {
  const analysis = await findOwned(req.params.id, req.user.id);
  res.json({ messages: analysis.chat });
});

// DELETE /api/analyses/:id/chat
exports.clear = asyncHandler(async (req, res) => {
  const analysis = await findOwned(req.params.id, req.user.id);
  analysis.chat = [];
  await analysis.save();
  res.status(204).end();
});
