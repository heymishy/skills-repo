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

  console.log('\n[pr-s2-pr-s3-products-route] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
