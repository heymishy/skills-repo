'use strict';

// sign-off-writer.js — SCM adapter for committing artefact sign-offs (ADR-012)
// commitSignOff(artefactPath, signOffPayload, token) — no inline GitHub API calls
// in route handler. Committer identity is always the authenticated user.
// Security constraint: token parameter is the user's OAuth token from session.
// No fallback to server-level env-var write token.

/**
 * Custom error thrown when the GitHub Contents API returns a 409 conflict
 * (the file was updated since the page was loaded).
 */
class SignOffConflictError extends Error {
  constructor(message) {
    super(message || 'Conflict: artefact file has been updated since loaded');
    this.name = 'SignOffConflictError';
  }
}

/**
 * Validate an artefact path to prevent path traversal attacks.
 * Rejects paths containing .., ./, null bytes, or absolute paths.
 *
 * @param {string} artefactPath
 * @returns {boolean} true if path is safe, false if rejected
 */
function validateArtefactPath(artefactPath) {
  if (typeof artefactPath !== 'string' || artefactPath.length === 0) return false;
  // Reject path traversal sequences
  if (artefactPath.includes('..')) return false;
  // Reject relative path openers
  if (artefactPath.includes('./')) return false;
  // Reject absolute paths (Unix or Windows drive letters)
  if (artefactPath.startsWith('/')) return false;
  if (/^[A-Za-z]:/.test(artefactPath)) return false;
  // Reject null bytes
  if (artefactPath.includes('\0')) return false;
  return true;
}

/**
 * Detect an existing sign-off section in artefact markdown.
 *
 * @param {string} markdown - artefact content
 * @returns {{ approver: string, date: string } | null}
 */
function detectExistingSignOff(markdown) {
  const match = markdown.match(/## Approved by\r?\n\r?\n([^\n\r—]+?) — ([^\n\r]+)/);
  if (!match) return null;
  return { approver: match[1].trim(), date: match[2].trim() };
}

/**
 * Build updated artefact markdown with an ## Approved by section appended.
 *
 * @param {string} markdown - original artefact content
 * @param {{ name: string }} user - authenticated GitHub user
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} updated markdown
 */
function buildSignOffPayload(markdown, user, timestamp) {
  const trimmed = markdown.trimEnd();
  return trimmed + '\n\n## Approved by\n\n' + user.name + ' \u2014 ' + timestamp + '\n';
}

/**
 * Commit a sign-off to a GitHub artefact using the authenticated user's token.
 * The commit author and committer are set to the authenticated GitHub user identity
 * obtained by calling /user with the provided token — never a service account.
 *
 * Security constraint: the token parameter MUST come from the user's session
 * (set during OAuth in wuce.1). No server-level write token is used here.
 *
 * @param {string} artefactPath - repository-relative path to artefact file
 * @param {{ content: string, sha: string, approverName?: string }} signOffPayload
 *   content: updated markdown to commit
 *   sha: current file SHA (from prior GET — required by GitHub for update)
 *   approverName: display name for commit message (optional, falls back to user.name)
 * @param {string} token - user's OAuth access token from session
 * @returns {Promise<object>} GitHub Contents API PUT response
 * @throws {SignOffConflictError} if Contents API returns 409
 */
async function commitSignOff(artefactPath, signOffPayload, token) {
  const owner   = process.env.GITHUB_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO_NAME;
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  const authHeaders = {
    Authorization: 'Bearer ' + token,
    Accept:        'application/vnd.github+json'
  };

  // Fetch authenticated user identity for commit author/committer — NEVER service account
  const userRes = await fetch(apiBase + '/user', { headers: authHeaders });
  if (!userRes.ok) {
    throw new Error('Failed to fetch user identity: ' + userRes.status);
  }
  const user = await userRes.json();

  const approverName = signOffPayload.approverName || user.name;
  const fileContent  = Buffer.from(signOffPayload.content, 'utf8').toString('base64');

  const body = JSON.stringify({
    message:   'sign-off: ' + artefactPath + ' approved by ' + approverName,
    content:   fileContent,
    sha:       signOffPayload.sha,
    author:    { name: user.name, email: user.email },
    committer: { name: user.name, email: user.email }
  });

  const putUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;
  const putRes = await fetch(putUrl, {
    method:  'PUT',
    headers: Object.assign({}, authHeaders, { 'Content-Type': 'application/json' }),
    body
  });

  if (putRes.status === 409) {
    throw new SignOffConflictError();
  }

  if (!putRes.ok) {
    throw new Error('Failed to commit sign-off: ' + putRes.status);
  }

  return putRes.json();
}

module.exports = {
  buildSignOffPayload,
  commitSignOff,
  detectExistingSignOff,
  validateArtefactPath,
  SignOffConflictError
};
