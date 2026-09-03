'use strict';

// src/web-ui/adapters/pipeline-state-fetch-adapter.js -- pr-s2, pgft-s1, psbf-s1
//
// D37 injectable adapters for fetching a connected repo's
// .github/pipeline-state.json via GitHub's REST API, using the requesting
// user's own OAuth token (ADR-020, never a service account). Two paths:
//   - realFetchPipelineState: GitHub's Contents API. Reliable for files
//     under ~1MB; for larger files the `content` field can arrive
//     truncated even on an ok:200 response (psbf-s1's own root-cause
//     finding, confirmed live in production for this repo's own 1.34MB
//     pipeline-state.json).
//   - realFetchBlobBySha: GitHub's Git Blobs API, keyed by the blob `sha`
//     the Contents API always returns regardless of file size. No such
//     truncation ceiling (up to 100MB) -- the fallback syncProductRollup
//     uses when it detects the Contents API's own content was truncated.
// Both share the same retry-with-backoff mechanics (pgft-s1).

let _pipelineStateFetchAdapter = function() {
  throw new Error('Adapter not wired: pipelineStateFetchAdapter. Call setPipelineStateFetchAdapter() with a real implementation before use.');
};

let _pipelineStateBlobFetchAdapter = function() {
  throw new Error('Adapter not wired: pipelineStateBlobFetchAdapter. Call setPipelineStateBlobFetchAdapter() with a real implementation before use.');
};

function setPipelineStateFetchAdapter(impl) {
  _pipelineStateFetchAdapter = impl;
}

function getPipelineStateFetchAdapter() {
  return _pipelineStateFetchAdapter;
}

function setPipelineStateBlobFetchAdapter(impl) {
  _pipelineStateBlobFetchAdapter = impl;
}

function getPipelineStateBlobFetchAdapter() {
  return _pipelineStateBlobFetchAdapter;
}

/**
 * pgft-s1: fetches url with up to 3 attempts (500ms/1000ms backoff) on a
 * thrown network error or a JSON-parse failure on an otherwise-ok response.
 * A non-ok HTTP status is never retried -- fails immediately. On exhausted
 * parse failures, the thrown error includes the actual bytes received and
 * the response's own Content-Length header for diagnosis.
 * @param {string} url
 * @param {object} headers
 * @param {string} errorPrefix - included in thrown error messages
 */
async function _fetchWithRetry(url, headers, errorPrefix) {
  var maxAttempts = 3;
  var lastErr = null;

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    var res;
    try {
      res = await fetch(url, { headers: headers });
    } catch (networkErr) {
      lastErr = networkErr;
      if (attempt < maxAttempts) { await _pgftDelay(attempt * 500); continue; }
      throw lastErr;
    }

    if (!res.ok) {
      throw new Error(errorPrefix + ': HTTP ' + res.status);
    }

    var bodyText = await res.text();
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      var contentLength = (res.headers && res.headers.get) ? (res.headers.get('content-length') || 'absent') : 'unavailable';
      lastErr = new Error(
        errorPrefix + ' response: ' + parseErr.message +
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

/**
 * Real GitHub implementation -- GET /repos/{owner}/{repo}/contents/.github/pipeline-state.json
 * using the caller's own OAuth token (ADR-020).
 * @param {string} owner
 * @param {string} repo
 * @param {string} accessToken
 * @returns {Promise<{content: string, encoding: string, size?: number, sha?: string}>} raw GitHub Contents API response shape
 */
async function realFetchPipelineState(owner, repo, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/.github/pipeline-state.json';
  return _fetchWithRetry(url, {
    Authorization: 'Bearer ' + accessToken,
    Accept: 'application/vnd.github+json'
  }, 'Failed to fetch pipeline-state.json');
}

/**
 * psbf-s1: Real GitHub implementation -- GET /repos/{owner}/{repo}/git/blobs/{sha},
 * the fallback for a blob the Contents API's own content field could not
 * fully return. No practical size ceiling for this platform's files (up to
 * 100MB per GitHub's own documented limit).
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha - blob sha, from the Contents API response's own `sha` field
 * @param {string} accessToken
 * @returns {Promise<{content: string, encoding: string, size?: number, sha?: string}>} raw GitHub Git Blobs API response shape
 */
async function realFetchBlobBySha(owner, repo, sha, accessToken) {
  var apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  var url = apiBase + '/repos/' + owner + '/' + repo + '/git/blobs/' + sha;
  return _fetchWithRetry(url, {
    Authorization: 'Bearer ' + accessToken,
    Accept: 'application/vnd.github+json'
  }, 'Failed to fetch blob ' + sha);
}

module.exports = {
  setPipelineStateFetchAdapter,
  getPipelineStateFetchAdapter,
  realFetchPipelineState,
  setPipelineStateBlobFetchAdapter,
  getPipelineStateBlobFetchAdapter,
  realFetchBlobBySha
};
