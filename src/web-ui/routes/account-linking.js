'use strict';

// account-linking.js — tir-s2
// /settings/link-account — lets a logged-in person deliberately link a second
// auth-provider identity to their existing people row. Mirrors the existing
// redirect-based OAuth pattern (routes/auth.js's handleAuthGoogle/
// handleAuthGoogleCallback) rather than inventing a new flow shape: a "start"
// route redirects out to the provider, a "callback" route completes the real
// auth step (ADR-018: stubbed via the NODE_ENV=test auth-bypass fixture
// pattern in tests, never a live OAuth round-trip) and performs the link.
//
// Mounted behind the existing authGuard in server.js (AC2) — this module does
// not duplicate auth-guard logic itself.
//
// Use module reference (not destructuring) so tests can monkeypatch individual
// exports — matches routes/auth.js's own convention.
var _oauthAdapter = require('../auth/oauth-adapter');
var _identityLinks = require('../modules/identity-links');

// Audit logger — replaced via setLogger() in tests and production bootstrap.
// Default is a safe no-op (matches routes/auth.js's own _logger convention) —
// a missing audit log is a monitoring gap, not a correctness risk, so this is
// not a D37 adapter (D37 is about state-mutating adapters whose silent stub
// could mask misconfiguration and complete a flow incorrectly).
let _logger = {
  info: (/* event, data */) => {},
  warn: (/* event, data */) => {}
};

/**
 * Replace the audit logger (used in tests and production startup).
 * @param {{ info: Function, warn: Function }} logger
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
 * GET /settings/link-account — minimal, functional settings page (no polished
 * UI required — story's Out of Scope). Two keyboard-operable, labelled links
 * (native <a> elements) satisfy the WCAG 2.1 AA NFR informally; verified
 * manually per the test plan (no automated accessibility scan in this repo).
 */
function handleGetLinkSettings(req, res) {
  var currentLogin = req.session && req.session.login;
  var html = '<!DOCTYPE html><html><head><title>Link a second sign-in method</title></head><body>' +
    '<h1>Link a second sign-in method</h1>' +
    '<p>Currently signed in as: ' + _escapeHtml(currentLogin) + '</p>' +
    '<ul>' +
    '<li><a href="/settings/link-account/google/start">Link a Google account</a></li>' +
    '<li><a href="/settings/link-account/github/start">Link a GitHub account</a></li>' +
    '</ul>' +
    '</body></html>';
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

/**
 * GET /settings/link-account/google/start — redirect to Google's OAuth
 * authorisation page to prove ownership of the second identity. Stores a
 * dedicated CSRF state field (linkOauthState) distinct from the original
 * login's oauthState, so an in-progress link never clobbers an in-progress
 * fresh login (or vice versa) in the same session.
 */
function handleStartGoogleLink(req, res) {
  var state = _oauthAdapter.generateState();
  req.session.linkOauthState = state;
  var redirectUrl = _oauthAdapter.getGoogleAuthUrl(state);
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}

/**
 * GET /settings/link-account/github/start — redirect to GitHub's OAuth
 * authorisation page to prove ownership of the second identity.
 */
function handleStartGithubLink(req, res) {
  var state = _oauthAdapter.generateState();
  req.session.linkOauthState = state;
  var redirectUrl = _oauthAdapter.buildOAuthRedirectURL(state);
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}

/**
 * Shared callback logic for both providers — validates CSRF state, resolves
 * the new identity's key via the given provider-specific resolver (reusing
 * the existing provider adapters — no new OAuth integration), then performs
 * the link via identity-links.js. Rejections (AC4) respond 409 with a clear
 * error and cause zero data changes (guaranteed by linkIdentity itself).
 * @param {object} pool
 * @param {object} req
 * @param {object} res
 * @param {string} provider
 * @param {(code: string) => Promise<string>} resolveNewIdentityKey
 */
async function _handleLinkCallback(pool, req, res, provider, resolveNewIdentityKey) {
  var query = req.query || {};
  var code = query.code;
  var callbackState = query.state;
  var sessionState = req.session && req.session.linkOauthState;

  if (!_oauthAdapter.validateOAuthState(sessionState, callbackState)) {
    _logger.warn('link_oauth_state_mismatch', { sessionId: req.sessionId });
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    var newIdentityKey = await resolveNewIdentityKey(code);
    var currentIdentityKey = req.session.tenantId;

    var result = await _identityLinks.linkIdentity(pool, currentIdentityKey, newIdentityKey, provider, _logger);

    res.writeHead(302, { Location: '/settings/link-account?linked=' + (result.alreadyLinked ? 'already' : '1') });
    res.end();
  } catch (err) {
    var status = (err && err.status === 409) ? 409 : 500;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (err && err.message) || 'Link failed' }));
  }
}

/**
 * Factory — binds a Postgres pool to the two provider callback handlers. No
 * new D37 adapter (DoR H-ADAPTER: direct DB access, app-layer logic) — this
 * is a plain factory closing over an already-wired pool, not a throw-on-
 * unwired module-level setter/getter.
 * @param {object} pool
 * @returns {{ handleGoogleLinkCallback: Function, handleGithubLinkCallback: Function }}
 */
function createLinkCallbackHandlers(pool) {
  async function handleGoogleLinkCallback(req, res) {
    return _handleLinkCallback(pool, req, res, 'google', async function(code) {
      var redirectUri = process.env.GOOGLE_CALLBACK_URL;
      var userInfo = await _oauthAdapter.fetchGoogleUserInfo(code, redirectUri);
      return userInfo.sub;
    });
  }

  async function handleGithubLinkCallback(req, res) {
    return _handleLinkCallback(pool, req, res, 'github', async function(code) {
      var token = await _oauthAdapter.providerExchangeCode(code);
      var identity = await _oauthAdapter.providerGetUserIdentity(token);
      return identity.login;
    });
  }

  return {
    handleGoogleLinkCallback: handleGoogleLinkCallback,
    handleGithubLinkCallback: handleGithubLinkCallback
  };
}

module.exports = {
  handleGetLinkSettings,
  handleStartGoogleLink,
  handleStartGithubLink,
  createLinkCallbackHandlers,
  setLogger
};
