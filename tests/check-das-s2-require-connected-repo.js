'use strict';

// tests/check-das-s2-require-connected-repo.js
//
// TDD tests for das-s2: require a connected repo before a brand-new product
// (journey count = 0) can start its first journey. See
// artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
// and artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s2-test-plan.md.
//
// The gate lives in handlePostProductFeature (routes/products.js, POST
// /products/:id/features) -- the only journey-creation entry point with a
// real productId at request time (see plans/das-s2-plan.md's "Contract
// deviation found during planning" section for why this is not journey.js).
//
// Follows the exact convention of tests/check-product-feature-cap-bypass.js
// (freshRequire + makeRes + inline pool mock), extended with a stateful pool
// mock that returns repo_owner/repo_name rows keyed by product_id/tenant_id.
//
// Run: node tests/check-das-s2-require-connected-repo.js

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.stack || err)); }
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

/**
 * Stateful pg-Pool-shaped mock covering every query shape exercised by
 * this test file:
 *   - SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND
 *     tenant_id = $2 (the new das-s2 gate check)
 *   - SELECT product_id, tenant_id FROM products WHERE product_id = $1
 *     (the pre-existing tenant-ownership check used by handlePutProductEdit
 *     / product-repo.js's _applyRepoChange)
 *   - UPDATE products SET repo_provider = $1, repo_owner = $2, repo_name =
 *     $3 WHERE product_id = $4 (the real repo-connection write path)
 * Mutable so AC2's "connect then retry" scenario, and the integration
 * test's real PUT /products/:id round trip, can flip a row from repo-less
 * to repo-connected mid-test.
 */
function createProductPool(initialRows) {
  var rows = (initialRows || []).slice();
  var queryCount = 0;
  function query(sql, params) {
    queryCount++;
    var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
    if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') !== -1) {
      var productId = params[0], tenantId = params[1];
      var match = rows.filter(function(r) { return r.product_id === productId && r.tenant_id === tenantId; });
      return Promise.resolve({ rows: match.map(function(r) { return { repo_owner: r.repo_owner, repo_name: r.repo_name }; }) });
    }
    if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM PRODUCTS WHERE PRODUCT_ID') !== -1) {
      var pid = params[0];
      var pmatch = rows.filter(function(r) { return r.product_id === pid; });
      return Promise.resolve({ rows: pmatch.map(function(r) { return { product_id: r.product_id, tenant_id: r.tenant_id }; }) });
    }
    if (s.indexOf('UPDATE PRODUCTS SET REPO_PROVIDER') !== -1) {
      var owner = params[1], repoName = params[2], updProductId = params[3];
      var target = rows.filter(function(r) { return r.product_id === updProductId; })[0];
      if (target) { target.repo_owner = owner; target.repo_name = repoName; }
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  }
  return {
    query: query,
    setRepo: function(productId, tenantId, owner, name) {
      var existing = rows.filter(function(r) { return r.product_id === productId && r.tenant_id === tenantId; })[0];
      if (existing) { existing.repo_owner = owner; existing.repo_name = name; }
      else { rows.push({ product_id: productId, tenant_id: tenantId, repo_owner: owner, repo_name: name }); }
    },
    getQueryCount: function() { return queryCount; }
  };
}

