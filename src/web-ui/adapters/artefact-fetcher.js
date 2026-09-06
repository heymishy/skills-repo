'use strict';

// artefact-fetcher.js — ADR-012: artefact-fetching adapter
// All artefact fetching goes through this module — no inline GitHub API calls in route handlers.
// Resolves artefact paths via GitHub Contents API using the user's OAuth token.

const { listKnownSubdirs } = require('../utils/artefact-labels');

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
 * @param {number} [timeoutMs=10000] - wugs-s14: abort the request if no
 *   response arrives within this window, so a hung GitHub API call can't
 *   leave a route handler (and its caller) waiting indefinitely.
 * @returns {Promise<object|Array>} parsed GitHub Contents API JSON response
 * @throws {ArtefactNotFoundError} on 404
 * @throws {ArtefactFetchError}    on other errors, including a timeout
 */
async function fetchGithubContentsResponse(url, token, notFoundArgs, networkErrorMessage, timeoutMs = 10000) {
  let response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept':        'application/vnd.github.v3+json'
      },
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ArtefactFetchError(`Timeout: ${networkErrorMessage} (exceeded ${timeoutMs}ms)`, 'timeout');
    }
    throw new ArtefactFetchError(networkErrorMessage, err.message);
  } finally {
    clearTimeout(timer);
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

// adlr-s1: known artefact subdirectories, per CLAUDE.md's own documented
// directory-tree convention. Only consulted as a last-resort fallback for a
// bare, no-slash artefactType (a legacy link generated before this fix, or
// any other caller not yet updated to pass the full relative path) -- a
// correctly-generated link already contains its own subdirectory and never
// reaches this probing loop.
//
// cat-s2: sourced from the canonical subdirectory label table
// (utils/artefact-labels.js) instead of being separately maintained, closing
// the 5-table divergence risk (ADR-028). This array's own scope is
// unchanged by cat-s2 -- it historically excludes 'review', 'decisions',
// and 'spikes' (the 3 subdirectories added to the canonical table after
// this array was first written), so those 3 are filtered back out here
// rather than silently widening what this fallback probes.
const NOT_PROBED_AS_FALLBACK = ['review', 'decisions', 'spikes'];
const ARTEFACT_SUBDIRS = listKnownSubdirs()
  .filter((name) => !NOT_PROBED_AS_FALLBACK.includes(name));

// Reduced timeout for exploratory subdirectory probes (AC5) -- these are
// speculative guesses for a legacy bare-name input, not the common case, so
// a slow/hung GitHub API response shouldn't make a genuinely-missing
// artefact take minutes to 404. The direct attempts (both prefixes) still
// use the caller's normal timeout, since those cover every correctly-
// generated link and should get the full grace period.
const FALLBACK_PROBE_TIMEOUT_MS = 3000;

/**
 * Attempt a single artefact fetch at one exact repo path, translating a 404
 * into null (caller decides how to proceed) rather than throwing, so the
 * resolution loop in fetchArtefact can try the next candidate on a miss
 * without special-casing ArtefactNotFoundError at every call site.
 * @returns {Promise<string|null>} decoded content, or null on 404
 * @throws {ArtefactFetchError} on any non-404 error, network failure, or timeout
 */
async function _tryFetchAtPath(repoPath, targetRepo, token, featureSlug, artefactType, timeoutMs) {
  const url = `${GITHUB_API_BASE}/repos/${targetRepo}/contents/${repoPath}`;
  try {
    const data = await fetchGithubContentsResponse(url, token, [featureSlug, artefactType], 'Network error fetching artefact', timeoutMs);
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  } catch (err) {
    if (err.name === 'ArtefactNotFoundError') return null;
    throw err;
  }
}

/**
 * Fetch a pipeline artefact from GitHub Contents API.
 *
 * adlr-s1: artefactType may now be a bare type name (e.g. 'discovery', for
 * the 4 root-level artefact types, or a legacy link generated before this
 * fix) or a path relative to the feature directory including its own
 * subdirectory (e.g. 'dor/psh-s1-dor', what every correctly-generated link
 * now carries). Resolution order: (1) the decoded path directly under
 * artefacts/<slug>/, (2) the same path under artefacts/archived/<slug>/ --
 * closing the gap where an archived feature's artefacts, including its 4
 * root-level types, previously always 404'd -- and only if artefactType has
 * no '/' (so a correctly-generated nested link never pays this cost), (3) a
 * bounded probe of every known subdirectory under both prefixes, with a
 * shorter per-attempt timeout, so an old bookmarked or externally-shared
 * bare-name link still resolves instead of 404ing forever.
 *
 * @param {string} featureSlug  - e.g. '2026-01-01-example-feature'
 * @param {string} artefactType - e.g. 'discovery' or 'dor/psh-s1-dor'
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
 * @param {number} [timeoutMs] - wugs-s14: optional override of the shared
 *   helper's default request timeout; undefined falls through to
 *   fetchGithubContentsResponse's own 10000ms default. Applies to the two
 *   direct attempts only -- the subdirectory-probing fallback (if reached)
 *   always uses the shorter FALLBACK_PROBE_TIMEOUT_MS regardless.
 * @returns {Promise<string>} decoded markdown content
 * @throws {ArtefactNotFoundError} when every candidate path 404s
 * @throws {ArtefactFetchError}    on non-404 error, network failure, or timeout
 */
async function fetchArtefact(featureSlug, artefactType, token, repoOverride, timeoutMs) {
  const targetRepo = repoOverride ? `${repoOverride.owner}/${repoOverride.repo}` : GITHUB_REPO;
  const prefixes = ['artefacts', 'artefacts/archived'];

  for (const prefix of prefixes) {
    const result = await _tryFetchAtPath(`${prefix}/${featureSlug}/${artefactType}.md`, targetRepo, token, featureSlug, artefactType, timeoutMs);
    if (result !== null) return result;
  }

  if (artefactType.indexOf('/') === -1) {
    for (const prefix of prefixes) {
      for (const dir of ARTEFACT_SUBDIRS) {
        const result = await _tryFetchAtPath(`${prefix}/${featureSlug}/${dir}/${artefactType}.md`, targetRepo, token, featureSlug, artefactType, FALLBACK_PROBE_TIMEOUT_MS);
        if (result !== null) return result;
      }
    }
  }

  throw new ArtefactNotFoundError(featureSlug, artefactType);
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
 * @param {number} [timeoutMs] - wugs-s14: optional override of the shared
 *   helper's default request timeout; undefined falls through to
 *   fetchGithubContentsResponse's own 10000ms default.
 * @returns {Promise<string|Array>} decoded file content, or a directory entry array
 * @throws {ArtefactNotFoundError} on 404
 * @throws {ArtefactFetchError}    on other errors, including a timeout
 */
async function realFetchRepoPath(owner, repo, path, token, timeoutMs) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  const data = await fetchGithubContentsResponse(url, token, [`${owner}/${repo}`, path], 'Network error fetching repo path', timeoutMs);

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
  fetchRepoPath, setFetchRepoPath, getFetchRepoPath, realFetchRepoPath,
  fetchGithubContentsResponse, ARTEFACT_SUBDIRS
};
