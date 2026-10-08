# Drag-and-drop stage reorder with keyboard alternative — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every unit test in the test plan pass (11 tests covering all 4 ACs); implement the E2E spec carefully even though it cannot run this session.
**Branch:** `feature/ep1-s4`
**Worktree:** `.worktrees/ep1-s4`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep1-s4-stage-reorder.js       — 11 unit tests covering AC1 (backend+atomicity+wiring), AC2 (shape), AC3, AC4
  tests/e2e/ep1-s4-stage-reorder.spec.js    — 2 E2E scenarios (AC1 interaction, AC2 interaction) — written, not executed this session

Modify:
  src/web-ui/routes/journeys.js   — add handlePatchJourneyStagesOrder; extend handleGetJourneyCanvas's stage card markup (draggable, up/down buttons) and client script (drag wiring, submitOrder, rollback+toast)
  src/web-ui/server.js            — add handlePatchJourneyStagesOrder to the journeys.js import; one new dispatch entry for PATCH /journeys/:id/stages-order
```

---

## Task 1: Backend reorder handler — happy path, CSRF, cross-tenant, stageIds-set validation

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep1-s4-stage-reorder.js` (new file, started here)

- [ ] **Step 1: Write the failing tests**

```js
'use strict';
// check-ep1-s4-stage-reorder.js -- TDD tests for ep1-s4 (Epic 1, customer-journey
// feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s4-test-plan.md

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (err) { failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
}

var { handlePatchJourneyStagesOrder, handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

// ── Transactional mock pool/client, modeled on check-tab-s1-tenant-admin-bootstrap.js's own fake-pool pattern ──
function makeTransactionalMockPool(opts) {
  opts = opts || {};
  var journeyRow = opts.journeyRow; // { id, tenant_id } or undefined
  var stageRows = (opts.stageRows || []).map(function(r) { return Object.assign({}, r); }); // [{id, position}]
  var updateCalls = [];
  var connectCalls = 0;
  var beginCalls = 0, commitCalls = 0, rollbackCalls = 0;
  var failOnUpdateNumber = opts.failOnUpdateNumber || null; // 1-indexed

  function makeClient() {
    var updateCountThisTx = 0;
    return {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (s === 'BEGIN') { beginCalls++; return Promise.resolve({ rows: [] }); }
        if (s === 'COMMIT') { commitCalls++; return Promise.resolve({ rows: [] }); }
        if (s === 'ROLLBACK') { rollbackCalls++; return Promise.resolve({ rows: [] }); }
        if (/^UPDATE customer_journey_stages/.test(s)) {
          updateCountThisTx++;
          if (failOnUpdateNumber && updateCountThisTx === failOnUpdateNumber) {
            return Promise.reject(new Error('simulated mid-transaction failure'));
          }
          var position = params[0], stageId = params[1];
          var row = stageRows.find(function(r) { return r.id === stageId; });
          updateCalls.push({ sql: s, params: params });
          if (row) row.position = position; // only committed logically if COMMIT is reached -- caller checks commitCalls too
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      },
      release: function() {}
    };
  }

  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0] && journeyRow.tenant_id === params[1];
        return Promise.resolve({ rows: match ? [{ id: journeyRow.id }] : [] });
      }
      if (/^SELECT id FROM customer_journey_stages WHERE journey_id = \$1$/.test(s)) {
        return Promise.resolve({ rows: stageRows.map(function(r) { return { id: r.id }; }) });
      }
      return Promise.resolve({ rows: [] });
    },
    connect: function() { connectCalls++; return Promise.resolve(makeClient()); },
    _state: function() {
      return { stageRows: stageRows, updateCalls: updateCalls, connectCalls: connectCalls, beginCalls: beginCalls, commitCalls: commitCalls, rollbackCalls: rollbackCalls };
    }
  };
}

function mockRes() {
  var statusCode, body;
  return {
    status: function(code) { statusCode = code; return this; },
    json: function(obj) { body = obj; return this; },
    get statusCode_() { return statusCode; },
    get body_() { return body; }
  };
}

(function() {
  test('AC1 (backend): valid ordered stageIds array updates all positions in one transaction', function() {
    var pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 't1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }, { id: 's3', position: 2 }]
    });
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' }, body: { stageIds: ['s3', 's1', 's2'], _csrf: 'VALID' } };
    req._csrfValid = true; // matches this file's CSRF test-fixture convention below
    var res = mockRes();
    return handlePatchJourneyStagesOrder(req, res, null, pool).then(function() {
      var st = pool._state();
      assert.strictEqual(st.connectCalls, 1, 'expected exactly one pool.connect() call');
      assert.strictEqual(st.beginCalls, 1, 'expected exactly one BEGIN');
      assert.strictEqual(st.commitCalls, 1, 'expected exactly one COMMIT');
      assert.strictEqual(st.rollbackCalls, 0, 'expected zero ROLLBACK calls');
      assert.strictEqual(st.updateCalls.length, 3, 'expected 3 UPDATE calls, one per stage');
      assert.strictEqual(res.statusCode_, 200);
    });
  });

  test('AC1 (backend security): a stageId not belonging to this journey is rejected before any transaction opens', function() {
    var pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 't1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }]
    });
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' }, body: { stageIds: ['s1', 's2', 's-foreign'], _csrf: 'VALID' } };
    req._csrfValid = true;
    var res = mockRes();
    return handlePatchJourneyStagesOrder(req, res, null, pool).then(function() {
      assert.strictEqual(res.statusCode_, 400);
      assert.strictEqual(pool._state().connectCalls, 0, 'expected zero pool.connect() calls -- rejected before any transaction opens');
    });
  });

  test('AC1 (backend security): cross-tenant journey id is rejected', function() {
    var pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 't-OTHER' },
      stageRows: [{ id: 's1', position: 0 }]
    });
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' }, body: { stageIds: ['s1'], _csrf: 'VALID' } };
    req._csrfValid = true;
    var res = mockRes();
    return handlePatchJourneyStagesOrder(req, res, null, pool).then(function() {
      assert.strictEqual(res.statusCode_, 404);
      assert.strictEqual(pool._state().connectCalls, 0);
    });
  });

  console.log('\n[ep1-s4-stage-reorder] Task 1 results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

Note: this draft test file uses a simplified CSRF bypass (`req._csrfValid`) for clarity in this plan — the ACTUAL test file (written in Task 1's real implementation) must use this codebase's REAL CSRF fixture convention (see `check-ep1-s3-stage-panel.js` for the exact pattern: a real `_csrf` middleware double, not a bypass flag). Replace `req._csrfValid`/`req.body._csrf: 'VALID'` with the established `csrfGuard` test double used in every other `check-ep1-s*-*.js` file in this feature before committing.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `FAIL — handlePatchJourneyStagesOrder is not defined` (or a `TypeError: handlePatchJourneyStagesOrder is not a function`, since the export doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journeys.js`, add this new handler directly below `handlePatchJourneyStage` (before `handleGetJourneyCanvas`):

