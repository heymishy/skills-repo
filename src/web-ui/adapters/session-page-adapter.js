'use strict';
// session-page-adapter.js — ppc-s1 (AC8, D37 mandatory). Bridges a tenant
// user's own req.sessionId to an authenticated headless Playwright page, by
// seeding the browser context's cookie with that same opaque session_id
// value. No new token-minting, no service credential (ADR-018; decisions.md
// 2026-10-21 ARCHITECTURE entry: "Capture mechanism reuses the tenant's own
// live session"). This adapter is new — rpca's own mechanism
// (scripts/playback-capture.js) is CLI-only, never route-handler-callable.
//
// chromiumModule is an injectable third parameter so this module's own
// behavioural correctness can be verified WITHOUT ever invoking a real
// Playwright browser from the unit test chain (ADR-018: "unit test chain
// (npm test) must not invoke Playwright"). This mirrors the precedent in
// scripts/playback-capture.js's own header comment: Playwright passed as a
// plain function argument is ordinary dependency injection, not a D37
// adapter concern in itself -- the D37 concern here is strictly the
// getAuthenticatedPage/setSessionPageAdapter wiring boundary below.

let _sessionPageAdapter = function() {
  throw new Error('Adapter not wired: sessionPageAdapter. Call setSessionPageAdapter() with a real implementation before use.');
};

function setSessionPageAdapter(fn) {
  _sessionPageAdapter = fn;
}

function getSessionPageAdapter() {
  return _sessionPageAdapter;
}

/**
 * Route-callable adapter. Throws until wired (D37) -- see
 * setSessionPageAdapter. Production wiring (server.js) and its
 * behavioural-correctness wiring test are a later task (Task 5), not this
 * one.
 * @param {string} sessionId - the opaque req.sessionId value (never req.session.accessToken)
 * @param {string} baseUrl - the app's own base URL, used to scope the cookie's domain
 * @returns {Promise<{page: object, browser: object}>}
 */
async function getAuthenticatedPage(sessionId, baseUrl) {
  return getSessionPageAdapter()(sessionId, baseUrl);
}

/**
 * Real production implementation. chromiumModule defaults to Playwright's
 * own chromium launcher; tests inject a fake one to verify this function's
 * real cookie-seeding logic without launching a real browser (ADR-018).
 * @param {string} sessionId
 * @param {string} baseUrl
 * @param {object} [chromiumModule] - defaults to require('playwright').chromium
 * @returns {Promise<{page: object, browser: object}>}
 */
async function realGetAuthenticatedPage(sessionId, baseUrl, chromiumModule) {
  const chromium = chromiumModule || require('playwright').chromium;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const url = new URL(baseUrl);
  await context.addCookies([{
    name: 'session_id',
    value: sessionId,
    domain: url.hostname,
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'Lax'
  }]);
  const page = await context.newPage();
  return { page: page, browser: browser };
}

module.exports = {
  setSessionPageAdapter,
  getSessionPageAdapter,
  getAuthenticatedPage,
  realGetAuthenticatedPage
};
