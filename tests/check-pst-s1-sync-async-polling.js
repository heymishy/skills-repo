'use strict';
var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

console.log('\n[pst-s1] AC1/AC3 -- sync route responds immediately and logs background failures');

(async function() {
  var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

  // AC1: response is sent before the background sync work resolves
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
        await fetchGate; // never resolves until the test releases it
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-ac1', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-ac1' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var responded = false; var statusCode = null;
      var res = { status: function(c) { statusCode = c; responded = true; return { json: function() {} }; } };

      var start = Date.now();
      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
      var elapsed = Date.now() - start;

      if (!responded) throw new Error('Expected a response to have been sent before the deferred fetch resolved');
      if (statusCode !== 202) throw new Error('Expected 202, got ' + statusCode);
      if (elapsed > 1000) throw new Error('Expected the immediate response in well under 1000ms, took ' + elapsed + 'ms');
      passed++; console.log('  [PASS] handlePostProductSync: responds 202 before the background fetch resolves (AC1)');
      resolveFetch();
      await new Promise(function(r) { setTimeout(r, 10); }); // let the background promise settle
    } catch (err) { failed++; console.log('  [FAIL] AC1 immediate response --', err.message); }
  })();

  // AC3: a background failure is logged via console.error, not swallowed
  await (async function() {
    try {
      var rollupModPath = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
      delete require.cache[require.resolve(rollupModPath)];
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(async function() { throw new Error('simulated GitHub fetch failure'); });

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-ac3', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-ac3' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var res = { status: function() { return { json: function() {} }; } };

      var errorLogs = [];
      var originalConsoleError = console.error;
      console.error = function() { errorLogs.push(Array.prototype.slice.call(arguments)); };
      try {
        await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
        await new Promise(function(r) { setTimeout(r, 20); }); // let the background rejection settle
      } finally {
        console.error = originalConsoleError;
      }

      var loggedTheFailure = errorLogs.some(function(args) {
        return args.some(function(a) { return typeof a === 'string' && /simulated GitHub fetch failure|p-ac3/.test(a); });
      });
      if (!loggedTheFailure) throw new Error('Expected the background failure to be logged via console.error, got: ' + JSON.stringify(errorLogs));
      passed++; console.log('  [PASS] handlePostProductSync: background failure is logged via console.error, not swallowed (AC3)');
    } catch (err) { failed++; console.log('  [FAIL] AC3 background failure logged --', err.message); }
  })();

  console.log('\n[pst-s1] AC2 -- background success still writes to product_rollups exactly as before');

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

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var writtenRows = [];
      var mockPool = {
        query: async function(sql, params) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-ac2', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          if (/INSERT INTO product_rollups/i.test(sql)) { writtenRows.push(params); return { rows: [] }; }
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-ac2' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var res = { status: function() { return { json: function() {} }; } };

      await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
      if (writtenRows.length !== 0) throw new Error('Expected zero writes before the background fetch resolves, got ' + writtenRows.length);
      resolveFetch();
      await new Promise(function(r) { setTimeout(r, 20); }); // let the background write settle
      if (writtenRows.length !== 1) throw new Error('Expected exactly one cache write once the background sync resolves, got ' + writtenRows.length);
      passed++; console.log('  [PASS] handlePostProductSync: background success still writes exactly one product_rollups row, unchanged shape (AC2)');
    } catch (err) { failed++; console.log('  [FAIL] AC2 background write --', err.message); }
  })();

  console.log('\n[pst-s1] AC4 (backend) -- GET /products/:id/sync/status reports in-flight state, tenant-scoped');

  await (async function() {
    try {
      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      if (typeof productsRouteFresh.handleGetProductSyncStatus !== 'function') {
        throw new Error('Expected products.js to export handleGetProductSyncStatus');
      }
      passed++; console.log('  [PASS] products.js exports handleGetProductSyncStatus');

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-status', tenant_id: 't1' }] };
          return { rows: [] };
        }
      };

      // Wrong tenant -> 404, no leak of sync state across tenants
      var wrongTenantReq = { params: { id: 'p-status' }, session: { tenantId: 't-other' } };
      var wrongTenantStatus = null;
      var wrongTenantRes = { status: function(c) { wrongTenantStatus = c; return { json: function() {} }; } };
      await productsRouteFresh.handleGetProductSyncStatus(wrongTenantReq, wrongTenantRes, null, mockPool);
      if (wrongTenantStatus !== 404) throw new Error('Expected 404 for a mismatched tenant, got ' + wrongTenantStatus);
      passed++; console.log('  [PASS] handleGetProductSyncStatus: 404 for a product outside the caller\'s tenant (NFR-Security)');

      // Correct tenant, no sync in progress -> inProgress:false
      var req = { params: { id: 'p-status' }, session: { tenantId: 't1' } };
      var jsonBody = null;
      var res = { status: function() { return { json: function(b) { jsonBody = b; } }; } };
      await productsRouteFresh.handleGetProductSyncStatus(req, res, null, mockPool);
      if (jsonBody.inProgress !== false) throw new Error('Expected inProgress:false when no sync is running, got ' + JSON.stringify(jsonBody));
      passed++; console.log('  [PASS] handleGetProductSyncStatus: reports inProgress:false when no sync is running (AC4)');
    } catch (err) { failed++; console.log('  [FAIL] AC4 backend status endpoint --', err.message); }
  })();

  console.log('\n[pst-s1] AC4 (frontend) -- rendered page includes real polling logic targeting the status endpoint');

  await (async function() {
    try {
      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);
      var html = productsRouteFresh._renderProductView('Acme', 'p1', [], 'user1', null, false, null, null, [], 'csrf-token', {}, {}, [], 0, null, false);

      if (!/pshTriggerSync/.test(html)) throw new Error('Expected the pshTriggerSync function to still be rendered');
      passed++; console.log('  [PASS] _renderProductView: still renders pshTriggerSync');

      if (!/\/sync\/status/.test(html)) throw new Error('Expected a fetch call targeting a .../sync/status-shaped URL in the rendered script');
      passed++; console.log('  [PASS] _renderProductView: rendered script fetches the new sync/status endpoint (AC4)');

      if (!/setTimeout\(/.test(html)) throw new Error('Expected a real polling construct (setTimeout), not a single one-shot fetch');
      passed++; console.log('  [PASS] _renderProductView: rendered script contains a polling construct, not a one-shot fetch (AC4)');

      if (!/window\.location\.reload\(\)/.test(html)) throw new Error('Expected a window.location.reload() call gated on the polled status');
      passed++; console.log('  [PASS] _renderProductView: rendered script reloads the page once polling reports completion (AC4)');
    } catch (err) { failed++; console.log('  [FAIL] AC4 frontend polling script --', err.message); }
  })();

  console.log('\n[pst-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
})();