```js
/**
 * PATCH /journeys/:id/stages-order — reorder all stages in one transaction.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePatchJourneyStagesOrder(req, res, _next, pool) {
  // ep1-s4 -- CSRF guard first, mandatory from first implementation per
  // jcg-s1/ep1-s2/ep1-s3's own precedent.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageIds = (req.body && req.body.stageIds) || [];

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  // Journey ownership check BEFORE anything else -- 404, not 403, for a
  // cross-tenant journey id, matching every other handler in this file.
  var jr = await pool.query(
    `SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  if (!jr.rows[0]) { notFound('journey not found'); return; }

  // ep1-s4 -- the submitted stageIds array MUST be an EXACT set match
  // against the journey's real stages (no missing id, no extra id, no id
  // from a different journey/tenant). Checked BEFORE opening any
  // transaction -- a rejected request never calls pool.connect() at all.
  var sr = await pool.query(
    `SELECT id FROM customer_journey_stages WHERE journey_id = $1`,
    [journeyId]
  );
  var realIds = sr.rows.map(function(r) { return r.id; });
  var sameSize = realIds.length === stageIds.length;
  var sameSet = sameSize && realIds.every(function(id) { return stageIds.indexOf(id) !== -1; });
  if (!sameSet) { badRequest('stageIds must match the journey\'s existing stages exactly'); return; }

  // Single-transaction position rebalance -- matches the story's own
  // Architecture Constraints. Reuses tenant-admin-bootstrap.js's
  // bootstrapTenantAdminIfNeeded pattern verbatim (see decisions.md D6):
  // pool.connect() -> BEGIN -> N UPDATEs -> COMMIT, ROLLBACK on error,
  // release() in finally. pg.Pool.query() alone gives no cross-statement
  // atomicity guarantee, so a per-row pool.query() loop would NOT satisfy
  // this requirement.
  var client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (var i = 0; i < stageIds.length; i++) {
      await client.query(
        'UPDATE customer_journey_stages SET position = $1, updated_at = NOW() WHERE id = $2 AND journey_id = $3 AND tenant_id = $4',
        [i, stageIds[i], journeyId, tenantId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best-effort */ }
    throw err;
  } finally {
    client.release();
  }

  if (res.status) { res.status(200).json({ id: journeyId, stageIds: stageIds }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: journeyId, stageIds: stageIds })); }
}
```

Update the module's export line at the bottom of the file:

```js
module.exports = { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `[ep1-s4-stage-reorder] Task 1 results: 3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline was 724 files, 0 failed, plus the new file)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep1-s4-stage-reorder.js
git commit -m "feat: add handlePatchJourneyStagesOrder with transactional position updates"
```

---

## Task 2: Backend atomicity — a mid-transaction failure rolls back everything

**Files:**
- Test: `tests/check-ep1-s4-stage-reorder.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s4-stage-reorder.js`, inside the same IIFE, after the Task 1 tests:

```js
  test('AC1 (atomicity): a mid-transaction failure rolls back -- ALL stages keep their pre-call position, not just the failed one', function() {
    var pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 't1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }, { id: 's3', position: 2 }],
      failOnUpdateNumber: 2
    });
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' }, body: { stageIds: ['s3', 's1', 's2'], _csrf: 'VALID' } };
    req._csrfValid = true;
    var res = mockRes();
    return handlePatchJourneyStagesOrder(req, res, null, pool).catch(function() {
      // the handler is expected to re-throw after ROLLBACK -- the dispatch
      // layer (server.js) is responsible for turning this into a 500;
      // this test only asserts the transaction-level contract.
    }).then(function() {
      var st = pool._state();
      assert.strictEqual(st.rollbackCalls, 1, 'expected ROLLBACK to be called');
      assert.strictEqual(st.commitCalls, 0, 'expected COMMIT to never be called');
      // The 1st UPDATE (s3 -> position 0) ran before the 2nd one failed --
      // but since COMMIT never happened, a real Postgres ROLLBACK would
      // undo it too. This mock applies UPDATE effects immediately for
      // simplicity, so assert the CALL COUNT instead (proves the 3rd
      // UPDATE never even ran, and the handler didn't silently continue
      // past the failure) -- the real-database guarantee (1st UPDATE
      // undone too) is provided by Postgres itself, not by this mock.
      assert.strictEqual(st.updateCalls.length, 1, 'expected only the 1st UPDATE to have been recorded before the 2nd one failed');
    });
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `FAIL` on the new atomicity test (the handler doesn't yet exist in a form that this specific mock exercises differently — actually by Task 1 the handler already exists; this test should PASS immediately since the implementation already has the try/catch/ROLLBACK structure. If it fails, re-check `failOnUpdateNumber` wiring in the mock against the handler's actual UPDATE call order.)

- [ ] **Step 3: Write minimal implementation**

No source change needed — Task 1's implementation already has the `BEGIN`/`UPDATE`/`COMMIT`/catch-`ROLLBACK` structure. This task exists to prove that structure under a forced failure, not to add new code. If the test fails, the bug is in Task 1's implementation (most likely: `ROLLBACK` not actually called, or the loop swallowing the error instead of propagating it) — fix `handlePatchJourneyStagesOrder` directly, do not weaken the test.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `[ep1-s4-stage-reorder] Task 1+2 results: 4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s4-stage-reorder.js
git commit -m "test: verify mid-transaction failure rolls back stage reorder"
```

---

## Task 3: Wire the new route in server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Write the failing test**

No dedicated unit test for pure dispatch wiring (matching `ep1-s1`/`ep1-s2`/`ep1-s3`'s own precedent — the handler itself is unit-tested directly; the E2E spec in Task 7 exercises the real HTTP path). Skip to implementation.

- [ ] **Step 2: (skipped — no failing test for pure wiring)**

- [ ] **Step 3: Write the implementation**

In `src/web-ui/server.js`, update the import line (around line 117):

```js
const { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder } = require('./routes/journeys');
```

Add a new dispatch branch immediately after the existing `PATCH /journeys/:id/stages/:stageId` block (around line 3998, right after its closing `});`):

```js

  } else if (pathname.match(/^\/journeys\/[^/]+\/stages-order$/) && req.method === 'PATCH') {
    // cj-ep1-s4 — reorder all stages in one transaction (2026-10-05-customer-journey-as-first-class)
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePatchJourneyStagesOrder(req, res, null, _pshPool);
    });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `[ep1-s4-stage-reorder] Task 1+2 results: 4 passed, 0 failed` (unchanged — this task adds no new unit test, only real-HTTP reachability, exercised by the E2E spec in Task 7)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire PATCH /journeys/:id/stages-order dispatch"
