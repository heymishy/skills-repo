# Implementation Plan: Free node positioning persisted across reloads (ic-s2)

**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**DoR:** artefacts/2026-10-10-infinite-canvas/dor/ic-s2-dor.md
**Test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
**Worktree:** `.worktrees/ic-s2` on `feature/ic-s2`

---

## Architecture note

`ic-s1`'s own `handleGetJourneyCanvas` already builds `drawflowNodesScript` from `stages.map(...)`, calling `editor.addNode(name, 1, 1, idx*220, 120, 'sw-drawflow-node', {}, nodeHtml)` and capturing the returned numeric node id into `__icS1NodeIds[stageId]`. This story extends that same generated script in three ways:

1. The SELECT query for stages must return the new `position_x`/`position_y` columns, and `addNode`'s `posx`/`posy` arguments become conditional: use the stored position when both are non-`NULL` (AC1/AC2), otherwise fall back to the existing `idx*220, 120` auto-layout formula unchanged.
2. A reverse lookup `__icS2NodeIdToStageId` (the inverse of `__icS1NodeIds`) is built alongside it, so a `nodeMoved` event (which only gives drawflow's own numeric node id) can be mapped back to the stage's real id for the PATCH request.
3. An `editor.on('nodeMoved', ...)` listener, registered once right after node/connection rendering (inside the existing `if(typeof window.Drawflow==="function")` branch, after `drawflowConnectionsScript` runs), reads the node's final position via `editor.getNodeFromId(id)` (confirmed via `node_modules/drawflow/README.md`: returns `{pos_x, pos_y, ...}`) and calls the **already-existing** `submitJson(url, method, payload)` helper (defined a few lines below the init block, reused as-is) to PATCH the new route.

**Failure toast reuses the existing `#sw-stage-reorder-error` element and its CSS classes verbatim** (`sw-stage-reorder-error`/`sw-stage-reorder-error--visible`, already defined by `ep1-s4`) — it is a sibling of `#sw-journey-stages` in `bodyContent`, not a descendant, so it is **not** hidden by `ic-s1`'s own `.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}` rule and is already visible on every view including Canvas. No new DOM element or CSS rule is needed for AC6 — confirmed by reading the existing `bodyContent` structure in `journeys.js` directly (the span sits between `#sw-journey-stages`'s closing `</div>` and the `+ Add stage` button, both outside the hidden container).

**On success: no DOM mutation beyond drawflow's own already-applied visual move.** Per `web-ui-patterns.md`'s "Client-side DOM patch vs. full page reload" rule (cited explicitly in the DoR): `window.location.reload()` must never be called after a successful position save — the node already visually moved the instant drawflow's own drag completed; only a background PATCH persists it. **On failure:** show the toast. Reverting the node's visual position back to where it was before the failed drag is **not** required by any AC (AC6 only requires the operator sees a visible error, not that the node snaps back) — matching the DoR's own framing of this as "a reload after a failed save must not leave the operator unknowingly believing their drag persisted," which the toast alone satisfies; a reload would re-fetch the stage's last-saved (pre-drag) position anyway, so the inconsistency self-corrects on the operator's next reload rather than needing an immediate visual snap-back. Keep this scope-minimal per the story's own Out of Scope section (no new behaviour beyond what ACs/tests require).

---

## Task 1: Migration — add `position_x`/`position_y` columns, idempotent

**Files:**
- Modify: `scripts/migrate-schema-journeys.js`
- Test: `tests/check-ic-s2-position-persistence.js` (new file, AC4 test, first of 6)

- [ ] **Step 1: Write the failing test**

