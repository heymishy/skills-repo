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

  // T5: triggerProductSync rejects a second concurrent call for the same product_id (AC4)
  queue.push(function() {
    console.log('\n[pr-s3] T5 -- triggerProductSync rejects a concurrent second call for the same product_id while the first is still in flight (AC4)');
    return test('triggerProductSync: a second call for the same productId while one is pending is rejected, not started', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));

      var fetchCallCount = 0;
      var resolveFetch;
      var fetchPromise = new Promise(function(resolve) { resolveFetch = resolve; });
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        fetchCallCount++;
        await fetchPromise; // held open until the test explicitly resolves it
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });

      var mockPool = { query: async function() { return { rows: [] }; } };
      var opts = { productId: 'p-concurrent', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' };

      var firstCallPromise = mod.triggerProductSync(mockPool, freshAdapterMod, opts);
      assert.strictEqual(mod.isSyncInProgress('p-concurrent'), true, 'Expected isSyncInProgress to be true while the first sync is pending');

      try {
        await mod.triggerProductSync(mockPool, freshAdapterMod, opts);
        assert.fail('Expected the second concurrent triggerProductSync call to be rejected');
      } catch (err) {
        assert.ok(/already in progress|in flight/i.test(err.message), 'Expected a clear "already in progress" error, got: ' + err.message);
      }

      resolveFetch();
      await firstCallPromise;
      assert.strictEqual(fetchCallCount, 1, 'Expected exactly one underlying fetch call despite two trigger attempts');
      assert.strictEqual(mod.isSyncInProgress('p-concurrent'), false, 'Expected isSyncInProgress to be false after the sync completes');
    });
  });

  // T6: triggerProductSync clears the in-flight flag even when the sync fails (AC4 does not deadlock on error)
  queue.push(function() {
    console.log('\n[pr-s3] T6 -- triggerProductSync clears the in-flight flag after a failed sync, allowing a subsequent retry (AC4)');
    return test('triggerProductSync: in-flight flag clears after failure, a later retry is allowed', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        throw new Error('Failed to fetch pipeline-state.json: HTTP 404');
      });
      var mockPool = { query: async function() { return { rows: [] }; } };
      var opts = { productId: 'p-retry', repoOwner: 'acme', repoName: 'missing', accessToken: 'fake-token' };

      try {
        await mod.triggerProductSync(mockPool, freshAdapterMod, opts);
        assert.fail('Expected the first sync attempt to throw (404)');
      } catch (err) {
        assert.ok(/404/.test(err.message));
      }
      assert.strictEqual(mod.isSyncInProgress('p-retry'), false, 'Expected the in-flight flag to clear after a failed sync, not deadlock');

      // A subsequent retry is allowed to proceed (not rejected as "already in progress")
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify({ features: [] })).toString('base64'), encoding: 'base64' };
      });
      await mod.triggerProductSync(mockPool, freshAdapterMod, opts); // should not throw
    });
  });

  // T7: computeHealthCounts counts features across all four health statuses (AC1)
  queue.push(function() {
    console.log('\n[pr-s4] T7 -- computeHealthCounts counts features across all four health statuses (AC1)');
    return test('computeHealthCounts: counts 3 green, 2 amber, 1 red, 1 unknown correctly', function() {
      var mod = freshRequire();
      var pipelineState = {
        features: [
          { slug: 'f1', health: 'green' }, { slug: 'f2', health: 'green' }, { slug: 'f3', health: 'green' },
          { slug: 'f4', health: 'amber' }, { slug: 'f5', health: 'amber' },
          { slug: 'f6', health: 'red' },
          { slug: 'f7', health: 'unknown' }
        ]
      };
      var counts = mod.computeHealthCounts(pipelineState);
      assert.deepStrictEqual(counts, { green: 3, amber: 2, red: 1, unknown: 1 });
    });
  });

  // T8: a feature with no health field at all counts as unknown, not a thrown error
  queue.push(function() {
    console.log('\n[pr-s4] T8 -- a feature with a missing health field counts as unknown (AC1 robustness)');
    return test('computeHealthCounts: a feature object with no health property is counted as unknown', function() {
      var mod = freshRequire();
      var counts = mod.computeHealthCounts({ features: [{ slug: 'f1' }] });
      assert.strictEqual(counts.unknown, 1);
    });
  });

  // T9: one red among many green/amber yields overall red (AC2)
  queue.push(function() {
    console.log('\n[pr-s4] T9 -- one red feature among many green/amber yields an overall red signal (AC2)');
    return test('computeOverallHealthSignal: 10 green, 5 amber, 1 red -> red', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 10, amber: 5, red: 1, unknown: 0 });
      assert.strictEqual(signal, 'red');
    });
  });

  // T10: a single red feature with zero others still yields red (AC2 boundary)
  queue.push(function() {
    console.log('\n[pr-s4] T10 -- a single red feature with zero other features still yields red (AC2 boundary)');
    return test('computeOverallHealthSignal: 0 green, 0 amber, 1 red -> red', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 0, amber: 0, red: 1, unknown: 0 });
      assert.strictEqual(signal, 'red');
    });
  });

  // T11: no red, at least one amber yields overall amber (AC3)
  queue.push(function() {
    console.log('\n[pr-s4] T11 -- no red features, at least one amber, yields an overall amber signal (AC3)');
    return test('computeOverallHealthSignal: 5 green, 2 amber, 0 red -> amber', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 5, amber: 2, red: 0, unknown: 0 });
      assert.strictEqual(signal, 'amber');
    });
  });

  // T12: all-green yields overall green (AC4)
  queue.push(function() {
    console.log('\n[pr-s4] T12 -- all-green features yield an overall green signal (AC4)');
    return test('computeOverallHealthSignal: 8 green, 0 amber/red/unknown -> green', function() {
      var mod = freshRequire();
      var signal = mod.computeOverallHealthSignal({ green: 8, amber: 0, red: 0, unknown: 0 });
      assert.strictEqual(signal, 'green');
    });
  });

  // T13: zero features yields overall green, not an error or undefined (AC4 boundary)
  queue.push(function() {
    console.log('\n[pr-s4] T13 -- zero features yields an overall green signal, not an error or undefined (AC4 boundary)');
    return Promise.all([
      test('computeOverallHealthSignal: all-zero counts -> green (does not throw or return undefined)', function() {
        var mod = freshRequire();
        var signal = mod.computeOverallHealthSignal({ green: 0, amber: 0, red: 0, unknown: 0 });
        assert.strictEqual(signal, 'green');
      }),
      test('computeOverallHealthSignal: empty object input -> green (does not throw)', function() {
        var mod = freshRequire();
        var signal = mod.computeOverallHealthSignal({});
        assert.strictEqual(signal, 'green');
      })
    ]);
  });

  // T14: syncProductRollup also computes and writes health_counts alongside dod_status_counts (AC1 storage)
  queue.push(function() {
    console.log('\n[pr-s4] T14 -- syncProductRollup writes health_counts alongside dod_status_counts (AC1 storage)');
    return test('syncProductRollup: the cache write includes both dod_status_counts and health_counts', async function() {
      var mod = freshRequire();
      delete require.cache[require.resolve(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'))];
      var freshAdapterMod = require(path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js'));
      var fixture = { features: [{ slug: 'f1', health: 'red', stories: [{ dodStatus: 'complete' }] }] };
      freshAdapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: Buffer.from(JSON.stringify(fixture)).toString('base64'), encoding: 'base64' };
      });

      var capturedSql = null; var capturedParams = null;
      var mockPool = {
        query: async function(sql, params) {
          if (/INSERT INTO product_rollups/i.test(sql)) { capturedSql = sql; capturedParams = params; }
          return { rows: [] };
        }
      };

      await mod.syncProductRollup(mockPool, freshAdapterMod, { productId: 'p1', repoOwner: 'acme', repoName: 'widgets', accessToken: 'x' });

      assert.ok(/health_counts/i.test(capturedSql), 'Expected the INSERT statement to include the health_counts column');
      var healthJson = capturedParams.find(function(p) { return typeof p === 'string' && p.indexOf('"red"') !== -1; });
      assert.ok(healthJson, 'Expected one of the written params to be the health_counts JSON containing the red count');
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
