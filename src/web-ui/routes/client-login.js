'use strict';

// client-login.js -- story-4-dual-path-authentication
// (artefacts/2026-07-30-agency-client-organisations)
//
// GET  /auth/magic-link          -- Sign-in-with-email request form (NFR-Accessibility)
// POST /auth/magic-link/request  -- Issue a Client-org login magic-link (AC2/AC3)
//
// Redemption happens at the EXISTING /invite/redeem GET route
// (routes/agency-provisioning.js's handleGetInviteRedeem) -- the shared
// strategy's callbackUrl is a single, construction-time-fixed value shared by
// BOTH Story 3's invitation links and this story's login links, so both
// flows' magic-link emails point to the same redemption URL. server.js's
// combined verify() dispatcher (see server.js's story-4-dual-path-
// authentication wiring block) tells them apart by payload shape
// (invitationId vs loginTokenId) and hands off to
// modules/client-invitations.js or modules/client-login.js accordingly. This
// route factory calls magicLinkStrategy.issueMagicLink() -- it NEVER calls
// registerMagicLinkStrategy() again (see auth/magic-link-strategy.js's
// module header and decisions.md, 2026-07-31 ARCH entry, Stories 3+4).
//
// Rate-limiting NFR (resolves review run 1's [1-M1]): reuses
// routes/auth-email.js's exact sliding-window rate-limiter primitive
// (checkSlidingWindowRateLimit) and its same RATE_MAX/RATE_WIN_MS threshold
// directly -- per-IP AND per-target-email, two independent sliding windows
// over the same mechanism, not a new bespoke limiter.
//
// Factory function mirrors agency-provisioning.js's createAgencyProvisioning
// Handlers(pool) convention (DoR H-ADAPTER: direct DB access via
// modules/client-login.js -- not itself a new D37 adapter).

var authEmail = require('./auth-email');
var clientLogin = require('../modules/client-login');
var magicLinkStrategy = require('../auth/magic-link-strategy');

var _ipRateLimits = new Map();
var _emailRateLimits = new Map();

/** Test-only reset -- mirrors auth-email.js's _clearRateLimits. */
function _clearRateLimits() {
  _ipRateLimits.clear();
  _emailRateLimits.clear();
}

function _getIP(req) {
  return req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
}

/** Read and parse the request body -- mirrors agency-provisioning.js's _readBody. */
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

function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

/** Renders a minimal, functional, keyboard-navigable HTML page (NFR-Accessibility). */
function _sendHtml(res, status, html) {
  if (res.status) { res.status(status).json({ html: html }); }
  else { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); }
}

/**
 * Build the route handlers, closed over a single pool instance.
 * @param {object} pool
 * @returns {{handleGetMagicLinkRequestForm:Function, handlePostMagicLinkRequest:Function}}
 */
function createClientLoginHandlers(pool) {
  /** GET /auth/magic-link -- request form (NFR-Accessibility: real <form>/<input type="email">). */
  async function handleGetMagicLinkRequestForm(req, res) {
    var html = '<!DOCTYPE html><html><head><title>Sign in with email</title></head><body>' +
      '<h1>Sign in with email</h1>' +
      '<form method="POST" action="/auth/magic-link/request">' +
      '<label for="email">Email address</label>' +
      '<input id="email" name="email" type="email" required>' +
      '<button type="submit">Send sign-in link</button>' +
      '</form>' +
      '</body></html>';
    _sendHtml(res, 200, html);
  }

  /** POST /auth/magic-link/request -- issue a Client-org login magic-link (AC2/AC3). */
  async function handlePostMagicLinkRequest(req, res) {
    var ip = _getIP(req);
    var body = await _readBody(req);
    var email = body && body.email ? String(body.email).toLowerCase().trim() : '';

    // Rate-limiting NFR: per-IP AND per-target-email, reusing auth-email.js's
    // exact sliding-window mechanism/threshold directly -- not a new
    // bespoke limiter (resolves review run 1's [1-M1]).
    var ipOk = authEmail.checkSlidingWindowRateLimit(_ipRateLimits, ip, authEmail.RATE_MAX, authEmail.RATE_WIN_MS);
    var emailOk = email
      ? authEmail.checkSlidingWindowRateLimit(_emailRateLimits, email, authEmail.RATE_MAX, authEmail.RATE_WIN_MS)
      : true;
    if (!ipOk || !emailOk) {
      _sendJson(res, 429, { error: 'Too many attempts' });
      return;
    }

    if (!email) {
      _sendJson(res, 400, { error: 'A valid email address is required.' });
      return;
    }

    // AC3: server-side rejection for non-Client-org emails -- never a
    // client-side-only restriction. Deliberately generic message (agency,
    // standalone, and unknown emails all get the identical response) to
    // avoid confirming which org_type applies or whether the email exists
    // at all.
    var issued = await clientLogin.requestMagicLinkLogin(pool, email);
    if (!issued.ok) {
      _sendJson(res, 403, { error: 'Magic-link sign-in is not available for this account.' });
      return;
    }

    var sent;
    try {
      // AC2/AC5: issues the signed magic link through the SAME shared
      // strategy Story 3 registered -- loginTokenId (not invitationId)
      // travels in the JWT payload so the combined verify() dispatcher in
      // server.js routes it to modules/client-login.js's resolveLoginToken.
      sent = await magicLinkStrategy.issueMagicLink(email, { loginTokenId: issued.tokenId });
    } catch (err) {
      _sendJson(res, 500, { error: 'Failed to send sign-in email.' });
      return;
    }

    // AC5: passport-magic-login's own .send() swallows a rejected
    // sendMagicLink (e.g. the D37 stub throwing when unwired) into
    // {success:false, error} rather than rejecting the outer promise -- must
    // be checked explicitly here, mirroring agency-provisioning.js's own
    // handlePostInviteUser.
    if (!sent || !sent.success) {
      _sendJson(res, 500, { error: 'Failed to send sign-in email.' });
      return;
    }

    _sendJson(res, 200, { success: true });
  }

  return {
    handleGetMagicLinkRequestForm: handleGetMagicLinkRequestForm,
    handlePostMagicLinkRequest: handlePostMagicLinkRequest
  };
}

module.exports = {
  createClientLoginHandlers: createClientLoginHandlers,
  _clearRateLimits: _clearRateLimits
};
