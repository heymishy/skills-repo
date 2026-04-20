'use strict';

/**
 * Parse git rev-list --count output to an integer.
 * @param {string} output - stdout from `git rev-list --count <range>`
 * @returns {number}
 */
function getCommitCount(output) {
  return parseInt(String(output).trim(), 10);
}

/**
 * Assert that a distribution command produced zero new commits.
 * @param {string} command  - The command name (init, fetch, pin, verify)
 * @param {number} before   - Commit count before running the command
 * @param {number} after    - Commit count after running the command
 * @returns {null|Error}    - null if no new commits, Error if count increased
 */
function assertZeroCommits(command, before, after) {
  if (after > before) {
    return new Error(
      `Distribution command generated unexpected commit(s): ` +
      `"${command}" added ${after - before} commit(s) (before: ${before}, after: ${after}). ` +
      `Distribution commands must be zero-commit operations.`
    );
  }
  return null;
}

/**
 * Registry of all distribution commands with their metadata.
 * @returns {Array<{name: string, readOnly: boolean}>}
 */
function getCommandRegistry() {
  return [
    { name: 'init',   readOnly: false },
    { name: 'fetch',  readOnly: false },
    { name: 'pin',    readOnly: false },
    { name: 'verify', readOnly: true  },
  ];
}

/**
 * Assert that a git status output indicates a clean working tree (no changes).
 * Primarily used for commands classified as read-only.
 * @param {string} statusOutput - stdout from `git status --porcelain`
 * @returns {null|Error}
 */
function assertReadOnly(statusOutput) {
  const trimmed = String(statusOutput || '').trim();
  if (trimmed.length > 0) {
    return new Error(
      `Read-only command produced file system changes (git status: ${trimmed.substring(0, 80)})`
    );
  }
  return null;
}

module.exports = { getCommitCount, assertZeroCommits, getCommandRegistry, assertReadOnly };
