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
//   groupIdentify(groupType, groupKey) → Promise<void>  (optional — registers a PostHog Group
//                                                         Analytics group; bri-s1.4)
//
// bri-s1.4 — tenant-level flag targeting via PostHog Group Analytics:
// isEnabled() automatically derives a `groups.tenant` targeting key from context.tenantId
// (see _withTenantGroup below) so every flag evaluation is scoped to the tenant, not the
// individual user, with no extra work required by call sites (AC1, AC2, AC4 — including the
// solo-tenant case, which uses this exact same derivation, no special-casing). identifyTenantGroup()
// registers the tenant as a PostHog group ahead of evaluation, through this same adapter — not a
// second, parallel adapter mechanism (Architecture Constraints, D37).

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
  return _withTenantGroup(safe); // bri-s1.4 — evaluate against the tenant's group, not the user
}

/**
 * Derive the PostHog Group Analytics targeting key from context.tenantId (bri-s1.4, AC1/AC2/AC4).
 * Every isEnabled() call whose context carries a tenantId is automatically evaluated against
 * that tenant's PostHog group — callers do not need to build the `groups` object themselves,
 * and the solo-tenant case (AC4) goes through this exact same derivation with no special-casing.
 * A caller-supplied context.groups.tenant (if already present) is never overwritten.
 * @param {object} context
 * @returns {object}
 */
function _withTenantGroup(context) {
  if (!context || typeof context !== 'object' || context.tenantId == null) return context;
  if (context.groups && context.groups.tenant != null) return context;
  const groups = Object.assign({}, context.groups, { tenant: context.tenantId });
  return Object.assign({}, context, { groups: groups });
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

/**
 * Register (identify) a tenant as a PostHog Group Analytics group ahead of flag evaluation
 * (bri-s1.4), so PostHog has a group record to target flags against (AC2). Wired through the
 * same D37 injectable adapter as isEnabled() — no second, parallel adapter mechanism
 * (Architecture Constraints).
 *
 * Inherits isEnabled()'s D37 stub-throw behaviour when no adapter has been wired at all — a
 * misconfiguration must be visible immediately, same as isEnabled().
 *
 * Once an adapter is wired, this call must never crash the caller: first-time group-type
 * registration (or any registration failure/delay) is caught and swallowed here — isEnabled()
 * falls back to its own documented safe default independently of whether group identification
 * succeeded (AC3).
 *
 * @param {string} tenantId
 * @returns {Promise<void>}
 */
async function identifyTenantGroup(tenantId) {
  const adapter = _requireAdapter(); // D37 — inherited stub-throw when unwired, same as isEnabled()
  if (typeof adapter.groupIdentify !== 'function') return; // adapter doesn't support group identification — no-op

  try {
    await adapter.groupIdentify('tenant', tenantId);
  } catch (err) {
    // AC3 — first-time group-type registration (or any failure/delay) must never crash the
    // caller; isEnabled() still falls back to its own safe default independently of this call.
  }
}

/**
 * Resolve the tenantId used for group targeting/identification exclusively from
 * req.session.tenantId — never from req.body or req.query (Security NFR, ADR-025). A client
 * cannot claim a different tenant via request body/query to influence which tenant's flag or
 * group state is read.
 *
 * @param {object} req - an Express-style request object
 * @returns {string|null}
 */
function resolveTenantIdFromRequest(req) {
  return (req && req.session && req.session.tenantId) || null;
}

module.exports = { setPostHogFlagsAdapter, isEnabled, identifyTenantGroup, resolveTenantIdFromRequest };
