# Persist a stage's session turns to Postgres on completion — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in dsh-s1's test plan pass — durably persist a completed stage's conversation turns to a new `session_turns` Postgres table, using the D37 injectable-adapter pattern, without changing the existing Redis-delete-on-completion behaviour.
**Branch:** `worktree-dsh-s1-persist-session-turns`
**Worktree:** `.claude/worktrees/dsh-s1-persist-session-turns`
**Test command:** `npm test` (runs `node scripts/run-all-tests.js`; to run just this story's file: `node tests/check-dsh-s1-persist-session-turns.js`)

---

## File map

```
Create:
  src/web-ui/adapters/session-turns-pg.js  — D37 injectable adapter: write session_turns rows
  tests/check-dsh-s1-persist-session-turns.js — unit + integration tests, all 5 ACs

Modify:
  scripts/migrate-schema-pg.js  — add session_turns table creation
  src/web-ui/routes/skills.js   — call the adapter's write function at stage-completion time
  src/web-ui/server.js          — wire the real Postgres adapter (separate task from the hook, per H-ADAPTER)
```

---

## Task 1: Add the `session_turns` table to the schema migration

**Files:**
- Modify: `scripts/migrate-schema-pg.js`

- [ ] **Step 1: Write the failing test**

There is no dedicated test file for DDL statements in this repo (matches the existing convention — `journeys`/`artefacts` table creation isn't unit-tested either, only exercised indirectly by later integration tests). Skip to Step 3.

- [ ] **Step 2: N/A** — no separate red step for pure DDL; Task 6's integration test is the first thing that exercises this table for real.

- [ ] **Step 3: Add the table creation block**

Add this block to `scripts/migrate-schema-pg.js`, inside `main()`, immediately after the existing `journeys` table's `CREATE INDEX` line:

```javascript
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_turns (
        id            SERIAL       PRIMARY KEY,
        journey_id    VARCHAR      NOT NULL REFERENCES journeys(journey_id),
        tenant_id     VARCHAR,
        skill_name    VARCHAR      NOT NULL,
        turns         JSONB        NOT NULL DEFAULT '[]',
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE(journey_id, skill_name)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS session_turns_journey_id_idx ON session_turns (journey_id)`);
    console.log('Schema created (or already exists): session_turns table + journey_id index');
```

- [ ] **Step 4: N/A**

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 37 pre-existing failures as the baseline (acknowledged in `decisions.md`), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add scripts/migrate-schema-pg.js
git commit -m "feat(dsh-s1): add session_turns table to schema migration"
```

---

## Task 2: Create the D37 injectable adapter module with a throwing stub

**Files:**
- Create: `src/web-ui/adapters/session-turns-pg.js`
- Test: `tests/check-dsh-s1-persist-session-turns.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-dsh-s1-persist-session-turns.js` with this initial content:

```javascript
'use strict';
// check-dsh-s1-persist-session-turns.js — dsh-s1: persist a stage's session
// turns to Postgres on completion.
// artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md

var assert = require('assert');
var path   = require('path');

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/session-turns-pg.js');

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

  console.log('\n--- dsh-s1 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `Cannot find module '../src/web-ui/adapters/session-turns-pg.js'` (module doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/adapters/session-turns-pg.js`:

```javascript
'use strict';

/**
 * session-turns-pg.js — dsh-s1: durably persist a completed stage's
 * conversation turns to Postgres, matching journey-store-pg.js's exact
 * D37 injectable-adapter convention.
 */

let _dbConnection = null;

function setSessionTurnsStore(adapter) {
  _dbConnection = adapter;
}

function requireSessionTurnsStore() {
  if (!_dbConnection) {
    throw new Error('Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.');
  }
  return _dbConnection;
}

/**
 * Persist a completed stage's turns. Upserts on (journey_id, skill_name).
 * @param {{journeyId: string, tenantId: string, skillName: string, turns: Array}} params
 * @returns {Promise<void>}
 */
async function writeSessionTurns(params) {
  const pool = requireSessionTurnsStore();
  await pool.query(
    'INSERT INTO session_turns (journey_id, tenant_id, skill_name, turns) VALUES ($1, $2, $3, $4) ' +
    'ON CONFLICT (journey_id, skill_name) DO UPDATE SET turns = $4, tenant_id = $2',
    [params.journeyId, params.tenantId, params.skillName, JSON.stringify(params.turns || [])]
  );
}

module.exports = { setSessionTurnsStore, requireSessionTurnsStore, writeSessionTurns };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `[PASS] AC4: writeSessionTurns throws when setSessionTurnsStore has not been called` — `Passed: 1  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 37 pre-existing failures, 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/session-turns-pg.js tests/check-dsh-s1-persist-session-turns.js
git commit -m "feat(dsh-s1): create session-turns-pg adapter with throwing stub (AC4)"
```

---

## Task 3: Insert a row on stage completion (AC1)

**Files:**
- Test: `tests/check-dsh-s1-persist-session-turns.js` (add to existing file)

- [ ] **Step 1: Write the failing test**

Add this block to `tests/check-dsh-s1-persist-session-turns.js`, inside `main()`, after the AC4 block:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: this specific test should actually PASS already, since Task 2's implementation already handles the insert shape. If it fails, re-check Task 2's `writeSessionTurns` parameter order against this test's assertions before proceeding — do not skip verifying this.

- [ ] **Step 3: N/A** — implementation already exists from Task 2.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `Passed: 2  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-dsh-s1-persist-session-turns.js
git commit -m "test(dsh-s1): add AC1 coverage for completion-write insert shape"
```

---

## Task 4: Re-completing the same stage upserts, does not duplicate (AC2)

**Files:**
- Test: `tests/check-dsh-s1-persist-session-turns.js` (add to existing file)

- [ ] **Step 1: Write the failing test**

Add this block after the AC1 block:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: should PASS already (the fake db here simulates upsert-by-key correctly, matching the real `ON CONFLICT ... DO UPDATE` SQL from Task 2). If it fails, check the fake db's key logic against the test's own assertions.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `Passed: 3  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-dsh-s1-persist-session-turns.js
git commit -m "test(dsh-s1): add AC2 coverage for upsert-not-duplicate behaviour"
```

---

## Task 5: Wire the completion hook into routes/skills.js, non-fatal on failure (AC3)

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Test: `tests/check-dsh-s1-persist-session-turns.js` (add to existing file)

- [ ] **Step 1: Write the failing test**

Add this block after the AC2 block:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: should PASS already (the adapter has no internal try/catch — it propagates the fake db's rejection, which IS the correct contract: the CALLER in `routes/skills.js` is what needs the try/catch, per AC3's actual scope).

- [ ] **Step 3: Wire the completion hook into `routes/skills.js`**

In `src/web-ui/routes/skills.js`, locate this existing block (around line 4538-4551):

```javascript
    // Mark stage complete in journey so resume can load it as a prior artefact
    if (session.journeyId && !session._stageDone) {
      session._stageDone = true;
      try { _journeyStore.completeStage(session.journeyId, session.skillName, session.artefactPath, null, sessionId); } catch (_) {}
      // Persist artefact content to Postgres so cross-device / post-deploy resume works.
      // (completeStage only writes the artefact path; content must be saved separately.)
      if (process.env.DATABASE_URL && session.artefactContent) {
        require('../adapters/journey-store-pg').saveArtefact(
          session.journeyId, session.skillName, session.artefactPath, session.artefactContent
        ).catch(function(e) {
          console.warn(JSON.stringify({ event: 'artefact_pg_save_failed', sessionId: sessionId, error: e.message }));
        });
      }
    }
```

Replace it with (adds the new session_turns write immediately after the existing artefact save, following the exact same fire-and-forget `.catch()` convention):

```javascript
    // Mark stage complete in journey so resume can load it as a prior artefact
    if (session.journeyId && !session._stageDone) {
      session._stageDone = true;
      try { _journeyStore.completeStage(session.journeyId, session.skillName, session.artefactPath, null, sessionId); } catch (_) {}
      // Persist artefact content to Postgres so cross-device / post-deploy resume works.
      // (completeStage only writes the artefact path; content must be saved separately.)
      if (process.env.DATABASE_URL && session.artefactContent) {
        require('../adapters/journey-store-pg').saveArtefact(
          session.journeyId, session.skillName, session.artefactPath, session.artefactContent
        ).catch(function(e) {
          console.warn(JSON.stringify({ event: 'artefact_pg_save_failed', sessionId: sessionId, error: e.message }));
        });
      }
      // dsh-s1: durably persist this stage's conversation turns — separate
      // from the artefact-content save above, so the conversation survives a
      // restart even though it's stored in a different table (session_turns,
      // not artefacts). Non-fatal: a failure here must never block the rest
      // of the completion flow (artefact save, Redis delete, response).
      if (process.env.DATABASE_URL) {
        var _turnsJourney = _journeyStore.getJourney(session.journeyId);
        require('../adapters/session-turns-pg').writeSessionTurns({
          journeyId: session.journeyId,
          tenantId: _turnsJourney ? _turnsJourney.tenantId : null,
          skillName: session.skillName,
          turns: session.turns || []
        }).catch(function(e) {
          console.warn(JSON.stringify({ event: 'session_turns_pg_save_failed', sessionId: sessionId, error: e.message }));
        });
      }
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `Passed: 4  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 37 pre-existing failures, 0 new failures. Specifically re-check `tests/check-mfc1-model-first-chat-session.js` and any other test exercising this same completion block still passes (it's a shared hook point).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-dsh-s1-persist-session-turns.js
git commit -m "feat(dsh-s1): wire session-turns write into the stage-completion hook (AC3)"
```

---

## Task 6: Wire the real Postgres adapter in server.js and verify with a real pg round-trip (AC5)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-dsh-s1-persist-session-turns.js` (add to existing file)

- [ ] **Step 1: Write the failing test**

Add this block after the AC3 block:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
DATABASE_URL="<your local/dev Postgres connection string>" node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `relation "session_turns" does not exist` (Task 1's migration hasn't been applied to your test database yet)

- [ ] **Step 3: Apply the migration and wire the real adapter in server.js**

Run the migration against your test database first:

```bash
DATABASE_URL="<your local/dev Postgres connection string>" node scripts/migrate-schema-pg.js
```

Then, in `src/web-ui/server.js`, locate where `journey-store-pg`'s pool is wired (search for `setSkillSessionRedisAdapter` or the `DATABASE_URL` startup block) and add, in the same startup block:

```javascript
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const _sessionTurnsPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  require('./adapters/session-turns-pg').setSessionTurnsStore(_sessionTurnsPool);
}
```

- [ ] **Step 4: Run test — must pass**

```bash
DATABASE_URL="<your local/dev Postgres connection string>" node tests/check-dsh-s1-persist-session-turns.js
```

Expected output: `Passed: 5  Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 37 pre-existing failures, 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-dsh-s1-persist-session-turns.js
git commit -m "feat(dsh-s1): wire real Postgres adapter in server.js (AC5)"
```

---

## Final check before opening a PR

- All 5 tests in `tests/check-dsh-s1-persist-session-turns.js` pass (AC5 may show `[SKIP]` in CI if `DATABASE_URL` isn't available there — confirm with the operator whether CI has a test Postgres instance before assuming this is acceptable to skip in CI).
- Full suite (`npm test`) shows the same 37 pre-existing failures, 0 new ones.
- Story's own AC verification script (`artefacts/2026-07-28-durable-session-history/verification-scripts/dsh-s1-persist-session-turns-verification.md`) walked through and all scenarios pass.
