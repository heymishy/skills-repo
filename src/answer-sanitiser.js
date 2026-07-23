'use strict';

// Shell metacharacters to strip per NFR3 test assertion
const META_CHARS = /[;&|`$!><\\]/g;
// HTML/script injection
const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
const TAG_PATTERN = /<[^>]+>/g;
// CLI flags (-- and - prefixed). A flag only ever begins at a token
// boundary (start of string, or preceded by whitespace/punctuation that is
// not itself a word character or hyphen) -- never in the middle of an
// ordinary hyphenated compound word/identifier. Without the negative
// lookbehind below, a plain-English message like "call it
// Project-Codename-Falcon-detail-1784829153994-51525: an internal tool..."
// had its entire "-Codename-Falcon-detail-1784829153994-51525" span silently
// deleted -- every character in it (letters, digits, hyphens) is valid
// inside the trailing [\w-]* body, so the regex happily matched starting
// right after "Project" and consumed everything up to the colon. See
// artefacts/2026-07-24-chat-message-text-truncation-fix/decisions.md.
const CLI_FLAG = /(?<![\w-])--?[a-z][\w-]*/gi;

/**
 * sanitiseAnswer(raw) -> string
 *
 * Returns a cleaned version of the input safe for forwarding to the execution engine.
 * Rules:
 * 1. Strip <script> blocks and all HTML tags
 * 2. Strip shell metacharacters (; & | ` $ ! > < \)
 * 3. Strip CLI flag patterns (--flag)
 * 4. Trim whitespace
 */
function sanitiseAnswer(raw) {
  if (typeof raw !== 'string') { return ''; }
  let clean = raw;
  clean = clean.replace(SCRIPT_TAG, '');
  clean = clean.replace(TAG_PATTERN, '');
  clean = clean.replace(CLI_FLAG, '');
  clean = clean.replace(META_CHARS, '');
  clean = clean.trim();
  return clean;
}

module.exports = { sanitiseAnswer };