Create `tests/check-ic-s2-position-persistence.js` with this header and the AC4 migration test (`DATABASE_URL`-gated, SKIPs cleanly when unset — matches `check-ep5-s1-migration.js`'s own established convention exactly, do not deviate):

```javascript
'use strict';
// check-ic-s2-position-persistence.js -- TDD tests for ic-s2 (Epic: canvas-replacement-for-journey-stages,
// 2026-10-10-infinite-canvas). Story: artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
// Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  // -- AC4: migration is idempotent, DATABASE_URL-gated -------------------
  if (!process.env.DATABASE_URL) {
    console.log('  [SKIP] AC4: DATABASE_URL not set -- integration test requires a real Postgres connection');
  } else {
    try {
      const { Client } = require('pg');
      const { migrate } = require('../scripts/migrate-schema-journeys');
      const db = new Client({ connectionString: process.env.DATABASE_URL });
      await db.connect();
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS products (
          product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id VARCHAR NOT NULL,
          name VARCHAR NOT NULL
        )`);
        await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
        await migrate(db);
        // Insert a pre-existing row BEFORE the second run, to prove no backfill happens.
        const jr = await db.query(`INSERT INTO customer_journeys (tenant_id, name) VALUES ('t1','J') RETURNING id`);
        await db.query(`INSERT INTO customer_journey_stages (journey_id, tenant_id, name, position) VALUES ($1,'t1','S1',0)`, [jr.rows[0].id]);
        await migrate(db); // second run -- must not error, must not backfill
        const cols = await db.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'customer_journey_stages' AND column_name IN ('position_x','position_y')`);
        assert.strictEqual(cols.rows.length, 2, 'expected both position_x and position_y columns to exist');
        cols.rows.forEach(function(r) {
          assert.strictEqual(r.is_nullable, 'YES', r.column_name + ' must be nullable');
          assert.strictEqual(r.data_type, 'double precision', r.column_name + ' must be DOUBLE PRECISION');
        });
        const row = await db.query(`SELECT position_x, position_y FROM customer_journey_stages WHERE journey_id = $1`, [jr.rows[0].id]);
        assert.strictEqual(row.rows[0].position_x, null, 'pre-existing row position_x must be NULL, no backfill');
        assert.strictEqual(row.rows[0].position_y, null, 'pre-existing row position_y must be NULL, no backfill');
        await db.query('DROP TABLE IF EXISTS feature_customer_journey_stage_mappings CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journey_stages CASCADE');
        await db.query('DROP TABLE IF EXISTS customer_journeys CASCADE');
        await db.end();
        pass('AC4: migration adds nullable position_x/position_y columns idempotently, no backfill');
      } catch (e) {
        try { await db.end(); } catch (_) {}
        throw e;
      }
    } catch (e) { fail('AC4: migration adds nullable position_x/position_y columns idempotently, no backfill', e); }
  }

  console.log(`\n[ic-s2-position-persistence] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must pass trivially (SKIP, no DATABASE_URL locally)**

```bash
node tests/check-ic-s2-position-persistence.js
```

Expected: `[SKIP] AC4: DATABASE_URL not set...` then `Results: 0 passed, 0 failed`. This is expected to SKIP, not FAIL, locally — matching `ep5-s1`'s own established pattern. Do not treat the SKIP as a reason to not also implement the migration change below; the test exists and is real, it simply cannot execute without a real Postgres instance in this environment.

- [ ] **Step 3: Add the migration**

Open `scripts/migrate-schema-journeys.js`. Immediately after the existing `idx_customer_journey_stages_tenant_id` index creation line (inside the `customer_journey_stages` block, before the `feature_customer_journey_stage_mappings` table), add:

```javascript
  // ic-s2: free node positioning (AC4) -- nullable, no backfill; a NULL
  // position means "use ic-s1's own deterministic auto-layout" (AC2), not
  // an error state. ADD COLUMN IF NOT EXISTS keeps this idempotent,
  // matching every other migration file's own convention.
  await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_x DOUBLE PRECISION`);
  await db.query(`ALTER TABLE customer_journey_stages ADD COLUMN IF NOT EXISTS position_y DOUBLE PRECISION`);
```

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-schema-journeys.js tests/check-ic-s2-position-persistence.js
git commit -m "feat: add nullable position_x/position_y columns to customer_journey_stages (ic-s2 AC4)"
```

---

