'use strict';

// impersonation.js (routes) — d1
// GET  /admin/impersonate           — search UI (requireAdmin, mounted in server.js)
// POST /api/admin/impersonate/start — reason-gated session swap (requireAdmin + CSRF)
// Mirrors team-management.js's createTeamManagementHandlers(pool) factory convention.

var { filterUsers, listImpersonationCandidates, getImpersonationCandidateById, startImpersonationSession } = require('../modules/impersonation');
var csrf = require('../middleware/csrf');

function _escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Read and parse the request body (form-urlencoded). Mirrors this repo's own
 * established _readBody convention (admin-credits.js, team-management.js).
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var params = new URLSearchParams(raw);
      var obj = {};
      params.forEach(function(v, k) { obj[k] = v; });
      resolve(obj);
    });
  });
}

/**
 * Build the two HTTP handlers, closed over a single pool instance (mirrors
 * team-management.js's createTeamManagementHandlers(pool) factory).
 * @param {object} pool
 * @returns {{handleGetImpersonatePage:Function, handlePostImpersonateStart:Function}}
 */
function createImpersonationHandlers(pool) {
  /**
   * GET /admin/impersonate — search form + CSRF-protected "Act as" form per
   * result (AC1). Reason is a required native input (AC2, Accessibility NFR:
   * fully keyboard-operable — native labelled controls, no custom widgets).
   */
  async function handleGetImpersonatePage(req, res) {
    var q = (req.query && req.query.q) || '';
    var candidates = await listImpersonationCandidates(pool);
    var results = filterUsers(candidates, q);
    var csrfToken = csrf.generateCsrfToken(req);

    var rows = results.map(function(u) {
      var idAttr = _escapeHtml(u.personId);
      return (
        '<tr><td>' + _escapeHtml(u.login) + '</td><td>' + _escapeHtml(u.tenantId) + '</td><td>' + _escapeHtml(u.role) + '</td>' +
        '<td><form method="POST" action="/api/admin/impersonate/start">' +
        csrf.csrfField(csrfToken) +
        // Only targetId is submitted -- login/tenantId/role are re-derived
        // server-side from targetId (see handlePostImpersonateStart), never
        // trusted from the client, so no hidden field for them is needed.
        '<input type="hidden" name="targetId" value="' + idAttr + '">' +
        '<label for="reason-' + idAttr + '">Reason (required)</label>' +
        '<input id="reason-' + idAttr + '" name="reason" type="text" required>' +
        '<button type="submit">Act as &rarr;</button>' +
        '</form></td></tr>'
      );
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Impersonate</title></head><body>' +
      '<h1>Impersonate</h1>' +
      '<form method="GET" action="/admin/impersonate">' +
      '<label for="q">Search by login or tenant</label>' +
      '<input id="q" name="q" type="text" value="' + _escapeHtml(q) + '">' +
      '<button type="submit">Search</button>' +
      '</form>' +
      '<table><thead><tr><th>Login</th><th>Tenant</th><th>Role</th><th>Action</th></tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      '</body></html>';

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  /**
   * POST /api/admin/impersonate/start — reason-gated session swap (AC2-AC5).
   * ADR-025 / D37: the actual swap mechanics live in modules/impersonation.js
   * (startImpersonationSession) — this handler only parses/validates the
   * request and maps error codes to HTTP statuses.
   *
   * Security fix (post-review, before merge): only `targetId` from the
   * request body is trusted. targetLogin/targetTenantId/targetRole are
   * IGNORED even if present in the body -- they exist only so the search
   * page's hidden form fields are self-describing to a human reading the
   * HTML; the actual login/tenantId/role used for the session swap and the
   * audit write are re-derived server-side from `targetId` via
   * getImpersonationCandidateById(), the same DB join listImpersonationCandidates
   * uses. A request with a targetId that doesn't correspond to a real
   * team_memberships row is rejected outright -- this also closes the gap
   * where a tampered hidden-form submission could otherwise write an
   * audit-log entry for a target/role combination that never existed.
   */
  async function handlePostImpersonateStart(req, res) {
    var csrfOk = await csrf.csrfGuard(req, res);
    if (!csrfOk) return;

    var body = await _readBody(req);
    var targetId = body && body.targetId;
    var reason = body && body.reason ? String(body.reason) : '';

    if (!targetId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'targetId is required' }));
      return;
    }

    var candidate = await getImpersonationCandidateById(pool, targetId);
    if (!candidate) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No such user found for the given targetId' }));
      return;
    }
    // startImpersonationSession expects `target.id`; getImpersonationCandidateById
    // returns `personId` (matching listImpersonationCandidates' own shape) --
    // map it here rather than changing either function's return shape.
    var target = { id: candidate.personId, login: candidate.login, tenantId: candidate.tenantId, role: candidate.role };

    try {
      var result = await startImpersonationSession(req.session, target, reason);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ started: true, auditId: result.auditId }));
    } catch (err) {
      if (err && err.code === 'REASON_REQUIRED') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'A reason is required to start an impersonation session.' }));
        return;
      }
      if (err && err.code === 'ALREADY_IMPERSONATING') {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Already impersonating a user -- exit first.' }));
        return;
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to start impersonation session.' }));
    }
  }

  return {
    handleGetImpersonatePage: handleGetImpersonatePage,
    handlePostImpersonateStart: handlePostImpersonateStart
  };
}

module.exports = { createImpersonationHandlers };
