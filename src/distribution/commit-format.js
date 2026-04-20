'use strict';

/**
 * Validate a commit message against a configured regex pattern.
 * The regex is sourced from config (e.g. context.yml distribution.commit_format_regex),
 * never from process.argv or process.env.
 *
 * @param {object} options
 * @param {string|null} options.regex   - The regex pattern string, or null to skip validation
 * @param {string} options.sha          - Full or partial commit SHA
 * @param {string} options.message      - The commit message to validate
 * @returns {null|Error}                - null if valid (or regex absent), Error otherwise
 */
function validateCommitFormat({ regex, sha, message }) {
  // AC2: absent / null regex → skip validation
  if (regex === null || regex === undefined) {
    return null;
  }

  // AC4: invalid regex → named error identifying config location
  let pattern;
  try {
    pattern = new RegExp(regex);
  } catch (_syntaxErr) {
    return new Error(
      `Invalid regular expression in distribution.commit_format_regex (context.yml): ` +
      `"${regex}" is not a valid regex pattern. Fix the pattern in .github/context.yml.`
    );
  }

  // AC3: matching commit → pass
  if (pattern.test(message)) {
    return null;
  }

  // AC1: non-matching commit → error with SHA prefix, excerpt, and regex string
  const shaPrefix = String(sha).substring(0, 8);
  const excerpt = String(message).substring(0, 72);
  return new Error(
    `Commit ${shaPrefix} does not match distribution.commit_format_regex. ` +
    `Message: "${excerpt}". ` +
    `Required pattern: ${regex}`
  );
}

module.exports = { validateCommitFormat };
