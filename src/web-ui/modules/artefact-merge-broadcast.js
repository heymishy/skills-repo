'use strict';

// artefact-merge-broadcast.js — ep2-s4. In-memory pub/sub keyed by
// `${journeyId}:${stageName}`, so a merge triggered by one user's incoming
// save can push to every OTHER open SSE connection subscribed to that same
// journey+stage -- not just the two requests that triggered the merge.
// Single-instance in-memory assumption, matching this codebase's existing
// presence-store.js precedent (no cross-process pub/sub broker).

/** @type {Map<string, Set<import('http').ServerResponse>>} */
var _subscribers = new Map();

function subscribe(key, res) {
  if (!_subscribers.has(key)) _subscribers.set(key, new Set());
  _subscribers.get(key).add(res);
}

function unsubscribe(key, res) {
  var set = _subscribers.get(key);
  if (set) {
    set.delete(res);
    if (set.size === 0) _subscribers.delete(key);
  }
}

/**
 * Push a payload to every subscriber for this key. Gracefully skips any
 * response that has already closed (matches this codebase's own SSE
 * "must gracefully degrade" convention, see handleGetJourneyPresenceStream).
 * @param {string} key
 * @param {object} payload
 */
function publish(key, payload) {
  var set = _subscribers.get(key);
  if (!set) return;
  var data = 'data: ' + JSON.stringify(payload) + '\n\n';
  set.forEach(function (res) {
    try { res.write(data); } catch (_) { /* connection already closed */ }
  });
}

function _clearForTesting() { _subscribers = new Map(); }

module.exports = { subscribe, unsubscribe, publish, _clearForTesting };
