'use strict';

// Shell metacharacters to strip per NFR3 test assertion
const META_CHARS = /[;&|`$!><\\]/g;
// HTML/script injection
const SCRIPT_TAG = /<script[\s\S]*?<\/script>/gi;
const TAG_PATTERN = /<[^>]+>/g;
// CLI flags (-- and - prefixed)
const CLI_FLAG = /--?[a-z][\w-]*/gi;

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
