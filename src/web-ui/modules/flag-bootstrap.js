'use strict';

// flag-bootstrap.js — bri-s1.3: server-side flag bootstrap at session start.
// Resolves all relevant flags once per session via S1.1's isEnabled(), caches the
// result onto req.session.flags, and applies its own bounded timeout so a
// slow/hanging PostHog call can never block session start beyond the documented
// Performance NFR budget (200ms) — this is in addition to (not a replacement for)
// isEnabled()'s own reject-to-false safe default (S1.1 AC4).
//
// AC2's "does not apply until next session-start" behaviour is a direct consequence
// of the caching mechanism here: once req.session.flags is populated, this function
// never re-queries isEnabled() for the lifetime of that session object.
//
// tgid-s1: this is also the one real, already-live session-bootstrap entry point,
// so it's where bri-s1.4's identifyTenantGroup() gets called too — once per session,
// same as flag resolution, so PostHog's dashboard actually shows tenants as Groups
// (isEnabled()'s own automatic groups.tenant derivation already handled targeting
// correctly; this just registers the group so it's visible/segmentable in PostHog
// itself). Bounded by the same _withTimeout wrapper as the flag calls below.

var DEFAULT_TIMEOUT_MS = 200;

// The set of flags resolved at session-bootstrap time. bri-s1.5 (initial flags wired)
// is expected to extend this list as more flags are named; bri-s1.3 seeds it with the
// one flag named in this story's Architecture Constraints / Downstream note (wizard-ui).
var FLAG_KEYS = ['wizard-ui'];

/**
 * Race a flag-resolution promise against a bounded timeout. Resolves `false`
 * (the documented safe default) if the promise neither resolves nor rejects
 * within `ms` milliseconds, or if it rejects.
 * @param {Promise<boolean>} promise
 * @param {number} ms
 * @returns {Promise<boolean>}
 */
function _withTimeout(promise, ms) {
  return new Promise(function(resolve) {
    var settled = false;
    var timer = setTimeout(function() {
      if (!settled) { settled = true; resolve(false); }
    }, ms);
    Promise.resolve(promise).then(function(val) {
      if (!settled) { settled = true; clearTimeout(timer); resolve(val === true); }
    }, function() {
      if (!settled) { settled = true; clearTimeout(timer); resolve(false); }
    });
  });
}

/**
 * Resolve and cache all relevant flags for this session, ahead of page render.
 *
 * AC1: every relevant flag is resolved and attached to req.session.flags before
 * this function returns — no client-side flag fetch needs to precede first paint.
 *
 * AC2: if req.session.flags is already populated (a prior bootstrap call within
 * this same session), returns the cached value as-is without re-querying
 * isEnabled() — a flag toggled in PostHog mid-session has no effect until the
 * next session start (a fresh session object).
 *
 * AC3: applies its own bounded timeout (default 200ms) around each isEnabled()
 * call so a slow or hanging PostHog call can never block session start
 * indefinitely — the affected flag defaults to false in that case.
 *
 * tgid-s1 AC1-AC4: also calls identifyTenantGroup(tenantId) exactly once per session
 * (same first-bootstrap-only gate as flag resolution), skipped entirely when no
 * tenantId is present, and bounded by the same timeout wrapper as the flag calls
 * so a slow/hanging group-identify call can never delay bootstrap either.
 *
 * @param {object} req - must have a mutable req.session object
 * @param {object} [deps] - { isEnabled, identifyTenantGroup, timeoutMs } injected for
 *   testability; defaults to the real S1.1 isEnabled(), the real bri-s1.4
 *   identifyTenantGroup(), and a 200ms timeout budget
 * @returns {Promise<object>} the resolved (or cached) flags map
 */
async function bootstrapFlags(req, deps) {
  deps = deps || {};
  if (!req || !req.session) return {};

  if (req.session.flags && typeof req.session.flags === 'object') {
    return req.session.flags; // AC2 — do not re-query; serve the cached value
  }

  var posthogFlags = require('./posthog-flags');
  var isEnabledFn = deps.isEnabled || posthogFlags.isEnabled;
  var identifyTenantGroupFn = deps.identifyTenantGroup || posthogFlags.identifyTenantGroup;
  var timeoutMs = typeof deps.timeoutMs === 'number' ? deps.timeoutMs : DEFAULT_TIMEOUT_MS;
  var tenantId = req.session.tenantId;
  var context = { tenantId: tenantId };

  if (tenantId) {
    // tgid-s1 AC1, AC3, AC4 — bounded by the same timeout budget as flag resolution;
    // identifyTenantGroup() already swallows its own adapter failures (bri-s1.4 AC3),
    // this wrapper only guarantees it can't hang bootstrap either. Return value unused
    // (_withTimeout is boolean-shaped for the flag-resolution case above; here it's
    // purely a bounded-wait, the resolved value is discarded).
    await _withTimeout(identifyTenantGroupFn(tenantId), timeoutMs);
  }

  var flags = {};
  for (var i = 0; i < FLAG_KEYS.length; i++) {
    var key = FLAG_KEYS[i];
    flags[key] = await _withTimeout(isEnabledFn(key, context), timeoutMs);
  }
  req.session.flags = flags;
  return flags;
}

module.exports = { bootstrapFlags: bootstrapFlags, FLAG_KEYS: FLAG_KEYS };