```

---

## Task 4: Stage card markup — draggable attribute, up/down move buttons, boundary disabling, no controls on a single stage

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep1-s4-stage-reorder.js` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ep1-s4-stage-reorder.js`:

```js
  function makeCanvasMockPool(journeyRow, stageRows) {
    return {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT id, name, description FROM customer_journeys/.test(s)) {
          return Promise.resolve({ rows: journeyRow ? [journeyRow] : [] });
        }
        if (/^SELECT id, name, position, description/.test(s)) {
          return Promise.resolve({ rows: stageRows });
        }
        return Promise.resolve({ rows: [] });
      }
    };
  }

  test('AC1 (wiring shape): stage cards are draggable', function() {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'A', position: 0 }, { id: 's2', name: 'B', position: 1 }
    ]);
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
    var res = mockRes();
    return handleGetJourneyCanvas(req, res, null, pool).then(function() {
      assert.ok(/class="sw-stage-card" data-stage-id="s1" draggable="true"/.test(res.body_.bodyContent), 'expected draggable="true" on stage cards');
    });
  });

  test('AC3: up/down move buttons render for every card when there are 2+ stages, boundary-disabled', function() {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'First', position: 0 }, { id: 's2', name: 'Mid', position: 1 }, { id: 's3', name: 'Last', position: 2 }
    ]);
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
    var res = mockRes();
    return handleGetJourneyCanvas(req, res, null, pool).then(function() {
      var html = res.body_.bodyContent;
      assert.ok(/data-stage-id="s1" data-direction="up"[^>]*disabled/.test(html), 'expected s1 (first) up button disabled');
      assert.ok(!/data-stage-id="s1" data-direction="down"[^>]*disabled/.test(html), 'expected s1 down button NOT disabled');
      assert.ok(/data-stage-id="s3" data-direction="down"[^>]*disabled/.test(html), 'expected s3 (last) down button disabled');
      assert.ok(!/data-stage-id="s3" data-direction="up"[^>]*disabled/.test(html), 'expected s3 up button NOT disabled');
      assert.ok(!/data-stage-id="s2" data-direction="up"[^>]*disabled/.test(html), 'expected s2 (mid) up button NOT disabled');
      assert.ok(!/data-stage-id="s2" data-direction="down"[^>]*disabled/.test(html), 'expected s2 (mid) down button NOT disabled');
    });
  });

  test('AC3 (single-stage): a journey with exactly one stage renders no reorder controls', function() {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'Only', position: 0 }
    ]);
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
    var res = mockRes();
    return handleGetJourneyCanvas(req, res, null, pool).then(function() {
      assert.ok(!/class="sw-stage-reorder-controls"/.test(res.body_.bodyContent), 'expected no reorder-controls element for a single-stage journey');
    });
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `FAIL` on all 3 new tests — `draggable="true"` and the move buttons don't exist yet in the rendered markup

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journeys.js`, add two new icon constants right after `MOMENT_OF_TRUTH_ICON`'s definition (inside `handleGetJourneyCanvas`):

```js
  // ep1-s4 -- 14x14/20x20-viewBox/1.5px-stroke icons per DESIGN.md's own
  // icon spec, not unicode glyphs (rule 5 explicitly disallows those in
  // new work) -- matches MOMENT_OF_TRUTH_ICON's own precedent above.
  var ARROW_UP_ICON =
    '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 16V4M4 9l6-6 6 6"/>' +
    '</svg>';
  var ARROW_DOWN_ICON =
    '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 4v12M4 11l6 6 6-6"/>' +
    '</svg>';
