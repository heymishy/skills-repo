'use strict';

// repo-picker.js — mtrr-s2
//
// Business logic for the repo-connection picker (mtrr-s2): fetching +
// session-scoped caching of the operator's own accessible GitHub repos (via
// the D37 listReposAdapter in adapters/repo-adapter.js), and a pure,
// DOM-independent filter function for the search/filter box (AC4).
// Rendering the markup itself stays in routes/products.js's
// _renderProductView, matching this codebase's existing convention (see
// its repoHtml construction) -- this module owns only the data-fetch/
// cache/filter logic, never markup.
//
// Fallback (AC3): any failure fetching the list (rate limit, missing OAuth
// scope, network error) resolves to { ok: false, message } rather than
// throwing -- the caller (handleGetProductView) always receives something
// renderable and falls back to the existing URL-entry field. This mirrors
// D37's "never leave the caller with no way to proceed" spirit even though
// this isn't itself a swappable injectable adapter.
//
// Caching (NFR: Performance) -- keyed by the caller's own accessToken
// (unique per authenticated session), so a second render within the same
// session never re-calls the underlying GitHub API. Only successful
// fetches are cached; a failed fetch is deliberately NOT cached so a
// transient rate-limit/network blip is retried on the operator's next
// render rather than sticking the whole session with a permanent fallback.

var _cache = new Map();

/**
 * Fetch the operator's accessible repos, using a session-scoped cache keyed
 * by accessToken so a repeat render within the same session never re-calls
 * the underlying adapter (NFR: Performance).
 * @param {string} accessToken
 * @param {(accessToken: string) => Promise<Array<{owner: string, name: string, fullName: string}>>} listReposFn
 * @returns {Promise<{ok: true, repos: Array} | {ok: false, message: string}>}
 */
async function getAccessibleRepos(accessToken, listReposFn) {
  if (_cache.has(accessToken)) {
    return _cache.get(accessToken);
  }
  var result;
  try {
    var repos = await listReposFn(accessToken);
    result = { ok: true, repos: repos || [] };
    _cache.set(accessToken, result);
  } catch (err) {
    result = { ok: false, message: _friendlyErrorMessage(err) };
    // Deliberately not cached -- see file header.
  }
  return result;
}

/**
 * Translate a raw fetch/adapter failure into a short, human-readable
 * explanation suitable for display next to the URL-entry fallback (AC3).
 * Never leaks internal error detail; always actionable.
 * @param {Error & {status?: number}} err
 * @returns {string}
 */
function _friendlyErrorMessage(err) {
  var status = err && err.status;
  if (status === 403 || status === 429) {
    return 'GitHub API rate limit reached -- connect using a repo URL instead for now.';
  }
  if (status === 401) {
    return 'Your GitHub connection needs to be re-authorised -- connect using a repo URL instead for now.';
  }
  return 'Could not load your GitHub repos right now -- connect using a repo URL instead.';
}

/**
 * Pure filter for the search/filter box (AC4). Case-insensitive substring
 * match against the repo's fullName (owner/name) so typing either the
 * owner or the repo name narrows the visible list. No DOM dependency --
 * directly unit-testable and reused by the client-side inline script's
 * equivalent logic.
 * @param {Array<{owner: string, name: string, fullName?: string}>} repos
 * @param {string} query
 * @returns {Array}
 */
function filterRepoList(repos, query) {
  if (!query) return repos || [];
  var q = String(query).toLowerCase();
  return (repos || []).filter(function(r) {
    var fullName = (r.fullName || ((r.owner || '') + '/' + (r.name || ''))).toLowerCase();
    return fullName.indexOf(q) !== -1;
  });
}

/**
 * Test-only reset of the session cache. Production has no need to clear it
 * (a new accessToken naturally gets its own cache entry; a server restart
 * clears it implicitly) -- this exists solely so tests can assert
 * call-count behaviour without cross-test cache pollution.
 */
function _resetCacheForTests() {
  _cache.clear();
}

module.exports = {
  getAccessibleRepos,
  filterRepoList,
  _resetCacheForTests
};
