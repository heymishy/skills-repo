'use strict';

// src/web-ui/adapters/pipeline-state-fetch-adapter.js -- pr-s2
//
// D37 injectable adapter fetching a connected repo's .github/pipeline-state.json
// via GitHub's Contents API, using the requesting user's own OAuth token
// (ADR-020, never a service account). Mirrors repo-adapter.js's exact
// pattern (throw-on-unwired stub default, set/get pair, a separate "real"
// implementation function wired in server.js as its own D37 task).

let _pipelineStateFetchAdapter = function() {
  throw new Error('Adapter not wired: pipelineStateFetchAdapter. Call setPipelineStateFetchAdapter() with a real implementation before use.');
};

/**
 * Replace the pipeline-state fetch adapter (used in tests and production startup).
 * @param {(owner: string, repo: string, accessToken: string) => Promise<{content: string, encoding: string}>} impl
 */
function setPipelineStateFetchAdapter(impl) {
  _pipelineStateFetchAdapter = impl;
}

/**
 * Retrieve the currently wired adapter function. Callers invoke
 * getPipelineStateFetchAdapter()(owner, repo, accessToken) rather than
 * holding a captured reference, so rewiring always takes effect for the
 * next call.
 * @returns {Function}
 */
function getPipelineStateFetchAdapter() {
  return _pipelineStateFetchAdapter;
}

/**
 * Real GitHub implementation -- GET /repos/{owner}/{repo}/contents/.github/pipeline-state.json
 * using the caller's own OAuth token (ADR-020). Throws with the HTTP status
 * on any non-ok response (404 not found, 403 forbidden, etc.) so the caller
 * can surface a visible failure rather than silently treating it as empty
 * data (AC3).
 * @param {string} owner
 * @param {string} repo
 * @param {string} accessToken
 * @returns {Promise<{content: string, encoding: string}>} raw GitHub Contents API response shape
 */
async function realFetchPipelineState(owner, repo, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/.github/pipeline-state.json';

  var res = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch pipeline-state.json: HTTP ' + res.status);
  }

  return res.json();
}

module.exports = {
  setPipelineStateFetchAdapter,
  getPipelineStateFetchAdapter,
  realFetchPipelineState
};
