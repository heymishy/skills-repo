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
  var maxAttempts = 3;
  var lastErr = null;

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    var res;
    try {
      res = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          Accept: 'application/vnd.github+json'
        }
      });
    } catch (networkErr) {
      // pgft-s1 (AC1): a transient network-layer failure (e.g. connection
      // reset mid-transfer) -- retry rather than fail the whole sync outright.
      lastErr = networkErr;
      if (attempt < maxAttempts) { await _pgftDelay(attempt * 500); continue; }
      throw lastErr;
    }

    if (!res.ok) {
      // pgft-s1 (AC3): a non-ok HTTP status (404/403/rate-limit) is not a
      // transient condition -- fail immediately, matching pre-existing
      // behaviour exactly, never retried.
      throw new Error('Failed to fetch pipeline-state.json: HTTP ' + res.status);
    }

    var bodyText = await res.text();
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      // pgft-s1 (AC1/AC2): a syntactically truncated response body on an
      // otherwise-ok response -- the most likely explanation is a dropped
      // or truncated transfer for a large file. Retry, and if retries are
      // exhausted, surface real diagnostic detail (AC2) instead of the bare
      // "Unexpected end of JSON input" this used to throw.
      var contentLength = (res.headers && res.headers.get) ? (res.headers.get('content-length') || 'absent') : 'unavailable';
      lastErr = new Error(
        'Failed to parse pipeline-state.json response: ' + parseErr.message +
        ' (received ' + bodyText.length + ' bytes; Content-Length header: ' + contentLength + ')'
      );
      if (attempt < maxAttempts) { await _pgftDelay(attempt * 500); continue; }
      throw lastErr;
    }
  }
  throw lastErr;
}

function _pgftDelay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

module.exports = {
  setPipelineStateFetchAdapter,
  getPipelineStateFetchAdapter,
  realFetchPipelineState
};
