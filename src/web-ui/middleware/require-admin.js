'use strict';

// require-admin.js — middleware to enforce admin role on protected routes (arl-s2).
// Returns 403 for both unauthenticated and non-admin requests (avoids route enumeration).
// Must check BOTH userId AND role === 'admin'.

/**
 * requireAdmin — gate middleware for admin-only routes.
 * Returns 403 for unauthenticated users AND for authenticated non-admin users.
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId || req.session.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  next();
}

module.exports = { requireAdmin };
