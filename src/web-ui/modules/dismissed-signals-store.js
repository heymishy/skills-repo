'use strict';
// dismissed-signals-store.js -- sptu-s4: D37 injectable adapter for a
// reversible per-signal "dismiss" mechanism. Matches
// signals-aggregator.js's own _fileReadAdapter/createFsFileReadAdapter
// precedent exactly: stub default throws, production adapter wired once in
// server.js at startup.
const fs = require('fs');
const crypto = require('crypto');

// D37: default stub MUST throw, never return empty/null.
let _dismissedSignalsStore = function() {
  throw new Error('Adapter not wired: dismissed-signals-store. Call setDismissedSignalsStore() with a real implementation before use.');
};

function setDismissedSignalsStore(adapter) { _dismissedSignalsStore = adapter; }
function _resetDismissedSignalsStoreForTesting() {
  _dismissedSignalsStore = function() {
    throw new Error('Adapter not wired: dismissed-signals-store. Call setDismissedSignalsStore() with a real implementation before use.');
  };
}

// Stable key -- source+type+text, NEVER signal.id (confirmed non-deterministic
// for parse-error signals, ep1-s2-dod.md AC5 deviation). Node's built-in
// crypto module only -- no new npm dependency. The separator is a real NUL
// character built via String.fromCharCode(0) -- deliberately NOT a printable
// character like a space, since a space (or any printable separator) can
// appear inside source/type/text itself and create a real collision between
// two different signals (e.g. source="a b", type="c" vs source="a",
// type="b c" joined with a space both produce "a b c"). NUL cannot appear in
// normal signal text, so this separator is collision-safe for AC4's own
// "two distinct signals never collide" requirement.
const _DISMISS_KEY_SEPARATOR = String.fromCharCode(0);
function deriveDismissKey(signal) {
  const raw = String((signal && signal.source) || '') + _DISMISS_KEY_SEPARATOR +
              String((signal && signal.type) || '') + _DISMISS_KEY_SEPARATOR +
              String((signal && signal.text) || '');
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function isDismissed(key) {
  const adapter = _dismissedSignalsStore;
  if (typeof adapter === 'function') return adapter(); // triggers the D37 throw
  return adapter.isDismissed(key);
}
function dismiss(key) {
  const adapter = _dismissedSignalsStore;
  if (typeof adapter === 'function') return adapter();
  return adapter.dismiss(key);
}
function undismiss(key) {
  const adapter = _dismissedSignalsStore;
  if (typeof adapter === 'function') return adapter();
  return adapter.undismiss(key);
}

// The real, production fs-backed adapter -- wired in server.js at startup.
// Caches the parsed Set in memory per adapter instance (loaded lazily on
// first use, kept in sync by dismiss()/undismiss()) so that a single
// long-lived server process only pays the file-read cost once, not once per
// signal per request -- required to stay within the <100ms render budget
// when composed with filterSignals()/paginateSignals() over ~5,340 signals.
// A SEPARATE adapter instance (e.g. in AC2's own persistence test) always
// re-reads the real file on its own first use, so this caching never masks
// a real cross-instance persistence bug.
function createFsDismissedSignalsStoreAdapter(filePath) {
  let _cache = null; // Set<string> | null
  function _load() {
    if (_cache) return _cache;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      _cache = new Set(Array.isArray(parsed) ? parsed.filter(function(x) { return typeof x === 'string'; }) : []);
    } catch (_) {
      // AC7: missing file (first use) or invalid JSON -- treat as empty, never throw.
      _cache = new Set();
    }
    return _cache;
  }
  function _persist() {
    fs.writeFileSync(filePath, JSON.stringify(Array.from(_cache)), 'utf8');
  }
  return {
    isDismissed: function(key) { return _load().has(key); },
    dismiss: function(key) { _load().add(key); _persist(); },
    undismiss: function(key) { _load().delete(key); _persist(); },
  };
}

module.exports = {
  isDismissed,
  dismiss,
  undismiss,
  deriveDismissKey,
  setDismissedSignalsStore,
  _resetDismissedSignalsStoreForTesting,
  createFsDismissedSignalsStoreAdapter,
};
