# Reassign an epic to a different module — Implementation Plan

> **For agent execution:** single-session /tdd, task by task.

**Goal:** Add a `reassignEpic` function to A1's existing `modules-adapter.js` (no new adapter — H-ADAPTER at DoR confirmed A2 reuses A1's `setModulesAdapter`), plus a `PUT /products/:id/epics/:epicId/module` route handler that moves an epic (in this codebase's real schema, a row in the `journeys` table — see decisions.md ARCH entry from A1's `/implementation-plan`) from one module to another within the same product, rejecting cross-product reassignment and treating same-module reassignment as a no-op.

**Branch:** `feature/a2-reassign-epics-between-modules`
**Worktree:** current session worktree (already isolated; branched fresh from `origin/master` after confirming A1/#520 is merged)
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-a2-reassign-epics-between-modules.js` (this story's file)

---

## Ambiguity resolved before coding (recorded in decisions.md)

1. **"Epic" = a `journeys` row.** Per A1's decisions.md ARCH entry, there is no persisted `epics` table in this codebase — epic groupings are computed at sync time from `pipeline-state.json` into `product_rollups.taxonomy`. The only persisted, product-scoped per-feature row is `journeys`, which already has a `module_id` column (added by A1). This story's `:epicId` route param is a `journey_id`.

2. **The "render" integration test targets the persisted store, not `_renderProductView`'s HTML.** The test plan's second integration test says "Components involved: route handler + `_renderProductView` (or its module-grouped successor from A4)". Reading `_renderProductView` directly (`src/web-ui/routes/products.js`, the `taxonomyHtml` block) confirms the current "Epics" section is rendered from `rollupRow.taxonomy` — a JSONB cache computed by `product-rollup.js`'s `computeTaxonomyRollup` directly from `pipeline-state.json` epic slugs. It has zero dependency on `journeys.module_id`. Grouping that visible section by module is explicitly **A4's** scope (not yet built — confirmed epic story list shows A4 still at `definition-of-ready`). Wiring A2's write path into A4's not-yet-built read path is out of scope for A2 and cannot be tested honestly against real code today. Resolution: the "reflects on next load" integration test verifies the real persisted state directly — after a PUT reassignment, the underlying store (`journeys.module_id`) reflects the new module and not the old, which is the actual, real behaviour A4 will later read from. Logged in decisions.md as an ARCH entry.

3. **No new UI control shipped in this story.** The DoR contract's "What will be built" names a "Move to ▾" UI control, but there is nowhere in the current product view to attach it — the visible Epics list is sourced from the pipeline-state.json taxonomy scrape (point 2 above), not from `journeys` rows, so a control wired to `journey_id` would have no corresponding visible row to sit on until A4 ships the module-grouped, journeys-backed rendering. Per the Coding Agent Instructions ("Make every test in the test plan pass. Do not add scope beyond the ACs/tests.") and the test plan itself (Unit/Integration only — no E2E/Manual automated coverage), this plan implements the backend capability (adapter function + route + wiring) that A4's UI will call. Flagged as a PR comment, not silently deferred.

---

## File map

```
Modify:
  src/web-ui/adapters/modules-adapter.js   — add reassignEpic(productId, tenantId, journeyId, moduleId)
  src/web-ui/routes/products.js            — add handlePutEpicModule
  src/web-ui/server.js                     — register PUT /products/:id/epics/:epicId/module route (no new migration — module_id column already exists from A1)

Create:
  tests/check-a2-reassign-epics-between-modules.js  — unit + integration + NFR tests for AC1-AC4
```

---

## Task 1: modules-adapter.js — reassignEpic moves module reference from X to Y (AC1)

**Files:**
- Modify: `src/web-ui/adapters/modules-adapter.js`
- Test: `tests/check-a2-reassign-epics-between-modules.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/check-a2-reassign-epics-between-modules.js (new file, first tests)
var assert = require('assert');
var path = require('path');
var passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');
var modulesAdapter = require(MODULES_ADAPTER_PATH);

function makeFakePool() {
  var moduleRows = []; var journeyRows = []; var seq = 1;
  return {
    _rows: moduleRows,
    _journeys: journeyRows,
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      var p = params || [];
      if (s.indexOf('INSERT INTO PRODUCT_MODULES') === 0) {
        var row = { id: 'mod-' + (seq++), product_id: p[0], tenant_id: p[1], name: p[2], created_at: new Date().toISOString() };
        moduleRows.push(row);
        return { rows: [row] };
      }
      if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE ID = $1 AND PRODUCT_ID = $2 AND TENANT_ID = $3') === 0) {
        var owner = moduleRows.filter(function(r) { return r.id === p[0] && r.product_id === p[1] && r.tenant_id === p[2]; });
        return { rows: owner };
      }
      if (s.indexOf('SELECT JOURNEY_ID, MODULE_ID FROM JOURNEYS WHERE JOURNEY_ID = $1 AND PRODUCT_ID = $2') === 0) {
        var j = journeyRows.filter(function(r) { return r.journey_id === p[0] && r.product_id === p[1]; });
        return { rows: j };
      }
      if (s.indexOf('UPDATE JOURNEYS SET MODULE_ID = $1 WHERE JOURNEY_ID = $2') === 0) {
        var target = journeyRows.find(function(r) { return r.journey_id === p[1]; });
        if (target) { target.module_id = p[0]; }
        return { rows: target ? [{ journey_id: target.journey_id, module_id: target.module_id }] : [] };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  await test('reassignEpic moves an epic\'s module reference from X to Y (AC1)', async function() {
    var pool = makeFakePool();
    modulesAdapter.setModulesAdapter(pool);
    var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
    var modY = await modulesAdapter.createModule('p1', 't1', 'Module Y');
    pool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: modX.id });

    var result = await modulesAdapter.reassignEpic('p1', 't1', 'e1', modY.id);
    assert.strictEqual(result.module_id, modY.id, 'expected the epic\'s module reference to be Y');
    assert.notStrictEqual(result.module_id, modX.id);
    assert.strictEqual(pool._journeys[0].module_id, modY.id, 'underlying journeys row must reflect the new module');
  });

  console.log('\n[a2] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected output: `TypeError: modulesAdapter.reassignEpic is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/adapters/modules-adapter.js`:

```js
/**
 * a2 (AC1-AC4) -- Reassign an epic (a `journeys` row -- see decisions.md ARCH
 * entry, no persisted `epics` table exists in this codebase) from its current
 * module to a different module, within the same product. Rejects a target
 * module that belongs to a different product (AC4). Reassigning to the
 * epic's current module is a no-op (AC3) -- returns immediately with
 * changed:false, no UPDATE issued.
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} journeyId -- the epic being reassigned
 * @param {string} moduleId -- the target module
 * @returns {Promise<{journey_id:string, module_id:string, changed:boolean}>}
 */
async function reassignEpic(productId, tenantId, journeyId, moduleId) {
  var db = _requireAdapter();

  var journeyRows = await db.query(
    'SELECT journey_id, module_id FROM journeys WHERE journey_id = $1 AND product_id = $2',
    [journeyId, productId]
  );
  if (!journeyRows.rows.length) {
    var nf = new Error('Epic not found for this product');
    nf.code = 'EPIC_NOT_FOUND';
    throw nf;
  }

  var moduleRows = await db.query(
    'SELECT id FROM product_modules WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
    [moduleId, productId, tenantId]
  );
  if (!moduleRows.rows.length) {
    var badMod = new Error('Target module does not belong to this product');
    badMod.code = 'MODULE_NOT_FOUND';
    throw badMod;
  }

  if (journeyRows.rows[0].module_id === moduleId) {
    return { journey_id: journeyId, module_id: moduleId, changed: false };
  }

  var r = await db.query(
    'UPDATE journeys SET module_id = $1 WHERE journey_id = $2 RETURNING journey_id, module_id',
    [moduleId, journeyId]
  );
  return Object.assign({ changed: true }, r.rows[0]);
}

module.exports = {
  setModulesAdapter,
  listModules,
  createModule,
  renameModule,
  deleteModule,
  reassignEpic
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected output: `1 passed, 0 failed` (so far)

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the pre-existing baseline (see a1's decisions.md RISK-ACCEPT entry — 37 pre-existing failures unrelated to modules/journeys).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/modules-adapter.js tests/check-a2-reassign-epics-between-modules.js
git commit -m "feat(a2): add modules-adapter reassignEpic moving module references"
```

---

## Task 2: modules-adapter.js — reassignEpic handles the Unassigned starting state (AC2)

**Files:**
- Modify: `tests/check-a2-reassign-epics-between-modules.js` (test only — no new production code)

- [ ] **Step 1: Write the failing test**

```js
await test('reassignEpic moves an unassigned epic (null module) into a real module (AC2)', async function() {
  var pool = makeFakePool();
  modulesAdapter.setModulesAdapter(pool);
  var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
  pool._journeys.push({ journey_id: 'e2', product_id: 'p1', module_id: null });

  var result = await modulesAdapter.reassignEpic('p1', 't1', 'e2', modX.id);
  assert.strictEqual(result.module_id, modX.id, 'expected e2 to now reference Module X');
  assert.strictEqual(pool._journeys[0].module_id, modX.id);
});
```

- [ ] **Step 2: Run test — should already pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected: passes immediately — `reassignEpic`'s null-vs-string comparison (`journeyRows.rows[0].module_id === moduleId`) already handles `null !== 'mod-N'` correctly, taking the UPDATE branch. This test pins that null-starting-state edge case explicitly (per test plan's own "Edge case: Yes — null starting state" note) rather than leaving it implicit.

- [ ] **Step 3: No new implementation needed.**

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-a2-reassign-epics-between-modules.js
git commit -m "test(a2): pin reassignEpic from the Unassigned starting state (AC2)"
```

---

## Task 3: modules-adapter.js — reassignEpic to current module is a no-op (AC3)

**Files:**
- Modify: `tests/check-a2-reassign-epics-between-modules.js` (test only)

- [ ] **Step 1: Write the failing test**

```js
await test('reassignEpic to the epic\'s current module is a no-op (AC3)', async function() {
  var pool = makeFakePool();
  modulesAdapter.setModulesAdapter(pool);
  var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
  pool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: modX.id });

  var result = await modulesAdapter.reassignEpic('p1', 't1', 'e1', modX.id);
  assert.strictEqual(result.changed, false, 'expected a no-op result');
  assert.strictEqual(result.module_id, modX.id);
  assert.strictEqual(pool._journeys[0].module_id, modX.id, 'module reference must be unchanged');
});
```

- [ ] **Step 2: Run test — should already pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected: passes immediately — the no-op short-circuit was written in Task 1. This test pins AC3 explicitly.

- [ ] **Step 3: No new implementation needed.**

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-a2-reassign-epics-between-modules.js
git commit -m "test(a2): pin same-module reassignment as a no-op (AC3)"
```

