'use strict';
// check-dsh-s6-rehydrate-archived-turns.js — dsh-s6: transparently rehydrate
// an archived stage's turns on read (archive-table fallback tier).
// artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md

var assert = require('assert');
var path   = require('path');

var ADAPTER_PATH       = path.resolve(__dirname, '../src/web-ui/adapters/session-turns-pg.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var ROUTES_PATH        = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
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

function ownerSession(login, tenantId) {
  return { accessToken: 'tok', login: login, tenantId: tenantId };
}

// A fake db double that keeps separate "hot" and "archive" tables, so tests
// can plant a row in one but not the other and assert which table a given
// query actually touched -- mirrors fake-test-db.js's SQL-prefix matching
// convention (src/web-ui/adapters/fake-test-db.js), but scoped narrowly to
// just the two session_turns query shapes this adapter issues.
function makeFakeArchiveDb(opts) {
  var hotRow = (opts && opts.hotRow) || null;
  var archiveRow = (opts && opts.archiveRow) || null;
  var hotQueryCount = 0;
  var archiveQueryCount = 0;
  return {
    query: async function(sql, params) {
      var s = String(sql).toUpperCase();
      if (s.indexOf('SESSION_TURNS_ARCHIVE') !== -1) {
        archiveQueryCount++;
        assert.ok(params && params.length === 2, 'expected (journeyId, skillName) params on the archive query');
        return { rows: archiveRow ? [{ turns: archiveRow }] : [] };
      }
      if (s.indexOf('FROM SESSION_TURNS') !== -1) {
        hotQueryCount++;
        return { rows: hotRow ? [{ turns: hotRow }] : [] };
      }
      throw new Error('unexpected query in fake archive db: ' + s.slice(0, 120));
    },
    hotQueryCount: function() { return hotQueryCount; },
    archiveQueryCount: function() { return archiveQueryCount; }
  };
}

async function main() {
  // -- AC1: falls back to the archive table when the hot table has nothing
  console.log('\n[dsh-s6] AC1 -- falls back to archive table when hot table has nothing');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH); // no live session registered for this journey/skill

    var journey = journeyStore.createJourney('dsh-s6-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var archivedTurns = [{ role: 'user', content: 'from archive' }];
    var fakeDb = makeFakeArchiveDb({ hotRow: null, archiveRow: archivedTurns });
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC1: returns the archived turns, in the same shape as a hot-table read', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.deepStrictEqual(result, archivedTurns);
      assert.strictEqual(fakeDb.hotQueryCount(), 1, 'expected the hot table to be checked first');
      assert.strictEqual(fakeDb.archiveQueryCount(), 1, 'expected exactly one archive-table query');
    });
  }

  // -- AC2: a hot-table hit never triggers an archive-table query
  console.log('\n[dsh-s6] AC2 -- hot-table hit never queries the archive table');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s6-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var hotTurns = [{ role: 'user', content: 'from hot table' }];
    var fakeDb = makeFakeArchiveDb({ hotRow: hotTurns, archiveRow: [{ role: 'user', content: 'should never be seen' }] });
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC2: returns the hot-table row and never issues the archive-table query', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.deepStrictEqual(result, hotTurns);
      assert.strictEqual(fakeDb.archiveQueryCount(), 0, 'expected the archive-table query to never be issued on a hot-table hit');
    });
  }

  // -- AC3: neither table has data -> still returns null, unchanged from dsh-s2
  console.log('\n[dsh-s6] AC3 -- returns null when neither table has data');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s6-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var fakeDb = makeFakeArchiveDb({ hotRow: null, archiveRow: null });
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC3: returns null without throwing when neither table has a row', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.strictEqual(result, null);
      assert.strictEqual(fakeDb.hotQueryCount(), 1);
      assert.strictEqual(fakeDb.archiveQueryCount(), 1, 'expected the archive tier to still be checked on a full miss');
    });
  }

  // -- AC5: cross-tenant archive read returns null, same guard as hot-table reads
  console.log('\n[dsh-s6] AC5 -- cross-tenant archive read returns null');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s6-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var archivedTurns = [{ role: 'user', content: 'tenant A archived turns' }];
    var fakeDb = makeFakeArchiveDb({ hotRow: null, archiveRow: archivedTurns });
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC5: a different tenant requesting an archived stage gets null, never the row', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-b', 'tenant-b'));
      assert.strictEqual(result, null);
      assert.strictEqual(fakeDb.hotQueryCount(), 0, 'expected the tenant guard to reject before ever reaching Postgres');
      assert.strictEqual(fakeDb.archiveQueryCount(), 0, 'expected the tenant guard to reject before ever reaching the archive table');
    });
  }

  // -- NFR: an archive-tier read completes within budget (fake-db timing proxy)
  console.log('\n[dsh-s6] NFR -- archive-tier read completes within budget');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s6-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var fakeDb = makeFakeArchiveDb({ hotRow: null, archiveRow: [] });
    adapter.setSessionTurnsStore(fakeDb);

    await test('NFR-perf: an archive-tier read completes under ~500ms against the fake db', async function() {
      var start = process.hrtime.bigint();
      await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      assert.ok(elapsedMs < 500, 'expected under 500ms, took ' + elapsedMs.toFixed(2) + 'ms');
    });
  }

  console.log('\n--- dsh-s6 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
