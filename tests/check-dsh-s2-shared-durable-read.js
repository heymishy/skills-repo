'use strict';
// check-dsh-s2-shared-durable-read.js — dsh-s2: a single, tenant-scoped read
// path for a completed stage's turns.
// artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md

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

async function main() {
  // -- AC1: returns Postgres turns when the stage's session is no longer in memory
  console.log('\n[dsh-s2] AC1 -- returns Postgres turns when no longer resident in memory');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH); // no live session registered for this journey/skill

    var journey = journeyStore.createJourney('dsh-s2-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var pgTurns = [{ role: 'user', content: 'from postgres' }];
    var fakeDb = {
      query: async function(sql, params) {
        assert.strictEqual(params[0], journey.journeyId);
        assert.strictEqual(params[1], 'discovery');
        return { rows: [{ turns: pgTurns }] };
      }
    };
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC1: returns the turns array from Postgres when memory has no matching session', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.deepStrictEqual(result, pgTurns);
    });
  }

  // -- AC2: prefers in-memory turns over Postgres when both exist
  console.log('\n[dsh-s2] AC2 -- prefers in-memory turns (freshest) over Postgres');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    var routes = freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s2-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var memoryTurns = [{ role: 'user', content: 'from memory -- freshest' }];
    var staleTurns = [{ role: 'user', content: 'stale postgres copy' }];
    var sid = 'test-dsh-s2-ac2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', journeyId: journey.journeyId, turns: memoryTurns
    });

    var queried = false;
    var fakeDb = { query: async function() { queried = true; return { rows: [{ turns: staleTurns }] }; } };
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC2: returns in-memory turns, never queries Postgres', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.deepStrictEqual(result, memoryTurns);
      assert.strictEqual(queried, false, 'expected Postgres not to be queried when an in-memory session exists');
    });
  }

  // -- AC3: returns null (not a throw) when no row exists yet
  console.log('\n[dsh-s2] AC3 -- returns null when no row exists and no in-memory session');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s2-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var fakeDb = { query: async function() { return { rows: [] }; } };
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC3: returns null without throwing when no row exists', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.strictEqual(result, null);
    });
  }

  // -- AC4: cross-tenant request returns null, never another tenant's turns
  console.log('\n[dsh-s2] AC4 -- cross-tenant request returns null');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s2-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var queried = false;
    var fakeDb = { query: async function() { queried = true; return { rows: [{ turns: [{ role: 'user', content: 'tenant A only' }] }] }; } };
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC4 (different tenantId): returns null, never queries the tenant-A row', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-b', 'tenant-b'));
      assert.strictEqual(result, null);
      assert.strictEqual(queried, false, 'expected the guard to reject before ever reaching Postgres');
    });

    await test('AC4 (not the owner, no accessToken): returns null, does not throw', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', { accessToken: null });
      assert.strictEqual(result, null);
    });
  }

  // -- AC5: non-existent journeyId returns null without an unhandled exception
  console.log('\n[dsh-s2] AC5 -- non-existent journeyId returns null, no throw');
  {
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(JOURNEY_STORE_PATH);
    freshRequire(ROUTES_PATH);

    var fakeDb = { query: async function() { throw new Error('should never be reached'); } };
    adapter.setSessionTurnsStore(fakeDb);

    await test('AC5: returns null for a journeyId that does not resolve to any journey', async function() {
      var result = await adapter.getTurnsForStage('does-not-exist-' + Date.now(), 'discovery', ownerSession('user-a', 'tenant-a'));
      assert.strictEqual(result, null);
    });
  }

  // -- NFR: Postgres-tier read returns within budget (fake-db timing proxy)
  console.log('\n[dsh-s2] NFR -- Postgres-tier read returns within budget');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s2-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });

    var fakeDb = { query: async function() { return { rows: [{ turns: [] }] }; } };
    adapter.setSessionTurnsStore(fakeDb);

    await test('NFR-perf: a single Postgres-tier read completes under ~200ms against the fake db', async function() {
      var start = process.hrtime.bigint();
      await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-a', 'tenant-a'));
      var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      assert.ok(elapsedMs < 200, 'expected under 200ms, took ' + elapsedMs.toFixed(2) + 'ms');
    });
  }

  // -- NFR: tenant-isolation guard covers both sub-cases explicitly
  console.log('\n[dsh-s2] NFR -- tenant-isolation guard covers both different-tenant and no-owner-match sub-cases');
  {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    var adapter = freshRequire(ADAPTER_PATH);
    freshRequire(ROUTES_PATH);

    var journey = journeyStore.createJourney('dsh-s2-test');
    journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-a', ownerId: 'user-a' });
    var fakeDb = { query: async function() { return { rows: [{ turns: [{ role: 'user', content: 'x' }] }] }; } };
    adapter.setSessionTurnsStore(fakeDb);

    await test('NFR-security sub-case 1: different tenantId is rejected', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-b', 'tenant-b'));
      assert.strictEqual(result, null);
    });
    await test('NFR-security sub-case 2: same tenantId but not the owner login is rejected', async function() {
      var result = await adapter.getTurnsForStage(journey.journeyId, 'discovery', ownerSession('user-c', 'tenant-a'));
      assert.strictEqual(result, null);
    });
  }

  console.log('\n--- dsh-s2 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