---

## Task 4: modules-adapter.js — reassignEpic rejects a cross-product module (AC4, unit level)

**Files:**
- Modify: `tests/check-a2-reassign-epics-between-modules.js` (test only)

- [ ] **Step 1: Write the failing test**

```js
await test('reassignEpic rejects a module belonging to a different product (AC4, unit)', async function() {
  var pool = makeFakePool();
  modulesAdapter.setModulesAdapter(pool);
  var modBOther = await modulesAdapter.createModule('p2', 't1', 'Module in product B');
  pool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: null });

  var threw = false;
  try {
    await modulesAdapter.reassignEpic('p1', 't1', 'e1', modBOther.id);
  } catch (e) {
    threw = true;
    assert.strictEqual(e.code, 'MODULE_NOT_FOUND');
  }
  assert.ok(threw, 'expected a rejection for a cross-product module');
  assert.strictEqual(pool._journeys[0].module_id, null, 'epic\'s module reference must be unchanged after a rejected reassignment');
});
```

- [ ] **Step 2: Run test — should already pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected: passes immediately — the module-ownership check in Task 1's implementation already scopes by `product_id`. This test pins AC4 at the adapter/unit level.

- [ ] **Step 3: No new implementation needed.**

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-a2-reassign-epics-between-modules.js
git commit -m "test(a2): pin cross-product module rejection at the adapter level (AC4 unit)"
```

---

## Task 5: products.js route handler — PUT reassign (AC1/AC2/AC3 integration)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a2-reassign-epics-between-modules.js`