```

Replace the existing `stagesHtml` block with:

```js
  var stagesHtml = stages.length
    ? stages.map(function(s, idx) {
        var isFirst = idx === 0;
        var isLast = idx === stages.length - 1;
        var reorderControls = stages.length > 1
          ? '<span class="sw-stage-reorder-controls">' +
              '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="up"' + (isFirst ? ' disabled' : '') + ' aria-label="Move stage up">' + ARROW_UP_ICON + '</button>' +
              '<button type="button" class="sw-stage-move" data-stage-id="' + escHtml(s.id) + '" data-direction="down"' + (isLast ? ' disabled' : '') + ' aria-label="Move stage down">' + ARROW_DOWN_ICON + '</button>' +
            '</span>'
          : '';
        return (
          '<div class="sw-stage-card" data-stage-id="' + escHtml(s.id) + '" draggable="true">' +
            '<span class="sw-stage-name">' + escHtml(s.name) + '</span>' +
            (s.moment_of_truth
              ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>'
              : '') +
            reorderControls +
            '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit stage</a>' +
          '</div>'
        );
      }).join('')
    : '<p class="sw-journey-stages-empty">No stages yet. Add your first stage.</p>';
```

Add CSS for the new elements inside the existing `panelHtml`'s `<style>` block (append before the closing `</style>` string segment):

```js
      '.sw-stage-card{cursor:grab}' +
      '.sw-stage-reorder-controls{display:inline-flex;gap:2px;margin-left:8px;vertical-align:middle}' +
      '.sw-stage-move{background:none;border:1px solid var(--line);border-radius:4px;padding:2px;color:var(--ink-2);cursor:pointer;display:inline-flex}' +
      '.sw-stage-move:disabled{opacity:0.35;cursor:default}' +
      '.sw-stage-reorder-error{display:none;font-size:12px;color:var(--danger);margin-top:8px}' +
      '.sw-stage-reorder-error--visible{display:block}' +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `[ep1-s4-stage-reorder] Task 1+2+4 results: 7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing — pay particular attention to `check-ep1-s3-stage-panel.js`'s own markup tests, since this changes the shared `stagesHtml` block they may also assert against

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep1-s4-stage-reorder.js
git commit -m "feat: render draggable stage cards with keyboard-accessible reorder buttons"
```

