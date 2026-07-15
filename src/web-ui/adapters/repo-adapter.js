'use strict';

// repo-adapter.js — prc-s1.2 (D37 / ADR-012 / ADR-020)
//
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

module.exports = {
  setRepoAdapter,
  getRepoAdapter,
  realCheckRepoAccess
};
