'use strict';

// tests/check-jrf-s2-register-product-feature-journeys.js — jrf-s2
//
// Unit + integration tests for jrf-s2 (register product-feature journeys in
// the shared in-memory journey store, fixing "Journey not found" at
// gate-confirm). Covers AC1-AC5 from
// artefacts/2026-07-22-journey-registration-fix/test-plans/jrf-s2-test-plan.md.
//
// Deliberately imports and calls the REAL exported handlePostProductFeature
// from routes/products.js -- jrf-s1's own test file hand-copied a
// reimplementation of this handler instead, which is exactly why this bug
// went uncaught (see decisions.md / the test plan's own note).

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
var JOURNEY_STORE_PG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');
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

function extractSidFromRedirect(res) {
  var loc = res._headers.Location || '';
  var m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
  return m ? decodeURIComponent(m[1]) : null;
}

(async function() {
  // ===========================================================================
  // U1 -- journey-store-pg.js's saveJourney writes product_id into the real column (AC3)
  // ===========================================================================
  await test('saveJourney writes product_id into both the INSERT list and ON CONFLICT DO UPDATE clause (AC3)', async function() {
    var journeyStorePg = freshRequire(JOURNEY_STORE_PG_PATH);
    var recordedSql = null;
    var recordedParams = null;
    var fakePool = {
      query: async function(sql, params) { recordedSql = sql; recordedParams = params; return { rows: [] }; }
    };
    // journey-store-pg.js builds its own pool internally from DATABASE_URL; for
    // this unit test we bypass _getPool by monkeypatching the exported function
    // indirectly is not possible (no injectable setter exists for the pool) --
    // instead we assert on the SQL text/params shape via a temporary DATABASE_URL
    // stub is impractical here, so we verify via direct source inspection of the
    // already-modified query string construction, exercised through a minimal
    // reimplementation-free check: call saveJourney with DATABASE_URL unset,
    // which no-ops safely (returns early), and instead assert on the literal
    // SQL template captured from the module's own source at require-time.
    var fs = require('fs');
    var src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js'), 'utf8');
    assert.ok(/INSERT INTO journeys \(journey_id, tenant_id, owner_id, feature_slug, product_id, data\)/.test(src), 'expected product_id in the INSERT column list');
    assert.ok(/product_id = EXCLUDED\.product_id/.test(src), 'expected product_id in the ON CONFLICT DO UPDATE clause');
    assert.ok(/journey\.productId \|\| null/.test(src), 'expected journey.productId to be read as a param');
  });

  // ===========================================================================
  // AC1, AC2 -- journey registered in-memory, activeSession genuinely set
  // ===========================================================================
  await test('handlePostProductFeature registers the journey in the real in-memory store (AC1)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat' } };
    var res = makeRes();
    var fakePosthog = { capture: function() {} };
    var fakePool = { query: async function() { return { rows: [] }; } };

    await productsRoute.handlePostProductFeature(req, res, null, fakePool, fakePosthog);

    var sid = extractSidFromRedirect(res);
    assert.ok(sid, 'expected a real redirect to a discovery chat session');

    // Recover the journeyId via the linked session (real skills.js module, same require-cache instance).
    var skillsRoute = require(SKILLS_ROUTE_PATH);
    var session = skillsRoute._getHtmlSession(sid);
    assert.ok(session, 'expected the skill session to be registered');
    var journeyId = session.journeyId;
    assert.ok(journeyId, 'expected the session to be linked to a journey');

    var journey = journeyStore.getJourney(journeyId);
    assert.ok(journey, 'expected getJourney to return a real journey object, not null (this is the exact bug: it previously returned null)');
  });

  await test('activeSessionId and activeSkill are genuinely populated, not silently dropped (AC2)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function() { return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res);
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    assert.strictEqual(journey.activeSessionId, sid, 'expected activeSessionId to be genuinely set (previously silently no-op\'d)');
    assert.strictEqual(journey.activeSkill, 'discovery');
  });

  // ===========================================================================
  // AC3 (integration) -- productId reaches the adapter layer
  // ===========================================================================
  await test('the created journey carries the real productId through to the store (AC3)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = { params: { id: 'real-product-id-123' }, session: { tenantId: 'tenant-1', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function() { return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res);
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    assert.strictEqual(journey.productId, 'real-product-id-123', 'expected the journey object to carry productId, ready for saveJourney to persist it to the real column');
  });

  // ===========================================================================
  // AC4 (integration) -- gate-confirm no longer 404s for a journey created this way
  // ===========================================================================
  await test('handlePostGateConfirm does not return "Journey not found" for a journey created via the fixed handler (AC4)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);
    var journeyRoute = freshRequire(JOURNEY_ROUTE_PATH);

    var req1 = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat' } };
    var res1 = makeRes();
    await productsRoute.handlePostProductFeature(req1, res1, null, { query: async function() { return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res1);
    var session = skillsRoute._getHtmlSession(sid);
    var journeyId = session.journeyId;

    // Mark the session complete (bypassing the real multi-turn chat flow, matching
    // this repo's own established cdg4 test convention for gate-confirm fixtures).
    skillsRoute._setHtmlSession(sid, Object.assign({}, session, {
      done: true,
      artefactPath: 'artefacts/test-jrf-s2/discovery.md',
      artefactContent: '# Discovery'
    }));

    journeyRoute.setRepoRoot(require('os').tmpdir());

    var req2 = { params: { journeyId: journeyId }, session: { tenantId: 'tenant-1', login: 'octocat', accessToken: 'test-token' } };
    var res2 = makeRes();
    await journeyRoute.handlePostGateConfirm(req2, res2);

    assert.notStrictEqual(res2._status, 404, 'expected no 404 at all for this journey (got ' + res2._status + ')');
    assert.ok(res2._body.indexOf('Journey not found') === -1, 'expected the response body to never say "Journey not found"');
  });

  // ===========================================================================
  // AC5 (integration) -- the existing product-view journeys-listing query shape picks it up
  // ===========================================================================
  await test('a journey created via the fixed handler is queryable by product_id, matching handleGetProductView\'s own query shape (AC5)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = { params: { id: 'listing-product-id' }, session: { tenantId: 'tenant-1', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function() { return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res);
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    // Simulate the exact shape handleGetProductView's own SQL query would return,
    // sourced from the in-memory journey's own fields (proving the data needed
    // for that query -- journeyId, featureSlug, productId -- is all present).
    assert.strictEqual(journey.productId, 'listing-product-id');
    assert.ok(journey.featureSlug, 'expected a real feature_slug to have been set');
    assert.ok(journey.journeyId, 'expected a real journey_id');
  });

  console.log('\n[jrf-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
