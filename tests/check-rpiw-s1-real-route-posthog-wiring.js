'use strict';

// tests/check-rpiw-s1-real-route-posthog-wiring.js — rpiw-s1
// Story: artefacts/2026-09-13-real-route-posthog-identity-wiring/stories/rpiw-s1-wire-client-posthog-into-real-routes.md
// Test plan: artefacts/2026-09-13-real-route-posthog-identity-wiring/test-plans/rpiw-s1-test-plan.md
//
// AC1-AC6 tests for the new shared posthog-client-snippet module and its
// wiring into public.js's handleRoot and products.js's handleGetDashboard —
// the two routes actually served in production.

var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('[rpiw-s1] PASS: ' + name); },
    function(err) { failed++; console.log('[rpiw-s1] FAIL: ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

// ── Environment setup — must precede any require() of application code ───────
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';

var SNIPPET_PATH = path.resolve(__dirname, '../src/web-ui/modules/posthog-client-snippet.js');
var PUBLIC_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/public.js');
var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

var snippet = require(SNIPPET_PATH);

function mockRes() {
  var body = null;
  var headers = {};
  return {
    headers: headers,
    body: function() { return body; },
    setHeader: function(k, v) { headers[k.toLowerCase()] = v; },
    writeHead: function() {},
    end: function(b) { body = b != null ? String(b) : ''; }
  };
}

function makePool(productRows) {
  return {
    query: async function(sql) {
      if (/SELECT product_id, name, created_at FROM products/.test(sql)) {
        return { rows: productRows || [] };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  // ===========================================================================
  // AC5 — buildPostHogScript / buildClickCaptureScript graceful degradation
  // ===========================================================================

  await test('buildPostHogScript returns empty string when key is falsy (AC5)', function() {
    assertTrue(snippet.buildPostHogScript('', { captureEvent: 'x' }) === '', 'expected empty string for falsy key');
    assertTrue(snippet.buildPostHogScript(null, {}) === '', 'expected empty string for null key');
  });

  await test('buildClickCaptureScript returns empty string when key is falsy (AC5)', function() {
    assertTrue(snippet.buildClickCaptureScript('', 'a', 'evt') === '', 'expected empty string for falsy key');
  });

  // ===========================================================================
  // AC1 — buildPostHogScript with a real key contains the CDN init snippet
  // ===========================================================================

  await test('buildPostHogScript with a real key contains the PostHog CDN init snippet (AC1)', function() {
    var script = snippet.buildPostHogScript('phc_testkey', {});
    assertTrue(script.indexOf('us-assets.i.posthog.com/static/array.js') !== -1, 'expected the CDN script src');
    assertTrue(script.indexOf('posthog.init("phc_testkey"') !== -1, 'expected posthog.init with the key');
  });

  // ===========================================================================
  // AC3 — buildPostHogScript with identify + captureEvent
  // ===========================================================================

  await test('buildPostHogScript renders identify() and capture(login_completed) (AC3)', function() {
    var script = snippet.buildPostHogScript('phc_testkey', {
      identify: { login: 'alice', tenantId: 'acme' },
      captureEvent: 'login_completed'
    });
    assertTrue(script.indexOf('posthog.identify("alice",{tenant_id:"acme"})') !== -1, 'expected identify() call with login/tenantId');
    assertTrue(script.indexOf('posthog.capture("login_completed")') !== -1, 'expected capture(login_completed)');
  });

  // ===========================================================================
  // AC4 — buildPostHogScript never renders an accessToken field, even if passed
  // ===========================================================================

  await test('buildPostHogScript never renders an accessToken even if present on identify (AC4)', function() {
    var script = snippet.buildPostHogScript('phc_testkey', {
      identify: { login: 'alice', tenantId: 'acme', accessToken: 'ghp_SECRETVALUE123' },
      captureEvent: 'login_completed'
    });
    assertTrue(script.indexOf('ghp_SECRETVALUE123') === -1, 'expected accessToken value to never appear in rendered script');
  });

  // ===========================================================================
  // AC2 — buildClickCaptureScript shape
  // ===========================================================================

  await test('buildClickCaptureScript renders the typeof guard and capture(cta_clicked) (AC2)', function() {
    var script = snippet.buildClickCaptureScript('phc_testkey', 'a[href="/auth/github"]', 'cta_clicked');
    assertTrue(script.indexOf("typeof posthog !== 'undefined'") !== -1, 'expected the typeof guard');
    assertTrue(script.indexOf('posthog.capture("cta_clicked")') !== -1, 'expected capture(cta_clicked)');
  });

  // ===========================================================================
  // AC1/AC2 — handleRoot wires the snippet + CTA tracker, keeps server-side
  // landing_page_viewed capture untouched (AC6 non-regression, inline check)
  // ===========================================================================

  await test('handleRoot injects PostHog snippet + cta_clicked tracker when POSTHOG_KEY is set (AC1, AC2)', async function() {
    delete require.cache[PUBLIC_ROUTE_PATH];
    delete require.cache[path.resolve(__dirname, '../src/web-ui/modules/posthog-server.js')];
    process.env.POSTHOG_KEY = 'phc_testkey';

    var posthogModule = require('../src/web-ui/modules/posthog-server');
    var captured = [];
    posthogModule.capture = function(distinctId, event) { captured.push({ distinctId: distinctId, event: event }); };

    var publicRoute = require(PUBLIC_ROUTE_PATH);
    var req = { session: {}, query: {}, body: {}, method: 'GET', url: '/', headers: {} };
    var res = mockRes();

    await publicRoute.handleRoot(req, res);

    var html = res.body();
    assertTrue(html.indexOf('us-assets.i.posthog.com/static/array.js') !== -1, 'expected the PostHog CDN snippet in the response HTML');
    assertTrue(html.indexOf('cta_clicked') !== -1, 'expected the cta_clicked tracker in the response HTML');

    var landingViewedCalls = captured.filter(function(c) { return c.event === 'landing_page_viewed'; });
    assertTrue(landingViewedCalls.length >= 1, 'expected the existing server-side landing_page_viewed capture to still fire');

    delete process.env.POSTHOG_KEY;
    delete require.cache[PUBLIC_ROUTE_PATH];
    delete require.cache[path.resolve(__dirname, '../src/web-ui/modules/posthog-server.js')];
  });

  // ===========================================================================
  // AC5 — handleRoot renders no new script when POSTHOG_KEY is unset
  // ===========================================================================

  await test('handleRoot injects nothing new when POSTHOG_KEY is unset (AC5)', async function() {
    delete process.env.POSTHOG_KEY;
    delete require.cache[PUBLIC_ROUTE_PATH];
    var publicRoute = require(PUBLIC_ROUTE_PATH);
    var req = { session: {}, query: {}, body: {}, method: 'GET', url: '/', headers: {} };
    var res = mockRes();
    await publicRoute.handleRoot(req, res);
    var html = res.body();
    assertTrue(html.indexOf('us-assets.i.posthog.com') === -1, 'expected no PostHog snippet when key is unset');
  });

  // ===========================================================================
  // AC3/AC4 — handleGetDashboard wires identify()/login_completed, excludes accessToken
  // ===========================================================================

  await test('handleGetDashboard injects identify()/login_completed when POSTHOG_KEY is set (AC3)', async function() {
    process.env.POSTHOG_KEY = 'phc_testkey';
    delete require.cache[PRODUCTS_ROUTE_PATH];
    var productsRoute = require(PRODUCTS_ROUTE_PATH);

    var pool = makePool([]);
    var req = { session: { login: 'alice', tenantId: 'acme', accessToken: 'ghp_SUPERSECRET456' }, query: {} };
    var res = mockRes();

    await productsRoute.handleGetDashboard(req, res, null, pool);

    var html = res.body();
    assertTrue(html.indexOf('posthog.identify("alice",{tenant_id:"acme"})') !== -1, 'expected identify() with login/tenantId in dashboard HTML');
    assertTrue(html.indexOf('posthog.capture("login_completed")') !== -1, 'expected capture(login_completed) in dashboard HTML');

    delete process.env.POSTHOG_KEY;
    delete require.cache[PRODUCTS_ROUTE_PATH];
  });

  await test('handleGetDashboard never renders req.session.accessToken (AC4)', async function() {
    process.env.POSTHOG_KEY = 'phc_testkey';
    delete require.cache[PRODUCTS_ROUTE_PATH];
    var productsRoute = require(PRODUCTS_ROUTE_PATH);

    var pool = makePool([]);
    var req = { session: { login: 'alice', tenantId: 'acme', accessToken: 'ghp_SUPERSECRET456' }, query: {} };
    var res = mockRes();

    await productsRoute.handleGetDashboard(req, res, null, pool);

    var html = res.body();
    assertTrue(html.indexOf('ghp_SUPERSECRET456') === -1, 'expected accessToken value to never appear in dashboard HTML');

    delete process.env.POSTHOG_KEY;
    delete require.cache[PRODUCTS_ROUTE_PATH];
  });

  // ===========================================================================
  // AC5 — handleGetDashboard renders nothing new when POSTHOG_KEY is unset
  // ===========================================================================

  await test('handleGetDashboard injects nothing new when POSTHOG_KEY is unset (AC5)', async function() {
    delete process.env.POSTHOG_KEY;
    delete require.cache[PRODUCTS_ROUTE_PATH];
    var productsRoute = require(PRODUCTS_ROUTE_PATH);

    var pool = makePool([]);
    var req = { session: { login: 'alice', tenantId: 'acme' }, query: {} };
    var res = mockRes();

    await productsRoute.handleGetDashboard(req, res, null, pool);

    var html = res.body();
    assertTrue(html.indexOf('us-assets.i.posthog.com') === -1, 'expected no PostHog snippet when key is unset');
  });

  console.log('\n[rpiw-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
})();
