'use strict';
// check-dfr-s1-fix-delete-feature-redirect.js — dfr-s1: fix "Delete feature"
// to redirect back to the owning product, not the generic journeys list.
// artefacts/2026-07-29-delete-feature-redirect-fix/stories/dfr-s1-fix-delete-feature-redirect.md

var assert = require('assert');
var path   = require('path');

var FEATURES_PATH   = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var JOURNEY_PG_PATH  = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

function makeRes() {
  var state = { status: 200, body: '' };
  return {
    writeHead: function(code) { state.status = code; },
    end: function(body) { state.body = body || ''; },
    _get: function() { return state; }
  };
}

async function main() {
  // -- AC1: delete success handler redirects to /products/:productId when productId is present
  console.log('\n[dfr-s1] AC1 -- delete success handler redirects to /products/:productId');
  {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-dfr-s1-ac1', featureSlug: 'x', displayName: null, completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var req = { session: { accessToken: 'tok', login: 'user' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await test('AC1: redirect target is /products/product-abc, not /journey', async function() {
      // pncg-s1: handleGetFeatureArtefacts now threads a `pool` param (4th
      // positional, after featureSlug) through to renderShellWithNav's own
      // getProductsNavSummary(pool, tenantId) call -- empty rows is fine,
      // this test doesn't assert on the Products nav section itself.
      await routes.handleGetFeatureArtefacts(req, res, 'x', { query: async function() { return { rows: [] }; } });
      var body = res._get().body;
      assert.ok(body.indexOf('window.location.href="/products/product-abc"') !== -1, 'expected the redirect to target /products/product-abc, got: ' + body.slice(0, 400));
      assert.ok(body.indexOf('window.location.href="/journey"') === -1, 'expected the old /journey redirect to be gone');
    });
  }

  // -- AC3: falls back to /journey when productId is genuinely absent
  console.log('\n[dfr-s1] AC3 -- falls back to /journey when productId is absent');
  {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-dfr-s1-ac3', featureSlug: 'x', displayName: null, completedStages: [] }; }, // no productId
      getArtefactsForJourney: async function() { return []; }
    });
    var req = { session: { accessToken: 'tok', login: 'user' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await test('AC3: redirect falls back to /journey, never /products/undefined', async function() {
      // pncg-s1: handleGetFeatureArtefacts now threads a `pool` param (4th
      // positional, after featureSlug) through to renderShellWithNav's own
      // getProductsNavSummary(pool, tenantId) call -- empty rows is fine,
      // this test doesn't assert on the Products nav section itself.
      await routes.handleGetFeatureArtefacts(req, res, 'x', { query: async function() { return { rows: [] }; } });
      var body = res._get().body;
      assert.ok(body.indexOf('window.location.href="/journey"') !== -1, 'expected the fallback redirect to /journey, got: ' + body.slice(0, 400));
      assert.ok(body.indexOf('/products/undefined') === -1, 'must never redirect to /products/undefined');
    });
  }

  // -- AC2 (unit): listJourneys() maps product_id back onto the returned object
  console.log('\n[dfr-s1] AC2 (unit) -- listJourneys() rehydrates productId from Postgres');
  {
    var journeyPg = freshRequire(JOURNEY_PG_PATH);
    var capturedSql = null;
    var fakePool = {
      query: async function(sql) {
        capturedSql = sql;
        return { rows: [{ journey_id: 'j1', tenant_id: 't1', owner_id: 'o1', feature_slug: 'feat-x', product_id: 'product-xyz', created_at: '2026-07-29T00:00:00.000Z', data: {} }] };
      }
    };
    journeyPg._setPoolForTesting(fakePool);
    await test('AC2 (unit): the real listJourneys() function selects product_id and maps it to productId', async function() {
      var all = await journeyPg.listJourneys();
      assert.ok(capturedSql && /product_id/i.test(capturedSql), 'expected the SELECT statement to include product_id, got: ' + capturedSql);
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0].productId, 'product-xyz');
    });
    journeyPg._setPoolForTesting(null);
  }

  // -- AC2 (integration): real Postgres round-trip
  console.log('\n[dfr-s1] AC2 (integration) -- real Postgres round-trip for product_id');
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] AC2 (integration): DATABASE_URL not set -- integration test requires a real Postgres connection');
  } else {
    var { Pool } = require('pg');
    var pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    var seededProductId = null;
    var seededJourneyId = null;
    await test('AC2 (integration): listJourneys() returns productId after a real save/list cycle', async function() {
      // journeys.product_id is a real UUID FK -> products.product_id (see
      // server.js's ALTER TABLE), so this needs a real product row to
      // reference, not an arbitrary string.
      var productRes = await pgPool.query(
        "INSERT INTO products (tenant_id, name, created_by) VALUES ('dfr-s1-tenant', 'dfr-s1 test product', 'dfr-s1-test') RETURNING product_id"
      );
      seededProductId = productRes.rows[0].product_id;

      seededJourneyId = 'dfr-s1-test-journey-' + Date.now();
      await pgPool.query(
        'INSERT INTO journeys (journey_id, tenant_id, feature_slug, product_id, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (journey_id) DO NOTHING',
        [seededJourneyId, 'dfr-s1-tenant', 'dfr-s1-test', seededProductId, '{}']
      );

      var journeyPg = freshRequire(JOURNEY_PG_PATH);
      var all = await journeyPg.listJourneys();
      var found = all.find(function(j) { return j.journeyId === seededJourneyId; });
      assert.ok(found, 'expected to find the seeded journey in listJourneys() output');
      assert.strictEqual(found.productId, seededProductId);
    });
    if (seededJourneyId) await pgPool.query('DELETE FROM journeys WHERE journey_id = $1', [seededJourneyId]).catch(function() {});
    if (seededProductId) await pgPool.query('DELETE FROM products WHERE product_id = $1', [seededProductId]).catch(function() {});
    await pgPool.end();
  }

  console.log('\n--- dfr-s1 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
