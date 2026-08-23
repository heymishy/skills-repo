'use strict';

// tests/check-product-feature-cap-bypass.js
//
// Regression test for a production gap found live: a tenant that signed up
// and never completed Stripe checkout could create unlimited features via
// handlePostProductFeature (routes/products.js, the "add feature" flow from
// within a product's own page) -- this entry point had never been wired to
// the usage-cap check handlePostJourney (routes/journey.js, the standalone
// /journey form) has always correctly enforced. Confirmed via code review:
// handlePostProductFeature called tenantPlan.checkJourneyCap nowhere at all.
//
// This file verifies the ported gate: same tenantPlan.checkJourneyCap call,
// same 402 response shape, same "allowed under cap, blocked at cap" boundary
// behaviour already covered for the standalone form by
// tests/check-bri-s3.5-usage-gate.js and tests/e2e/bri-s3.5-billing-journey.spec.js.
//
// Run: node tests/check-product-feature-cap-bypass.js

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
var TENANT_PLAN_PATH = path.resolve(__dirname, '../src/web-ui/modules/tenant-plan.js');

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

(async function() {

  await test('AC1: handlePostProductFeature blocks with 402 when the tenant is already at the journey cap', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(function() { return 0; }); // cap=0 -- even the very first feature is "at the limit"
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'e2e-cap-tenant', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function() { return { rows: [] }; } }, { capture: function() {} });

    assert.strictEqual(res._status, 402, 'expected a 402 response when at cap, got ' + res._status);
    assert.ok(res._body.indexOf('Journey limit reached') !== -1, 'expected a human-readable "Journey limit reached" message');
    tenantPlan.setCapReader(null);
  });

  await test('AC2: no journey is created in the store when the cap check blocks the request', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(function() { return 0; });
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'e2e-cap-tenant-2', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function() { return { rows: [] }; } }, { capture: function() {} });

    assert.strictEqual(res._status, 402);
    var all = [];
    try { all = journeyStore.listJourneys(); } catch (_) {} // empty in-memory store throws (D37 test-isolation guard) -- means zero journeys, exactly as expected here
    var forTenant = all.filter(function(j) { return j.tenantId === 'e2e-cap-tenant-2'; });
    assert.strictEqual(forTenant.length, 0, 'expected zero journeys created for a blocked request, found ' + forTenant.length);
    tenantPlan.setCapReader(null);
  });

  // das-s2: handlePostProductFeature now also gates on "brand-new product
  // (0 journeys) with no connected repo" (see
  // tests/check-das-s2-require-connected-repo.js for that gate's own
  // dedicated coverage). AC3/AC4/AC5 below test the billing-cap gate, not
  // the repo gate, so their pool mock must report a connected repo for
  // 'prod-1' -- otherwise every request here is a brand-new, repo-less
  // product and das-s2's gate would block them before the cap logic is
  // ever exercised, which is not what these tests are checking.
  function poolWithConnectedRepo() {
    return { query: async function(sql) {
      if (String(sql).toUpperCase().indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) {
        return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      return { rows: [] };
    } };
  }

  await test('AC3: handlePostProductFeature still succeeds (real redirect, no 402) when under the cap', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(function() { return 5; }); // plenty of headroom
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'e2e-cap-tenant-3', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, poolWithConnectedRepo(), { capture: function() {} });

    assert.notStrictEqual(res._status, 402, 'expected no 402 when well under cap');
    assert.ok(res._headers.Location, 'expected a real redirect to the new feature\'s chat session');
    tenantPlan.setCapReader(null);
  });

  await test('AC4: no cap configured (unlimited) -- unchanged pre-existing behaviour, no 402', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    delete process.env.MAX_JOURNEYS_PER_TENANT;
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'e2e-cap-tenant-4', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, poolWithConnectedRepo(), { capture: function() {} });

    assert.notStrictEqual(res._status, 402, 'expected no 402 when no cap is configured at all (matches pre-existing behaviour)');
    assert.ok(res._headers.Location, 'expected a real redirect');
  });

  await test('AC5: paid + active plan state lifts the cap entirely, same as the standalone /journey form', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(function() { return 0; }); // would block a trial tenant
    var _fakeRows = new Map();
    tenantPlan.setPlanStateAdapter({
      query: async function(sql, params) {
        if (sql.indexOf('INSERT INTO tenant_plan') !== -1) { _fakeRows.set(params[0], { plan: params[1], status: params[2] }); return { rows: [], rowCount: 1 }; }
        if (sql.indexOf('SELECT plan, status FROM tenant_plan') !== -1) {
          var row = _fakeRows.get(params[0]);
          return { rows: row ? [{ plan: row.plan, status: row.status }] : [] };
        }
        return { rows: [] };
      }
    });
    await tenantPlan.setPlanState('e2e-cap-tenant-5', 'paid', 'active');
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var req = { params: { id: 'prod-1' }, session: { tenantId: 'e2e-cap-tenant-5', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, poolWithConnectedRepo(), { capture: function() {} });

    assert.notStrictEqual(res._status, 402, 'expected a paid+active tenant to bypass the cap entirely, same as the standalone /journey form');
    tenantPlan.setCapReader(null);
  });

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
