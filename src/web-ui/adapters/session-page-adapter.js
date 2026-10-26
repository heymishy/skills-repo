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

/**
 * Replace the session-page adapter (used in tests and production startup).
 * @param {(sessionId: string, baseUrl: string) => Promise<{page: object, browser: object}>} fn
 */
function setSessionPageAdapter(fn) {
  _sessionPageAdapter = fn;
}

/**
 * Retrieve the currently wired session-page adapter function. Callers
 * invoke getSessionPageAdapter()(...) rather than holding a captured
 * reference, so rewiring (e.g. setSessionPageAdapter() in a test) always
 * takes effect for the next call -- mirrors artefact-commit-writer.js's
 * getArtefactCommitAdapter() convention.
 * @returns {Function}
 */
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
 *
 * ppc-s8: uses 'playwright-core' (the automation API without a bundled
 * browser download), not 'playwright' (the devDependency-only test-framework
 * package @playwright/test pulls in transitively -- never actually shipped
 * to production, see decisions.md 2026-10-26 ARCHITECTURE entry's RCA).
 * playwright-core and playwright resolve browsers from the SAME default
 * cache path (PLAYWRIGHT_BROWSERS_PATH, or ~/.cache/ms-playwright), so in
 * local dev/CI -- where @playwright/test's own postinstall already
 * downloaded a real Chromium into that shared cache -- chromium.launch()
 * with no executablePath finds it automatically, unchanged from before this
 * fix. Only production (no such download ever having run, Alpine base image
 * installing its own native 'chromium' package instead) needs the explicit
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH override set below.
 * @param {string} sessionId
 * @param {string} baseUrl
 * @param {object} [chromiumModule] - defaults to require('playwright-core').chromium
 * @returns {Promise<{page: object, browser: object}>}
 */
async function realGetAuthenticatedPage(sessionId, baseUrl, chromiumModule) {
  const chromium = chromiumModule || require('playwright-core').chromium;
  const launchOptions = {};
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    // ppc-s8 fast-follow: launching Chromium as a non-root container user
    // (Dockerfile's USER node) commonly HANGS (not errors) rather than
    // failing cleanly, because Chromium's own sandbox setup needs
    // privileges an unprivileged container process doesn't have --
    // confirmed live: two real production capture attempts against
    // skills-framework.fly.dev hung indefinitely (no error, no crash,
    // no completion) after the playwright-core/executablePath fix alone.
    // chromiumSandbox: false is Playwright's own documented way to
    // disable it (equivalent to passing --no-sandbox as a raw arg).
    // Scoped to the same production-only branch as executablePath above --
    // dev/CI's own browser launch already works without this and is left
    // untouched.
    launchOptions.chromiumSandbox = false;
    // ppc-s8 fast-follow #2: chromiumSandbox:false alone did not resolve
    // the hang -- confirmed live, two further capture attempts after that
    // fix was deployed still hung indefinitely with no error. /dev/shm is
    // typically very small by default in containers (often 64MB), and
    // Chromium is well known to hang or crash under exactly these
    // conditions -- --disable-dev-shm-usage (makes Chromium use /tmp
    // instead) is the standard companion flag to --no-sandbox in every
    // "run headless Chrome in Docker" guide, almost always needed
    // together. The 512MB VM's own tight memory budget (fly.toml) for a
    // real video recording, not just a screenshot, makes this more likely
    // here than in a typical container.
    launchOptions.args = ['--disable-dev-shm-usage'];
  }
  const browser = await chromium.launch(launchOptions);
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
