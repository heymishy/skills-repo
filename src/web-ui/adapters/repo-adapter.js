'use strict';

// repo-adapter.js — prc-s1.2 (repo-access verification) + prc-s2.1 (repo creation)
//
// Two independent D37 injectable adapters live in this module, one per
// story. Each follows the same bare-function + set/get pattern (never a
// silent stub -- a thrown error on the default, per CLAUDE.md's D37 rule)
// but is wired and named distinctly so neither story's setter clobbers the
// other's:
//
//   prc-s1.2 — repo-access verification (unchanged from that story's own
//     implementation): setRepoAdapter/getRepoAdapter, checks whether the
//     authenticated user's own GitHub OAuth token has access to a named
//     owner/repo via GET /repos/{owner}/{repo}.
//
//   prc-s2.1 — repo creation: setCreateRepoAdapter/getCreateRepoAdapter,
//     creates a brand-new repo under the authenticated user's own account
//     via POST /user/repos.
//
// Both use the authenticated user's own OAuth token (ADR-020), never a
// service account or env-var write token.

// ── prc-s1.2: repo-access verification ──────────────────────────────────

// Injectable adapter verifying whether the authenticated user's own GitHub
// OAuth token has access to a given owner/repo, via GET /repos/{owner}/{repo}
// — never a service account (ADR-020). Default stub throws (D37 / CLAUDE.md):
// a silent stub would mask misconfiguration and let a "connect repo" flow
// complete incorrectly with no error. Production wiring happens in
// server.js, kept as a separate task from both this module and the route
// handler that calls it (D37 rule 3).

let _repoAdapter = function() {
  throw new Error('Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.');
};

/**
 * Replace the repo adapter (used in tests and production startup).
 * @param {(owner: string, repo: string, accessToken: string) => Promise<{hasAccess: boolean, status: number}>} impl
 */
function setRepoAdapter(impl) {
  _repoAdapter = impl;
}

/**
 * Retrieve the currently wired repo adapter function. Callers invoke
 * getRepoAdapter()(owner, repo, accessToken) rather than holding a captured
 * reference, so rewiring (e.g. setRepoAdapter() in a test) always takes
 * effect for the next call.
 * @returns {Function}
 */
function getRepoAdapter() {
  return _repoAdapter;
}

/**
 * Real GitHub implementation — GET /repos/{owner}/{repo} using the caller's
 * own OAuth token (ADR-020: never a service account). Returns hasAccess:true
 * only on a 200; any other status (404 not found, 403 forbidden, etc.) is
 * treated as no access — this endpoint's semantics conflate "doesn't exist"
 * and "you can't see it" by design on GitHub's side, which matches AC2's
 * "does NOT have access to (or that doesn't exist)" wording exactly.
 * @param {string} owner
 * @param {string} repo
 * @param {string} accessToken
 * @returns {Promise<{hasAccess: boolean, status: number}>}
 */
async function realCheckRepoAccess(owner, repo, accessToken) {
  var apiBase = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
  var response = await fetch(apiBase + '/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo), {
    headers: {
      'Authorization': 'token ' + accessToken,
      'Accept':        'application/json',
      'User-Agent':    'skills-pipeline-web-ui'
    }
  });
  return { hasAccess: response.status === 200, status: response.status };
}

// ── prc-s2.1: repo creation ──────────────────────────────────────────────

/**
 * Custom error thrown when GitHub reports the repo name is already taken
 * (422 Validation Failed on POST /user/repos).
 */
class RepoNameTakenError extends Error {
  constructor(name) {
    super('A repo named "' + name + '" already exists on your GitHub account. Choose a different name.');
    this.name = 'RepoNameTakenError';
  }
}

// Injectable adapter creating a brand-new GitHub repo under the
// authenticated user's own account, via POST /user/repos — never a service
// account (ADR-020). Default stub throws (D37 / CLAUDE.md): a silent stub
// would mask misconfiguration and let a "create repo" flow complete
// incorrectly with no error. Production wiring happens in server.js, kept
// as a separate task from both this module and the route handler that
// calls it (D37 rule 3).
let _createRepoAdapter = function() {
  throw new Error('Adapter not wired: createRepoAdapter. Call setCreateRepoAdapter() with a real implementation before use.');
};

/**
 * Replace the create-repo adapter (used in tests and production startup).
 * @param {(token: string, name: string) => Promise<{ owner: { login: string }, name: string }>} impl
 */
function setCreateRepoAdapter(impl) {
  _createRepoAdapter = impl;
}

/**
 * Retrieve the currently wired create-repo adapter function. Callers invoke
 * getCreateRepoAdapter()(token, name) rather than holding a captured
 * reference, so rewiring (e.g. setCreateRepoAdapter() in a test) always
 * takes effect for the next call. Mirrors getRepoAdapter()'s own convention
 * above.
 * @returns {Function}
 */
function getCreateRepoAdapter() {
  return _createRepoAdapter;
}

/**
 * Create a new GitHub repo under the authenticated user's own account.
 * Route handlers call this -- NOT realCreateRepo directly -- so the
 * implementation can be swapped in tests without touching route logic.
 * @param {string} token - user's OAuth access token from req.session.accessToken
 * @param {string} name - desired repo name
 * @returns {Promise<{ owner: { login: string }, name: string }>}
 */
async function createRepo(token, name) {
  return getCreateRepoAdapter()(token, name);
}

/**
 * Real production implementation -- POST /user/repos using the authenticated
 * user's own OAuth token (ADR-020). Wire via setCreateRepoAdapter in
 * server.js.
 * @param {string} token - user's OAuth access token
 * @param {string} name - desired repo name
 * @returns {Promise<{ owner: { login: string }, name: string }>}
 * @throws {RepoNameTakenError} on a 422 name-collision response
 */
async function realCreateRepo(token, name) {
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  const res = await fetch(apiBase + '/user/repos', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: name })
  });

  if (res.status === 422) {
    throw new RepoNameTakenError(name);
  }

  if (!res.ok) {
    throw new Error('Failed to create repo: ' + res.status);
  }

  return res.json();
}

module.exports = {
  // prc-s1.2 — repo-access verification
  setRepoAdapter,
  getRepoAdapter,
  realCheckRepoAccess,
  // prc-s2.1 — repo creation
  setCreateRepoAdapter,
  getCreateRepoAdapter,
  createRepo,
  realCreateRepo,
  RepoNameTakenError
};
