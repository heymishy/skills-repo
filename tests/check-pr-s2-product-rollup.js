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
