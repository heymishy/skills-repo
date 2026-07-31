'use strict';

// agency-provisioning.js -- story-3-self-service-provisioning
// (artefacts/2026-07-30-agency-client-organisations)
//
// GET  /agency/clients/new          -- Create Client form (Agency-only, AC2)
// POST /agency/clients/new          -- Create Client org + relationship (AC1/AC2/AC4)
// GET  /agency/clients/:id/invite   -- Invite-first-user form (Agency-only)
// POST /agency/clients/:id/invite   -- Issue invitation (AC3, AC5)
// GET  /invite/redeem               -- Redeem invitation link (AC3) -- creates the
//                                       Client-org user account + team_memberships
//                                       row (role='admin') and resolves a session,
//                                       through the SAME shared magic-link strategy
//                                       Story 4 will extend for ongoing login.
//
// Factory function mirrors team-management.js's createTeamManagementHandlers(pool)
// convention (DoR H-ADAPTER: direct DB access via modules/organisations.js +
// modules/agency-client-grants.js + modules/client-invitations.js -- not itself a
// new D37 adapter). The ONE D37 adapter this story introduces is
// modules/invitation-email.js's sendInvitationEmail (AC5) -- a genuinely external,
// swappable integration (Resend) -- wired separately in server.js.
//
// Scope note (flagged, not guessed -- see decisions.md 2026-07-31, story-3): the
// invite-user routes below verify the CALLER's own org_type is 'agency', but do
// NOT verify that the calling Agency org is specifically the one with an
// agency_client_relationships row to the target client_org_id. Story 2's
// modules/agency-client-grants.js exposes no "list relationships for an agency"
// lookup, and adding one is outside this story's DoR-contracted touch points.
// This means any two Agency-type orgs can currently invite a user into any
// Client org whose ID they know or guess, not just a Client org they created.
// Flagged for operator confirmation (PR description + decisions.md) rather than
// silently guessed at or silently left undocumented.

var crypto = require('crypto');
var organisations = require('../modules/organisations');
var agencyClientGrants = require('../modules/agency-client-grants');
var clientInvitations = require('../modules/client-invitations');
var magicLinkStrategy = require('../auth/magic-link-strategy');
var _session = require('../middleware/session');

/**
 * Read and parse the request body -- supports JSON and form-urlencoded,
 * mirrors this codebase's repeated _readBody convention (products.js,
 * auth-email.js, team-management.js).
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  if (typeof req.on !== 'function') return Promise.resolve({});
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var ct = (req.headers && req.headers['content-type']) || '';
      if (ct.indexOf('application/json') !== -1) {
        try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
      } else {
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      }
    });
    req.on('error', function() { resolve({}); });
  });
}

function _escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mirrors this codebase's repeated "res.status ? Express-mock : raw http" dual path (products.js). */
function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

/** Renders a minimal, functional, keyboard-navigable HTML page -- mirrors team-management.js's handleGetTeamMembers convention (no polished UI required by this story's NFRs beyond real <form>/<input> elements). */
function _sendHtml(res, status, html) {
  if (res.status) { res.status(status).json({ html: html }); }
  else { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); }
}

/**
 * AC4: reject blank/invalid names, matching handlePostProductConfirm's
 * existing path-traversal-style name-validation convention (the closest
 * real validation pattern this codebase has for a persisted "name" field).
 * @param {string} name
 * @returns {boolean}
 */
function _invalidOrgName(name) {
  if (!name || !String(name).trim()) return true;
  var n = String(name);
  return n.indexOf('..') !== -1 || n.indexOf('/') !== -1 || n.indexOf('\\') !== -1;
}

/**
 * Build the 5 route handlers, closed over a single pool instance.
 * @param {object} pool
 * @returns {{handleGetCreateClient:Function, handlePostCreateClient:Function, handleGetInviteUser:Function, handlePostInviteUser:Function, handleGetInviteRedeem:Function}}
 */