---

## Task 5: Client script — drag-and-drop wiring, shared submitOrder, optimistic rollback + exact toast text

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep1-s4-stage-reorder.js` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ep1-s4-stage-reorder.js`:

```js
  function extractScript(html) {
    var m = html.match(/<script>([\s\S]*)<\/script>/);
    if (!m) throw new Error('no <script> tag found in rendered HTML');
    return m[1];
  }

  function extractFunctionBody(script, fnName) {
    var start = script.indexOf('function ' + fnName + '(');
    if (start === -1) throw new Error('function ' + fnName + ' not found in script');
    var openBrace = script.indexOf('{', start);
    var depth = 0;
    for (var i = openBrace; i < script.length; i++) {
      if (script[i] === '{') depth++;
      else if (script[i] === '}') { depth--; if (depth === 0) return script.slice(start, i + 1); }
    }
    throw new Error('unbalanced braces while extracting ' + fnName);
  }

  test('AC2 (shape): the drop handler reverts to the pre-drop snapshot and shows the exact toast text on failure', function() {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'A', position: 0 }, { id: 's2', name: 'B', position: 1 }
    ]);
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
    var res = mockRes();
    return handleGetJourneyCanvas(req, res, null, pool).then(function() {
      var script = extractScript(res.body_.bodyContent);
      var submitOrderBody = extractFunctionBody(script, 'submitOrder');
      assert.ok(/reorderDom\(snapshot\)/.test(submitOrderBody), 'expected submitOrder\'s failure branch to restore the DOM snapshot');
      assert.ok(submitOrderBody.indexOf('Stage order not saved — please try again') !== -1, 'expected the EXACT toast text in submitOrder\'s failure branch');
    });
  });

  test('AC3 (click wiring): the move-button handler shares submitOrder with the drop handler -- proves one shared mechanism', function() {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'A', position: 0 }, { id: 's2', name: 'B', position: 1 }
    ]);
    var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
    var res = mockRes();
    return handleGetJourneyCanvas(req, res, null, pool).then(function() {
      var script = extractScript(res.body_.bodyContent);
      // Both the drop listener and the move-button click listener must
      // call submitOrder(...) -- count occurrences: 1 for the definition,
      // 2+ for the two call sites.
      var occurrences = script.split('submitOrder(').length - 1;
      assert.ok(occurrences >= 3, 'expected submitOrder to be defined once and called from at least 2 call sites (drop + move button), found ' + occurrences + ' occurrence(s)');
    });
  });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `FAIL` — `submitOrder` function does not exist in the rendered script yet

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journeys.js`'s client `<script>` block (inside `handleGetJourneyCanvas`'s `bodyContent` string), add this block right after the existing `'if(list){' ... '}'` section that wires the `.sw-stage-edit` click listener (i.e. after the `openPanel` click-delegation block, before the `if(panelClose)...` line):

