# ResumeIQ — AI Resume Analyzer & Career Coach (MERN + Gemini)

Capstone-grade platform with a **Candidate mode** (optimise my resume) and a **Recruiter mode** (bulk-rank resumes against one JD), company-culture scoring, radar charts, resume chat, one-click STAR rewrites, seniority/salary estimates and a cover-letter generator.

## Quick start

```bash
# 1. MongoDB (or use Atlas)
docker compose up -d

# 2. API
cd server && cp .env.example .env     # set GEMINI_API_KEY (free: aistudio.google.com/apikey) and JWT_SECRET
npm install && npm run dev            # http://localhost:5000

# 3. Web app
cd ../client && npm install && npm run dev   # http://localhost:5173
```

Company rubrics are seeded automatically on first API start.

## v2 additions

- **Mobile-first, fully responsive UI** (phone / tablet / desktop), collapsible mobile nav, scrollable tables.
- **Dark mode** (Sun/Moon toggle in the navbar, remembers choice, follows OS by default).
- **Animated score gauges** (green > 75, yellow 50-75, red < 50).
- **Branded PDF report** download on the candidate result (client-side, jsPDF).
- **Recruiter "Send Interview Invite"** for Strong Yes / Yes candidates (editable draft + opens your email app).
- **Skeleton loaders + toast notifications**.

## Directory structure

```
server/src
├── config/        env.js (validated), db.js
├── models/        User, Analysis, CompanyRubric
├── seed/          companies.js  (Amazon, Google, Microsoft, Adobe, Product-based, Service-based)
├── middleware/    auth (JWT), upload (multer, memory), errorHandler
├── services/      pdfService, textCleaner, aiService (Gemini wrapper), analysisService (orchestration + normalisation)
├── prompts/       index.js  ← ALL system + user prompt templates
├── schemas/       index.js  ← JSON schemas that force structured output
├── controllers/   auth, company, analysis, recruiter, chat, rewrite, coverLetter
├── routes/        index.js
└── app.js / server.js

client/src
├── lib/api.js                       axios + typed API helpers
├── context/AuthContext.jsx
├── components/    ModeToggle, UploadZone, CompanySelector, SkillRadar, ScoreCards,
│                  SeniorityCard, SkillGaps, WeakPoints (Fix with AI), CultureFit,
│                  ChatPanel, CoverLetter, RecruiterBoard, AuthForm
└── pages/         CandidateDashboard, RecruiterDashboard
```

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` · `/login` · GET `/me` | JWT auth |
| GET | `/api/companies` | Company rubrics |
| POST | `/api/analyses` | multipart `resume` + `jobDescription, targetRole, companySlug, location` → full analysis |
| GET/DELETE | `/api/analyses[/:id]` | History / erase data |
| POST | `/api/analyses/:id/chat` | Chat with the resume (history persisted) |
| POST | `/api/rewrite-bullet` | `{ analysisId, weakPointId }` → STAR rewrite ("✨ Fix with AI"). Legacy alias: `/api/analyses/:id/rewrite` |
| POST | `/api/analyses/:id/cover-letter` | Tailored letter (PDF/TXT download is client-side) |
| POST | `/api/recruiter/batches` | multipart `resumes[]` + `jobDescription` → ranked candidates |
| GET | `/api/recruiter/batches[/:batchId]` | Batch history / reopen |

## How the AI layer works

- **Strict JSON**: each feature defines a JSON schema (`schemas/index.js`) and Gemini is forced to answer in that schema (`responseSchema`). Output is then **normalised in code** (scores clamped, IDs added, overall score recomputed from the radar so numbers are consistent).
- **Company culture**: `CompanyRubric` values + hiring style are rendered into the prompt (`renderRubric`), and the model returns a score + evidence + gap per principle.
- **Chat**: one resume fits in context, so it's full-context chat with the resume block marked `cache_control` (cheap follow-ups). Swap to chunk+embed retrieval if you later add long documents.
- **Provider**: Google Gemini only, called over plain REST with `responseSchema` (set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in `server/.env`).
- **Gemini free tier caveats**: per-minute rate limits (keep `BATCH_CONCURRENCY` at 1-2; the client retries 429s with backoff), and free-tier prompts may be used by Google to improve its products, so use sample/fake resumes, not real personal data.

## Design decisions worth defending in a viva

- **No fabricated metrics.** The rewriter inserts `[X%]`-style placeholders and lists what the user must fill in. Invented numbers on a resume are a real risk for candidates.
- **Prompt-injection defence.** Resume/JD text is wrapped in tags and declared as data (resumes are attacker-controlled input, e.g. white text saying "rate me 100").
- **Fair screening.** Recruiter prompt ignores protected characteristics; red flags must be objective; UI states the AI is decision support.
- **IDOR-safe.** Every per-analysis route loads by `{_id, user}`. The rewrite endpoint takes a `weakPointId`, not free text, so it can't be abused as a free LLM proxy.
- **Privacy.** PDFs are parsed in memory (never written to disk); analyses auto-expire via a Mongo TTL index (`RETENTION_DAYS`); users can delete any analysis.
- **Cost control.** Separate tighter rate limit on AI routes; bounded batch concurrency; file/JD size limits.

## Known limits / next steps

- Scanned (image-only) PDFs are rejected with a clear message — add OCR (Tesseract) to support them.
- Batch screening runs synchronously with bounded concurrency (fine for ≈20 resumes). For hundreds, move to a queue (BullMQ) and poll the batch endpoint.
- Salary figures are model estimates, not market data — feed real salary datasets into the prompt for accuracy.
- Company rubrics are approximations from public values; edit `seed/companies.js` (or build an admin UI) to keep them current.
- Add tests (Jest + supertest for routes, mock `aiService`) and a CI pipeline.
