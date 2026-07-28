'use strict';
// check-dsh-s1-persist-session-turns.js — dsh-s1: persist a stage's session
// turns to Postgres on completion.
// artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md

var assert = require('assert');
var fs     = require('fs');
var os     = require('os');
var path   = require('path');

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/session-turns-pg.js');
var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var JOURNEY_STORE_PG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');

function freshRequire() {
  try { delete require.cache[require.resolve(MODULE_PATH)]; } catch (_) {}
  return require(MODULE_PATH);
}

function freshRequirePath(modulePath) {
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

async function main() {
  // -- AC4: unwired adapter throws instead of silently no-op'ing
  console.log('\n[dsh-s1] AC4 -- unwired adapter throws instead of silently no-op\'ing');
  {
    var mod = freshRequire();
    await test('AC4: writeSessionTurns throws when setSessionTurnsStore has not been called', async function() {
      var threw = false;
      try {
        await mod.writeSessionTurns({ journeyId: 'j1', tenantId: 't1', skillName: 'discovery', turns: [] });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.message, 'Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.');
      }
      assert.ok(threw, 'expected writeSessionTurns to throw when unwired');
    });
  }

  // -- AC1: completion write inserts a row with journey_id, tenant_id, skill_name, and full turns array
  console.log('\n[dsh-s1] AC1 -- completion write inserts a row with correct fields');
  {
    var mod = freshRequire();
    var inserted = [];
    var fakeDb = {
      query: async function(sql, params) {
        inserted.push({ sql: sql, params: params });
        return { rows: [], rowCount: 1 };
      }
    };
    mod.setSessionTurnsStore(fakeDb);
    await test('AC1: writeSessionTurns inserts journey_id, tenant_id, skill_name, turns', async function() {
      var turns = [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }];
      await mod.writeSessionTurns({ journeyId: 'j1', tenantId: 't1', skillName: 'discovery', turns: turns });
      assert.strictEqual(inserted.length, 1);
      var p = inserted[0].params;
      assert.strictEqual(p[0], 'j1');
      assert.strictEqual(p[1], 't1');
      assert.strictEqual(p[2], 'discovery');
      assert.deepStrictEqual(JSON.parse(p[3]), turns);
    });
  }

  // -- AC2: re-completing the same stage upserts, does not duplicate
  console.log('\n[dsh-s1] AC2 -- re-completing the same stage upserts, does not duplicate');
  {
    var mod = freshRequire();
    var rows = {};
    var fakeDb = {
      query: async function(sql, params) {
        var key = params[0] + '::' + params[2];
        rows[key] = { journey_id: params[0], tenant_id: params[1], skill_name: params[2], turns: params[3] };
        return { rows: [], rowCount: 1 };
      }
    };
    mod.setSessionTurnsStore(fakeDb);
    await test('AC2: second completion write for the same stage upserts, one row remains', async function() {
      await mod.writeSessionTurns({ journeyId: 'j1', tenantId: 't1', skillName: 'discovery', turns: [{ role: 'user', content: 'v1' }] });
      await mod.writeSessionTurns({ journeyId: 'j1', tenantId: 't1', skillName: 'discovery', turns: [{ role: 'user', content: 'v2' }] });
      assert.strictEqual(Object.keys(rows).length, 1, 'expected exactly one row for (j1, discovery)');
      assert.deepStrictEqual(JSON.parse(rows['j1::discovery'].turns), [{ role: 'user', content: 'v2' }]);
    });
  }

  // -- AC3: a failed Postgres write does not block the rest of the completion flow
  console.log('\n[dsh-s1] AC3 -- a failed Postgres write does not block the rest of the completion flow');
  {
    var mod = freshRequire();
    var fakeDb = {
      query: async function() { throw new Error('connection reset'); }
    };
    mod.setSessionTurnsStore(fakeDb);
    await test('AC3: writeSessionTurns failure does not throw past the caller (caller wraps in try/catch)', async function() {
      // The adapter itself may reject; the calling code in routes/skills.js
      // wraps this in try/catch so the rest of the completion flow proceeds.
      // This test confirms the adapter's own promise rejects (so the caller's
      // catch has something real to catch), not that it silently resolves.
      var rejected = false;
      try {
        await mod.writeSessionTurns({ journeyId: 'j1', tenantId: 't1', skillName: 'discovery', turns: [] });
      } catch (_) {
        rejected = true;
      }
      assert.ok(rejected, 'expected writeSessionTurns to reject when the underlying query throws');
    });
  }

  // -- AC1 regression: the persisted turns array must include the completing
  // assistant turn (the artefact-bearing one). Drives the real
  // handlePostTurnStreamHtml call site (not just the adapter in isolation) --
  // a fresh final-review pass on dsh-s1 found the original wiring read
  // session.turns for the Postgres write BEFORE the completing assistant
  // turn was pushed onto that same array, so every persisted conversation
  // was missing its own final turn.
  console.log('\n[dsh-s1] AC1 regression -- persisted turns include the completing assistant turn (real call site)');
  {
    var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-s1-'));
    process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
    // Save/restore rather than delete: a real DATABASE_URL may already be set
    // in the environment (e.g. AC5's integration run) and must not be wiped
    // out by this block's own fake placeholder value.
    var _priorDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://fake-for-test-only';

    var journeyStore = freshRequirePath(JOURNEY_STORE_PATH);
    var journeyStorePg = freshRequirePath(JOURNEY_STORE_PG_PATH);
    journeyStorePg.saveArtefact = function() { return Promise.resolve(); };

    var turnsMod = freshRequire();
    var capturedWrites = [];
    turnsMod.setSessionTurnsStore({
      query: function(sql, params) {
        capturedWrites.push(params);
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
    });

    var routes = freshRequirePath(ROUTES_PATH);
    var FIXTURE = 'Understood.\n\n---ARTEFACT-START---\n# Discovery\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\ndsh-s1-regression-slug';
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE);
      return Promise.resolve({ text: FIXTURE, usage: {} });
    });

    var journey = journeyStore.createJourney('dsh-s1-regression-slug');
    var sid = 'test-dsh-s1-ordering-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery',
      turns: [{ role: 'user', content: 'hi' }],
      artefactContent: null, artefactPath: null, done: false,
      journeyId: journey.journeyId, featureSlug: 'dsh-s1-regression-slug'
    });

    function noopRes() { return { writeHead: function() {}, write: function() {}, end: function() {} }; }

    await test('AC1 regression: writeSessionTurns is called with the completing assistant turn included', async function() {
      await routes.handlePostTurnStreamHtml(
        { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
        noopRes()
      );
      assert.strictEqual(capturedWrites.length, 1, 'expected exactly one session_turns write');
      var writtenTurns = JSON.parse(capturedWrites[0][3]);
      var lastTurn = writtenTurns[writtenTurns.length - 1];
      assert.strictEqual(lastTurn && lastTurn.role, 'assistant', 'expected the last persisted turn to be the completing assistant turn');
      assert.strictEqual(lastTurn && lastTurn.content, FIXTURE, 'expected the persisted final turn content to match the completing response');
    });

    delete process.env.COPILOT_REPO_PATH;
    if (_priorDatabaseUrl === undefined) { delete process.env.DATABASE_URL; }
    else { process.env.DATABASE_URL = _priorDatabaseUrl; }
    fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
  }

  // -- AC5: real Postgres wiring, two tenants, no cross-contamination
  console.log('\n[dsh-s1] AC5 -- real Postgres wiring, two tenants, no cross-contamination');
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] AC5: DATABASE_URL not set — integration test requires a real Postgres connection');
  } else {
    var { Pool } = require('pg');
    var pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    var mod = freshRequire();
    mod.setSessionTurnsStore(pgPool);
    await test('AC5: two tenants\' turns are stored and read back without cross-contamination', async function() {
      var jA = 'dsh-s1-test-journey-a-' + Date.now();
      var jB = 'dsh-s1-test-journey-b-' + Date.now();
      // Minimal journeys rows so the FK constraint is satisfied.
      await pgPool.query("INSERT INTO journeys (journey_id, tenant_id, feature_slug) VALUES ($1, 'tenant-a', 'dsh-s1-test') ON CONFLICT DO NOTHING", [jA]);
      await pgPool.query("INSERT INTO journeys (journey_id, tenant_id, feature_slug) VALUES ($1, 'tenant-b', 'dsh-s1-test') ON CONFLICT DO NOTHING", [jB]);

      await mod.writeSessionTurns({ journeyId: jA, tenantId: 'tenant-a', skillName: 'discovery', turns: [{ role: 'user', content: 'tenant A content' }] });
      await mod.writeSessionTurns({ journeyId: jB, tenantId: 'tenant-b', skillName: 'discovery', turns: [{ role: 'user', content: 'tenant B content' }] });

      var rowA = (await pgPool.query('SELECT turns FROM session_turns WHERE journey_id = $1', [jA])).rows[0];
      var rowB = (await pgPool.query('SELECT turns FROM session_turns WHERE journey_id = $1', [jB])).rows[0];

      assert.deepStrictEqual(rowA.turns, [{ role: 'user', content: 'tenant A content' }]);
      assert.deepStrictEqual(rowB.turns, [{ role: 'user', content: 'tenant B content' }]);
      assert.notDeepStrictEqual(rowA.turns, rowB.turns);

      // Cleanup this test's own rows
      await pgPool.query('DELETE FROM session_turns WHERE journey_id IN ($1, $2)', [jA, jB]);
      await pgPool.query('DELETE FROM journeys WHERE journey_id IN ($1, $2)', [jA, jB]);
    });
    await pgPool.end();
  }

  console.log('\n--- dsh-s1 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
