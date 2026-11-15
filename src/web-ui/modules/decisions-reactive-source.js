'use strict';

// src/web-ui/modules/decisions-reactive-source.js -- urpv-s3
//
// Second reactive-work source for the consolidated features view: reads each
// feature's artefacts/<slug>/decisions.md LIVE (no caching) through the
// existing, already-wired fetchRepoPath primitive (adapters/artefact-fetcher.js,
// the same read path decisions-log-writer.js uses) and extracts only
// RISK-ACCEPT / SCOPE entries.
//
// decisions.md is prose convention, not a machine schema: an entry header is
// a bolded line `**YYYY-MM-DD | CODE | phase**`, with a `**Decision:**` field
// somewhere below it. This parser tolerates field order variation, a missing
// phase, and decorated codes seen in real files ("RISK-ACCEPT (informational)",
// "SCOPE + DESIGN"). The reported code is the leading token only.
//
// Never throws to its caller: a malformed entry is skipped with a server-side
// log; a missing file or any fetch failure yields an empty list.

var _artefactFetcher = require('../adapters/artefact-fetcher');

var REACTIVE_CODES = { 'RISK-ACCEPT': true, 'SCOPE': true };
var HEADER_RE = /^\*\*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|*]+?)\s*(?:\|\s*([^*]*?)\s*)?\*\*\s*$/;
var DECISION_RE = /^\s*\*\*Decision:\*\*\s*(.*)$/;
var SAFE_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
var MAX_TITLE_LEN = 300;
var FETCH_CONCURRENCY = 16;
// ppp-s1: in-memory stale-while-revalidate cache for the product page. Key is owner/repo/slug only -- never the token.
var DEFAULT_TTL_MS = 5 * 60 * 1000;
var DEFAULT_MAX_ENTRIES = 2000;

function _leadingCode(rawCode) {
  var m = /^[A-Za-z][A-Za-z-]*/.exec(rawCode.trim());
  return m ? m[0].toUpperCase() : '';
}

/**
 * Parse decisions.md content into reactive-work items (RISK-ACCEPT / SCOPE only).
 * @param {string} content
 * @param {{featureSlug?: string, log?: Function}} [opts]
 * @returns {Array<{date: string, code: string, title: string, phase: string, featureSlug: string}>}
 */
function parseReactiveDecisions(content, opts) {
  opts = opts || {};
  var log = typeof opts.log === 'function' ? opts.log : function(msg) { console.error(msg); };
  var featureSlug = opts.featureSlug || '';
  var items = [];
  if (typeof content !== 'string' || !content) { return items; }

  var segments = content.split(/^\s*---\s*$/m);
  segments.forEach(function(segment, segIdx) {
    var lines = segment.split(/\r?\n/);
    var headerIdxs = [];
    lines.forEach(function(line, i) { if (HEADER_RE.test(line.trim())) { headerIdxs.push(i); } });

    if (headerIdxs.length === 0) {
      // A segment with a Decision field but no recognisable header is a
      // malformed entry (AC3). Headerless prose (title, preamble) is not.
      var hasDecision = lines.some(function(l) { return DECISION_RE.test(l); });
      if (hasDecision) {
        log('[urpv-s3] skipped malformed decisions.md entry (no recognisable header) in feature "' + featureSlug + '", segment ' + segIdx);
      }
      return;
    }

    headerIdxs.forEach(function(start, h) {
      var end = h + 1 < headerIdxs.length ? headerIdxs[h + 1] : lines.length;
      var m = HEADER_RE.exec(lines[start].trim());
      var code = _leadingCode(m[2]);
      if (!REACTIVE_CODES[code]) { return; } // AC2: other codes are out of scope
      var title = null;
      for (var i = start + 1; i < end; i++) {
        var dm = DECISION_RE.exec(lines[i]);
        if (dm) { title = dm[1].replace(/\s+/g, ' ').trim(); break; }
      }
      if (!title) {
        log('[urpv-s3] skipped malformed decisions.md entry (no Decision field) in feature "' + featureSlug + '", segment ' + segIdx);
        return;
      }
      if (title.length > MAX_TITLE_LEN) { title = title.slice(0, MAX_TITLE_LEN - 1) + '…'; }
      items.push({ date: m[1], code: code, title: title, phase: (m[3] || '').trim(), featureSlug: featureSlug });
    });
  });
  return items;
}

/**
 * Fetch (live) and parse one feature's decisions.md. Resolves to [] on a
 * missing file or any fetch/parse failure (AC4) -- never rejects.
 * @param {string} owner
 * @param {string} repo
 * @param {string} featureSlug
 * @param {string} token - req.session.accessToken
 * @param {{log?: Function}} [opts]
 * @returns {Promise<Array>}
 */
async function fetchReactiveDecisionsForFeature(owner, repo, featureSlug, token, opts) {
  opts = opts || {};
  var log = typeof opts.log === 'function' ? opts.log : function(msg) { console.error(msg); };
  if (!owner || !repo || !token || typeof featureSlug !== 'string' || !SAFE_SLUG_RE.test(featureSlug) || featureSlug.indexOf('..') !== -1) {
    return [];
  }
  try {
    var content = await _artefactFetcher.fetchRepoPath(owner, repo, 'artefacts/' + featureSlug + '/decisions.md', token);
    if (typeof content !== 'string') { return []; }
    return parseReactiveDecisions(content, { featureSlug: featureSlug, log: log });
  } catch (err) {
    if (!(err instanceof _artefactFetcher.ArtefactNotFoundError)) {
      log('[urpv-s3] decisions.md fetch failed for feature "' + featureSlug + '": ' + (err && err.message ? err.message : 'unknown error'));
    }
    return [];
  }
}

