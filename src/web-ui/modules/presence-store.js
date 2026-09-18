'use strict';

// ep2-s1: in-memory per-journey presence tracking, deliberately separate
// from journey.js's existing _viewerActivity (same Map<journeyId,
// Map<login, lastSeenMs>> shape, same 30s threshold) -- see decisions.md
// (2026-09-18) for why this is a parallel module rather than a refactor
// of that already-shipped code, and why it's in-memory rather than a new
// Postgres feature_presence table.

var _now = function () { return Date.now(); };
function setNow(fn) { _now = fn; }

var STALE_MS = 30000;

/** @type {Map<string, Map<string, number>>} journeyId -> Map<login, lastSeenMs> */
var _activity = new Map();

function registerActivity(journeyId, login) {
  if (!journeyId || !login) return;
  if (!_activity.has(journeyId)) _activity.set(journeyId, new Map());
  _activity.get(journeyId).set(login, _now());
}

/**
 * @param {string} journeyId
 * @param {string} login
 * @returns {{status: 'online'|'offline', lastSeenMs: number|null}}
 */
function getStatus(journeyId, login) {
  var map = _activity.get(journeyId);
  var lastSeen = map ? map.get(login) : undefined;
  if (lastSeen == null) return { status: 'offline', lastSeenMs: null };
  var age = _now() - lastSeen;
  return { status: age < STALE_MS ? 'online' : 'offline', lastSeenMs: lastSeen };
}

function _clearForTesting() { _activity = new Map(); }

/**
 * Test-only: seed a presence entry as if it was registered `ageMs`
 * milliseconds ago, without needing to wait `ageMs` of real time or
 * override the whole module's clock via setNow (which would also affect
 * unrelated concurrent state). Used by the /test/seed-presence E2E
 * fixture endpoint to simulate a stale/offline collaborator.
 */
function _seedStaleActivity(journeyId, login, ageMs) {
  if (!_activity.has(journeyId)) _activity.set(journeyId, new Map());
  _activity.get(journeyId).set(login, _now() - ageMs);
}

module.exports = { registerActivity, getStatus, setNow, STALE_MS, _clearForTesting, _seedStaleActivity };
