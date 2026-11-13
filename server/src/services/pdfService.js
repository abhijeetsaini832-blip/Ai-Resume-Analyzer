/**
 * PDF → clean text. Uses pdf-parse (CommonJS require avoids the library's
 * known debug-mode quirk when imported via ESM).
 */
const pdfParse = require('pdf-parse');
const { AppError } = require('../utils/AppError');
const { cleanResumeText } = require('./textCleaner');

const MIN_USEFUL_CHARS = 200;
const PARSE_TIMEOUT_MS = 30000;

/**
 * pdf-parse's bundled (old) pdf.js can reject an *internal* promise that is not connected to the
 * promise we await — e.g. "FormatError: bad XRef entry" on a damaged PDF. On Node 15+ that stray
 * rejection would crash the whole server. We (1) listen for it while a parse is running and turn it
 * into a normal error for THAT file, (2) add a timeout in case the parse never settles, and
 * (3) parse one PDF at a time so a stray rejection can never be blamed on the wrong file.
 */
let queue = Promise.resolve();

function parseGuarded(buffer) {
  const run = () =>
    new Promise((resolve, reject) => {
      let done = false;
      const finish = (fn, val) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        process.off('unhandledRejection', onStray);
        fn(val);
      };
      const onStray = (reason) => finish(reject, reason instanceof Error ? reason : new Error(String(reason)));
      const timer = setTimeout(() => finish(reject, new Error('PDF parsing timed out')), PARSE_TIMEOUT_MS);
      process.on('unhandledRejection', onStray);
      pdfParse(buffer).then((v) => finish(resolve, v), (e) => finish(reject, e));
    });
  const result = queue.then(run, run);
  queue = result.catch(() => {}); // keep the chain alive after failures
  return result;
}

async function extractResumeText(buffer, fileName = 'resume.pdf') {
  // Don't trust the client's mimetype: check the %PDF magic bytes.
  if (!buffer || buffer.slice(0, 5).toString('latin1') !== '%PDF-') {
    throw new AppError(`"${fileName}" is not a valid PDF file`, 400);
  }

  let parsed;
  try {
    parsed = await parseGuarded(buffer);
  } catch (err) {
    console.warn(`PDF parse failed for "${fileName}": ${err.message}`);
    throw new AppError(
      `Could not read "${fileName}" (${err.message}). The PDF may be damaged or password-protected — try re-saving it with "Print → Save as PDF" and upload again.`,
      422
    );
  }

  const cleaned = cleanResumeText(parsed.text);
  if (cleaned.stats.chars < MIN_USEFUL_CHARS) {
    throw new AppError(
      `"${fileName}" contains almost no selectable text. It looks like a scanned/image PDF — upload a text-based PDF (or run OCR first).`,
      422
    );
  }

  return { ...cleaned, pages: parsed.numpages };
}

module.exports = { extractResumeText };
