'use strict';
// check-djfk-s1-delete-journey-session-turns.js
// TDD tests for djfk-s1: deleteJourney must delete session_turns rows
// before the journeys row, alongside the existing artefacts delete —
// session_turns has a real FK to journeys(journey_id) with no ON DELETE
// clause (scripts/migrate-schema-pg.js), which was never accounted for in
// journey-store-pg.js's deleteJourney (alrf-s10).
//
// artefacts/2026-08-07-delete-journey-session-turns-fk/stories/djfk-s1-delete-session-turns-before-journey.md
// artefacts/2026-08-07-delete-journey-session-turns-fk/test-plans/djfk-s1-test-plan.md

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

var PG_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');

function freshRequirePgAdapter() {
  try { delete require.cache[require.resolve(PG_ADAPTER_PATH)]; } catch (_) {}
  return require(PG_ADAPTER_PATH);
}

/**
 * Mock pool recording every query() call's SQL text and params, in order.
 * Configurable per-table rowCount so tests can simulate "zero session_turns"
 * or "nonexistent journey" without a real Postgres instance.
 */
function createMockPool(rowCounts) {
  rowCounts = rowCounts || {};
  var calls = [];
  async function query(sql, params) {
    calls.push({ sql: String(sql).replace(/\s+/g, ' ').trim(), params: params });
    var s = String(sql).toUpperCase();
    if (s.indexOf('SESSION_TURNS') !== -1) {
      return { rowCount: rowCounts.sessionTurns !== undefined ? rowCounts.sessionTurns : 1 };
    }
    if (s.indexOf('ARTEFACTS') !== -1) {
      return { rowCount: rowCounts.artefacts !== undefined ? rowCounts.artefacts : 1 };
    }
    if (s.indexOf('JOURNEYS') !== -1) {
      return { rowCount: rowCounts.journeys !== undefined ? rowCounts.journeys : 1 };
    }
    return { rowCount: 0 };
  }
  return { query: query, calls: calls };
}

var queue = [];

// ---------------------------------------------------------------------------
// AC1 (unit) — all 3 deletes happen, session_turns before journeys
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('deleteJourney_deletesSessionTurnsArtefactsAndJourney_inCorrectOrder', async function() {
    var pg = freshRequirePgAdapter();
    var pool = createMockPool({ sessionTurns: 2, artefacts: 3, journeys: 1 });
    pg._setPoolForTesting(pool);

    await pg.deleteJourney('journey-1');

    assert.strictEqual(pool.calls.length, 3, 'exactly 3 query() calls expected, got ' + pool.calls.length + ': ' + JSON.stringify(pool.calls.map(function(c) { return c.sql; })));

    var sessionTurnsIdx = pool.calls.findIndex(function(c) { return c.sql.toUpperCase().indexOf('SESSION_TURNS') !== -1; });
    var artefactsIdx = pool.calls.findIndex(function(c) { return c.sql.toUpperCase().indexOf('ARTEFACTS') !== -1 && c.sql.toUpperCase().indexOf('SESSION_TURNS') === -1; });
    var journeysIdx = pool.calls.findIndex(function(c) { return c.sql.toUpperCase().indexOf('FROM JOURNEYS') !== -1; });

    assert.ok(sessionTurnsIdx !== -1, 'a DELETE FROM session_turns statement must exist');
    assert.ok(artefactsIdx !== -1, 'the existing DELETE FROM artefacts statement must still exist');
    assert.ok(journeysIdx !== -1, 'the existing DELETE FROM journeys statement must still exist');
    assert.ok(sessionTurnsIdx < journeysIdx, 'session_turns must be deleted before journeys (FK ordering)');
    assert.ok(artefactsIdx < journeysIdx, 'artefacts must be deleted before journeys (FK ordering, unchanged from alrf-s10)');

    assert.deepStrictEqual(pool.calls[sessionTurnsIdx].params, ['journey-1'], 'session_turns delete must target the correct journeyId');
  });
});

queue.push(function() {
  return test('deleteJourney_returnsDeletedTrue_whenJourneyRowRemoved', async function() {
    var pg = freshRequirePgAdapter();
    var pool = createMockPool({ journeys: 1 });
    pg._setPoolForTesting(pool);

    var result = await pg.deleteJourney('journey-1');

    assert.deepStrictEqual(result, { deleted: true });
  });
});

// ---------------------------------------------------------------------------
// AC2 (unit) — zero session_turns rows is a no-op, not an error
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('deleteJourney_succeedsWithZeroSessionTurns_asANoOp', async function() {
    var pg = freshRequirePgAdapter();
    var pool = createMockPool({ sessionTurns: 0, artefacts: 0, journeys: 1 });
    pg._setPoolForTesting(pool);

    var result = await pg.deleteJourney('journey-with-no-turns');

    assert.deepStrictEqual(result, { deleted: true }, 'zero session_turns rows must not prevent the journey from being deleted');
  });
});

// ---------------------------------------------------------------------------
// AC3 (unit, regression guard) — nonexistent journey behaves as before
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('deleteJourney_returnsDeletedFalse_forNonexistentJourney', async function() {
    var pg = freshRequirePgAdapter();
    var pool = createMockPool({ sessionTurns: 0, artefacts: 0, journeys: 0 });
    pg._setPoolForTesting(pool);

    var result = await pg.deleteJourney('nonexistent-journey');

    assert.deepStrictEqual(result, { deleted: false }, 'a nonexistent journeyId must still return deleted:false, unchanged from today');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-djfk-s1-delete-journey-session-turns.js');
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err));
    });
    process.exit(1);
  }
})();
