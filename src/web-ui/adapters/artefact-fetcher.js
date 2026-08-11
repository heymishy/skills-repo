'use strict';

// artefact-fetcher.js — ADR-012: artefact-fetching adapter
// All artefact fetching goes through this module — no inline GitHub API calls in route handlers.
// Resolves artefact paths via GitHub Contents API using the user's OAuth token.

const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';
const GITHUB_REPO     = process.env.GITHUB_REPO || '';

// ── Named error classes ────────────────────────────────────────────────────

class ArtefactNotFoundError extends Error {
  constructor(featureSlug, artefactType) {
    super(`Artefact not found: ${featureSlug}/${artefactType}`);
    this.name        = 'ArtefactNotFoundError';
    this.featureSlug = featureSlug;
    this.artefactType = artefactType;
  }
}

class ArtefactFetchError extends Error {
  constructor(message, cause) {
    super(message);
    this.name  = 'ArtefactFetchError';
    this.cause = cause;
  }
}

// ── Adapter ────────────────────────────────────────────────────────────────

/**
 * Shared GitHub Contents API request + error-handling, factored out of
 * fetchArtefact/realFetchRepoPath (wugs-s1 Task 2 code-quality review):
 * both fetch a URL with a bearer token, translate a 404 into
 * ArtefactNotFoundError, translate any other non-ok response or network
 * failure into ArtefactFetchError, and hand back the parsed JSON body.
 * Callers are responsible for their own URL construction and for decoding
 * the returned body's shape (single-file `content`, or a directory array).
 * @param {string} url
 * @param {string} token
 * @param {[string, string]} notFoundArgs - passed positionally to `new ArtefactNotFoundError(...)`
 * @param {string} networkErrorMessage
 * @returns {Promise<object|Array>} parsed GitHub Contents API JSON response
 * @throws {ArtefactNotFoundError} on 404
 * @throws {ArtefactFetchError}    on other errors
 */
async function fetchGithubContentsResponse(url, token, notFoundArgs, networkErrorMessage) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/vnd.github.v3+json'
      }
    });
  } catch (err) {
    throw new ArtefactFetchError(networkErrorMessage, err.message);
  }

  if (response.status === 404) {
    throw new ArtefactNotFoundError(...notFoundArgs);
  }

  if (!response.ok) {
    let errorMessage = 'Unknown error';
    try {
      const body = await response.json();
      errorMessage = body.message || errorMessage;
    } catch (_) { /* ignore parse failure */ }
    throw new ArtefactFetchError(`GitHub API error: ${response.status}`, errorMessage);
  }

  return response.json();
}

/**
 * Fetch a pipeline artefact from GitHub Contents API.
 * @param {string} featureSlug  - e.g. '2026-01-01-example-feature'
 * @param {string} artefactType - e.g. 'discovery'
 * @param {string} token        - OAuth access token
 * @param {{owner: string, repo: string}} [repoOverride] - mtrr-s1: when
 *   supplied, fetches from this owner/repo instead of the single, deployment-
 *   wide GITHUB_REPO env var. Used by export-data-source.js's
 *   realExportDataSource, which resolves the correct per-tenant repo via
 *   ownerRepoForFeature before calling this function -- without this,
 *   realExportDataSource would correctly resolve pipeline-state.json per
 *   product/tenant (via realFetchPipelineState) but still fetch the DoR
 *   artefact content itself from the single hardcoded env-var repo, silently
 *   reintroducing the exact cross-tenant defect mtrr-s1 exists to close.
 *   Optional and additive: every other caller (e.g. handleArtefactRoute, the
 *   in-app viewer) is unaffected and keeps using the env-var default.
 * @returns {Promise<string>} decoded markdown content
 * @throws {ArtefactNotFoundError} when the Contents API returns 404
 * @throws {ArtefactFetchError}    on non-404 error or network failure
 */
async function fetchArtefact(featureSlug, artefactType, token, repoOverride) {
  const repoPath = `artefacts/${featureSlug}/${artefactType}.md`;
  const targetRepo = repoOverride ? `${repoOverride.owner}/${repoOverride.repo}` : GITHUB_REPO;
  const url      = `${GITHUB_API_BASE}/repos/${targetRepo}/contents/${repoPath}`;

  const data    = await fetchGithubContentsResponse(url, token, [featureSlug, artefactType], 'Network error fetching artefact');
  const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return decoded;
}

/**
 * Fetch an arbitrary file or folder from a repo via GitHub Contents API.
 * Unlike fetchArtefact(), this accepts any path, not just the fixed
 * artefacts/<slug>/<type>.md convention, and branches on response shape:
 * a single file returns a decoded string; a directory returns an array
 * of entries (wugs-s1 AC1/AC2).
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} token
 * @returns {Promise<string|Array>} decoded file content, or a directory entry array
 * @throws {ArtefactNotFoundError} on 404
 * @throws {ArtefactFetchError}    on other errors
 */
async function realFetchRepoPath(owner, repo, path, token) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  const data = await fetchGithubContentsResponse(url, token, [`${owner}/${repo}`, path], 'Network error fetching repo path');

  if (Array.isArray(data)) {
    return data.map(entry => ({ name: entry.name, path: entry.path, type: entry.type }));
  }

  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
}

// ── wugs-s1: arbitrary repo-path fetch adapter (D37 injectable) ────────────
//
// Generalises fetchArtefact()'s fixed artefacts/<slug>/<type>.md path to any
// file or folder path, so the guardrails/standards feature can read
// .github/architecture-guardrails.md and standards/ from a connected repo.
// Mirrors pipeline-state-fetch-adapter.js's exact pattern (throw-on-unwired
// stub default, set/get pair, a separate "real" implementation wired in
// server.js as its own D37 task).

let _fetchRepoPath = function() {
  throw new Error('Adapter not wired: fetchRepoPath. Call setFetchRepoPath() with a real implementation before use.');
};

/**
 * Fetch an arbitrary file or folder from a repo (used in tests and production).
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} token
 * @returns {Promise<string|Array<{name: string, path: string, type: string}>>} decoded file content, or a directory entry array
 */
function fetchRepoPath(owner, repo, path, token) {
  return getFetchRepoPath()(owner, repo, path, token);
}

/**
 * Replace the repo-path fetch adapter (used in tests and production startup).
 * @param {(owner: string, repo: string, path: string, token: string) => Promise<string|Array>} impl
 */
function setFetchRepoPath(impl) {
  _fetchRepoPath = impl;
}

/**
 * Retrieve the currently wired adapter function. Callers invoke
 * getFetchRepoPath()(owner, repo, path, token) rather than holding a
 * captured reference, so rewiring always takes effect for the next call.
 * @returns {Function}
 */
function getFetchRepoPath() {
  return _fetchRepoPath;
}

module.exports = {
  fetchArtefact, ArtefactNotFoundError, ArtefactFetchError,
  fetchRepoPath, setFetchRepoPath, getFetchRepoPath, realFetchRepoPath
};
