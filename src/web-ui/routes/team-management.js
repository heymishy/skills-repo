'use strict';

// team-management.js — tir-s3
// GET  /team/members       — admin-only team management page (add-teammate form).
// POST /api/team/members   — admin-only add/assign-role action.
// Both routes are mounted behind requireAdmin in server.js (matches
// admin-credits.js's convention exactly -- requireAdmin applied at mount
// time, not inside the handler, AC3).

var teamManagement = require('../modules/team-management');
var teamInvitations = require('../modules/team-invitations');
var magicLinkStrategy = require('../auth/magic-link-strategy');
// sec-perf-s3: session-scoped CSRF (Cross-Site Request Forgery) protection.
var csrf = require('../middleware/csrf');
var _posthog = require('../modules/posthog-server');
var htmlShell = require('../utils/html-shell');

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
      return '<option value="' + htmlShell.escHtml(r) + '">' + htmlShell.escHtml(r) + '</option>';
    }).join('');

    // sec-perf-s3 AC2: session-scoped CSRF token, embedded in the add-teammate form below.
    var csrfToken = csrf.generateCsrfToken(req);

    var bodyContent = '<h1>Team members</h1>' +
      '<form method="POST" action="/api/team/members">' +
      csrf.csrfField(csrfToken) +
      '<label for="identity">Add teammate by identity (GitHub login, Google email, or email/password email)</label>' +
      '<input id="identity" name="identity" type="text" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Add teammate</button>' +
      '</form>';

    var html = htmlShell.renderShell({
      title: 'Team members',
      bodyContent: bodyContent,
      user: req.session,
      active: 'team-members',
      crumbs: ['Team members'],
      isAdmin: true
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  /**
   * GET /team/invites/new — minimal, functional form to create a team
   * invite (wsi-s6 AC1, AC4). Reuses handleGetTeamMembers's exact existing
   * rendering pattern -- native labelled controls, a real <button>, the
   * same CSRF field embedding convention. Role options come from the same
   * VALID_ROLES array wsi-s1's own handler already validates against
   * server-side. The form POSTs to wsi-s1's existing /api/team/invites
   * endpoint unchanged -- no new request shape (AC2).
   */
  function handleGetCreateInviteForm(req, res) {
    var roleOptions = teamManagement.VALID_ROLES.map(function(r) {
      return '<option value="' + _escapeHtml(r) + '">' + _escapeHtml(r) + '</option>';
    }).join('');

    var csrfToken = csrf.generateCsrfToken(req);

    var html = '<!DOCTYPE html><html><head><title>Invite a teammate</title></head><body>' +
      '<h1>Invite a teammate</h1>' +
      '<form method="POST" action="/api/team/invites">' +
      csrf.csrfField(csrfToken) +
      '<label for="email">Email</label>' +
      '<input id="email" name="email" type="email" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Send invite</button>' +
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

  /**
   * POST /api/team/invites — create a per-person team invite (wsi-s1 AC1),
   * then email it as a signed magic-link JWT carrying teamInvitationId
   * (AC2), surfacing a distinct error if the send itself fails (AC5).
   * ADR-025: tenantId is ALWAYS req.session.tenantId, never request input.
   */
  async function handleCreateInvite(req, res) {
    // sec-perf-s3 AC2: reject a POST that does not carry a valid session-scoped CSRF token.
    var csrfOk = await csrf.csrfGuard(req, res);
    if (!csrfOk) return;

    var body = await _readBody(req);
    var email = body && body.email ? String(body.email) : '';
    var role = body && body.role ? String(body.role) : '';
    var tenantId = req.session && req.session.tenantId;
    var adminId = req.session && req.session.userId;

    if (!email || !role) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'email and role are both required' }));
      return;
    }

    try {
      if (teamManagement.VALID_ROLES.indexOf(role) === -1) {
        throw new teamManagement.InvalidRoleError('Invalid role \'' + role + '\'. Must be one of: ' + teamManagement.VALID_ROLES.join(', '));
      }

      var invite = await teamInvitations.createInvitation(pool, tenantId, email, role, adminId, _logger);

      // wsi-s5 AC1: real, observable event for the "share of self-serve
      // invites" benefit metric -- fire-and-forget, never blocks the
      // response (matches this codebase's existing _posthog.capture
      // convention elsewhere). Never includes the invitee's raw email.
      _posthog.capture(tenantId, 'team_invite_created', {
        tenant_id: tenantId,
        role: role,
        team_invitation_id: invite.team_invitation_id
      });

      // AC2/AC5: issues the signed magic-link JWT (carrying teamInvitationId)
      // and sends it via the reused sendInvitationEmail adapter (see
      // auth/magic-link-strategy.js's sendMagicLink wiring in server.js) --
      // mirrors agency-provisioning.js's own handlePostInviteUser exactly,
      // including the explicit success check below: passport-magic-login's
      // own .send() swallows a rejected sendMagicLink into {success:false}
      // rather than rejecting the promise, so a failed send must be checked
      // for explicitly or it is silently reported back as a success.
      var sent;
      try {
        sent = await magicLinkStrategy.issueMagicLink(invite.email, { teamInvitationId: invite.team_invitation_id });
      } catch (err) {
        sent = null;
      }

      if (!sent || !sent.success) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'The invite was created but could not be emailed. Please try again.' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ team_invitation_id: invite.team_invitation_id, email: invite.email, role: invite.role, expires_at: invite.expires_at }));
    } catch (err) {
      if (err instanceof teamManagement.InvalidRoleError) {
        res.writeHead(err.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      throw err;
    }
  }

  return { handleGetTeamMembers: handleGetTeamMembers, handleAddTeammate: handleAddTeammate, handleCreateInvite: handleCreateInvite, handleGetCreateInviteForm: handleGetCreateInviteForm };
}

module.exports = { createTeamManagementHandlers: createTeamManagementHandlers, setLogger: setLogger };