(async function() {
  console.log('\ncheck-das-s2-require-connected-repo.js');

  // ---------------------------------------------------------------------
  // AC1 -- zero-journey, no-repo product -> journey-start rejected with a
  // clear, actionable message (not a silent failure or generic error)
  // ---------------------------------------------------------------------
  await test('AC1: zeroJourneyNoRepoProduct_journeyStartRejected', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null); // no billing cap in play for this test
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = createProductPool([{ product_id: 'prod-ac1', tenant_id: 'tenant-ac1', repo_owner: null, repo_name: null }]);
    var req = { params: { id: 'prod-ac1' }, session: { tenantId: 'tenant-ac1', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    assert.ok(res._status >= 400, 'expected a rejection status, got ' + res._status);
    assert.notStrictEqual(res._status, 500, 'must be a deliberate rejection, not an unhandled server error');
    assert.ok(res._body && res._body.length > 0, 'must not be a silent failure -- a body must be present');
    assert.ok(/connect.*repo/i.test(res._body), 'message must direct the operator to connect a repo, got: ' + res._body.slice(0, 300));

    var all = [];
    try { all = journeyStore.listJourneys(); } catch (_) {}
    var created = all.filter(function(j) { return j.productId === 'prod-ac1'; });
    assert.strictEqual(created.length, 0, 'no journey should be created when the gate blocks');
  });

  // ---------------------------------------------------------------------
  // AC2 -- after connecting a repo, retry succeeds with no further
  // restriction (unit-level: pool row flipped to simulate a successful
  // picker connection)
  // ---------------------------------------------------------------------
  await test('AC2: afterConnectingRepo_retrySucceeds', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = createProductPool([{ product_id: 'prod-ac2', tenant_id: 'tenant-ac2', repo_owner: null, repo_name: null }]);
    var req1 = { params: { id: 'prod-ac2' }, session: { tenantId: 'tenant-ac2', login: 'octocat' } };
    var res1 = makeRes();
    await productsRoute.handlePostProductFeature(req1, res1, null, pool, { capture: function() {} });
    assert.ok(res1._status >= 400, 'first attempt must be blocked, got ' + res1._status);

    // Simulate a successful picker connection (mtrr-s2's existing write path)
    pool.setRepo('prod-ac2', 'tenant-ac2', 'acme', 'widgets');

    var req2 = { params: { id: 'prod-ac2' }, session: { tenantId: 'tenant-ac2', login: 'octocat' } };
    var res2 = makeRes();
    await productsRoute.handlePostProductFeature(req2, res2, null, pool, { capture: function() {} });

    assert.notStrictEqual(res2._status, 409, 'expected the retry to succeed once a repo is connected, got ' + res2._status);
    assert.ok(res2._headers.Location, 'expected a real redirect to the new feature\'s chat session on success');
  });

  // ---------------------------------------------------------------------
  // AC3 (regression guard, 1-M1) -- product with >=1 existing journey and
  // no repo -> NOT blocked, regardless of when it was created
  // ---------------------------------------------------------------------
  await test('AC3: existingJourneyNoRepo_notBlocked', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    // Seed one existing journey already belonging to this product.
    var existing = journeyStore.createJourney('pending', 'default');
    journeyStore.setJourneyFields(existing.journeyId, { productId: 'prod-ac3', tenantId: 'tenant-ac3' });

    var pool = createProductPool([{ product_id: 'prod-ac3', tenant_id: 'tenant-ac3', repo_owner: null, repo_name: null }]);
    var req = { params: { id: 'prod-ac3' }, session: { tenantId: 'tenant-ac3', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    assert.notStrictEqual(res._status, 409, 'a product with >=1 existing journey must never be blocked by this gate, got ' + res._status);
    assert.ok(res._headers.Location, 'expected a real redirect (not blocked)');
  });

  // ---------------------------------------------------------------------
  // AC4 -- brand-new product (0 journeys) that already has a repo
  // connected -> proceeds with no gate friction at all
  // ---------------------------------------------------------------------
  await test('AC4: brandNewProductWithRepoAlreadyConnected_noGateFriction', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = createProductPool([{ product_id: 'prod-ac4', tenant_id: 'tenant-ac4', repo_owner: 'acme', repo_name: 'widgets' }]);
    var req = { params: { id: 'prod-ac4' }, session: { tenantId: 'tenant-ac4', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    assert.notStrictEqual(res._status, 409, 'expected no gate friction when a repo is already connected, got ' + res._status);
    assert.ok(res._headers.Location, 'expected a real redirect');
  });

  // ---------------------------------------------------------------------
  // Integration -- picker-connect-then-journey-start end-to-end through the
  // real gate-check code path (not a direct function call bypassing it)
  // ---------------------------------------------------------------------
  await test('Integration: pickerConnectThenJourneyStart_endToEnd', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = createProductPool([{ product_id: 'prod-it1', tenant_id: 'tenant-it1', repo_owner: null, repo_name: null }]);

    // Blocked at the gate first.
    var blockedRes = makeRes();
    await productsRoute.handlePostProductFeature(
      { params: { id: 'prod-it1' }, session: { tenantId: 'tenant-it1', login: 'octocat' } },
      blockedRes, null, pool, { capture: function() {} }
    );
    assert.ok(blockedRes._status >= 400, 'expected initial block');

    // Submit a repo selection via the picker's existing write path
    // (PUT /products/:id, handlePutProductEdit -> product-repo.js's
    // _applyRepoChange) so this genuinely exercises the real connection
    // endpoint's query shapes against the same pool, not just the pool
    // mock's setRepo test helper. Only the D37 repo-access-verification
    // adapter (a real GitHub API call) is stubbed -- the ownership check
    // and the UPDATE both run for real against `pool`.
    var _repoAdapterModule = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter'));
    var _throwingStub = function() { throw new Error('Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.'); };
    _repoAdapterModule.setRepoAdapter(async function() { return { hasAccess: true, status: 200 }; });
    var putReq = {
      params: { id: 'prod-it1' },
      session: { tenantId: 'tenant-it1', login: 'octocat', accessToken: 'test-token' },
      body: { owner: 'acme', repo: 'widgets' }
    };
    var putRes = makeRes();
    try {
      await productsRoute.handlePutProductEdit(putReq, putRes, null, pool, { capture: function() {} });
    } finally {
      _repoAdapterModule.setRepoAdapter(_throwingStub);
    }

    // Real journey-start endpoint, retried.
    var successRes = makeRes();
    await productsRoute.handlePostProductFeature(
      { params: { id: 'prod-it1' }, session: { tenantId: 'tenant-it1', login: 'octocat' } },
      successRes, null, pool, { capture: function() {} }
    );
    assert.notStrictEqual(successRes._status, 409, 'expected the journey to create successfully end-to-end, got ' + successRes._status);
  });

  // ---------------------------------------------------------------------
  // NFR: Performance -- the gate check issues exactly one query
  // ---------------------------------------------------------------------
  await test('NFR: gateCheckLatency_singleQuery', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = createProductPool([{ product_id: 'prod-nfr1', tenant_id: 'tenant-nfr1', repo_owner: 'acme', repo_name: 'widgets' }]);
    var req = { params: { id: 'prod-nfr1' }, session: { tenantId: 'tenant-nfr1', login: 'octocat' } };
    var res = makeRes();
    var start = Date.now();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });
    var elapsed = Date.now() - start;

    assert.strictEqual(pool.getQueryCount(), 1, 'expected exactly 1 query for the gate check, got ' + pool.getQueryCount());
    assert.ok(elapsed < 1000, 'gate check + journey creation took ' + elapsed + 'ms -- expected well under 1000ms in a unit test');
  });

  // ---------------------------------------------------------------------
  // NFR: Accessibility -- blocking message has a semantic heading and a
  // descriptive link (not a bare "error" with no actionable path)
  // ---------------------------------------------------------------------
  await test('NFR: blockingMessage_semanticStructure', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var tenantPlan = freshRequire(TENANT_PLAN_PATH);
    tenantPlan.setCapReader(null);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);

    var pool = createProductPool([{ product_id: 'prod-nfr2', tenant_id: 'tenant-nfr2', repo_owner: null, repo_name: null }]);
    var req = { params: { id: 'prod-nfr2' }, session: { tenantId: 'tenant-nfr2', login: 'octocat' } };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    assert.ok(/<h1[^>]*>/i.test(res._body), 'expected a semantic <h1> heading, got: ' + res._body.slice(0, 300));
    assert.ok(/<a\s+href="\/products\/prod-nfr2"/i.test(res._body), 'expected a descriptive link back to the product\'s repo-connection picker, got: ' + res._body.slice(0, 300));
  });

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
