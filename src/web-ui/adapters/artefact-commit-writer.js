'use strict';

// artefact-commit-writer.js — das-s1: commit completed-stage artefacts to the
// product's connected repo (dual-write alongside the existing local-disk
// write), so "Resume conversation" survives a redeploy even though the
// hosting container's local disk does not.
//
// Generalises sign-off-writer.js's commitSignOff GitHub Contents API PUT
// mechanics (real user identity as commit author -- never a service account,
// base64 content encoding, `sha` handling for updates, 409 conflict
// handling, fail-closed when owner/repo are missing) for a second use case:
// committing an artefact at stage-completion time, rather than a sign-off
// appended to one.
//
// D37 (CLAUDE.md, mandatory): a proper injectable adapter --
// setArtefactCommitAdapter/getArtefactCommitAdapter with a throw-on-unwired
// default stub -- following mtrr-s2's setListReposAdapter convention (not
// sign-off-writer.js's older plain-function-with-global-fetch-mock
// convention), per the story's Architecture Constraints (resolves review
// finding 1-M1). Production wiring happens in server.js, as its own,
// separate task from both this module and the route-handler changes that
// call it (D37 rule 3).

/**
 * Custom error thrown when the GitHub Contents API returns a 409 conflict
 * (the file was updated since the last read this call knew about).
 */
class ArtefactCommitConflictError extends Error {
  constructor(message) {
    super(message || 'Conflict: artefact file has been updated since it was last read');
    this.name = 'ArtefactCommitConflictError';
  }
}

let _artefactCommitAdapter = function() {
  throw new Error('Adapter not wired: artefactCommitAdapter. Call setArtefactCommitAdapter() with a real implementation before use.');
};

/**
 * Replace the artefact-commit adapter (used in tests and production startup).
 * @param {(artefactPath: string, content: string, token: string, owner: string, repo: string) => Promise<object>} fn
 */
function setArtefactCommitAdapter(fn) {
  _artefactCommitAdapter = fn;
}

/**
 * Retrieve the currently wired artefact-commit adapter function. Callers
 * invoke getArtefactCommitAdapter()(...) rather than holding a captured
 * reference, so rewiring (e.g. setArtefactCommitAdapter() in a test) always
 * takes effect for the next call -- mirrors repo-adapter.js's
 * getListReposAdapter()/getRepoAdapter() convention.
 * @returns {Function}
 */
function getArtefactCommitAdapter() {
  return _artefactCommitAdapter;
}

/**
 * Commit a completed stage's artefact content to the product's connected
 * repo. Route/handler code calls this -- NOT realCommitArtefact directly --
 * so the implementation can be swapped in tests without touching call sites.
 * @param {string} artefactPath - repo-relative path, e.g. artefacts/<slug>/<stage>.md
 * @param {string} content - artefact markdown content
 * @param {string} token - user's OAuth access token from req.session.accessToken
 * @param {string} owner - GitHub repository owner (product's repo_owner)
 * @param {string} repo - GitHub repository name (product's repo_name)
 * @returns {Promise<object>}
 */
async function commitArtefact(artefactPath, content, token, owner, repo) {
  return getArtefactCommitAdapter()(artefactPath, content, token, owner, repo);
}

/**
 * Real production implementation -- GitHub Contents API PUT, generalising
 * sign-off-writer.js's commitSignOff mechanics for the artefact-commit use
 * case. The commit author and committer are always set to the authenticated
 * GitHub user identity (obtained by calling /user with the provided token) --
 * never a service account (product/constraints.md #12).
 *
 * Security constraint: the token parameter MUST come from the user's session
 * (req.session.accessToken). No server-level write token is used here.
 *
 * @param {string} artefactPath - repo-relative path, e.g. artefacts/<slug>/<stage>.md
 * @param {string} content - artefact markdown content to commit
 * @param {string} token - user's OAuth access token from session
 * @param {string} owner - GitHub repository owner (product's repo_owner)
 * @param {string} repo - GitHub repository name (product's repo_name)
 * @returns {Promise<object>} GitHub Contents API PUT response
 * @throws {ArtefactCommitConflictError} if the Contents API returns 409
 * @throws {Error} if owner or repo is not provided (fail-closed on missing config)
 */
async function realCommitArtefact(artefactPath, content, token, owner, repo) {
  // Fail-closed -- no repo configured means reject before any API call
  // (mirrors sign-off-writer.js's commitSignOff AC3 guard exactly).
  if (!owner || !repo) {
    throw new Error('realCommitArtefact: owner and repo parameters are required (product has no repo configured)');
  }

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
  const authorName  = user.name || user.login;
  const authorEmail = user.email || (user.login + '@users.noreply.github.com');

  const contentsUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;

  // GET the existing file first (if any) to obtain its sha -- required by
  // the Contents API for an update; absent entirely (404) for a brand-new
  // file, which is fine -- the PUT below omits `sha` in that case.
  let sha;
  const getRes = await fetch(contentsUrl, { headers: authHeaders });
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  } else if (getRes.status !== 404) {
    throw new Error('Failed to check existing artefact: ' + getRes.status);
  }

  const fileContent = Buffer.from(content, 'utf8').toString('base64');
  const bodyPayload = {
    message:   'artefact: commit ' + artefactPath,
    content:   fileContent,
    author:    { name: authorName, email: authorEmail },
    committer: { name: authorName, email: authorEmail }
  };
  if (sha) bodyPayload.sha = sha;

  const putRes = await fetch(contentsUrl, {
    method:  'PUT',
    headers: Object.assign({}, authHeaders, { 'Content-Type': 'application/json' }),
    body:    JSON.stringify(bodyPayload)
  });

  if (putRes.status === 409) {
    throw new ArtefactCommitConflictError();
  }

  if (!putRes.ok) {
    throw new Error('Failed to commit artefact: ' + putRes.status);
  }

  return putRes.json();
}

module.exports = {
  setArtefactCommitAdapter,
  getArtefactCommitAdapter,
  commitArtefact,
  realCommitArtefact,
  ArtefactCommitConflictError
};