## Task 2: Position-update route — ownership check, 404-not-403, isolated from other stages

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Modify: `src/web-ui/server.js`
- Test: `tests/check-ic-s2-position-persistence.js` (AC3, AC5 tests)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ic-s2-position-persistence.js`, before the final `console.log`/closing block:

```javascript
  // -- AC3: cross-tenant stage id -> 404, zero mutation ---------------------
  try {
    const calls = [];
    const pool = {
      query: function(sql, params) {
        calls.push({ sql: String(sql).trim(), params: params });
        var s = String(sql).trim();
        if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
          return Promise.resolve({ rows: [] }); // cross-tenant: never matches
        }
        return Promise.resolve({ rows: [] });
      }
    };
    const { handlePatchJourneyStagePosition } = require('../src/web-ui/routes/journeys');
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1', stageId: 's-other-tenant' }, body: { x: 10, y: 20 } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePatchJourneyStagePosition(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404, not 403, for a cross-tenant stage id');
    const updateCalls = calls.filter(function(c) { return /^UPDATE/.test(c.sql); });
    assert.strictEqual(updateCalls.length, 0, 'expected zero UPDATE calls against the mock pool');
    pass('AC3: cross-tenant stage id returns 404 (not 403) and makes no UPDATE call');
  } catch (e) { fail('AC3: cross-tenant stage id returns 404 (not 403) and makes no UPDATE call', e); }

  // -- AC5: updating stage A's position leaves stage B's completely untouched --
  try {
    const updateCalls = [];
    const pool = {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
          return Promise.resolve({ rows: [{ id: 'sA' }] }); // sA belongs to this journey/tenant
        }
        if (/^UPDATE customer_journey_stages/.test(s)) {
          updateCalls.push(params);
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rows: [] });
      }
    };
    const { handlePatchJourneyStagePosition } = require('../src/web-ui/routes/journeys');
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1', stageId: 'sA' }, body: { x: 42, y: 99 } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePatchJourneyStagePosition(req, res, null, pool);
    assert.strictEqual(res._s, 200, 'expected 200 for a valid same-tenant stage id');
    assert.strictEqual(updateCalls.length, 1, 'expected exactly one UPDATE call');
    assert.ok(updateCalls[0].indexOf('sA') !== -1, 'expected the UPDATE to target stage sA only');
    assert.ok(updateCalls[0].indexOf('sB') === -1, 'expected stage sB\'s id to never appear in the UPDATE params -- it must be completely untouched by updating a different stage');
    pass('AC5: updating stage A\'s position makes exactly one UPDATE, targeting only stage A');
  } catch (e) { fail('AC5: updating stage A\'s position makes exactly one UPDATE, targeting only stage A', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ic-s2-position-persistence.js
```

Expected: `TypeError: handlePatchJourneyStagePosition is not a function` (or equivalent).

- [ ] **Step 3: Add the route handler**

Open `src/web-ui/routes/journeys.js`. Find `handleDeleteFeatureMapping` (search for `async function handleDeleteFeatureMapping`) — add this new handler immediately after its closing `}`, mirroring its exact ownership-check-before-mutation pattern (D13):

```javascript
/**
 * PATCH /journeys/:id/stages/:stageId/position — persist a drawflow node's
 * dragged screen position (ic-s2 AC1/AC3/AC5). Dual response mode:
 * res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePatchJourneyStagePosition(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var x = req.body && req.body.x;
  var y = req.body && req.body.y;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
    badRequest('x and y must be finite numbers');
    return;
  }

  // ic-s2 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as handleDeleteFeatureMapping (decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  // Single-statement update, no transaction needed -- matches this file's
  // own convention of only wrapping multi-row writes in BEGIN/COMMIT (D6).
  await pool.query(
    `UPDATE customer_journey_stages SET position_x = $1, position_y = $2, updated_at = NOW() WHERE id = $3`,
    [x, y, stageId]
  );

  if (res.status) { res.status(200).json({ id: stageId, position_x: x, position_y: y }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: stageId, position_x: x, position_y: y })); }
}
```

Update the `module.exports` line at the bottom of `journeys.js` to add `handlePatchJourneyStagePosition`.

- [ ] **Step 4: Wire the route in server.js**

Open `src/web-ui/server.js`. Add `handlePatchJourneyStagePosition` to the existing destructured require of `./routes/journeys` (search for `handlePatchJourneyStagesOrder`). Find the existing `/journeys/:id/stages-order` PATCH route dispatch (search for `stages-order` and `req.method === 'PATCH'`) and add immediately after its block:

```javascript
  } else if (pathname.match(/^\/journeys\/[^/]+\/stages\/[^/]+\/position$/) && req.method === 'PATCH') {
    // ic-s2 -- persist a drawflow node's dragged position (AC1/AC3/AC5).
    req.params = { id: pathname.split('/')[2], stageId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handlePatchJourneyStagePosition(req, res, null, _pshPool); });
```

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-ic-s2-position-persistence.js
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/journeys.js src/web-ui/server.js tests/check-ic-s2-position-persistence.js
git commit -m "feat: PATCH /journeys/:id/stages/:stageId/position route, 404-not-403, single-stage isolation (ic-s2 AC3/AC5)"
```

---

## Task 3: Client — stored-position rendering, drag-to-save, failure toast, E2E spec

**Files:**
- Modify: `src/web-ui/routes/journeys.js` (the `SELECT` for stages, `drawflowNodesScript`, the drawflow init block)
- Test: `tests/check-ic-s2-position-persistence.js` (AC2, AC6 tests)
- New: `tests/e2e/ic-s2-canvas-drag-position.spec.js` (AC1)

- [ ] **Step 1: Write the failing unit tests**

Append to `tests/check-ic-s2-position-persistence.js`, before the final `console.log`/closing block (reuse the exact same `makeCanvasMockPool`/`stageRow`/`makeCanvasMockRes` shape `check-ic-s1-canvas-render.js` already established — do not reinvent; this file does not export them, so redeclare locally, identically):

```javascript
  function stageRow(id, name, position, extra) {
    return Object.assign({ id: id, name: name, position: position, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false, position_x: null, position_y: null }, extra || {});
  }
  function makeCanvasMockPool(journeyRow, stageRows) {
    return {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT id, name, description FROM customer_journeys/.test(s)) {
          var match = journeyRow && journeyRow.id === params[0];
          return Promise.resolve({ rows: match ? [journeyRow] : [] });
        }
        if (/^SELECT id, name, position, description/.test(s)) {
          return Promise.resolve({ rows: stageRows });
        }
        return Promise.resolve({ rows: [] });
      }
    };
  }
  function makeCanvasMockRes() {
    return { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  }

  // -- AC2: NULL position falls back to ic-s1's own auto-layout formula ----
  try {
    const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      stageRow('s1', 'Discover', 0), // position_x/position_y both NULL (default above)
      stageRow('s2', 'Evaluate', 1, { position_x: 500, position_y: 300 }) // has a stored position
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    const s1Call = html.match(/addNode\("s1", 1, 1, ([\d.]+), ([\d.]+),/);
    const s2Call = html.match(/addNode\("s2", 1, 1, ([\d.]+), ([\d.]+),/);
    assert.ok(s1Call, 'expected an addNode call for s1');
    assert.strictEqual(Number(s1Call[1]), 0, 'expected s1 (NULL position, idx=0) to use the auto-layout x formula (idx*220=0)');
    assert.strictEqual(Number(s1Call[2]), 120, 'expected s1 (NULL position) to use the auto-layout y (120)');
    assert.ok(s2Call, 'expected an addNode call for s2');
    assert.strictEqual(Number(s2Call[1]), 500, 'expected s2 (stored position_x=500) to use its OWN stored x, not the auto-layout formula (idx*220=220)');
    assert.strictEqual(Number(s2Call[2]), 300, 'expected s2 (stored position_y=300) to use its own stored y, not the auto-layout 120');
    pass('AC2: a stage with NULL position falls back to ic-s1\'s auto-layout; a stage with a stored position uses it');
  } catch (e) { fail('AC2: a stage with NULL position falls back to ic-s1\'s auto-layout; a stage with a stored position uses it', e); }

  // -- AC6: a failed position-save shows a visible error toast -------------
  try {
    const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeCanvasMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/editor\.on\(["']nodeMoved["']/.test(html), 'expected an editor.on("nodeMoved", ...) listener to be registered');
    assert.ok(/getNodeFromId/.test(html), 'expected the nodeMoved handler to read the node\'s final position via editor.getNodeFromId');
    assert.ok(/\/stages\/["']?\s*\+?\s*\w*\s*\+?\s*["']?\/position/.test(html) || /\/position["']/.test(html), 'expected a PATCH to a .../position URL');
    assert.ok(/reorderError/.test(html), 'expected the save-failure handler to reuse the existing #sw-stage-reorder-error element, not a new one');
    assert.ok(/position not saved/i.test(html), 'expected a position-save-specific failure message, adapted from ep1-s4\'s own "Stage order not saved" convention');
    pass('AC6: nodeMoved handler reads the real position, PATCHes it, and reuses the existing failure-toast element on rejection');
  } catch (e) { fail('AC6: nodeMoved handler reads the real position, PATCHes it, and reuses the existing failure-toast element on rejection', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ic-s2-position-persistence.js
```

Expected: AC2 fails (both stages still use the pure auto-layout formula), AC6 fails (no `nodeMoved` listener exists yet).

- [ ] **Step 3: Extend the stages SELECT query**

Open `src/web-ui/routes/journeys.js`. Find the stages `SELECT` (search for `SELECT id, name, position, description`). Add `position_x, position_y` to the column list:

```javascript
  var sr = await pool.query(
    `SELECT id, name, position, description, customer_actions, touchpoints, channel, emotion, pain_points, opportunities, moment_of_truth, position_x, position_y
     FROM customer_journey_stages WHERE journey_id = $1 ORDER BY position ASC`,
    [journeyId]
  );
```

- [ ] **Step 4: Make node position conditional on stored vs. NULL**

In the same file, find `drawflowNodesScript` (search for `var drawflowNodesScript = 'var __icS1NodeIds={};'`). Replace the hardcoded `(idx * 220), 120` posx/posy arguments with a conditional, and build the reverse node-id-to-stage-id map alongside the existing one:

```javascript
  var drawflowNodesScript = 'var __icS1NodeIds={};var __icS2NodeIdToStageId={};' + stages.map(function(s, idx) {
    var nodeHtml =
      '<div class="sw-stage-name">' + escHtml(s.name) + '</div>' +
      buildHealthIndicator(s.id) +
      (s.moment_of_truth
        ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>'
        : '') +
      '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit stage</a>' +
      '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>';
    // ic-s2 AC1/AC2 -- a stage with a stored position (set by a prior drag)
    // uses it; a stage with NULL position (never dragged) falls back to
    // ic-s1's own unchanged auto-layout formula.
    var hasStoredPosition = typeof s.position_x === 'number' && typeof s.position_y === 'number';
    var posX = hasStoredPosition ? s.position_x : (idx * 220);
    var posY = hasStoredPosition ? s.position_y : 120;
    return '__icS1NodeIds[' + JSON.stringify(s.id) + ']=editor.addNode(' + JSON.stringify(s.id) + ', 1, 1, ' + posX + ', ' + posY + ', ' +
      JSON.stringify('sw-drawflow-node') + ', {}, ' + JSON.stringify(nodeHtml) + ');' +
      '__icS2NodeIdToStageId[__icS1NodeIds[' + JSON.stringify(s.id) + ']]=' + JSON.stringify(s.id) + ';';
  }).join('');
```

- [ ] **Step 5: Add the nodeMoved listener and reuse the existing failure toast**

In the same file, find the drawflow init block (search for `editor.start();`). Add the `nodeMoved` listener immediately after `drawflowConnectionsScript` runs, still inside the `if(typeof window.Drawflow==="function")` branch:

```javascript
          drawflowNodesScript +
          drawflowConnectionsScript +
          // ic-s2 AC1/AC3/AC5/AC6 -- persist a node's final position after
          // a drag. getNodeFromId confirmed against node_modules/drawflow/
          // README.md to return {pos_x, pos_y, ...}. Reuses the EXISTING
          // #sw-stage-reorder-error element verbatim for the failure toast
          // (it is a sibling of #sw-journey-stages in bodyContent, not a
          // descendant, so ic-s1's own canvas-view CSS rule that hides
          // #sw-journey-stages does not hide it -- confirmed by reading
          // bodyContent's own structure directly, not assumed).
          'editor.on("nodeMoved", function(nodeId){' +
            'var node=editor.getNodeFromId(nodeId);' +
            'var stageId=__icS2NodeIdToStageId[nodeId];' +
            'if(!stageId||!node)return;' +
            'submitJson("/journeys/"+journeyId+"/stages/"+stageId+"/position","PATCH",{x:node.pos_x,y:node.pos_y,_csrf:csrfToken})' +
              '.catch(function(){' +
                'var reorderError=document.getElementById("sw-stage-reorder-error");' +
                'if(reorderError){' +
                  'reorderError.textContent="Stage position not saved — please try again";' +
                  'reorderError.classList.add("sw-stage-reorder-error--visible");' +
                  'setTimeout(function(){reorderError.classList.remove("sw-stage-reorder-error--visible");},3000);' +
                '}' +
              '});' +
          '});' +
```

Note: `submitJson` is declared a few lines further down in the same `<script>` IIFE (search for `function submitJson(url,method,payload){`), inside the same closure — it is available by the time `nodeMoved` actually fires (an event callback, not executed synchronously at this point in the script), even though its declaration textually follows this block. `csrfToken` and `journeyId` are both already declared earlier in the same IIFE.

- [ ] **Step 6: Run test — must pass**

```bash
node tests/check-ic-s2-position-persistence.js
```

Expected: `Results: 5 passed, 0 failed` locally (AC4's own test SKIPs without `DATABASE_URL`; AC1's E2E spec, written next, is not part of this file's own count).

- [ ] **Step 7: Write the E2E spec**

Create `tests/e2e/ic-s2-canvas-drag-position.spec.js`, reusing `ep1-s4-stage-reorder.spec.js`'s own `seedJourneyWithStages` helper and `withAuth` fixture pattern exactly (read that file first as the literal template — same CSRF-extraction approach, same `/test/session` seeding, same known-gap header comment convention):

```javascript
// ic-s2-canvas-drag-position.spec.js -- E2E coverage for AC1 of story
// artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
//
// NOT in npm test chain (ADR-018, matching ep1-s3/ep1-s4's own precedent) -- run with:
//   npx playwright test tests/e2e/ic-s2-canvas-drag-position.spec.js
//
// KNOWN GAP (pre-existing, logged in this feature's own decisions.md D5, not
// introduced by this story): src/web-ui/adapters/fake-test-db.js has no
// in-memory backing for customer_journeys/customer_journey_stages (confirmed
// by grep, and by ic-s1's own /definition-of-ready and /definition-of-done
// passes reproducing the same gap). Running this spec against the standard
// local/CI harness (NODE_ENV=test, no DATABASE_URL) will fail the moment it
// tries to create a journey or stage through the real server.js dispatch.
// Running it against a real Postgres instance (DATABASE_URL set) works.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'ic-s2-' + label + '-' + Date.now();
}

function extractCsrfToken(html) {
  const hiddenInput = html.match(/name="_csrf" value="([^"]*)"/);
  if (hiddenInput) return hiddenInput[1];
  const jsVar = html.match(/var csrfToken=("(?:[^"\\]|\\.)*")/);
  return jsVar ? JSON.parse(jsVar[1]) : null;
}

async function seedJourneyWithStages(request, journeyName, stageNames) {
  const homeHtml = await (await request.get('/')).text();
  const homeCsrf = extractCsrfToken(homeHtml);
  expect(homeCsrf, 'the authenticated home page must embed a usable CSRF token').toBeTruthy();

  const journeyRes = await request.post('/journeys', {
    data: { name: journeyName, _csrf: homeCsrf },
    maxRedirects: 0
  });
  const journeyId = journeyRes.headers()['location'].split('/journeys/')[1];
  const canvasHtml = await (await request.get('/journeys/' + journeyId)).text();
  const canvasCsrf = extractCsrfToken(canvasHtml);
  for (const name of stageNames) {
    await request.post('/journeys/' + journeyId + '/stages', { data: { name: name, _csrf: canvasCsrf } });
  }
  return journeyId;
}

withAuth('dragging a canvas node to a new position persists across reload (AC1)', async ({ page, request }) => {
  const journeyId = await seedJourneyWithStages(request, uniqueName('journey'), ['Discover', 'Evaluate']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');

  const node = page.locator('#sw-drawflow-canvas .sw-drawflow-node').first();
  const before = await node.boundingBox();
  expect(before).toBeTruthy();

  // Drag the node to a clearly different position.
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + 300, before.y + 250, { steps: 10 });
  await page.mouse.up();

  // Give the nodeMoved -> PATCH request a moment to complete before reload.
  await page.waitForTimeout(500);

  await page.reload();
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');
  const after = await page.locator('#sw-drawflow-canvas .sw-drawflow-node').first().boundingBox();
  expect(after).toBeTruthy();

  // The reloaded position should be close to where it was dropped, not back
  // at the original auto-layout position.
  const movedX = Math.abs(after.x - before.x);
  expect(movedX).toBeGreaterThan(100);
});
```

- [ ] **Step 8: Run full suite — no regressions**

```bash
npm test
```

Expected: all files passing, especially `tests/check-ic-s1-canvas-render.js` (AC1 of `ic-s1` asserts `idx*220` positions for a fresh mock pool with no `position_x`/`position_y` fields set at all — confirm this still passes: `stageRow()` in that file does not set `position_x`/`position_y`, so they are `undefined`, and `typeof undefined === 'number'` is `false`, so `hasStoredPosition` is correctly `false` and the exact same auto-layout formula applies unchanged).

- [ ] **Step 9: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ic-s2-position-persistence.js tests/e2e/ic-s2-canvas-drag-position.spec.js
git commit -m "feat: persist dragged node positions, fall back to auto-layout when unset (ic-s2 AC1/AC2/AC6)"
```

---

## Final check before opening a PR

- [ ] Run the full suite one more time (`npm test`) and confirm 0 failures
- [ ] **Live browser render check (mandatory per `/verify-completion` — `ic-s1`'s own session found 4 real defects this exact check alone caught, none of which any jsdom test found):** render the real `handleGetJourneyCanvas` output via a mock pool (same technique `ic-s1`'s DoD/verify-completion passes used), load it in a real browser, and directly confirm: (a) a node can actually be dragged and visibly moves, (b) a real `nodeMoved` event fires and a real PATCH request is sent (check Network tab or console), (c) reloading the SAME rendered output with the stage's `position_x`/`position_y` now set to the dragged coordinates shows the node at that position, not the auto-layout one, (d) a stage with `position_x`/`position_y` still `NULL` continues to use the auto-layout formula unchanged, (e) deliberately making the PATCH fail (e.g. block the `/position` route or point it at a 404) shows the reused `#sw-stage-reorder-error` toast with the adapted "Stage position not saved" text. Do NOT skip (c)/(d)/(e) as "already covered by jsdom" — `ic-s1`'s own session proved that assumption wrong four separate times for exactly this category of claim.
- [ ] Switch to Customer experience and Delivery tabs, confirm they render EXACTLY as before — zero regression to the other two views (same check `ic-s1` already established as mandatory for this file).
- [ ] Open a draft PR (never ready for review)
