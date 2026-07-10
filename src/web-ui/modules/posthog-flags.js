'use strict';

// posthog-flags.js — D37-injectable adapter for the shared isEnabled() flag helper (bri-s1.1)
// Default stub throws — call setPostHogFlagsAdapter() with a real implementation before use.
// Real posthog-node client construction and setPostHogFlagsAdapter() wiring into server.js
// is a separate D37 wiring task, out of scope for this module (see story Architecture Constraints).
//
// This module is the single shared evaluation path used identically by every API route and
// every UI-rendering code path, so flag state can never diverge between what the API returns
// and what the UI renders (AC3).
//
// The adapter must implement:
//   evaluateFlag(flagKey, context) → Promise<boolean>   (queries PostHog for the flag's boolean state)

let _postHogFlagsAdapter = null;

// Context keys that must never be forwarded to the adapter's evaluateFlag call (Security NFR) —
// matches accessToken, sessionToken, token, refreshToken, etc.
const _TOKEN_KEY_PATTERN = /token/i;

/**
 * D37 mandatory: default stub throws if called without wiring.
 * @returns {object}
 */
function _requireAdapter() {
  if (!_postHogFlagsAdapter) {
    throw new Error('Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.');
  }
  return _postHogFlagsAdapter;
}

/**
 * Wire the real PostHog flags adapter (done in server.js — separate D37 wiring task).
 * @param {{ evaluateFlag: Function }} impl
 */
function setPostHogFlagsAdapter(impl) {
  _postHogFlagsAdapter = impl;
}

/**
 * Strip any token-shaped field (e.g. accessToken, sessionToken) from a context object before
 * it is forwarded to the adapter's evaluateFlag call (Security NFR) — a caller accidentally
 * passing the whole session object must never leak a token value to PostHog.
 * @param {object} context
 * @returns {object}
 */
function _sanitizeContext(context) {
  if (!context || typeof context !== 'object') return context;
  const safe = {};
  for (const key of Object.keys(context)) {
    if (_TOKEN_KEY_PATTERN.test(key)) continue;
    safe[key] = context[key];
  }
  return safe;
}

/**
 * Evaluate a boolean feature flag for the given context.
 * Shared by every API route and every UI-rendering code path (AC3) — both call sites must
 * use this exact function reference so flag state can never diverge.
 *
 * D37 mandatory (AC2): if no adapter has been wired, this rejects with the documented stub
 * error rather than silently returning false — a misconfiguration must be visible immediately.
 *
 * Safe-default behaviour (AC4): if the wired adapter's evaluateFlag call fails (network error,
 * timeout, any thrown/rejected error), isEnabled() resolves to false rather than propagating
 * the failure — a PostHog outage must never crash a request.
 *
 * @param {string} flagKey
 * @param {object} [context]
 * @returns {Promise<boolean>}
 */
async function isEnabled(flagKey, context) {
  const adapter = _requireAdapter(); // AC2 — must throw/reject here, before the safe-default try/catch below

  const safeContext = _sanitizeContext(context);
  try {
    const result = await adapter.evaluateFlag(flagKey, safeContext);
    return result === true;
  } catch (err) {
    return false; // AC4 — safe default; the feature stays off rather than crashing the request
  }
}

module.exports = { setPostHogFlagsAdapter, isEnabled };