```js
      // ep1-s4 -- drag-and-drop + keyboard reorder, sharing one submit
      // path. Native HTML5 drag-and-drop (kanban-view.js's own existing
      // convention in this codebase, reused here, not reinvented).
      'var reorderError=document.getElementById("sw-stage-reorder-error");' +
      'function getStageIds(){' +
        'return Array.prototype.slice.call(list.querySelectorAll(".sw-stage-card")).map(function(c){return c.getAttribute("data-stage-id");});' +
      '}' +
      'function reorderDom(orderIds){' +
        'orderIds.forEach(function(id){' +
          'var card=list.querySelector(\'.sw-stage-card[data-stage-id="\'+id+\'"]\');' +
          'if(card)list.appendChild(card);' +
        '});' +
      '}' +
      'function submitOrder(newOrderIds){' +
        'var snapshot=getStageIds();' +
        'reorderDom(newOrderIds);' +
        'submitJson("/journeys/"+journeyId+"/stages-order","PATCH",{stageIds:newOrderIds,_csrf:csrfToken})' +
          '.catch(function(){' +
            'reorderDom(snapshot);' +
            'if(reorderError){' +
              'reorderError.textContent="Stage order not saved \\u2014 please try again";' +
              'reorderError.classList.add("sw-stage-reorder-error--visible");' +
              'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
            '}' +
          '});' +
      '}' +
      'if(list){' +
        'list.addEventListener("dragstart",function(ev){' +
          'var card=ev.target.closest&&ev.target.closest(".sw-stage-card");' +
          'if(!card)return;' +
          'ev.dataTransfer.setData("text/plain",card.getAttribute("data-stage-id"));' +
          'ev.dataTransfer.effectAllowed="move";' +
        '});' +
        'list.addEventListener("dragover",function(ev){' +
          'if(!ev.target.closest||!ev.target.closest(".sw-stage-card"))return;' +
          'ev.preventDefault();' +
        '});' +
        'list.addEventListener("drop",function(ev){' +
          'ev.preventDefault();' +
          'var draggedId=ev.dataTransfer.getData("text/plain");' +
          'if(!draggedId)return;' +
          'var targetCard=ev.target.closest&&ev.target.closest(".sw-stage-card");' +
          'var ids=getStageIds();' +
          'var fromIdx=ids.indexOf(draggedId);' +
          'if(fromIdx===-1)return;' +
          'ids.splice(fromIdx,1);' +
          'var toIdx=targetCard?ids.indexOf(targetCard.getAttribute("data-stage-id")):ids.length;' +
          'if(toIdx===-1)toIdx=ids.length;' +
          'ids.splice(toIdx,0,draggedId);' +
          'submitOrder(ids);' +
        '});' +
        'list.addEventListener("click",function(ev){' +
          'var btn=ev.target.closest&&ev.target.closest(".sw-stage-move");' +
          'if(!btn||btn.disabled)return;' +
          'var id=btn.getAttribute("data-stage-id");' +
          'var direction=btn.getAttribute("data-direction");' +
          'var ids=getStageIds();' +
          'var idx=ids.indexOf(id);' +
          'if(idx===-1)return;' +
          'var swapIdx=direction==="up"?idx-1:idx+1;' +
          'if(swapIdx<0||swapIdx>=ids.length)return;' +
          'var tmp=ids[idx];ids[idx]=ids[swapIdx];ids[swapIdx]=tmp;' +
          'submitOrder(ids);' +
        '});' +
      '}' +
```

Also add the error element to `bodyContent`'s markup, immediately after the `.sw-journey-stages` closing `</div>` and before the "+ Add stage" button:

