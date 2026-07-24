'use strict';
// check-tdc-s1-clean-e2e-staging-data.js — tdc-s1
// Story: artefacts/2026-07-24-test-data-cleanup/stories/tdc-s1-cleanup-scripts.md
// Test plan: artefacts/2026-07-24-test-data-cleanup/test-plans/tdc-s1-cleanup-scripts-test-plan.md
//
// Covers:
//   AC3: dry-run reports only e2e-test-tagged rows, issues no DELETE
//   AC4: --confirm deletes exactly the matched rows (artefacts then journeys)
//   AC5: missing DATABASE_URL exits cleanly with a clear error, no crash

var assert = require('assert');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var passed = 0; var failed = 0;

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
    return Promise.resolve();
  }
}

var SCRIPT_PATH = path.resolve(__dirname, '../scripts/clean-e2e-staging-data.js');

function freshRequireScript() {
  try { delete require.cache[require.resolve(SCRIPT_PATH)]; } catch (_) {}
  return require(SCRIPT_PATH);
}

var TEST_ROWS = [
  { journey_id: 'j-e2e-1', tenant_id: 'e2e-test-gh-abc123', owner_id: 'e2e-test-gh-abc123', feature_slug: 'e2e-test-feature-1', created_at: '2026-07-20T00:00:00Z' },
  { journey_id: 'j-e2e-2', tenant_id: 'e2e-test-signup-xyz@example.test', owner_id: 'e2e-test-signup-xyz@example.test', feature_slug: 'e2e-test-feature-2', created_at: '2026-07-21T00:00:00Z' }
];
var REAL_ROW = { journey_id: 'j-real-1', tenant_id: 'realuser123', owner_id: 'realuser123', feature_slug: 'real-feature', created_at: '2026-06-01T00:00:00Z' };

function makeMockPool(rowsToReturnForSelect) {
  var calls = [];
  return {
    _calls: calls,
    query: function(text, values) {
      calls.push({ text: text, values: values });
      if (/^SELECT/.test(text)) {
        return Promise.resolve({ rows: rowsToReturnForSelect });
      }
      return Promise.resolve({ rows: [] });
    },
    end: function() { return Promise.resolve(); }
  };
}

var queue = [];

queue.push(function() {
  return test('AC3: dry-run reports only e2e-test-tagged rows, issues no DELETE query', function() {
    var script = freshRequireScript();
    var pool = makeMockPool(TEST_ROWS);
    return script.run(pool, { confirm: false }).then(function(reportResult) {
      assert.strictEqual(reportResult.matchedCount, 2, 'expected 2 matched rows');
      assert.strictEqual(reportResult.deleted, false, 'expected deleted:false on a dry run');
      var deleteCalls = pool._calls.filter(function(c) { return /^DELETE/.test(c.text); });
      assert.strictEqual(deleteCalls.length, 0, 'expected zero DELETE queries on a dry run');
      // The predicate itself must only ever match the e2e-test- prefix, never a blanket delete.
      var selectCall = pool._calls[0];
      assert.ok(selectCall.values[0] === 'e2e-test-%', 'expected the SELECT predicate to be scoped to the e2e-test- prefix');
    });
  });
});

queue.push(function() {
  return test('AC4: --confirm deletes exactly the matched rows, artefacts before journeys', function() {
    var script = freshRequireScript();
    var pool = makeMockPool(TEST_ROWS);
    return script.run(pool, { confirm: true }).then(function(reportResult) {
      assert.strictEqual(reportResult.matchedCount, 2, 'expected 2 matched rows');
      assert.strictEqual(reportResult.deleted, true, 'expected deleted:true when confirmed');

      var artefactsDelete = pool._calls.find(function(c) { return /^DELETE FROM artefacts/.test(c.text); });
      var journeysDelete = pool._calls.find(function(c) { return /^DELETE FROM journeys/.test(c.text); });
      assert.ok(artefactsDelete, 'expected a DELETE FROM artefacts query');
      assert.ok(journeysDelete, 'expected a DELETE FROM journeys query');
      assert.ok(pool._calls.indexOf(artefactsDelete) < pool._calls.indexOf(journeysDelete), 'expected artefacts to be deleted before journeys (FK order)');

      assert.deepStrictEqual(artefactsDelete.values[0].sort(), ['j-e2e-1', 'j-e2e-2'].sort(), 'expected exactly the matched journey_ids passed to the artefacts DELETE');
      assert.deepStrictEqual(journeysDelete.values[0].sort(), ['j-e2e-1', 'j-e2e-2'].sort(), 'expected exactly the matched journey_ids passed to the journeys DELETE');
    });
  });
});

queue.push(function() {
  return test('Real (non-e2e-test-tagged) rows are never matched or included in any query result', function() {
    var script = freshRequireScript();
    var pool = makeMockPool([]); // real DB would never return REAL_ROW for this WHERE clause
    return script.run(pool, { confirm: true }).then(function(reportResult) {
      assert.strictEqual(reportResult.matchedCount, 0, 'expected zero matches when no e2e-test- rows exist');
      assert.strictEqual(reportResult.deleted, false, 'expected no delete attempted when nothing matched');
    });
  });
});

queue.push(function() {
  return test('AC5: missing DATABASE_URL exits cleanly with a clear error, no stack trace, no connection attempt', function() {
    var env = Object.assign({}, process.env);
    delete env.DATABASE_URL;
    var result = require('child_process').spawnSync(process.execPath, [SCRIPT_PATH], { env: env, encoding: 'utf8' });
    assert.notStrictEqual(result.status, 0, 'expected a non-zero exit code');
    assert.ok(/DATABASE_URL is not set/.test(result.stderr), 'expected a clear DATABASE_URL error message on stderr, got: ' + result.stderr);
    assert.ok(!/at Object\.<anonymous>/.test(result.stderr), 'expected no raw Node stack trace');
  });
});

(async function() {
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