- [ ] **Step 1: Write the failing test**

```js
function makeProductsOwnerPool(products) {
  return {
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim();
      if (/SELECT tenant_id FROM products WHERE product_id/i.test(s)) {
        var row = (products || []).find(function(p) { return p.product_id === params[0]; });
        return { rows: row ? [{ tenant_id: row.tenant_id }] : [] };
      }
      return { rows: [] };
    }
  };
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

await test('PUT /products/:id/epics/:epicId/module reassigns and returns 200 (AC1 integration)', async function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var fakePool = makeFakePool();
  modulesAdapter.setModulesAdapter(fakePool);
  var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
  var modY = await modulesAdapter.createModule('p1', 't1', 'Module Y');
  fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: modX.id });
  var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

  var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 't1' }, body: { moduleId: modY.id } };
  var status = null, body = null;
  var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
  await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
  assert.strictEqual(status, 200);
  assert.strictEqual(body.module_id, modY.id);
  assert.strictEqual(body.changed, true);
  assert.strictEqual(fakePool._journeys[0].module_id, modY.id, 'underlying journeys row must reflect the reassignment');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected output: `TypeError: productsRoute.handlePutEpicModule is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/routes/products.js`, near the other module-scoped handlers:

```js
/**
 * a2 (AC1-AC4) -- PUT /products/:id/epics/:epicId/module: reassign an epic
 * (a `journeys` row) to a different module within the same product.
 * Tenant-scoped (404 for a missing/mismatched tenant, matching the
 * FORBIDDEN-vs-NOT_FOUND policy used elsewhere in this file). Rejects an
 * unknown epic or a module belonging to a different product (AC4) with 404
 * and zero rows changed. Reuses A1's modules-adapter.js -- no new adapter
 * (see DoR H-ADAPTER check, decisions.md).
 */