```js
      '<span id="sw-stage-reorder-error" class="sw-stage-reorder-error" aria-live="polite"></span>' +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `[ep1-s4-stage-reorder] Task 1+2+4+5 results: 9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep1-s4-stage-reorder.js
git commit -m "feat: wire drag-and-drop and keyboard reorder through a shared submitOrder path"
```

---

## Task 6: AC4 — canvas re-render reflects the new position order

**Files:**
- Test: `tests/check-ep1-s4-stage-reorder.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s4-stage-reorder.js`:

```js
  test('AC4: after a successful reorder, re-querying the canvas renders stage cards in the new position order', function() {
    var pool = makeTransactionalMockPool({
      journeyRow: { id: 'j1', tenant_id: 't1' },
      stageRows: [{ id: 's1', position: 0 }, { id: 's2', position: 1 }, { id: 's3', position: 2 }]
    });
    var reorderReq = { session: { tenantId: 't1' }, params: { id: 'j1' }, body: { stageIds: ['s3', 's1', 's2'], _csrf: 'VALID' } };
    reorderReq._csrfValid = true;
    var reorderRes = mockRes();
    return handlePatchJourneyStagesOrder(reorderReq, reorderRes, null, pool).then(function() {
      // Re-fetch the canvas against a pool reflecting the SAME updated
      // rows, now sorted by position the way the real ORDER BY would.
      var state = pool._state();
      var sortedStages = state.stageRows.slice().sort(function(a, b) { return a.position - b.position; })
        .map(function(r) { return Object.assign({ name: r.id.toUpperCase() }, r); });
      var canvasPool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, sortedStages);
      var canvasReq = { session: { tenantId: 't1' }, params: { id: 'j1' } };
      var canvasRes = mockRes();
      return handleGetJourneyCanvas(canvasReq, canvasRes, null, canvasPool).then(function() {
        var html = canvasRes.body_.bodyContent;
        var idxS3 = html.indexOf('data-stage-id="s3"');
        var idxS1 = html.indexOf('data-stage-id="s1"');
        var idxS2 = html.indexOf('data-stage-id="s2"');
        assert.ok(idxS3 < idxS1 && idxS1 < idxS2, 'expected rendered order s3, s1, s2 (the new position order), got offsets ' + idxS3 + ',' + idxS1 + ',' + idxS2);
      });
    });
  });

  console.log('\n[ep1-s4-stage-reorder] FINAL results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
```

Remove the earlier intermediate `console.log('\n[ep1-s4-stage-reorder] Task 1+2+4+5 results...')`/`if (failed > 0) process.exitCode = 1;` lines from Task 5 — only ONE final summary block should remain at the very end of the IIFE (the one shown above). Each earlier task's "Expected output" in this plan describes the cumulative passed-count *at that point in development*, not a literal separate console.log call left in the final file.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `FAIL` only if the handler or canvas rendering has a bug — given Tasks 1–5's implementation, this should in fact PASS immediately, since `ORDER BY position ASC` is already correct from `ep1-s1`. If it fails, the bug is most likely in this test's own mock wiring (`sortedStages` construction) — double-check before touching source.

- [ ] **Step 3: Write minimal implementation**

No source change expected. If the test fails for a real reason (not a test-wiring bug), the issue is in `handlePatchJourneyStagesOrder`'s position-assignment loop (Task 1) — fix there, not here.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s4-stage-reorder.js
```

Expected output: `[ep1-s4-stage-reorder] FINAL results: 11 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (725 files total, 0 failed — 724 baseline + this new file)

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s4-stage-reorder.js
git commit -m "test: verify canvas re-render reflects new stage position order"
```

---

## Task 7: E2E spec — real drag reorder and failure rollback (written, not executed this session)

**Files:**
- Create: `tests/e2e/ep1-s4-stage-reorder.spec.js`

- [ ] **Step 1: Write the spec (not a failing-test step in the TDD sense — no DATABASE_URL this session, see test plan's own Coverage gaps)**

```js
// ep1-s4-stage-reorder.spec.js — E2E coverage for AC1 (interaction) and AC2
// (interaction) of story
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
//
// NOT in npm test chain (ADR-018, matching ep1-s3-stage-panel-focus-management.spec.js's
// own precedent) -- run with:
//   npx playwright test tests/e2e/ep1-s4-stage-reorder.spec.js
//
// KNOWN GAP (pre-existing, logged in decisions.md D5, not introduced by this
// story): src/web-ui/adapters/fake-test-db.js has no in-memory backing for
// customer_journeys/customer_journey_stages. Requires a real DATABASE_URL.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'ep1-s4-' + label + '-' + Date.now();
}

function extractCsrfToken(html) {
  const hiddenInput = html.match(/name="_csrf" value="([^"]*)"/);
  if (hiddenInput) return hiddenInput[1];
  const jsVar = html.match(/var csrfToken=("(?:[^"\\]|\\.)*")/);
  return jsVar ? JSON.parse(jsVar[1]) : null;
}

/**
 * Manual pointer-sequence drag, mirroring tests/e2e/s3.1-drag-to-advance.spec.js's
 * own documented approach (more reliable for native draggable="true" elements
 * than Playwright's dragTo()).
 */
async function dragAndDrop(page, sourceSelector, targetSelector) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

async function seedJourneyWithStages(request, stageNames) {
  const homeHtml = await (await request.get('/')).text();
  const homeCsrf = extractCsrfToken(homeHtml);
  const journeyRes = await request.post('/journeys', {
    data: { name: uniqueName('journey'), _csrf: homeCsrf },
    headers: { 'Content-Type': 'application/json' },
    maxRedirects: 0
  });
  const journeyId = journeyRes.headers()['location'].split('/journeys/')[1];
  const canvasHtml = await (await request.get('/journeys/' + journeyId)).text();
  const canvasCsrf = extractCsrfToken(canvasHtml);
  for (const name of stageNames) {
    await request.post('/journeys/' + journeyId + '/stages', {
      data: { name: name, _csrf: canvasCsrf },
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return journeyId;
}

withAuth('AC1: dragging a stage card to a new position persists the new order', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, ['Discover', 'Compare', 'Buy']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForLoadState('networkidle');

  const firstCard = page.locator('.sw-stage-card').first();
  const lastCard = page.locator('.sw-stage-card').last();
  await dragAndDrop(page, '.sw-stage-card >> nth=0', '.sw-stage-card >> nth=2');
  await page.waitForTimeout(300);

  await page.reload();
  await page.waitForLoadState('networkidle');
  const namesAfterReload = await page.locator('.sw-stage-name').allTextContents();
  expect(namesAfterReload[0], 'AC1: the dragged stage is no longer first after a real reload').not.toBe('Discover');
});

withAuth('AC2: a reorder whose PATCH fails rolls back visually and shows the exact error text', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, ['Discover', 'Compare']);

  await page.route('**/stages-order', function(route) { route.abort('failed'); });

  await page.goto('/journeys/' + journeyId);
  await page.waitForLoadState('networkidle');

  const namesBefore = await page.locator('.sw-stage-name').allTextContents();
  await dragAndDrop(page, '.sw-stage-card >> nth=0', '.sw-stage-card >> nth=1');
  await page.waitForTimeout(500);

  const namesAfter = await page.locator('.sw-stage-name').allTextContents();
  expect(namesAfter, 'AC2: order reverts to its pre-drag state after a failed save').toEqual(namesBefore);

  const errorEl = page.locator('#sw-stage-reorder-error');
  await expect(errorEl, 'AC2: exact toast text shown on save failure').toHaveText('Stage order not saved — please try again');
});
```

- [ ] **Step 2–4: (not executable this session — no DATABASE_URL)**

```bash
npx playwright test tests/e2e/ep1-s4-stage-reorder.spec.js
```

Expected output when run against a real `DATABASE_URL`: `2 passed`. This session: not run — logged honestly in the test plan's Coverage gaps and `decisions.md` D6, matching `ep1-s3`'s own D5 precedent.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (this spec file is not part of `npm test`'s own chain — confirm it is NOT picked up by `scripts/run-all-tests.js`, matching `ep1-s3-stage-panel-focus-management.spec.js`'s own precedent)

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/ep1-s4-stage-reorder.spec.js
git commit -m "test: add E2E spec for drag reorder and rollback-on-failure (not executed this session)"
```

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep1-s4-verification.md` (Scenarios 1 and 2's "reload" steps and the error-message scenario can be verified live against staging after deploy, same as every prior story this session; Scenario 3's keyboard buttons and the single-stage edge case are directly observable in a real browser without needing a fresh deploy).
