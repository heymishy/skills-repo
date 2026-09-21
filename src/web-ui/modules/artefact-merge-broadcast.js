'use strict';

// artefact-merge-broadcast.js — ep2-s4. In-memory pub/sub keyed by
// `${journeyId}:${stageName}`, so a merge triggered by one user's incoming
// save can push to every OTHER open SSE connection subscribed to that same
// journey+stage -- not just the two requests that triggered the merge.
// Single-instance in-memory assumption, matching this codebase's existing
// presence-store.js precedent (no cross-process pub/sub broker).

/** @type {Map<string, Set<import('http').ServerResponse>>} */
var _subscribers = new Map();

/**
 * Build the canonical subscription key for a journey+stage pair. Task 5
 * constructs this same key at two independent call sites (the SSE subscribe
 * route and the merge-triggering publish call) -- always build it through
 * this function rather than re-deriving the `${journeyId}:${stageName}`
 * format inline, so the two sites can never drift out of sync (wrong order,
 * wrong separator, a typo) and cause publish() to silently reach zero
 * subscribers.
 * @param {string} journeyId
 * @param {string} stageName
 * @returns {string}
 */
function keyFor(journeyId, stageName) {
  return journeyId + ':' + stageName;
}

/**
 * Register `res` to receive future publish() payloads for `key`. Pairs with
 * unsubscribe(key, res) -- see that function's doc for the identity-match
 * contract. Callers should also wire `res.on('close', ...)` to call
 * unsubscribe when the connection ends; see handleGetJourneyPresenceStream
 * (src/web-ui/routes/journey.js:~3597) for the existing convention this
 * codebase uses to pair subscription with connection close.
 * @param {string} key
 * @param {import('http').ServerResponse} res
 */
function subscribe(key, res) {
  if (!key || !res) return;
  if (!_subscribers.has(key)) _subscribers.set(key, new Set());
  _subscribers.get(key).add(res);
}

/**
 * Remove `res` from `key`'s subscriber set. IMPORTANT: this is a `Set`-based
 * identity match, not a value match -- you MUST pass the exact same `res`
 * object reference that was passed to subscribe(key, res); a different
 * object with equivalent contents will not be found and removed. Typically
 * called from a `res.on('close', ...)` handler -- see
 * handleGetJourneyPresenceStream (src/web-ui/routes/journey.js:~3597) for
 * the existing convention this codebase uses to pair subscribe with
 * connection close.
 * @param {string} key
 * @param {import('http').ServerResponse} res
 */
function unsubscribe(key, res) {
  if (!key || !res) return;
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
 * @param {{type: string, journeyId: string, stageName: string, [k: string]: *}} payload
 *   Provisional shape, not exhaustive -- Task 5 defines the concrete fields.
 */
function publish(key, payload) {
  if (!key) return;
  var set = _subscribers.get(key);
  if (!set) return;
  var data = 'data: ' + JSON.stringify(payload) + '\n\n';
  set.forEach(function (res) {
    try { res.write(data); } catch (_) { /* connection already closed */ }
  });
}

function _clearForTesting() { _subscribers = new Map(); }

module.exports = { keyFor, subscribe, unsubscribe, publish, _clearForTesting };
