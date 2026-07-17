'use strict';

// tests/check-pr-s2-product-rollup.js
// pr-s2 -- DoD-status aggregation (AC4) and full sync orchestration (AC1, AC3).

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

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

async function main() {
  var queue = [];

  // T1: counts epic-nested stories correctly (AC4)
  queue.push(function() {
    console.log('\n[pr-s2] T1 -- DoD aggregation counts epic-nested stories correctly (AC4)');
    return test('computeDodStatusRollup: counts stories nested under epics[].stories[]', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          {
            slug: 'feature-a',
            epics: [
              { slug: 'epic-1', stories: [
                { slug: 's1', dodStatus: 'complete' },
                { slug: 's2', dodStatus: 'in-progress' }
              ]}
            ]
          },
          { slug: 'feature-b', stories: [ { slug: 's3', dodStatus: 'complete' } ] }
        ]
      };
      var result = mod.computeDodStatusRollup(pipelineState);
      assert.strictEqual(result.complete, 2, 'Expected 2 complete stories, got ' + result.complete);
      assert.strictEqual(result['in-progress'], 1, "Expected 1 in-progress story, got " + result['in-progress']);
    });
  });

  // T2: does not double-count when a feature has both epics[].stories[] and a stale empty top-level stories[]
  queue.push(function() {
    console.log('\n[pr-s2] T2 -- DoD aggregation does not double-count the ambiguous epic-nested-plus-stale-flat shape (AC4)');
    return test('computeDodStatusRollup: a feature with both epics[].stories[] and an empty top-level stories[] is counted once', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          {
            slug: 'feature-a',
            stories: [], // stale/empty top-level field, as this platform's own repo actually has
            epics: [
              { slug: 'epic-1', stories: [
                { slug: 's1', dodStatus: 'complete' },
                { slug: 's2', dodStatus: 'complete' }
              ]}
            ]
          }
        ]
      };
      var result = mod.computeDodStatusRollup(pipelineState);
      assert.strictEqual(result.complete, 2, 'Expected exactly 2 complete (not 4 from double-counting), got ' + result.complete);
    });
  });

  // T3: syncProductRollup fetches, computes, and writes the rollup to the cache table (AC1)
  queue.push(function() {
    console.log('\n[pr-s2] T3 -- syncProductRollup fetches via the adapter, computes the rollup, and writes it to the cache table (AC1)');
    return test('syncProductRollup: writes computed DoD counts to a cache row scoped by product_id', async function() {
      var mod = freshRequire();
      var adapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));

      var fixturePipelineState = { features: [ { slug: 'f1', stories: [ { dodStatus: 'complete' }, { dodStatus: 'complete' } ] } ] };
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify(fixturePipelineState)).toString('base64'), encoding: 'base64' };
      });

      var writes = [];
      var mockPool = {
        query: async function(sql, params) {
          if (/INSERT INTO product_rollups/i.test(sql)) {
            writes.push({ sql: sql, params: params });
            return { rows: [] };
          }
          return { rows: [] };
        }
      };

      await mod.syncProductRollup(mockPool, freshAdapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' });

      assert.strictEqual(writes.length, 1, 'Expected exactly one write to product_rollups');
      assert.ok(writes[0].params.indexOf('p1') !== -1, 'Expected the write to be scoped by product_id p1');
      var writtenJson = writes[0].params.find(function(p) { return typeof p === 'string' && p.indexOf('complete') !== -1; });
      assert.ok(writtenJson, 'Expected the written rollup data to include the computed DoD counts');
    });
  });

  // T4: syncProductRollup surfaces a visible error and writes nothing on fetch failure (AC3)
  queue.push(function() {
    console.log('\n[pr-s2] T4 -- syncProductRollup surfaces a visible error and does not write on fetch failure (AC3)');
    return test('syncProductRollup: throws distinguishably and writes nothing when the adapter fetch fails', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        throw new Error('Failed to fetch pipeline-state.json: HTTP 404');
      });

      var writeAttempted = false;
      var mockPool = {
        query: async function(sql) {
          if (/INSERT INTO product_rollups/i.test(sql)) { writeAttempted = true; }
          return { rows: [] };
        }
      };

      try {
        await mod.syncProductRollup(mockPool, freshAdapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'missing', accessToken: 'fake-token' });
        assert.fail('Expected syncProductRollup to throw on fetch failure');
      } catch (err) {
        assert.ok(/404/.test(err.message), 'Expected the error to surface the underlying HTTP status: ' + err.message);
      }
      assert.strictEqual(writeAttempted, false, 'Expected no cache write attempt when the fetch fails');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pr-s2-product-rollup] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pr-s2-product-rollup] Unexpected error:', err);
  process.exit(1);
});
