'use strict';

// tests/check-pgft-s1-fetch-retry.js
// pgft-s1 -- realFetchPipelineState retries on transient network/parse
// failure, with diagnostic detail when retries are exhausted, while never
// retrying a genuine non-ok HTTP response.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

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
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

async function main() {
  var queue = [];

  console.log('\n[pgft-s1] AC1 -- retries on network error or JSON-parse failure, up to 3 total attempts');

  queue.push(function() {
    return test('realFetchPipelineState: recovers from a thrown network error on retry (AC1)', async function() {
      var originalFetch = global.fetch;
      var callCount = 0;
      global.fetch = async function() {
        callCount++;
        if (callCount === 1) { throw new TypeError('fetch failed'); }
        return {
          ok: true, status: 200,
          headers: { get: function() { return null; } },
          text: async function() { return JSON.stringify({ content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64' }); }
        };
      };
      try {
        var mod = freshRequire();
        var result = await mod.realFetchPipelineState('acme', 'widgets', 'fake-token');
        assert.ok(result && result.content, 'Expected a successful result after recovering from a network error');
        assert.strictEqual(callCount, 2, 'Expected exactly 2 fetch calls (1 failure + 1 success), got ' + callCount);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  queue.push(function() {
    return test('realFetchPipelineState: recovers from a JSON-parse failure on retry (AC1)', async function() {
      var originalFetch = global.fetch;
      var callCount = 0;
      global.fetch = async function() {
        callCount++;
        if (callCount === 1) {
          return { ok: true, status: 200, headers: { get: function() { return '5'; } }, text: async function() { return '{"fe'; } };
        }
        return {
          ok: true, status: 200,
          headers: { get: function() { return null; } },
          text: async function() { return JSON.stringify({ content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64' }); }
        };
      };
      try {
        var mod = freshRequire();
        var result = await mod.realFetchPipelineState('acme', 'widgets', 'fake-token');
        assert.ok(result && result.content, 'Expected a successful result after recovering from a parse failure');
        assert.strictEqual(callCount, 2, 'Expected exactly 2 fetch calls (1 failure + 1 success), got ' + callCount);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  console.log('\n[pgft-s1] AC2 -- diagnostic detail (bytes received, Content-Length) when all retries are exhausted');

  queue.push(function() {
    return test('realFetchPipelineState: diagnostic detail (bytes received, Content-Length) in the final error (AC2)', async function() {
      var originalFetch = global.fetch;
      var callCount = 0;
      global.fetch = async function() {
        callCount++;
        return {
          ok: true, status: 200,
          headers: { get: function(name) { return name === 'content-length' ? '1800000' : null; } },
          text: async function() { return '{"features":['; } // 13 bytes, truncated
        };
      };
      try {
        var mod = freshRequire();
        try {
          await mod.realFetchPipelineState('acme', 'widgets', 'fake-token');
          assert.fail('Expected realFetchPipelineState to throw after exhausting all retries');
        } catch (err) {
          assert.ok(/13/.test(err.message), 'Expected the error message to include the actual received byte count (13): ' + err.message);
          assert.ok(/1800000/.test(err.message), 'Expected the error message to include the Content-Length header value (1800000): ' + err.message);
          assert.strictEqual(callCount, 3, 'Expected exactly 3 fetch calls (all attempts exhausted), got ' + callCount);
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  console.log('\n[pgft-s1] AC3 -- non-ok HTTP response never retried, fails immediately unchanged');

  queue.push(function() {
    return test('realFetchPipelineState: non-ok HTTP response fails immediately, never retried (AC3)', async function() {
      var originalFetch = global.fetch;
      var callCount = 0;
      global.fetch = async function() {
        callCount++;
        return { ok: false, status: 404 };
      };
      try {
        var mod = freshRequire();
        try {
          await mod.realFetchPipelineState('acme', 'missing-repo', 'fake-token');
          assert.fail('Expected realFetchPipelineState to throw on a 404');
        } catch (err) {
          assert.ok(/404/.test(err.message), 'Expected the error to mention the HTTP status: ' + err.message);
          assert.strictEqual(callCount, 1, 'Expected exactly 1 fetch call (no retry on a non-ok status), got ' + callCount);
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  console.log('\n[pgft-s1] AC4 (regression guard) -- pst-s1 background-failure logging still catches an exhausted-retries failure');

  queue.push(function() {
    return test('pst-s1 background-failure logging still catches an exhausted-retries failure (AC4)', async function() {
      var adapterModPath = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
      delete require.cache[require.resolve(adapterModPath)];
      var adapterMod = require(adapterModPath);
      adapterMod.setPipelineStateFetchAdapter(async function() {
        throw new Error('Failed to parse pipeline-state.json response: Unexpected end of JSON input (received 14 bytes; Content-Length header: 1800000)');
      });

      delete require.cache[require.resolve(PRODUCTS_PATH)];
      var productsRouteFresh = require(PRODUCTS_PATH);

      var mockPool = {
        query: async function(sql) {
          if (/SELECT product_id, tenant_id FROM products/i.test(sql)) return { rows: [{ product_id: 'p-pgft', tenant_id: 't1' }] };
          if (/SELECT repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
          return { rows: [] };
        }
      };
      var req = { params: { id: 'p-pgft' }, session: { tenantId: 't1', accessToken: 'fake-token' } };
      var res = { status: function() { return { json: function() {} }; } };

      var errorLogs = [];
      var originalConsoleError = console.error;
      console.error = function() { errorLogs.push(Array.prototype.slice.call(arguments)); };
      try {
        await productsRouteFresh.handlePostProductSync(req, res, null, mockPool, null);
        await new Promise(function(r) { setTimeout(r, 20); });
      } finally {
        console.error = originalConsoleError;
      }

      var loggedIt = errorLogs.some(function(args) {
        return args.some(function(a) { return typeof a === 'string' && /Unexpected end of JSON input|p-pgft/.test(a); });
      });
      assert.ok(loggedIt, 'Expected console.error to be called with the failure, got: ' + JSON.stringify(errorLogs));
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pgft-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pgft-s1] Unexpected error:', err);
  process.exit(1);
});
