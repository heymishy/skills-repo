'use strict';

// require-non-viewer.js — middleware denying write actions for the 'viewer' role (vrne-s1).
// Reuses require-admin.js's resolveRole(req) so both gates observe identical
// live-role-resolution behaviour by construction, not by two independently-
// maintained copies (decisions.md ARCH entry, 2026-08-22, resolving review
// finding 1-M1 on vrne-s1).
//
// Fail-closed by design: uses an explicit ALLOWED_ROLES allowlist rather than
// a 'viewer' blocklist, so any future role this allowlist doesn't already name
// is denied by default -- matching this repo's own "Access control: Deny by
// default" security standard.

const { resolveRole } = require('./require-admin');

// Injectable audit logger -- NOT a D37 throw-on-unwired adapter, mirrors
// require-admin.js's own _logger: a logging failure must never block the
// access-control decision itself, so the default is a safe no-op.
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

const ALLOWED_ROLES = ['admin', 'engineer', 'product'];

/**
 * requireNonViewer — gate middleware denying write actions for the 'viewer' role.
 * Returns 403 for unauthenticated requests AND for any role not in ALLOWED_ROLES
 * (fail-closed: viewer, missing, null, or any unrecognised role value).
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
async function requireNonViewer(req, res, next) {
  const { hasSession, role } = await resolveRole(req);

  const isAllowed = !!(hasSession && ALLOWED_ROLES.includes(role));
  if (!isAllowed) {
    _logger.warn('viewer_write_denied', {
      personId: (req.session && req.session.userId) || null,
      tenantId: (req.session && req.session.tenantId) || null,
      timestamp: new Date().toISOString(),
      route: (req && req.url) || null
    });
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  next();
}

module.exports = { requireNonViewer, setLogger };
