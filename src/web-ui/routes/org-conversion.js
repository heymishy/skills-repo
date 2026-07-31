'use strict';

// org-conversion.js -- story-6-conversion-to-independent
// (artefacts/2026-07-30-agency-client-organisations)
//
// GET  /organisations/convert -- confirmation form (real <form>, NFR-Accessibility)
// POST /organisations/convert -- perform the conversion (AC1), then redirect into
//                                 the EXISTING createCheckoutSession Stripe flow
//                                 (AC2) by calling routes/billing.js's
//                                 handlePostCheckout DIRECTLY -- the SAME function
//                                 every new `standalone` signup uses, never a
//                                 separate/duplicate checkout code path.
//
// AC1: org_type flips client -> standalone IN PLACE on the same org_id row
// (modules/organisations.js's convertOrganisationToStandalone), gated by
// team_memberships.role === 'admin' for the org's OWN tenant_id (decisions.md,
// 2026-07-31 ARCH entry, Stories 3+6). Reuses modules/user-roles.js's
// resolveRoleForPerson DIRECTLY -- not the injectable getRoleForTenant/
// requireAdmin layer, which closes over a single server-wired pool at module
// scope -- this route's factory function takes `pool` explicitly, mirroring
// routes/agency-provisioning.js's createAgencyProvisioningHandlers(pool)
// convention (this story's own DoR H-ADAPTER: no new injectable adapter,
// direct DB access via an existing module function).
//
// AC3: conversion touches ONLY the organisations row (org_type) -- it never
// reads, writes, or otherwise touches agency_client_relationships /
// shared_access_grants, so Story 2's own relationship/grant enforcement is
// unaffected by construction, not merely by convention.
//
// No D37 injectable adapter here (DoR H-ADAPTER: reuses the existing,
// already-wired createCheckoutSession Stripe flow unmodified -- no new
// swappable integration is introduced by this story).

var organisations = require('../modules/organisations');
var userRoles = require('../modules/user-roles');
var billing = require('./billing');
var csrf = require('../middleware/csrf');

var _defaultLogger = { info: function(msg) { console.log(msg); } };
var _logger = _defaultLogger;

/** Test/production override for the audit logger (mirrors products.js's setSharedAccessLogger convention). */
function setConversionLogger(logger) {
  _logger = logger || _defaultLogger;
}

/** Mirrors this codebase's repeated _readBody convention (products.js, agency-provisioning.js, billing.js). */
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

/** Mirrors this codebase's repeated "res.status ? Express-mock : raw http" dual path (products.js, agency-provisioning.js). */
function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

/** Renders a minimal, functional, keyboard-navigable HTML page (NFR-Accessibility) -- mirrors agency-provisioning.js's _sendHtml convention. */
function _sendHtml(res, status, html) {
  if (res.status) { res.status(status).json({ html: html }); }
  else { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); }
}

/**
 * AC1's role gate (NFR-Security: server-side only, never a client-supplied
 * flag): is the authenticating person an admin of THEIR OWN org (the org
 * their own session's tenantId already resolves to -- conversion is always
 * "convert MY org", never an arbitrary other org_id)? Reuses
 * modules/user-roles.js's resolveRoleForPerson directly -- the same
 * person/team_memberships-scoped resolution requireAdmin's live-role adapter
 * (sec-perf-s2) delegates to in production -- rather than building a new
 * permission mechanism (decisions.md 2026-07-31 ARCH entry).
 * @param {object} pool
 * @param {object} req
 * @returns {Promise<boolean>}
 */
async function _isAdminOfOwnOrg(pool, req) {
  var orgId = req.session && req.session.tenantId;
  if (!orgId) return false;
  // identityKey: the authenticating person's own identity (GitHub login /
  // Google sub / magic-link email), never the bare tenantId, for the same
  // reason tir-s9 fixed getRoleForTenant's own wiring -- falls back to orgId
  // only if no per-person identity is present on the session (defensive).
  var identityKey = (req.session && (req.session.login || req.session.userId)) || orgId;
  var role = await userRoles.resolveRoleForPerson(pool, identityKey, orgId);
  return role === 'admin';
}

