'use strict';

// team-management.js — tir-s3
// GET  /team/members       — admin-only team management page (add-teammate form).
// POST /api/team/members   — admin-only add/assign-role action.
// Both routes are mounted behind requireAdmin in server.js (matches
// admin-credits.js's convention exactly -- requireAdmin applied at mount
// time, not inside the handler, AC3).

var teamManagement = require('../modules/team-management');
// sec-perf-s3: session-scoped CSRF (Cross-Site Request Forgery) protection.
var csrf = require('../middleware/csrf');

// Audit logger — replaced via setLogger() in tests and production bootstrap.
// Mirrors account-linking.js's own _logger / setLogger convention exactly.
let _logger = {
  info: (/* event, data */) => {}
};

/**
 * Replace the audit logger (used in tests and production startup).
 * @param {{ info: Function }} logger
 */
function setLogger(logger) {
  _logger = logger;
}

function _escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Read and parse the request body (form-urlencoded). Mirrors admin-credits.js's
 * own _readBody convention exactly.
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
 * account-linking.js's createLinkCallbackHandlers(pool) factory convention).
 * No new D37 adapter (DoR H-ADAPTER: direct DB access, app-layer logic).
 * @param {object} pool
 * @returns {{handleGetTeamMembers: Function, handleAddTeammate: Function}}
 */
function createTeamManagementHandlers(pool) {
  /**
   * GET /team/members — minimal, functional admin page with an add-teammate
   * form (identity + role). No polished UI required (story's Out of Scope
   * covers only invite/removal flows, not this page's existence) -- the
   * WCAG 2.1 AA NFR is verified manually per the test plan; native, labelled
   * form controls satisfy it informally, matching account-linking.js's page.
   */
  function handleGetTeamMembers(req, res) {
    var roleOptions = teamManagement.VALID_ROLES.map(function(r) {
      return '<option value="' + _escapeHtml(r) + '">' + _escapeHtml(r) + '</option>';
    }).join('');

    // sec-perf-s3 AC2: session-scoped CSRF token, embedded in the add-teammate form below.
    var csrfToken = csrf.generateCsrfToken(req);

    var html = '<!DOCTYPE html><html><head><title>Team members</title></head><body>' +
      '<h1>Team members</h1>' +
      '<form method="POST" action="/api/team/members">' +
      csrf.csrfField(csrfToken) +
      '<label for="identity">Add teammate by identity (GitHub login, Google email, or email/password email)</label>' +
      '<input id="identity" name="identity" type="text" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Add teammate</button>' +
      '</form>' +
      '</body></html>';

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  /**
   * POST /api/team/members — add or update a teammate's role in the calling
   * admin's own tenant (AC1, AC4). ADR-025: tenantId is ALWAYS
   * req.session.tenantId -- the request body carries only `identity` and
   * `role`; any other field (including a spoofed tenant) is ignored, so
   * there is no cross-tenant write surface at all.
   */
  async function handleAddTeammate(req, res) {
    // sec-perf-s3 AC2: reject a POST that does not carry a valid session-scoped CSRF token.
    var csrfOk = await csrf.csrfGuard(req, res);
    if (!csrfOk) return;

    var body = await _readBody(req);
    var identity = body && body.identity ? String(body.identity) : '';
    var role = body && body.role ? String(body.role) : '';
    var adminTenantId = req.session && req.session.tenantId;
    var adminId = req.session && req.session.userId;

    if (!identity || !role) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'identity and role are both required' }));
      return;
    }

    try {
      var result = await teamManagement.addOrUpdateTeammate(pool, adminTenantId, identity, role, adminId, _logger);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      if (err instanceof teamManagement.UnknownIdentityError || err instanceof teamManagement.InvalidRoleError) {
        res.writeHead(err.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      throw err;
    }
  }

  return { handleGetTeamMembers: handleGetTeamMembers, handleAddTeammate: handleAddTeammate };
}

module.exports = { createTeamManagementHandlers: createTeamManagementHandlers, setLogger: setLogger };
