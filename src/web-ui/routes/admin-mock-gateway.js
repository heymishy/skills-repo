'use strict';

// admin-mock-gateway.js — amgt-s1
// GET  /admin/mock-gateway         — show the mock LLM gateway's current effective
//                                     state for this environment, and a toggle form.
// POST /api/admin/mock-gateway/toggle — flip the runtime override.
// Protected by requireAdmin middleware (mounted in server.js), same pattern as
// routes/admin-credits.js: requireAdmin + renderShell + csrfField/csrfGuard,
// reused verbatim rather than inventing a new admin-auth or CSRF mechanism
// (Architecture Constraints, artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md).
//
// This is a NEW small route file rather than an extension of admin-credits.js —
// see decisions.md for the rationale (credits and the mock gateway toggle are
// unrelated admin concerns; keeping them in separate files avoids growing
// admin-credits.js with an unrelated responsibility).

const mockLlmGateway = require('../modules/mock-llm-gateway');
// sec-perf-s3: session-scoped CSRF (Cross-Site Request Forgery) protection —
// identical mechanism to admin-credits.js, reused verbatim.
const { generateCsrfToken, csrfField, csrfGuard } = require('../middleware/csrf');
const { renderShell } = require('../utils/html-shell');

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Read and parse the request body (form-urlencoded). Mirrors the identical
 * `_readBody` helper already present in admin-credits.js and every other
 * route file in this codebase.
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
 * GET /admin/mock-gateway — render the current effective mock-gateway state
 * (AC1: a live call to isMockGatewayEnabled(), never a stale/cached value)
 * and a toggle form that flips it.
 */
async function adminMockGatewayGet(req, res) {
  // AC1: live call, not a cached value -- read at render time, every request.
  const currentlyEnabled = mockLlmGateway.isMockGatewayEnabled();
  const nextState = !currentlyEnabled;
  const isProduction = process.env.NODE_ENV === 'production';

  // sec-perf-s3 pattern: session-scoped CSRF token, embedded in the toggle form.
  const csrfToken = generateCsrfToken(req);

  const bodyContent = [
    '<h1 class="sw-page-h1">Admin: Mock LLM Gateway</h1>',
    '<p>Current effective state for this environment: <strong>' +
      (currentlyEnabled ? 'ON (mock fixture responses)' : 'OFF (real model calls)') +
      '</strong></p>',
    // AC3: honest, explicit copy about in-memory-only persistence -- must not
    // imply durable persistence the implementation doesn't have.
    '<p>This toggle is in-memory only and resets to the configured default ' +
      '(the <code>MOCK_LLM_GATEWAY</code> environment variable) on the next server restart or redeploy.</p>',
    isProduction
      ? '<p><strong>Note:</strong> this environment has <code>NODE_ENV=production</code> — ' +
        'the mock gateway is hard-disabled here regardless of this toggle.</p>'
      : '',
    '<form method="POST" action="/api/admin/mock-gateway/toggle">',
    csrfField(csrfToken),
    '<input type="hidden" name="nextState" value="' + (nextState ? 'on' : 'off') + '">',
    '<button type="submit">Turn ' + escapeHtml(nextState ? 'ON' : 'OFF') + '</button>',
    '</form>'
  ].join('\n');

  const html = renderShell({
    title: 'Admin — Mock LLM Gateway',
    bodyContent,
    user: req.session,
    active: 'admin-mock-gateway',
    crumbs: ['Admin mock gateway'],
    isAdmin: true
  });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * POST /api/admin/mock-gateway/toggle — flip the runtime override.
 * Logs the flip (admin identity + new state) via the existing
 * console.info/structured-log pattern used elsewhere in this codebase
 * (e.g. routes/journey.js's console.info(JSON.stringify({event: ...}))).
 * Redirects 302 to /admin/mock-gateway on success.
 */
async function adminMockGatewayPost(req, res) {
  // sec-perf-s3 AC1: reject a POST that does not carry a valid session-scoped CSRF token.
  const csrfOk = await csrfGuard(req, res);
  if (!csrfOk) return;

  const body = await _readBody(req);
  // Fail-safe default: anything other than the literal string 'on' resolves to
  // false (mock gateway off) -- a missing/tampered field must never
  // accidentally turn the toggle on.
  const newState = !!(body && body.nextState === 'on');

  mockLlmGateway.setRuntimeMockGatewayOverride(newState);

  // NFR-Audit: log every toggle flip with admin identity + new state, never
  // req.session.accessToken (canonical field name rule) -- mirrors the
  // adjustBalanceWithAudit precedent's identity resolution.
  const adminId = String((req.session && (req.session.login || req.session.userId)) || 'unknown');
  console.info(JSON.stringify({
    event: 'mock_gateway_toggled',
    adminId: adminId,
    newState: newState,
    timestamp: new Date().toISOString()
  }));

  res.writeHead(302, { Location: '/admin/mock-gateway' });
  res.end();
}

module.exports = { adminMockGatewayGet, adminMockGatewayPost };