/**
 * Fetch reactive decisions for several features with bounded concurrency.
 * Always resolves to a flat array; per-feature failures degrade to nothing.
 * @param {string} owner
 * @param {string} repo
 * @param {string[]} featureSlugs
 * @param {string} token
 * @param {{log?: Function}} [opts]
 * @returns {Promise<Array>}
 */
async function fetchReactiveDecisionsForFeatures(owner, repo, featureSlugs, token, opts) {
  var seen = {};
  var slugs = (featureSlugs || []).filter(function(s) {
    if (!s || seen[s]) { return false; }
    seen[s] = true;
    return true;
  });
  var results = new Array(slugs.length);
  var next = 0;
  async function worker() {
    while (next < slugs.length) {
      var idx = next++;
      results[idx] = await fetchReactiveDecisionsForFeature(owner, repo, slugs[idx], token, opts);
    }
  }
  var workers = [];
  for (var w = 0; w < Math.min(FETCH_CONCURRENCY, slugs.length); w++) { workers.push(worker()); }
  await Promise.all(workers);
  return [].concat.apply([], results.filter(Boolean));
}

// ---------------- ppp-s1: cached, stale-while-revalidate reads ----------------
var _cache = new Map();    // key -> { items, at }; insertion order = age of the last successful write
var _inflight = new Map(); // key -> Promise of items; at most one fetch per key at a time
var _now = function() { return Date.now(); };
var _ttlMs = DEFAULT_TTL_MS;
var _maxEntries = DEFAULT_MAX_ENTRIES;

function _setClock(fn) { _now = typeof fn === 'function' ? fn : function() { return Date.now(); }; }
function _setCacheConfig(cfg) {
  cfg = cfg || {};
  _ttlMs = typeof cfg.ttlMs === 'number' ? cfg.ttlMs : DEFAULT_TTL_MS;
  _maxEntries = typeof cfg.maxEntries === 'number' ? cfg.maxEntries : DEFAULT_MAX_ENTRIES;
}
function _clearDecisionsCache() { _cache.clear(); _inflight.clear(); }
function _cacheKeys() { return Array.from(_cache.keys()); }

function _storeEntry(key, items) {
  _cache.delete(key);
  _cache.set(key, { items: items, at: _now() });
  while (_cache.size > _maxEntries) { _cache.delete(_cache.keys().next().value); }
}

// One live read. { ok: true, items } for a parsed file or a missing file (both cacheable);
// { ok: false } for a network, rate-limit or server failure (never cached).
async function _loadFeature(owner, repo, featureSlug, token) {
  try {
    var content = await _artefactFetcher.fetchRepoPath(owner, repo, 'artefacts/' + featureSlug + '/decisions.md', token);
    if (typeof content !== 'string') { return { ok: true, items: [] }; }
    return { ok: true, items: parseReactiveDecisions(content, { featureSlug: featureSlug }) };
  } catch (err) {
    if (err instanceof _artefactFetcher.ArtefactNotFoundError) { return { ok: true, items: [] }; }
    console.error('[urpv-s3] decisions.md fetch failed for feature "' + featureSlug + '": ' + (err && err.message ? err.message : 'unknown error'));
    return { ok: false };
  }
}

function _refreshFeature(key, owner, repo, featureSlug, token) {
  if (_inflight.has(key)) { return _inflight.get(key); }
  var p = _loadFeature(owner, repo, featureSlug, token).then(function(r) {
    if (r.ok) { _storeEntry(key, r.items); return r.items; }
    var old = _cache.get(key);
    return old ? old.items : [];
  }).then(function(items) { _inflight.delete(key); return items; });
  _inflight.set(key, p);
  return p;
}

async function _cachedFeature(owner, repo, featureSlug, token) {
  if (!owner || !repo || !token || typeof featureSlug !== 'string' || !SAFE_SLUG_RE.test(featureSlug) || featureSlug.indexOf('..') !== -1) {
    return [];
  }
  var key = owner + '/' + repo + '/' + featureSlug;
  var entry = _cache.get(key);
  if (entry) {
    if (_now() - entry.at >= _ttlMs) { _refreshFeature(key, owner, repo, featureSlug, token); } // stale: serve now, refresh behind
    return entry.items;
  }
  return _refreshFeature(key, owner, repo, featureSlug, token);
}

/**
 * Cached variant of fetchReactiveDecisionsForFeatures for the product page: fresh entries cost no request,
 * stale entries are served at once and refreshed in the background, a missing file is cached as empty, a failed
 * fetch is never cached and never replaces a good entry. Always resolves to a flat array.
 */
async function fetchReactiveDecisionsForFeaturesCached(owner, repo, featureSlugs, token) {
  var seen = {};
  var slugs = (featureSlugs || []).filter(function(s) {
    if (!s || seen[s]) { return false; }
    seen[s] = true;
    return true;
  });
  var results = new Array(slugs.length);
  var next = 0;
  async function worker() {
    while (next < slugs.length) {
      var idx = next++;
      results[idx] = await _cachedFeature(owner, repo, slugs[idx], token);
    }
  }
  var workers = [];
  for (var w = 0; w < Math.min(FETCH_CONCURRENCY, slugs.length); w++) { workers.push(worker()); }
  await Promise.all(workers);
  return [].concat.apply([], results.filter(Boolean));
}

module.exports = {
  parseReactiveDecisions, fetchReactiveDecisionsForFeature, fetchReactiveDecisionsForFeatures,
  fetchReactiveDecisionsForFeaturesCached, _setClock, _setCacheConfig, _clearDecisionsCache, _cacheKeys
};
