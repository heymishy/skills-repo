'use strict';
// check-dsh-s5-archive-session-turns.js -- dsh-s5: archive session_turns
// rows older than 60 days out of the hot table into session_turns_archive.
// artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
//
// Covers AC1, AC2, AC4, AC5 (Task 1). AC3 (CLI-spawn, no lingering process)
// is added separately in Task 2, once the scheduled workflow also exists.

var assert = require('assert');
var path   = require('path');

var MODULE_PATH = path.resolve(__dirname, '../scripts/archive-session-turns.js');

function freshRequire() {
  try { delete require.cache[require.resolve(MODULE_PATH)]; } catch (_) {}
  return require(MODULE_PATH);
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

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/**
 * A minimal fake db that stores session_turns / session_turns_archive rows
 * in-memory and supports just enough SQL pattern matching (on the literal
 * query strings archive-session-turns.js actually issues) to prove the real
 * behaviour without a real Postgres connection. Mirrors
 * check-alrf-s11-purge-e2e-tenants.js's makeFakeDb pattern.
 * @param {object} seedRows { session_turns: [...] }
 * @param {number[]} [failingIds] ids whose archive INSERT should throw
 */
function makeFakeDb(seedRows, failingIds) {
  var tables = {
    session_turns: (seedRows.session_turns || []).map(function(r) { return Object.assign({}, r); }),
    session_turns_archive: []
  };
  var fail = failingIds || [];
  var queryLog = [];
  return {
    _tables: tables,
    _queryLog: queryLog,
    query: async function(sql, params) {
      queryLog.push({ sql: sql, params: params });

      if (/FROM session_turns WHERE created_at </.test(sql)) {
        var thresholdDays = params[0];
        var cutoffMs = Date.now() - thresholdDays * 24 * 60 * 60 * 1000;
        var rows = tables.session_turns.filter(function(r) {
          return new Date(r.created_at).getTime() < cutoffMs;
        });
        return { rows: rows.map(function(r) { return Object.assign({}, r); }) };
      }

      if (/INSERT INTO session_turns_archive/.test(sql)) {
        var id = params[0];
        if (fail.indexOf(id) !== -1) {
          throw new Error('simulated insert failure for id ' + id);
        }
        tables.session_turns_archive.push({
          id: params[0], journey_id: params[1], tenant_id: params[2],
          skill_name: params[3], turns: params[4], created_at: params[5]
        });
        return { rowCount: 1 };
      }

      if (/DELETE FROM session_turns WHERE id = \$1/.test(sql)) {
        var delId = params[0];
        var before = tables.session_turns.length;
        tables.session_turns = tables.session_turns.filter(function(r) { return r.id !== delId; });
        return { rowCount: before - tables.session_turns.length };
      }

      return { rows: [], rowCount: 0 };
    }
  };
}

async function main() {
  // -- AC4 (unwired adapter throws, matching D37 convention across this repo's scripts)
  console.log('\n[dsh-s5] AC4-adapter -- unwired adapter throws instead of silently no-op\'ing');
  {
    var mod = freshRequire();
    await test('unwired: requireDbConnection throws before setDbConnection is called', function() {
      var threw = false;
      try {
        mod.requireDbConnection();
      } catch (err) {
        threw = true;
        assert.strictEqual(err.message, 'Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.');
      }
      assert.ok(threw, 'expected requireDbConnection to throw when unwired');
    });
  }

  // -- AC1: a row older than 60 days moves to the archive table and is removed from the hot table
  console.log('\n[dsh-s5] AC1 -- a row 61 days old moves to session_turns_archive and is removed from session_turns');
  {
    var mod = freshRequire();
    var oldRow = { id: 1, journey_id: 'j1', tenant_id: 't1', skill_name: 'discovery', turns: [{ role: 'user', content: 'old' }], created_at: daysAgo(61) };
    var db = makeFakeDb({ session_turns: [oldRow] });
    await test('AC1: archiveOldTurns moves the 61-day-old row, identical content, and deletes it from the hot table', async function() {
      var summary = await mod.archiveOldTurns(db);
      assert.strictEqual(summary.archivedCount, 1);
      assert.strictEqual(summary.errorCount, 0);
      assert.strictEqual(db._tables.session_turns.length, 0, 'expected the row to be removed from the hot table');
      assert.strictEqual(db._tables.session_turns_archive.length, 1, 'expected the row to now exist in the archive table');
      var archived = db._tables.session_turns_archive[0];
      assert.strictEqual(archived.id, 1);
      assert.strictEqual(archived.journey_id, 'j1');
      assert.strictEqual(archived.tenant_id, 't1');
      assert.strictEqual(archived.skill_name, 'discovery');
      assert.deepStrictEqual(archived.turns, oldRow.turns);
      assert.strictEqual(archived.created_at.getTime(), oldRow.created_at.getTime(), 'the original created_at must be preserved, not re-timestamped');
    });
  }

  // -- AC2: a row within 60 days remains untouched
  console.log('\n[dsh-s5] AC2 -- a row 30 days old remains untouched in the hot table');
  {
    var mod = freshRequire();
    var recentRow = { id: 2, journey_id: 'j2', tenant_id: 't1', skill_name: 'benefit-metric', turns: [{ role: 'user', content: 'recent' }], created_at: daysAgo(30) };
    var db = makeFakeDb({ session_turns: [recentRow] });
    await test('AC2: archiveOldTurns leaves the 30-day-old row in place, nothing added to the archive', async function() {
      var summary = await mod.archiveOldTurns(db);
      assert.strictEqual(summary.archivedCount, 0);
      assert.strictEqual(db._tables.session_turns.length, 1, 'expected the recent row to remain in the hot table');
      assert.deepStrictEqual(db._tables.session_turns[0], recentRow);
      assert.strictEqual(db._tables.session_turns_archive.length, 0, 'expected nothing added to the archive table');
    });
  }

  // -- AC4: one row's archive-insert failure is logged and does not abort the rest of the batch
  console.log('\n[dsh-s5] AC4 -- one row\'s failed insert is logged; the remaining eligible rows still archive');
  {
    var mod = freshRequire();
    var rowA = { id: 3, journey_id: 'j3', tenant_id: 't1', skill_name: 'discovery', turns: [{ role: 'user', content: 'a' }], created_at: daysAgo(61) };
    var rowB = { id: 4, journey_id: 'j4', tenant_id: 't1', skill_name: 'discovery', turns: [{ role: 'user', content: 'b' }], created_at: daysAgo(65) };
    var rowC = { id: 5, journey_id: 'j5', tenant_id: 't1', skill_name: 'discovery', turns: [{ role: 'user', content: 'c' }], created_at: daysAgo(70) };
    // rowA (id 3) is configured to fail its archive insert.
    var db = makeFakeDb({ session_turns: [rowA, rowB, rowC] }, [3]);
    await test('AC4: the failing row is logged as an error; the other two rows archive successfully', async function() {
      var summary = await mod.archiveOldTurns(db);
      assert.strictEqual(summary.archivedCount, 2, 'expected the two non-failing rows to archive');
      assert.strictEqual(summary.errorCount, 1, 'expected exactly one logged error');
      assert.strictEqual(summary.errors.length, 1);
      assert.strictEqual(summary.errors[0].id, 3, 'expected the failing row\'s id to be reported');
      assert.ok(summary.errors[0].message.indexOf('simulated insert failure') !== -1, 'expected the underlying error message to be captured');

      var archivedIds = db._tables.session_turns_archive.map(function(r) { return r.id; });
      assert.ok(archivedIds.indexOf(4) !== -1, 'rowB should have archived');
      assert.ok(archivedIds.indexOf(5) !== -1, 'rowC should have archived');
      assert.ok(archivedIds.indexOf(3) === -1, 'rowA (the failing row) must not appear in the archive');

      var hotIds = db._tables.session_turns.map(function(r) { return r.id; });
      assert.deepStrictEqual(hotIds, [3], 'the failing row must remain in the hot table since its move never completed (insert failed before delete ran)');
    });
  }

  // -- AC5: zero eligible rows completes successfully and logs "0 rows archived", not silence
  console.log('\n[dsh-s5] AC5 -- zero eligible rows completes successfully with an explicit "0 rows archived" log');
  {
    var mod = freshRequire();
    var db = makeFakeDb({ session_turns: [] });
    var capturedLogs = [];
    var originalLog = console.log;
    console.log = function() {
      capturedLogs.push(Array.prototype.slice.call(arguments).join(' '));
      originalLog.apply(console, arguments);
    };
    try {
      await test('AC5: archiveOldTurns on an empty db returns a zero summary and logs "0 rows archived"', async function() {
        var summary = await mod.archiveOldTurns(db);
        assert.strictEqual(summary.archivedCount, 0);
        assert.strictEqual(summary.errorCount, 0);
        assert.deepStrictEqual(summary.errors, []);
        assert.ok(capturedLogs.some(function(line) { return line.indexOf('0 rows archived') !== -1; }), 'expected a log line containing "0 rows archived", got: ' + JSON.stringify(capturedLogs));
      });
    } finally {
      console.log = originalLog;
    }
  }

  // -- AC5 (also with rows present, but none eligible): confirms the message
  // is about eligibility, not merely an empty table.
  console.log('\n[dsh-s5] AC5b -- rows exist but none are eligible: still logs "0 rows archived"');
  {
    var mod = freshRequire();
    var onlyRecentRow = { id: 6, journey_id: 'j6', tenant_id: 't1', skill_name: 'discovery', turns: [], created_at: daysAgo(1) };
    var db = makeFakeDb({ session_turns: [onlyRecentRow] });
    var capturedLogs = [];
    var originalLog = console.log;
    console.log = function() {
      capturedLogs.push(Array.prototype.slice.call(arguments).join(' '));
      originalLog.apply(console, arguments);
    };
    try {
      await test('AC5b: no eligible rows (all recent) still logs "0 rows archived" and leaves the hot table intact', async function() {
        var summary = await mod.archiveOldTurns(db);
        assert.strictEqual(summary.archivedCount, 0);
        assert.strictEqual(db._tables.session_turns.length, 1);
        assert.ok(capturedLogs.some(function(line) { return line.indexOf('0 rows archived') !== -1; }));
      });
    } finally {
      console.log = originalLog;
    }
  }

  console.log('\n--- dsh-s5 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