async function handlePutEpicModule(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var epicId = req.params && req.params.epicId;
  var tenantId = req.session && req.session.tenantId;
  var moduleId = (req.body && req.body.moduleId) || '';
  if (typeof moduleId === 'string') { moduleId = moduleId.trim(); }

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!moduleId) {
    if (res.status) { res.status(400).json({ error: 'moduleId is required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'moduleId is required.' })); }
    return;
  }

  var result;
  try {
    result = await _modulesAdapter.reassignEpic(productId, tenantId, epicId, moduleId);
  } catch (err) {
    if (err && (err.code === 'EPIC_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')) {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    throw err;
  }

  _ph.capture(tenantId, 'epic_reassigned', { productId: productId, tenantId: tenantId, epicId: epicId, moduleId: moduleId, changed: result.changed });

  if (res.status) { res.status(200).json({ reassigned: true, journey_id: result.journey_id, module_id: result.module_id, changed: result.changed }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ reassigned: true, journey_id: result.journey_id, module_id: result.module_id, changed: result.changed })); }
}
```

Add `handlePutEpicModule` to the `module.exports` block at the bottom of `products.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a2-reassign-epics-between-modules.js
git commit -m "feat(a2): add PUT /products/:id/epics/:epicId/module route handler"
```

---

## Task 6: products.js route handler — cross-product rejection (AC4 integration + Security NFR)

**Files:**
- Modify: `tests/check-a2-reassign-epics-between-modules.js` (test only)

- [ ] **Step 1: Write the failing test**

```js
await test('PUT /products/:id/epics/:epicId/module rejects a cross-product module (AC4 integration)', async function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var fakePool = makeFakePool();
  modulesAdapter.setModulesAdapter(fakePool);
  var modBOther = await modulesAdapter.createModule('p2', 't1', 'Module in product B');
  fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: null });
  var ownerPool = makeProductsOwnerPool([
    { product_id: 'p1', tenant_id: 't1' },
    { product_id: 'p2', tenant_id: 't1' }
  ]);

  var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 't1' }, body: { moduleId: modBOther.id } };
  var status = null, body = null;
  var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
  await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
  assert.strictEqual(status, 404, 'expected the cross-product reassignment to be rejected');
  assert.strictEqual(fakePool._journeys[0].module_id, null, 'epic\'s module reference must be unchanged');
});

