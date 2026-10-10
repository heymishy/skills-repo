# Implementation Plan: ep5-s2 — Tenant isolation hardening

**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md
**DoR:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep5-s2-dor.md
**Worktree:** `.worktrees/cj-ep5-s2` on branch `feature/cj-ep5-s2`

## Grounding (confirmed by direct code read this session)

All 6 target routes in `src/web-ui/routes/journeys.js` already implement the ownership-check-before-mutation / 404-not-403 cross-tenant guard (decisions.md D13). Exact confirmed query shapes:

| AC | Handler | Ownership-check query | Cross-tenant outcome |
|----|---------|------------------------|----------------------|
| AC1 | `handleGetJourneyCanvas` (line 396) | `SELECT id, name, description FROM customer_journeys WHERE id = $1 AND tenant_id = $2` | 404 before any stage/mapping query runs |
| AC2 | `handlePostJourneyStage` (line 69) | `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2` | 404 before `INSERT` |
| AC3 | `handlePatchJourneyStage` (line 124) | journey: `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`; stage: `SELECT id FROM customer_journey_stages WHERE id = $1 AND journey_id = $2` | 404 before `UPDATE` — attack shape is attacker's OWN valid journey id + a stageId belonging to a DIFFERENT journey |
| AC4 | `handlePatchJourneyStagesOrder` (line 186) | `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2` | 404 before `pool.connect()` (zero transactions opened) |
| AC5 | `handlePostFeatureMapping` (line 265) | `SELECT cjs.id FROM customer_journey_stages cjs JOIN customer_journeys cj ON cjs.journey_id = cj.id WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3` | 404 before `pool.connect()` |
| AC6 | `handleDeleteFeatureMapping` (line 354) | same join query as AC5 | 404 before `DELETE` |

AC7 is an aggregate assertion over the 6 results above, not a 7th route.

This story requires **zero production code changes** — confirmed correct behaviour already exists in every handler. The only deliverable is one new test file.

## File map

**Create only:** `tests/check-ep5-s2-tenant-isolation-adversarial.js`

No other file is touched. The test runner (`scripts/run-all-tests.js`) auto-discovers `tests/check-*.js` — no registration step needed (confirmed: no hardcoded file list in `package.json` or the runner).

## TDD sequence

### RED
Before writing the file, there is no RED step in the traditional sense — the behaviour under test already exists and already passes. Instead: write each test, run it, confirm PASS. Then, for each test, temporarily comment out the handler's ownership-check `if (!...) { notFound...; return; }` line (or equivalent) in a **scratch copy** — do NOT edit `src/web-ui/routes/journeys.js` itself — to confirm the test actually fails when the guard is missing. This is the mutation-testing-style discriminating-check convention established in `ep3-s1` (see `workspace/learnings.md`). If a faster equivalent check is more practical (e.g. temporarily changing the mock's matching row to always match, proving the test's assertion on `res._s === 404` would fail), that satisfies the same intent — the goal is proving each test can actually catch a real regression, not just that it passes today.

### GREEN
Write the full test file below verbatim. Run `node tests/check-ep5-s2-tenant-isolation-adversarial.js` directly first (fast feedback), then `npm test` for the full suite once the new file is green.

### Full test file content

