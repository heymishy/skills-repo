'use strict';

// org-activation.js -- story-asa-s1
// (artefacts/2026-09-11-agency-self-activation)
//
// GET  /organisations/become-agency -- confirmation form (real <form>, NFR-Accessibility)
// POST /organisations/become-agency -- perform the activation (AC1)
//
// Closes a real gap found via live Chrome verification in the already-shipped,
// already-merged 2026-07-30-agency-client-organisations epic: every one of
// that epic's 6 stories assumes the caller's organisation already has
// org_type='agency' as a precondition, but nothing in that epic (nor anywhere
// else in this codebase) ever sets it -- every org defaults to
// org_type='standalone' and stays there. This route is the missing
// precondition-setter.
//
// AC1: org_type flips standalone -> agency IN PLACE on the same org_id row
// (modules/organisations.js's activateOrganisationAsAgency), gated by
// team_memberships.role === 'admin' for the org's OWN tenant_id -- mirrors
// routes/org-conversion.js's own established admin-gate pattern (decisions.md,
// 2026-07-31 ARCH entry, Stories 3+6) as closely as possible, per this
// story's own decisions.md (2026-09-11): reuse an already-reviewed pattern
// rather than invent a new permission mechanism.
//
// AC3: the UPDATE's WHERE org_type='standalone' clause means an already-
// 'agency' or 'client' org can never be affected by this action -- one-way,
// scoped by construction, not by convention.
//
// AC4: activation touches ONLY the organisations row (org_type) -- it never
// reads, writes, or otherwise touches agency_client_relationships /
// shared_access_grants, so Story 2's own relationship/grant enforcement is
// unaffected by construction, not merely by convention.
//
// No D37 injectable adapter here (mirrors org-conversion.js's own DoR
// H-ADAPTER precedent: direct DB access via an existing module function, no
// new swappable integration introduced).
//
// No billing/Stripe involvement -- unlike Story 6's conversion (client ->
// standalone, which redirects into checkout), becoming an Agency does not
// change what the org pays.

var organisations = require('../modules/organisations');
var userRoles = require('../modules/user-roles');

var _defaultLogger = { info: function(msg) { console.log(msg); } };
var _logger = _defaultLogger;

/** Test/production override for the audit logger (mirrors org-conversion.js's setConversionLogger convention). */
function setActivationLogger(logger) {
  _logger = logger || _defaultLogger;
}

/** Mirrors this codebase's repeated "res.status ? Express-mock : raw http" dual path (products.js, agency-provisioning.js, org-conversion.js). */
function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

/** Renders a minimal, functional, keyboard-navigable HTML page (NFR-Accessibility) -- mirrors org-conversion.js's _sendHtml convention. */
function _sendHtml(res, status, html) {
  if (res.status) { res.status(status).json({ html: html }); }
  else { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); }
}

/**
 * AC2's role gate (NFR-Security: server-side only, never a client-supplied
 * flag): is the authenticating person an admin of THEIR OWN org (the org
 * their own session's tenantId already resolves to -- activation is always
 * "activate MY org", never an arbitrary other org_id)? Reuses
 * modules/user-roles.js's resolveRoleForPerson directly, mirroring
 * org-conversion.js's own _isAdminOfOwnOrg exactly (decisions.md 2026-09-11
 * ARCH entry).
 * @param {object} pool
 * @param {object} req
 * @returns {Promise<boolean>}
 */
async function _isAdminOfOwnOrg(pool, req) {
  var orgId = req.session && req.session.tenantId;
  if (!orgId) return false;
  var identityKey = (req.session && (req.session.login || req.session.userId)) || orgId;
  var role = await userRoles.resolveRoleForPerson(pool, identityKey, orgId);
  return role === 'admin';
}

/**
 * Build the 2 route handlers, closed over a single pool instance (mirrors
 * routes/org-conversion.js's createOrgConversionHandlers(pool)).
 * @param {object} pool
 * @returns {{handleGetBecomeAgencyForm:Function, handlePostBecomeAgency:Function}}
 */
function createOrgActivationHandlers(pool) {
  /** GET /organisations/become-agency -- confirmation form (NFR-Accessibility). */
  async function handleGetBecomeAgencyForm(req, res) {
    var isAdmin = await _isAdminOfOwnOrg(pool, req);
    if (!isAdmin) {
      _sendJson(res, 403, { error: 'Only this organisation’s admin can activate it as an Agency.' });
      return;
    }
    var html = '<!DOCTYPE html><html><head><title>Become an Agency</title></head><body>' +
      '<h1>Activate your organisation as an Agency</h1>' +
      '<p>As an Agency, you can create and manage Client organisations, invite their first users, and share read-only access to your products and features.</p>' +
      '<form method="POST" action="/organisations/become-agency">' +
      '<label for="confirm">Type AGENCY to confirm</label>' +
      '<input id="confirm" name="confirm" type="text" required>' +
      '<button type="submit">Activate as Agency</button>' +
      '</form>' +
      '</body></html>';
    _sendHtml(res, 200, html);
  }

  /**
   * POST /organisations/become-agency -- perform the activation (AC1), audit
   * it (NFR-Audit).
   */
  async function handlePostBecomeAgency(req, res) {
    var orgId = req.session && req.session.tenantId;
    if (!req.session || !orgId) {
      _sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    // AC2 / NFR-Security: server-side-only admin gate -- never a
    // client-supplied flag. Denials are audited too (NFR-Audit).
    var isAdmin = await _isAdminOfOwnOrg(pool, req);
    if (!isAdmin) {
      _logger.info(JSON.stringify({
        event: 'organisation_activation_denied',
        org_id: orgId,
        person_id: (req.session && req.session.userId) || null,
        timestamp: new Date().toISOString()
      }));
      _sendJson(res, 403, { error: 'Only this organisation’s admin can activate it as an Agency.' });
      return;
    }

    var activated = await organisations.activateOrganisationAsAgency(pool, orgId, _logger);
    if (!activated) {
      // Not currently org_type='standalone' (already an agency/client, or
      // unknown org) -- nothing to do. Out of scope: reversal.
      _sendJson(res, 400, { error: 'This organisation is not eligible for Agency activation.' });
      return;
    }

    // Audit (NFR): activating org_id, initiating user, timestamp.
    _logger.info(JSON.stringify({
      event: 'organisation_activated_as_agency',
      org_id: orgId,
      person_id: (req.session && req.session.userId) || null,
      timestamp: new Date().toISOString()
    }));

    _sendJson(res, 200, { success: true, org_id: activated.org_id, org_type: activated.org_type });
  }

  return {
    handleGetBecomeAgencyForm: handleGetBecomeAgencyForm,
    handlePostBecomeAgency: handlePostBecomeAgency
  };
}

module.exports = {
  createOrgActivationHandlers: createOrgActivationHandlers,
  setActivationLogger: setActivationLogger
};
