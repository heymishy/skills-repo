'use strict';

// tests/check-pnfc-s1-product-feature-choice.js — pnfc-s1
//
// Integration tests for pnfc-s1 (offer the formed-idea/rough-idea choice when
// creating a new feature from a product's page). Covers AC2-AC5 from
// artefacts/2026-07-24-product-new-feature-idea-choice/test-plans/pnfc-s1-test-plan.md.
//
// Deliberately imports and calls the REAL exported handlePostProductFeature
// from routes/products.js (not a hand-copied reimplementation) -- matching
// the established convention from check-jrf-s2-register-product-feature-journeys.js,
// whose own header comment explains why a hand-copied reimplementation let a
// real bug go uncaught.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var JOURNEY_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function extractSidFromRedirect(res, skillName) {
  var loc = res._headers.Location || '';
  var re = new RegExp('/skills/' + skillName + '/sessions/([^/]+)/chat');
  var m = re.exec(loc);
  return m ? decodeURIComponent(m[1]) : null;
}

(async function() {
  // ===========================================================================
  // AC2 (integration) -- rough-idea choice registers ideate, keeps productId
  // ===========================================================================
  await test('roughIdeaChoiceRegistersIdeateSessionKeepsProductId (AC2)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-ideate-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' },
      body: { startSkill: 'ideate' }
    };
    var res = makeRes();
    var fakePool = { query: async function() { return { rows: [] }; } };
    var fakePosthog = { capture: function() {} };

    await productsRoute.handlePostProductFeature(req, res, null, fakePool, fakePosthog);

    var sid = extractSidFromRedirect(res, 'ideate');
    assert.ok(sid, 'expected a redirect into an /skills/ideate/sessions/:id/chat route, got: ' + (res._headers.Location || '(none)'));

    var session = skillsRoute._getHtmlSession(sid);
    assert.ok(session, 'expected the skill session to be registered');
    assert.strictEqual(session.skillName, 'ideate', 'expected the session to be registered under ideate, not discovery');

    var journey = journeyStore.getJourney(session.journeyId);
    assert.ok(journey, 'expected a real journey to be registered');
    assert.strictEqual(journey.productId, 'prod-ideate-1', 'expected productId to still be set on the ideate path');
    assert.strictEqual(journey.activeSkill, 'ideate', 'expected the journey activeSkill to be ideate');
  });

  // ===========================================================================
  // AC3 (integration) -- formed-idea choice registers discovery, keeps productId
  // (also covers omission of startSkill defaulting to discovery, matching
  // handlePostJourney's own default ternary behaviour)
  // ===========================================================================
  await test('formedIdeaChoiceRegistersDiscoverySessionKeepsProductId (AC3)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-discovery-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' },
      body: { startSkill: 'discovery' }
    };
    var res = makeRes();
    var fakePool = { query: async function() { return { rows: [] }; } };
    var fakePosthog = { capture: function() {} };

    await productsRoute.handlePostProductFeature(req, res, null, fakePool, fakePosthog);

    var sid = extractSidFromRedirect(res, 'discovery');
    assert.ok(sid, 'expected a redirect into an /skills/discovery/sessions/:id/chat route, got: ' + (res._headers.Location || '(none)'));

    var session = skillsRoute._getHtmlSession(sid);
    assert.ok(session, 'expected the skill session to be registered');
    assert.strictEqual(session.skillName, 'discovery', 'expected the session to be registered under discovery');

    var journey = journeyStore.getJourney(session.journeyId);
    assert.ok(journey, 'expected a real journey to be registered');
    assert.strictEqual(journey.productId, 'prod-discovery-1', 'expected productId to still be set on the discovery path');
    assert.strictEqual(journey.activeSkill, 'discovery', 'expected the journey activeSkill to be discovery');
  });

  await test('omitting startSkill defaults to discovery, matching pre-existing behaviour (AC3, AC5 non-regression)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-default-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' }
      // no body at all -- exercises the pre-existing test-req shape used by
      // check-jrf-s2-register-product-feature-journeys.js and
      // check-psh-s4-navigation.js
    };
    var res = makeRes();
    var fakePool = { query: async function() { return { rows: [] }; } };
    var fakePosthog = { capture: function() {} };

    await productsRoute.handlePostProductFeature(req, res, null, fakePool, fakePosthog);

    var sid = extractSidFromRedirect(res, 'discovery');
    assert.ok(sid, 'expected the default (no startSkill submitted) to still land on discovery, got: ' + (res._headers.Location || '(none)'));
    var session = skillsRoute._getHtmlSession(sid);
    assert.strictEqual(session.skillName, 'discovery');
  });

  // ===========================================================================
  // AC4 (integration) -- new feature via the ideate path is visible on the
  // product's own feature list, matching the formed-idea path's existing
  // correct productId attribution
  // ===========================================================================
  await test('newFeatureViaIdeatePathVisibleOnProductPage (AC4)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-listing-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' },
      body: { startSkill: 'ideate' }
    };
    var res = makeRes();
    var fakePool = { query: async function() { return { rows: [] }; } };
    var fakePosthog = { capture: function() {} };

    await productsRoute.handlePostProductFeature(req, res, null, fakePool, fakePosthog);

    var sid = extractSidFromRedirect(res, 'ideate');
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    // Simulate the exact shape handleGetProductView's own SQL query relies on
    // (SELECT journey_id, feature_slug, data->>'activeSkill' AS stage FROM
    // journeys WHERE product_id = $1) -- proving the ideate-path journey
    // carries the same productId/featureSlug/activeSkill fields the
    // discovery path already correctly provides.
    assert.strictEqual(journey.productId, 'prod-listing-1', 'expected the journey to be queryable by product_id, matching the discovery path');
    assert.ok(journey.featureSlug, 'expected a real feature_slug to have been set');
    assert.ok(journey.journeyId, 'expected a real journey_id');
    assert.strictEqual(journey.activeSkill, 'ideate', 'expected the stage/activeSkill visible in the product feature list to be ideate, not silently discovery');
  });

  // ===========================================================================
  // AC5 (integration, redundant smoke-check) -- handlePostJourney's own
  // behaviour is unchanged by this story (journey.js was not modified at
  // all). The authoritative AC5 evidence is the full existing /journey test
  // suite (tests/check-jlc-s1-credit-based-journey-cap.js,
  // tests/check-ougl3-journey-entry-and-start.js,
  // tests/check-p1.2-tenant-session-journey.js, tests/check-s2.1-preflight-gate.js,
  // tests/check-pla-s2-posthog-wiring.js, etc.) passing unmodified when the
  // full suite runs -- this local check just re-confirms the ideate/discovery
  // branch directly against the real, untouched handlePostJourney.
  // ===========================================================================
  await test('handlePostJourney (routes/journey.js) still branches ideate/discovery correctly and is untouched by this story (AC5)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var journeyRoute = freshRequire(JOURNEY_ROUTE_PATH);
    journeyRoute.setRepoRoot(require('os').tmpdir());

    var req = {
      session: { accessToken: 'test-token', tenantId: 'tenant-1', login: 'octocat' },
      method: 'POST',
      body: { featureName: 'AC5 regression check', startSkill: 'ideate', profileName: 'default' }
    };
    var res = makeRes();
    await journeyRoute.handlePostJourney(req, res);

    var loc = res._headers.Location || '';
    assert.ok(/^\/skills\/ideate\/sessions\//.test(loc), 'expected handlePostJourney to still route startSkill=ideate into /skills/ideate/..., got: ' + loc);
  });

  console.log('\n[pnfc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