```javascript
'use strict';
// check-ep5-s2-tenant-isolation-adversarial.js -- TDD tests for ep5-s2 (Epic 5,
// customer-journey feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md
//
// Self-contained by design (per this repo's own test-file convention) --
// does NOT import mock-pool helpers from any other check-*.js file. Each
// of the 6 handlers under test has a distinct SQL query shape; each mock
// pool below matches that handler's own real query text exactly (confirmed
// by reading src/web-ui/routes/journeys.js directly during planning).
const assert = require('assert');

const REAL_CSRF = 'ep5-s2-real-token';

function makeMockRes() {
  return {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    writeHead: function(c, headers) { this._s = c; this._headers = headers; },
    end: function(b) { this._b = b; },
    _s: 200, _b: null, _headers: null
  };
}

// Normalizes a template-literal SQL string's internal whitespace/newlines
// to single spaces so the match regexes below don't have to mirror the
// handler's own indentation exactly.
function norm(sql) { return String(sql).replace(/\s+/g, ' ').trim(); }

let passed = 0; let failed = 0;
const results = {}; // AC id -> true/false, read by the AC7 aggregate check below
function pass(name, acId) { console.log(`  [PASS] ${name}`); passed++; if (acId) results[acId] = true; }
function fail(name, err, acId) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; if (acId) results[acId] = false; }

(async function() {
  const {
    handleGetJourneyCanvas,
    handlePostJourneyStage,
    handlePatchJourneyStage,
    handlePatchJourneyStagesOrder,
    handlePostFeatureMapping,
    handleDeleteFeatureMapping
  } = require('../src/web-ui/routes/journeys');

  // ── AC1: GET /journeys/:id with a cross-tenant journey id ────────────
  try {
    const journeyRow = { id: 'j-victim', name: 'Victim Journey', description: 'tenant-B secret', tenant_id: 'tenant-B' };
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id, name, description FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [journeyRow] : [] });
        }
        throw new Error('unexpected query in AC1 mock: ' + s);
      }
    };
    const req = { session: { tenantId: 'tenant-A' }, params: { id: 'j-victim' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    const bodyText = JSON.stringify(res._b || '');
    assert.ok(bodyText.indexOf('Victim Journey') === -1, 'expected no journey name in response body');
    assert.ok(bodyText.indexOf('tenant-B secret') === -1, 'expected no journey description in response body');
    pass('AC1: GET /journeys/:id with a cross-tenant journey id returns 404 with no journey data', 'AC1');
  } catch (e) { fail('AC1: GET /journeys/:id with a cross-tenant journey id returns 404 with no journey data', e, 'AC1'); }

  // ── AC2: POST /journeys/:id/stages with a cross-tenant journey id ────
  try {
    const journeyRow = { id: 'j-victim', tenant_id: 'tenant-B' };
    const insertCalls = [];
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: journeyRow.id }] : [] });
        }
        if (/^INSERT INTO customer_journey_stages/.test(s)) {
          insertCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [{ id: 'new-stage' }] });
        }
        if (/^SELECT COALESCE\(MAX\(position\)/.test(s)) {
          return Promise.resolve({ rows: [{ max_position: -1 }] });
        }
        throw new Error('unexpected query in AC2 mock: ' + s);
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim' },
      body: { name: 'Injected stage', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePostJourneyStage(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(insertCalls.length, 0, 'expected zero INSERT calls');
    pass('AC2: POST /journeys/:id/stages with a cross-tenant journey id returns 404 and creates no stage', 'AC2');
  } catch (e) { fail('AC2: POST /journeys/:id/stages with a cross-tenant journey id returns 404 and creates no stage', e, 'AC2'); }

  // ── AC3: PATCH /journeys/:id/stages/:stageId with a stage from a different journey ──
  try {
    // Attacker owns journey j-attacker (tenant-A) and passes it as :id
    // (so the journey-ownership check passes), but supplies :stageId
    // belonging to a DIFFERENT journey (j-victim). The stage lookup is
    // scoped by journey_id, so it must not match.
    const attackerJourney = { id: 'j-attacker', tenant_id: 'tenant-A' };
    const victimStage = { id: 's-victim', journey_id: 'j-victim' };
    const updateCalls = [];
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = attackerJourney.id === params[0] && attackerJourney.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: attackerJourney.id }] : [] });
        }
        if (/^SELECT id FROM customer_journey_stages WHERE id = \$1 AND journey_id = \$2$/.test(s)) {
          const match = victimStage.id === params[0] && victimStage.journey_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: victimStage.id }] : [] });
        }
        if (/^UPDATE customer_journey_stages SET/.test(s)) {
          updateCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [] });
        }
        throw new Error('unexpected query in AC3 mock: ' + s);
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-attacker', stageId: 's-victim' },
      body: { field: 'name', value: 'Hacked', _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStage(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(updateCalls.length, 0, 'expected zero UPDATE calls');
    pass('AC3: PATCH .../stages/:stageId with a stage id from a different journey/tenant returns 404 and modifies nothing', 'AC3');
  } catch (e) { fail('AC3: PATCH .../stages/:stageId with a stage id from a different journey/tenant returns 404 and modifies nothing', e, 'AC3'); }

  // ── AC4: PATCH /journeys/:id/stages-order with a cross-tenant journey id ──
  try {
    const journeyRow = { id: 'j-victim', tenant_id: 'tenant-B' };
    let connectCalls = 0;
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2$/.test(s)) {
          const match = journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: journeyRow.id }] : [] });
        }
        throw new Error('unexpected query in AC4 mock: ' + s);
      },
      connect: function() {
        connectCalls++;
        return Promise.resolve({ query: function() { return Promise.resolve({ rows: [] }); }, release: function() {} });
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim' },
      body: { stageIds: ['s1', 's2'], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePatchJourneyStagesOrder(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(connectCalls, 0, 'expected zero pool.connect() calls -- rejected before any transaction opens');
    pass('AC4: PATCH .../stages-order with a cross-tenant journey id returns 404 and modifies no positions', 'AC4');
  } catch (e) { fail('AC4: PATCH .../stages-order with a cross-tenant journey id returns 404 and modifies no positions', e, 'AC4'); }

  // ── AC5: POST .../feature-mappings with a cross-tenant stage id ──────
  try {
    let connectCalls = 0;
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT cjs\.id FROM customer_journey_stages cjs JOIN customer_journeys cj ON cjs\.journey_id = cj\.id WHERE cjs\.id = \$1 AND cjs\.journey_id = \$2 AND cj\.tenant_id = \$3$/.test(s)) {
          return Promise.resolve({ rows: [] }); // cross-tenant: never matches
        }
        throw new Error('unexpected query in AC5 mock: ' + s);
      },
      connect: function() {
        connectCalls++;
        return Promise.resolve({ query: function() { return Promise.resolve({ rows: [] }); }, release: function() {} });
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim', stageId: 's-victim' },
      body: { featureSlug: 'injected-feature', metricKeys: [], _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handlePostFeatureMapping(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(connectCalls, 0, 'expected zero pool.connect() calls -- rejected before any transaction opens, so zero INSERT/UPDATE is implied');
    pass('AC5: POST .../feature-mappings with a cross-tenant stage id returns 404 and creates no mapping', 'AC5');
  } catch (e) { fail('AC5: POST .../feature-mappings with a cross-tenant stage id returns 404 and creates no mapping', e, 'AC5'); }

  // ── AC6: DELETE .../feature-mappings/:mappingId with a cross-tenant stage id ──
  try {
    const deleteCalls = [];
    const pool = {
      query: function(sql, params) {
        const s = norm(sql);
        if (/^SELECT cjs\.id FROM customer_journey_stages cjs JOIN customer_journeys cj ON cjs\.journey_id = cj\.id WHERE cjs\.id = \$1 AND cjs\.journey_id = \$2 AND cj\.tenant_id = \$3$/.test(s)) {
          return Promise.resolve({ rows: [] }); // cross-tenant: never matches
        }
        if (/^DELETE FROM feature_customer_journey_stage_mappings/.test(s)) {
          deleteCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [] });
        }
        throw new Error('unexpected query in AC6 mock: ' + s);
      }
    };
    const req = {
      session: { tenantId: 'tenant-A', csrfToken: REAL_CSRF },
      params: { id: 'j-victim', stageId: 's-victim', mappingId: 'm-victim' },
      body: { _csrf: REAL_CSRF }
    };
    const res = makeMockRes();
    await handleDeleteFeatureMapping(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404');
    assert.strictEqual(deleteCalls.length, 0, 'expected zero DELETE calls');
    pass('AC6: DELETE .../feature-mappings/:mappingId with a cross-tenant stage id returns 404 and deletes nothing', 'AC6');
  } catch (e) { fail('AC6: DELETE .../feature-mappings/:mappingId with a cross-tenant stage id returns 404 and deletes nothing', e, 'AC6'); }

  // ── AC7: aggregate zero-leaks summary ─────────────────────────────────
  try {
    const checked = ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6'];
    const allPassed = checked.every(function(id) { return results[id] === true; });
    assert.ok(allPassed, 'expected all 6 individual adversarial tests to have passed: ' + JSON.stringify(results));
    console.log('  0 cross-tenant leaks found across all 6 journey/stage/mapping routes');
    pass('AC7: all 6 routes confirmed to enforce tenant isolation -- zero cross-tenant leaks found', 'AC7');
  } catch (e) { fail('AC7: all 6 routes confirmed to enforce tenant isolation -- zero cross-tenant leaks found', e, 'AC7'); }

  console.log(`\n[ep5-s2-tenant-isolation-adversarial] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
