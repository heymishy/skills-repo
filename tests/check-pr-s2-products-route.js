'use strict';

// tests/check-pr-s2-products-route.js
// pr-s2 AC2 -- GET /products/:id renders the cached DoD status once a sync
// has completed, instead of only the pre-existing featureCount.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err.message);
  }
}

console.log('\n[pr-s2] AC2 -- products.js route can render cached DoD status');

var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var src = require('fs').readFileSync(PRODUCTS_PATH, 'utf8');

test('products.js references product_rollups (reads the cache table for rendering)', function() {
  assert.ok(/product_rollups/i.test(src), 'Expected products.js to reference the product_rollups cache table');
});

test('products.js references dod_status_counts (renders the cached DoD counts, not just featureCount)', function() {
  assert.ok(/dod_status_counts/i.test(src), 'Expected products.js to read/render dod_status_counts from the cache row');
});


console.log('\n[pr-s3] AC2 -- POST /products/:id/sync triggers a new sync and returns the updated rollup');

test('products.js exports handlePostProductSync', function() {
  var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
  assert.strictEqual(typeof productsRoute.handlePostProductSync, 'function', 'Expected products.js to export handlePostProductSync');
});

(async function() {
  var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

  await (async function() {
    try {
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify({ features: [{ slug: 'f1', stories: [{ dodStatus: 'complete' }] }] })).toString('base64'), encoding: 'base64' };
      });

      // Re-require products.js after setting up the adapter mock, so the handler gets the mocked adapter
      var productsRouteFresh = (function() {
        delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
        return require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
      })();

      var writtenRows = [];
      var mockPool = {
        query: async function(sql, params) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) {
            return { rows: [{ product_id: 'p1', tenant_id: 't1' }] };
          }
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) {
            return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          }
          if (/INSERT INTO product_rollups/i.test(sql)) {
            writtenRows.push(params);
            return { rows: [] };
          }
          return { rows: [] };
        }
      };

      var req = { params: { id: 'p1' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var statusCode = null; var jsonBody = null;
      var res = { status: function(c) { statusCode = c; return { json: function(b) { jsonBody = b; } }; } };

      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);

      passed++; console.log('  [PASS] handlePostProductSync: completes without throwing for a valid product with a connected repo');
      if (writtenRows.length !== 1) { throw new Error('Expected exactly one cache write, got ' + writtenRows.length); }
      passed++; console.log('  [PASS] handlePostProductSync: writes exactly one rollup cache row via triggerProductSync');
    } catch (err) {
      failed++; console.log('  [FAIL] handlePostProductSync happy path --', err.message);
    }
  })();

  console.log('\n[pr-s3] AC4 -- a second concurrent POST /products/:id/sync for the same product is rejected (409)');

  await (async function() {
    try {
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      var resolveFetch;
      var fetchGate = new Promise(function(resolve) { resolveFetch = resolve; });
      adapterMod.setPipelineStateFetchAdapter(async function() {
        await fetchGate;
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });

      // Re-require products.js after setting up the adapter mock
      var productsRouteFresh = (function() {
        delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
        return require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
      })();

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p2', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p2' }, session: { tenantId: 't1', accessToken: 'fake-token' } };

      var firstStatus = null; var secondStatus = null;
      var res1 = { status: function(c) { firstStatus = c; return { json: function() {} }; } };
      var res2 = { status: function(c) { secondStatus = c; return { json: function() {} }; } };

      var firstCallPromise = productsRouteFresh.handlePostProductSync(req, res1, null, mockPool, null);
      await new Promise(function(r) { setTimeout(r, 10); }); // let the first call reach the in-flight guard
      await productsRouteFresh.handlePostProductSync(req, res2, null, mockPool, null);

      if (secondStatus !== 409) { throw new Error('Expected the second concurrent call to respond 409, got ' + secondStatus); }
      passed++; console.log('  [PASS] handlePostProductSync: a second concurrent call for the same product responds 409');

      resolveFetch();
      await firstCallPromise;
    } catch (err) {
      failed++; console.log('  [FAIL] handlePostProductSync concurrency --', err.message);
    }
  })();

  console.log('\n[pr-s3] AC1/AC3/AC4 -- freshness section and Refresh control render correctly in all three states');

  await (async function() {
    try {
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/routes/products.js'))];
      var productsRouteFresh = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var rollupMod = require(rollupModPath);

      // State 1: never synced (AC3)
      var mockPoolNeverSynced = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, synced_at FROM product_rollups/i.test(sql)) return { rows: [] };
          return { rows: [] };
        }
      };
      var htmlNeverSynced = null;
      var reqNeverSynced = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resNeverSynced = { writeHead: function() {}, end: function(body) { htmlNeverSynced = body; } };
      await productsRouteFresh.handleGetProductView(reqNeverSynced, resNeverSynced, null, mockPoolNeverSynced);
      if (!/Not yet synced/i.test(htmlNeverSynced)) throw new Error('Expected "Not yet synced" text in the rendered page when no rollup row exists');
      passed++; console.log('  [PASS] _renderProductView: shows "Not yet synced" when no cache row exists (AC3)');

      // State 2: previously synced (AC1)
      var syncedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      var mockPoolSynced = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          if (/SELECT dod_status_counts, synced_at FROM product_rollups/i.test(sql)) return { rows: [{ dod_status_counts: '{"complete":1}', synced_at: syncedAt }] };
          return { rows: [] };
        }
      };
      var htmlSynced = null;
      var reqSynced = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resSynced = { writeHead: function() {}, end: function(body) { htmlSynced = body; } };
      await productsRouteFresh.handleGetProductView(reqSynced, resSynced, null, mockPoolSynced);
      if (!/2 hours? ago/i.test(htmlSynced)) throw new Error('Expected a relative-time string mentioning "2 hours ago" in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: shows human-readable last-synced time (AC1)');
      if (!/Refresh/i.test(htmlSynced)) throw new Error('Expected a Refresh action in the rendered page');
      passed++; console.log('  [PASS] _renderProductView: renders a Refresh action');

      // State 3: sync currently in progress (AC4) -- render must disable Refresh
      // and show a non-colour-only loading signal (text label)
      rollupMod._syncsInProgressForTest = rollupMod._syncsInProgressForTest; // no-op guard, real check below
      var wasInProgress = rollupMod.isSyncInProgress('p1');
      // Force the in-flight flag on via triggerProductSync's own tracked Set,
      // using a fetch adapter that never resolves during this synchronous check.
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(function() { return new Promise(function() {}); }); // never resolves
      var mockPoolForTrigger = { query: async function() { return { rows: [] }; } };
      rollupMod.triggerProductSync(mockPoolForTrigger, adapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'x' }); // fire and forget, intentionally not awaited

      var htmlInProgress = null;
      var reqInProgress = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var resInProgress = { writeHead: function() {}, end: function(body) { htmlInProgress = body; } };
      await productsRouteFresh.handleGetProductView(reqInProgress, resInProgress, null, mockPoolSynced);
      if (!/disabled/i.test(htmlInProgress)) throw new Error('Expected the Refresh control to render as disabled while a sync is in progress (AC4)');
      passed++; console.log('  [PASS] _renderProductView: Refresh control is disabled while a sync is in progress (AC4)');
      if (!/(Syncing|Refreshing|in progress)/i.test(htmlInProgress)) throw new Error('Expected a text loading label (not colour-only) during sync (NFR-A11y)');
      passed++; console.log('  [PASS] _renderProductView: loading state has a text label, not colour alone (NFR-A11y)');
    } catch (err) {
      failed++; console.log('  [FAIL] freshness/Refresh rendering --', err.message);
    }
  })();

  console.log('\n[pr-s2-pr-s3-products-route] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
