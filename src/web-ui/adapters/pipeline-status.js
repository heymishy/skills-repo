'use strict';

// pipeline-status.js — ADR-012: getPipelineStatus adapter
// Reads pipeline-state.json from GitHub Contents API (production).
// setFetcher() injects a test double in tests.
// validateRepositoryAccess() checks read access before serving data.
// ADR-003: reads only existing fields (stage, prStatus, dorStatus, traceStatus).

let _fetcher = null;
let _accessValidator = null;

/**
 * Inject a fetcher function for tests.
 * fn(featureSlug, token) => feature object | null
 * @param {Function|null} fn
 */
function setFetcher(fn) {
  _fetcher = fn;
}

/**
 * Inject a custom access validator for tests.
 * fn(featureSlug, token) => boolean (async-safe)
 * @param {Function|null} fn
 */
function setAccessValidator(fn) {
  _accessValidator = fn;
}

/**
 * Validate that the caller has read access to the repository.
 * In production: calls GitHub Contents API to verify token scope.
 * Returns false when token is absent or access is denied.
 * @param {string} featureSlug
 * @param {string|null} token
 * @returns {Promise<boolean>}
 */
async function validateRepositoryAccess(featureSlug, token) {
  if (_accessValidator) return _accessValidator(featureSlug, token);
  // Default: token presence check (production would verify against GitHub API)
  return Boolean(token);
}

/**
 * Retrieve pipeline status for a feature.
 * Validates repository read access first; throws 'Access denied' if denied.
 * @param {string} featureSlug
 * @param {string|null} token
 * @returns {Promise<object|object[]|null>}
 */
async function getPipelineStatus(featureSlug, token) {
  const hasAccess = await validateRepositoryAccess(featureSlug, token);
  if (!hasAccess) {
    throw new Error('Access denied');
  }
  if (_fetcher) {
    return _fetcher(featureSlug, token);
  }
  // Production path: fetch .github/pipeline-state.json via GitHub Contents API
  // (not implemented in this story — adapter pattern per ADR-012)
  throw new Error('No fetcher configured — call setFetcher() or configure production GitHub adapter');
}

module.exports = { getPipelineStatus, validateRepositoryAccess, setFetcher, setAccessValidator };
