'use strict';

// require-admin.js — middleware to enforce admin role on protected routes (arl-s2, tir-s4).
// Returns 403 for both unauthenticated and non-admin requests (avoids route enumeration).
// Must check BOTH userId AND role === 'admin'.
//
// tir-s4: role is now sourced per-person via tir-s1's people/team_memberships schema
// (populated into req.session.role at login time) rather than tenant-wide. The strict
// `=== 'admin'` equality check below was already fail-closed by construction -- any value
// that is not exactly the string 'admin' (missing, null, stale, or any other role) is
// denied -- so no change to the comparison itself was needed to satisfy AC1-AC4. The one
// real gap this story closes is audit logging of denied attempts (NFR: Audit), added below.
//
// sec-perf-s2: req.session.role is set once at login and never re-checked or invalidated
// for the life of the session -- so an admin demoted mid-session via
// team-management.js's addOrUpdateTeammate (tir-s3) kept stale admin access until they
// logged out and back in. Adds an injectable live-role adapter (setGetCurrentRole) that,
// when wired, re-resolves the role from the database on every request and self-heals
// req.session.role to match -- closing that gap without needing a person->session-ID
// index (see decisions.md D1 for why this approach was chosen over session invalidation).
//
// D37 (decisions.md D1): the default when setGetCurrentRole is UNWIRED is an explicit
// fallback to this file's pre-sec-perf-s2 behaviour (trust req.session.role as-is), NOT a
// throw. This is a deliberate, logged deviation from the "stub defaults MUST throw" rule --
// required so that arl-s2/tir-s4/tir-s5's existing test suites, which call requireAdmin
// directly without wiring this adapter, continue to pass unmodified. In production,
// server.js always wires the adapter (sec-perf-s2 AC5), so this fallback branch is dead in
// production. Mirrors the existing precedent in user-roles.js's getRoleForTenant (falls
// back to the legacy getUserRole adapter when unwired) and tir-s9's additive-default
// pattern for its own new adapter parameter.

// Injectable audit logger (NOT a D37 throw-on-unwired adapter -- a logging failure must
// never alter or block the access-control decision itself, so the default is a safe
// no-op, mirroring the existing precedent in routes/auth.js's _logger).
let _logger = {
  warn: function(/* event, data */) {}
};

/**
 * Replace the audit logger (used in tests and production bootstrap).
 * @param {{ warn: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

// sec-perf-s2: injectable live-role adapter. Defaults to null (unwired) -- see the D37
// note above for why this deviates from the usual stub-throws convention.
let _getCurrentRole = null;

/**
 * Wire the live-role lookup adapter (used in production bootstrap and in this story's own
 * tests). Left unwired, requireAdmin falls back to trusting the cached req.session.role
 * exactly as it did before this story (AC4).
 * @param {Function} fn - async (tenantId: string) => Promise<string> role, e.g. the
 *   existing getRoleForTenant(tenantId) adapter from modules/user-roles.js.
 */
function setGetCurrentRole(fn) {
  _getCurrentRole = fn;
}

/**
 * requireAdmin — gate middleware for admin-only routes.
 * Returns 403 for unauthenticated users AND for authenticated non-admin users.
 * Fail-closed by default (tir-s4 AC4): any session/role state that is not unambiguously
 * { userId: <truthy>, role: 'admin' } is denied.
 *
 * sec-perf-s2: when a live-role adapter is wired (setGetCurrentRole), the role is
 * re-resolved from the database on every call rather than trusted from the cached
 * req.session.role -- closing the window where a mid-session demotion (or promotion)
 * would otherwise go unnoticed until the next login. req.session.role is overwritten
 * with the live value so later reads elsewhere in the app see the corrected role too
 * (AC2). A rejected/erroring adapter call fails closed -- denies -- rather than falling
 * back to the possibly-stale cached role (AC6). When unwired, this function performs the
 * exact same synchronous, cached-role-only decision it always has (AC4) -- no `await`
 * occurs on that path, so pre-existing callers that do not await this function's return
 * value still observe the correct next()/403 decision by the time the call returns.
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 * @returns {Promise<void>|void}
 */
async function requireAdmin(req, res, next) {
  const hasSession = !!(req.session && req.session.userId);
  let role = hasSession ? req.session.role : undefined;

  if (hasSession && _getCurrentRole) {
    try {
      role = await _getCurrentRole(req.session.tenantId);
    } catch (_err) {
      // AC6: fail closed on adapter error -- never fall back to the stale cached role.
      role = null;
    }
    // AC2: self-heal the cached session role so later reads elsewhere agree with the DB.
    req.session.role = role;
  }

  const isAdmin = !!(hasSession && role === 'admin');
  if (!isAdmin) {
    // tir-s4 NFR-Audit: log every denial with person ID, tenant ID, and timestamp.
    _logger.warn('admin_access_denied', {
      personId: (req.session && req.session.userId) || null,
      tenantId: (req.session && req.session.tenantId) || null,
      timestamp: new Date().toISOString()
    });
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  next();
}

module.exports = { requireAdmin, setLogger, setGetCurrentRole };
