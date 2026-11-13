/**
 * Turns raw PDF text into clean, lightly-structured text for the AI engine.
 * Goals: remove noise that wastes tokens, repair PDF line-wrap artefacts,
 * and detect section boundaries so downstream prompts see clear structure.
 */

const MAX_CHARS = 24000; // ~6k tokens; resumes rarely exceed this

const SECTION_HEADINGS = [
  'summary', 'professional summary', 'objective', 'profile',
  'experience', 'work experience', 'professional experience', 'employment history',
  'education', 'academic background',
  'skills', 'technical skills', 'core competencies',
  'projects', 'personal projects', 'academic projects',
  'certifications', 'certificates', 'achievements', 'awards',
  'publications', 'internships', 'volunteering', 'languages',
];

const headingRegex = new RegExp(`^\\s*(${SECTION_HEADINGS.join('|')})\\s*:?\\s*$`, 'i');

function cleanResumeText(raw) {
  let text = (raw || '')
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    // strip control chars except newline/tab
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // common bullet glyphs -> "•"
    .replace(/^[ \t]*[▪■●◦○▶➢➤✓✔·*–-][ \t]+/gm, '• ')
    // de-hyphenate words broken across lines: "develop-\nment" -> "development"
    .replace(/(\w)-\n(\w)/g, '$1$2')
    // page markers
    .replace(/^\s*(page\s*)?\d+\s*(of|\/)\s*\d+\s*$/gim, '')
    // trailing spaces
    .replace(/[ \t]+$/gm, '')
    // collapse 3+ newlines to a single blank line
    .replace(/\n{3,}/g, '\n\n')
    // collapse runs of spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }

  // Detect sections (best-effort; resume layouts vary wildly)
  const sections = {};
  let current = 'header';
  sections[current] = [];
  for (const line of text.split('\n')) {
    const m = line.match(headingRegex);
    if (m) {
      current = m[1].toLowerCase();
      sections[current] = sections[current] || [];
    } else {
      sections[current].push(line);
    }
  }
  const structured = Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join('\n').trim()]).filter(([, v]) => v)
  );

  return {
    text,
    sections: structured,
    stats: {
      chars: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
      sectionsFound: Object.keys(structured).filter((k) => k !== 'header'),
      truncated,
    },
  };
}

module.exports = { cleanResumeText };
