'use strict';

// csrf.js — session-scoped CSRF (Cross-Site Request Forgery) protection (sec-perf-s3).
// Follows the same generate/store-in-session/validate/403-on-mismatch shape as
// routes/auth.js's oauthState/validateOAuthState pattern, but is a distinct mechanism:
// oauthState protects the OAuth callback flow specifically; this protects general
// server-rendered form POSTs (admin credit adjust, team role assign, billing checkout,
// email signup/login — see artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md).

const crypto = require('crypto');

/**
 * Escape a string for safe embedding inside an HTML attribute value.
 * @param {string} str
 * @returns {string}
 */
function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate (or return the already-cached) CSRF token for this session.
 * Idempotent within a session — a token is generated once and reused for the
 * lifetime of the session, not regenerated on every page load.
 * @param {object} req - must have req.session
 * @returns {string} hex token
 */
function generateCsrfToken(req) {
  if (!req || !req.session) {
    throw new Error('generateCsrfToken requires req.session to be set (session middleware must run first)');
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

/**
 * Build the hidden `<input>` HTML for embedding a CSRF token in a server-rendered form.
 * @param {string} token
 * @returns {string}
 */
function csrfField(token) {
  return '<input type="hidden" name="_csrf" value="' + _escapeHtml(token) + '">';
}

/**
 * Read and parse the request body (JSON or form-urlencoded).
 * Short-circuits if req.body is already set (test injection scenario) — mirrors the
 * `_readBody` short-circuit already present in every route file in this codebase.
 * @param {object} req
 * @returns {Promise<object|null>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var ct = (req.headers && req.headers['content-type']) || '';
      if (ct.indexOf('application/json') !== -1) {
        try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
        return;
      }
      try {
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

/**
 * csrfGuard — validate the `_csrf` field on an incoming POST against the session's
 * stored CSRF token. Reads the request body itself (there is no separate body-parsing
 * middleware in this app's manual dispatch router) and caches the parsed result on
 * `req.body` so the downstream handler's own `_readBody`-style helper picks it up via
 * its existing `if (req.body !== undefined) return Promise.resolve(req.body);`
 * short-circuit, instead of trying to re-read the already-consumed request stream.
 *
 * On mismatch/missing token: writes 403 with Content-Type: text/plain and body
 * "Forbidden" — matching the existing oauthState mismatch response shape in
 * routes/auth.js's handleAuthCallback, for consistency.
 *
 * @param {object} req
 * @param {object} res
 * @returns {Promise<boolean>} true if the request may proceed, false if 403 was written
 */
async function csrfGuard(req, res) {
  const body = await _readBody(req);
  req.body = body;

  const submitted = body && body._csrf ? String(body._csrf) : '';
  const expected = (req.session && req.session.csrfToken) ? String(req.session.csrfToken) : '';

  if (!submitted || !expected || submitted !== expected) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return false;
  }
  return true;
}

module.exports = {
  generateCsrfToken,
  csrfField,
  csrfGuard
};
