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

/**
 * requireAdmin — gate middleware for admin-only routes.
 * Returns 403 for unauthenticated users AND for authenticated non-admin users.
 * Fail-closed by default (tir-s4 AC4): any session/role state that is not unambiguously
 * { userId: <truthy>, role: 'admin' } is denied.
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
function requireAdmin(req, res, next) {
  const isAdmin = !!(req.session && req.session.userId && req.session.role === 'admin');
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

module.exports = { requireAdmin, setLogger };
