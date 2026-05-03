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
    questions.push({ id: 'q' + (questions.length + 1), text });
  }
  return questions;
}

module.exports = { extractQuestions };