```

### Commit
`node tests/check-ep5-s2-tenant-isolation-adversarial.js` → expect `7 passed, 0 failed`.
Then `npm test` (full suite) → expect no regressions vs. the current master baseline.
Conflict-marker scan (not expected to be needed — no merge/rebase in this task — but run per standing convention before `git add` anyway): `grep -n "<<<\|===\|>>>" tests/check-ep5-s2-tenant-isolation-adversarial.js` → expect zero results.

Commit message:
```
test: ep5-s2 -- adversarial tenant-isolation suite for all 6 journey/stage/mapping routes

One new consolidated test file (self-contained, no shared mock-pool
helpers per this repo's own convention). Confirms the existing
ownership-check-before-mutation / 404-not-403 guard (decisions.md D13)
holds across every mutating/read route in journeys.js. Zero production
code changes -- all 6 handlers already implement the guard correctly.

7/7 tests pass: AC1 (GET canvas), AC2 (POST stage), AC3 (PATCH stage),
AC4 (PATCH stages-order), AC5 (POST feature-mapping), AC6 (DELETE
feature-mapping), AC7 (aggregate zero-leaks summary).
```

## Task breakdown (for /subagent-execution)

**One task only** — this story is pure test-writing with zero anticipated production-code changes:

- **Task 1:** Write `tests/check-ep5-s2-tenant-isolation-adversarial.js` exactly as specified above. Run it standalone, then run the full suite. Commit. Push. Open a draft PR.

No second task is planned. If the implementer's own run of the AC1 test (or any other) reveals a REAL isolation gap — a handler actually returning victim data or performing a mutation — STOP per the DoR's own explicit instruction and report it as a Critical finding rather than silently patching `journeys.js` as if it were in scope for this task.

## Dispatch sequence (per this session's established pattern)

1. Implementer agent (fresh `general-purpose` dispatch, full self-contained prompt, background-process warning, unexpected-HEAD-commit warning).
2. Independently verify: `git log`, `git status`, re-run the test file myself in the worktree.
3. Spec-compliance reviewer agent (fresh dispatch): confirm all 7 ACs are actually exercised, confirm each mock's query regex matches the REAL handler SQL (not just matches by coincidence), confirm zero production file changes.
4. Code-quality reviewer agent (fresh dispatch): confirm self-contained-test-file convention followed, confirm no unicode glyphs introduced (N/A here — no UI), confirm commit message quality.
5. `/verify-completion` → `/branch-complete` (push + draft PR per established default).
