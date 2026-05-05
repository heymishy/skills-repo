'use strict';

/**
 * extractQuestions(content) -> Array<{ id: string, text: string }>
 *
 * Parses question blocks from SKILL.md content.
 * A question block is identified as a line matching:
 *   > **<question text>**
 * The extracted text strips the `>`, `**` markers, and any trailing `Reply:` lines.
 *
 * Returns questions in document order with stable IDs q1, q2, q3, ...
 */
function extractQuestions(content) {
  if (typeof content !== 'string') { return []; }
  const questions = [];
  // Match lines like: > **What is the core problem...**
  const pattern = /^>\s+\*\*(.+?)\*\*/gm;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const text = match[1].trim();
    // Skip short decorative bold lines (less than 20 chars)
    if (text.length < 20) { continue; }
    // Skip step instructions (they are labels, not questions — they end with ':')
    if (text.endsWith(':')) { continue; }
    questions.push({ id: 'q' + (questions.length + 1), text });
  }
  return questions;
}

/**
 * extractSections(content) -> Array<{ heading: string, questions: Array<{id, text}> }>
 *
 * Splits SKILL.md content into sections keyed by H2 headings (## ...).
 * Questions that appear before the first H2 heading land in a section with heading ''.
 * Returns sections in document order; each section's questions are the subset
 * of extractQuestions results that fall under that H2 heading.
 *
 * Invariant: the flat union of all section.questions equals extractQuestions(content).
 */
function extractSections(content) {
  if (typeof content !== 'string') { return [{ heading: '', questions: [] }]; }
  const lines = content.split('\n');
  // Build list of { heading, startLine } where startLine is 0-based index AFTER the ## line.
  // Index 0 always exists as the pre-H2 bucket (heading '').
  const sectionBoundaries = [{ heading: '', start: 0 }];
  lines.forEach(function(line, idx) {
    var m = line.match(/^##\s+(.+)/);
    if (m) {
      sectionBoundaries.push({ heading: m[1].trim(), start: idx + 1 });
    }
  });

  // For each section, collect the content slice and extract questions from it.
  // We add a sentinel boundary at the end to simplify slicing.
  sectionBoundaries.push({ heading: null, start: lines.length });

  var sections = [];
  for (var i = 0; i < sectionBoundaries.length - 1; i++) {
    var boundary = sectionBoundaries[i];
    var nextStart = sectionBoundaries[i + 1].start;
    // Adjust the slice start: for the pre-H2 bucket the start is 0; for real H2 sections
    // the ## line itself is at (start - 1) and we want lines from `start` onward.
    var slice = lines.slice(boundary.start, nextStart).join('\n');
    var questions = extractQuestions(slice);
    sections.push({ heading: boundary.heading, questions: questions });
  }

  // If no questions at all live before the first H2, and there are real H2 sections,
  // drop the empty pre-H2 bucket — but only if it truly has 0 questions.
  // If there ARE questions before the first H2, keep the empty-heading section.
  if (sections.length > 1 && sections[0].heading === '' && sections[0].questions.length === 0) {
    sections = sections.slice(1);
  }

  // Re-assign stable IDs across all sections so the union matches extractQuestions(content).
  var counter = 1;
  sections.forEach(function(sec) {
    sec.questions.forEach(function(q) {
      q.id = 'q' + counter++;
    });
  });

  return sections;
}

module.exports = { extractQuestions, extractSections };