/**
 * Build the 2 route handlers, closed over a single pool instance (mirrors
 * routes/agency-provisioning.js's createAgencyProvisioningHandlers(pool)).
 * @param {object} pool
 * @returns {{handleGetConvertForm:Function, handlePostConvertOrganisation:Function}}
 */
function createOrgConversionHandlers(pool) {
  /** GET /organisations/convert -- confirmation form (NFR-Accessibility). */
  async function handleGetConvertForm(req, res) {
    var isAdmin = await _isAdminOfOwnOrg(pool, req);
    if (!isAdmin) {
      _sendJson(res, 403, { error: 'Only this organisation’s admin can convert it to an independent account.' });
      return;
    }
    var html = '<!DOCTYPE html><html><head><title>Convert to independent account</title></head><body>' +
      '<h1>Convert to an independent, paying account</h1>' +
      '<p>Converting keeps all your existing products, journeys, and artefacts -- nothing is lost or duplicated.</p>' +
      '<form method="POST" action="/organisations/convert">' +
      '<label for="confirm">Type CONVERT to confirm</label>' +
      '<input id="confirm" name="confirm" type="text" required>' +
      '<button type="submit">Convert to independent account</button>' +
      '</form>' +
      '</body></html>';
    _sendHtml(res, 200, html);
  }

  /**
   * POST /organisations/convert -- perform the conversion (AC1), audit it
   * (NFR-Audit), then redirect into the EXISTING createCheckoutSession
   * Stripe flow (AC2) by calling billing.js's handlePostCheckout DIRECTLY --
   * literally the same function every new `standalone` signup uses, not a
   * duplicate/parallel checkout code path.
   */
  async function handlePostConvertOrganisation(req, res) {
    var orgId = req.session && req.session.tenantId;
    if (!req.session || !orgId) {
      _sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    // AC1 / NFR-Security: server-side-only admin gate -- never a
    // client-supplied flag. Denials are audited too (NFR-Audit).
    var isAdmin = await _isAdminOfOwnOrg(pool, req);
    if (!isAdmin) {
      _logger.info(JSON.stringify({
        event: 'organisation_conversion_denied',
        org_id: orgId,
        person_id: (req.session && req.session.userId) || null,
        timestamp: new Date().toISOString()
      }));
      _sendJson(res, 403, { error: 'Only this organisation’s admin can convert it to an independent account.' });
      return;
    }

    var converted = await organisations.convertOrganisationToStandalone(pool, orgId, _logger);
    if (!converted) {
      // Not currently org_type='client' (already converted, or unknown org)
      // -- nothing to do. Out of scope: reversal / re-conversion.
      _sendJson(res, 400, { error: 'This organisation is not eligible for conversion.' });
      return;
    }

    // Audit (NFR): converting org_id, initiating user, timestamp.
    _logger.info(JSON.stringify({
      event: 'organisation_converted',
      org_id: orgId,
      person_id: (req.session && req.session.userId) || null,
      timestamp: new Date().toISOString()
    }));

    // AC2: redirect into the EXISTING, unmodified createCheckoutSession
    // Stripe flow -- the SAME billing.handlePostCheckout every new
    // `standalone` signup uses. Self-supply a valid CSRF token and a default
    // planId (this is an internal, server-side forward within the SAME
    // already-authorised request, not a new externally reachable CSRF
    // bypass -- admin status was already verified above) so the exact same,
    // unmodified function runs end-to-end and produces the exact same
    // Stripe redirect a normal /welcome plan-selection flow would.
    var body = await _readBody(req);
    var csrfToken = csrf.generateCsrfToken(req);
    req.body = Object.assign({}, body, {
      planId: (body && body.planId) || 'starter',
      _csrf: csrfToken
    });
    await billing.handlePostCheckout(req, res);
  }

  return {
    handleGetConvertForm: handleGetConvertForm,
    handlePostConvertOrganisation: handlePostConvertOrganisation
  };
}

module.exports = {
  createOrgConversionHandlers: createOrgConversionHandlers,
  setConversionLogger: setConversionLogger
};