await test('Cross-tenant epic reassignment is rejected (Security NFR)', async function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var fakePool = makeFakePool();
  modulesAdapter.setModulesAdapter(fakePool);
  var modX = await modulesAdapter.createModule('p1', 'tenant-owner', 'Module X');
  fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: null });
  var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 'tenant-owner' }]);

  var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 'tenant-attacker' }, body: { moduleId: modX.id } };
  var status = null;
  var res = { status: function(c) { status = c; return { json: function() {} }; } };
  await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
  assert.strictEqual(status, 404, 'cross-tenant reassignment must be rejected (404, matching this repo\'s FORBIDDEN-vs-NOT_FOUND policy)');
  assert.strictEqual(fakePool._journeys[0].module_id, null, 'zero rows changed for a rejected cross-tenant request');
});
```

- [ ] **Step 2: Run test — should already pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected: both pass immediately — Task 5's handler already does the tenant-ownership check (returns 404 before reaching the adapter) and the adapter's own cross-product check (Task 1) rejects the module. These tests pin both paths explicitly, per CLAUDE.md's mandate for a real cross-tenant isolation test (matching `tests/check-bri-s3.4-cross-tenant-isolation.js` and `tests/check-a1-modules-taxonomy-crud.js`'s own convention), not just a happy path.

- [ ] **Step 3: No new implementation needed.**

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 5: Commit**

```bash
git add tests/check-a2-reassign-epics-between-modules.js
git commit -m "test(a2): pin cross-product (AC4) and cross-tenant reassignment rejection"
```

---

## Task 7: wire server.js — register the route (D37-adjacent production wiring)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-a2-reassign-epics-between-modules.js` (grep-based wiring assertions, matching `check-a1-modules-taxonomy-crud.js`'s own convention)

- [ ] **Step 1: Write the failing test**

```js
await test('server.js registers handlePutEpicModule and the PUT epics/:epicId/module route', function() {
  var fs = require('fs');
  var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(/handlePutEpicModule/.test(src), 'expected server.js to reference handlePutEpicModule');
  assert.ok(/epics\\\/\[\^\/\]\+\\\/module|epics\/\[\^\/\]\+\/module/.test(src) || /epics.*module/.test(src), 'expected server.js to route PUT .../epics/:epicId/module');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected output: assertion fails (`handlePutEpicModule` not yet referenced in `server.js`).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`:

1. Add `handlePutEpicModule` to the existing destructured require of `./routes/products` (the line that already imports `handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule`):

```js
const { /* ...existing names..., */ handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule, handlePutEpicModule } = require('./routes/products'); // ...existing comment tags..., a1, a2
```

2. Register the route in the request router, alongside the existing `/products/:id/modules...` block:

```js
} else if (pathname.match(/^\/products\/[^/]+\/epics\/[^/]+\/module$/) && req.method === 'PUT') {
  // a2 -- reassign an epic (journey) to a different module within the same product
  req.params = { id: pathname.split('/')[2], epicId: pathname.split('/')[4] };
  authGuard(req, res, async () => { await handlePutEpicModule(req, res, null, _pshPool, null); });

```

No new table/column migration is needed — `journeys.module_id` was already added by A1's migration.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-a2-reassign-epics-between-modules.js
git commit -m "feat(a2): wire PUT /products/:id/epics/:epicId/module route in server.js"
```

---

## Task 8: Performance NFR + decisions.md entries + final full-suite verification

**Files:**
- Modify: `tests/check-a2-reassign-epics-between-modules.js`
- Modify: `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md`

- [ ] **Step 1: Write the failing test**

```js
await test('Epic reassignment completes within budget (Performance NFR, <200ms)', async function() {
  var pool = makeFakePool();
  modulesAdapter.setModulesAdapter(pool);
  var modX = await modulesAdapter.createModule('perf-p', 't1', 'Module X');
  var modY = await modulesAdapter.createModule('perf-p', 't1', 'Module Y');
  pool._journeys.push({ journey_id: 'perf-e1', product_id: 'perf-p', module_id: modX.id });

  var start = Date.now();
  await modulesAdapter.reassignEpic('perf-p', 't1', 'perf-e1', modY.id);
  var elapsed = Date.now() - start;
  assert.ok(elapsed < 200, 'expected reassignment under 200ms, took ' + elapsed + 'ms');
});
```

- [ ] **Step 2: Run test — should already pass** (pinning an NFR over already-implemented code, not new behaviour)

```bash
node tests/check-a2-reassign-epics-between-modules.js
```

Expected output: all tests in the file passing, e.g. `[a2] Results: 9 passed, 0 failed`

- [ ] **Step 3: Append decisions.md entries**

Append two entries to `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md`:
1. ARCH — confirming `:epicId` = `journey_id`, no new table/column needed (A1 already added `journeys.module_id`).
2. ARCH — the "reflects on next load" integration test verifies the persisted `journeys.module_id` store directly rather than `_renderProductView`'s HTML, because the current Epics section renders from a `pipeline-state.json` taxonomy scrape with no dependency on `journeys.module_id` — module-grouped rendering of that section is A4's explicit, not-yet-built scope. Also note that no UI control ships in this story for the same reason (nothing to attach it to yet), flagged as a PR comment.

- [ ] **Step 4: Run full suite — final check**

```bash
node scripts/run-all-tests.js
```

Expected output: 0 new failures vs the a1-established baseline (37 pre-existing, unrelated failures).

- [ ] **Step 5: Commit**

```bash
git add tests/check-a2-reassign-epics-between-modules.js artefacts/2026-07-21-web-ui-experience-redesign/decisions.md
git commit -m "test(a2): pin performance NFR; log ARCH decisions for epic/journey mapping and render-test scope"
```

- [ ] Proceed to `/verify-completion`.