function createAgencyProvisioningHandlers(pool) {
  /** GET /agency/clients/new -- Create Client form (Agency-only, AC2). */
  async function handleGetCreateClient(req, res) {
    var tenantId = req.session && req.session.tenantId;
    var org = await organisations.resolveOrganisationForTenant(pool, tenantId);
    if (!org || org.org_type !== 'agency') {
      // AC2: server-side rejection, never a client-side-only restriction (NFR-Security).
      _sendJson(res, 403, { error: 'This flow is only reachable by Agency-type organisations.' });
      return;
    }
    var html = '<!DOCTYPE html><html><head><title>Create Client</title></head><body>' +
      '<h1>Create a Client organisation</h1>' +
      '<form method="POST" action="/agency/clients/new">' +
      '<label for="name">Client organisation name</label>' +
      '<input id="name" name="name" type="text" required>' +
      '<button type="submit">Create Client</button>' +
      '</form>' +
      '</body></html>';
    _sendHtml(res, 200, html);
  }

  /** POST /agency/clients/new -- create the Client org + relationship (AC1/AC2/AC4). */
  async function handlePostCreateClient(req, res) {
    var body = await _readBody(req);
    var name = body && body.name;
    var tenantId = req.session && req.session.tenantId;

    var org = await organisations.resolveOrganisationForTenant(pool, tenantId);
    if (!org || org.org_type !== 'agency') {
      // AC2: server-side rejection -- never a client-side-only restriction.
      _sendJson(res, 403, { error: 'This flow is only reachable by Agency-type organisations.' });
      return;
    }

    if (_invalidOrgName(name)) {
      // AC4: blank/invalid name -- no organisations row created.
      _sendJson(res, 400, { error: 'A valid Client organisation name is required.' });
      return;
    }

    var clientOrgId = 'client-' + crypto.randomBytes(12).toString('hex');
    await organisations.createOrganisation(pool, clientOrgId, String(name).trim(), 'client');
    var relationship = await agencyClientGrants.createRelationship(pool, tenantId, clientOrgId);

    // Audit (NFR): Agency admin identity + new Client org's ID + timestamp.
    console.log(JSON.stringify({
      event: 'client_org_created',
      agency_org_id: tenantId,
      client_org_id: clientOrgId,
      relationship_id: relationship.relationship_id,
      timestamp: new Date().toISOString()
    }));

    _sendJson(res, 200, { success: true, clientOrgId: clientOrgId, relationshipId: relationship.relationship_id });
  }

  /** GET /agency/clients/:id/invite -- invite-first-user form (Agency-only). */
  async function handleGetInviteUser(req, res) {
    var clientOrgId = req.params && req.params.id;
    var tenantId = req.session && req.session.tenantId;
    var callerOrg = await organisations.resolveOrganisationForTenant(pool, tenantId);
    if (!callerOrg || callerOrg.org_type !== 'agency') {
      _sendJson(res, 403, { error: 'This flow is only reachable by Agency-type organisations.' });
      return;
    }
    var html = '<!DOCTYPE html><html><head><title>Invite user</title></head><body>' +
      '<h1>Invite the first user of this Client organisation</h1>' +
      '<form method="POST" action="/agency/clients/' + _escapeHtml(clientOrgId) + '/invite">' +
      '<label for="email">Email address</label>' +
      '<input id="email" name="email" type="email" required>' +
      '<button type="submit">Send invitation</button>' +
      '</form>' +
      '</body></html>';
    _sendHtml(res, 200, html);
  }

  /** POST /agency/clients/:id/invite -- issue the invitation (AC3, AC5). */
  async function handlePostInviteUser(req, res) {
    var clientOrgId = req.params && req.params.id;
    var tenantId = req.session && req.session.tenantId;
    var body = await _readBody(req);
    var email = body && body.email ? String(body.email).toLowerCase().trim() : '';

    var callerOrg = await organisations.resolveOrganisationForTenant(pool, tenantId);
    if (!callerOrg || callerOrg.org_type !== 'agency') {
      _sendJson(res, 403, { error: 'This flow is only reachable by Agency-type organisations.' });
      return;
    }
    if (!email) {
      _sendJson(res, 400, { error: 'A valid email address is required.' });
      return;
    }

    var invitation = await clientInvitations.createInvitation(pool, clientOrgId, email, tenantId);

    var sent;
    try {
      // AC3/AC5: issues the signed magic-link token AND sends it via the
      // wired sendInvitationEmail adapter (see auth/magic-link-strategy.js's
      // sendMagicLink wiring in server.js). invitationId travels inside the
      // signed JWT payload so the redemption verify() callback can resolve
      // this exact invitation row without a second lookup mechanism.
      sent = await magicLinkStrategy.issueMagicLink(email, { invitationId: invitation.invitation_id });
    } catch (err) {
      _sendJson(res, 500, { error: 'Failed to send invitation email.' });
      return;
    }

    // AC5: passport-magic-login's own .send() swallows a rejected
    // sendMagicLink (e.g. the D37 stub throwing when unwired) into
    // {success:false, error} rather than rejecting the outer promise -- so
    // an adapter failure must be checked here explicitly, not only via the
    // try/catch above, or an unwired/broken adapter would silently report
    // success to the caller.
    if (!sent || !sent.success) {
      _sendJson(res, 500, { error: 'Failed to send invitation email.' });
      return;
    }

    _sendJson(res, 200, { success: true, invitationId: invitation.invitation_id });
  }

  /**
   * GET /invite/redeem -- redeem an invitation link (AC3). Verifies the
   * token through the shared magic-link strategy (whose registered verify()
   * callback -- wired in server.js -- resolves the invitation, creates the
   * Client-org user account + team_memberships(role='admin') row, and marks
   * the invitation redeemed). This handler's own job is ONLY session
   * assignment, mirroring routes/auth.js's OAuth callback and
   * routes/auth-email.js's signup/login session-field/rotate shape exactly.
   */
  async function handleGetInviteRedeem(req, res) {
    var token = req.query && req.query.token;
    if (!token) {
      _sendJson(res, 400, { error: 'Missing invitation token.' });
      return;
    }

    var result;
    try {
      result = await magicLinkStrategy.verifyMagicLinkToken(token, req);
    } catch (err) {
      _sendJson(res, 500, { error: 'Invitation redemption failed.' });
      return;
    }

    if (!result.ok || !result.user) {
      // AC3 edge case: an already-redeemed (or invalid/expired) token is rejected.
      _sendJson(res, 400, { error: 'Invalid or expired invitation link.' });
      return;
    }

    var user = result.user; // { personId, tenantId, email, role }
    req.session.accessToken  = crypto.randomBytes(32).toString('hex');
    req.session.userId       = user.personId;
    req.session.tenantId     = user.tenantId;
    req.session.login        = user.email;
    req.session.authProvider = 'magic-link';
    req.session.role         = user.role || 'admin';

    var rotated = _session.rotateSessionId(req.sessionId, res, req.session);
    req.sessionId = rotated.newId;
    var newSession = _session.getSession(rotated.newId);
    if (newSession) req.session = newSession;
    _session.persistSession(req.sessionId);

    if (res.status) {
      res.status(200).json({ success: true, redirect: '/dashboard' });
    } else {
      res.writeHead(302, { Location: '/dashboard' });
      res.end();
    }
  }

  return {
    handleGetCreateClient: handleGetCreateClient,
    handlePostCreateClient: handlePostCreateClient,
    handleGetInviteUser: handleGetInviteUser,
    handlePostInviteUser: handlePostInviteUser,
    handleGetInviteRedeem: handleGetInviteRedeem
  };
}

module.exports = { createAgencyProvisioningHandlers: createAgencyProvisioningHandlers };
