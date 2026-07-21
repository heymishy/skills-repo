# Curate a Modules taxonomy for a product — Implementation Plan

> **For agent execution:** single-session /tdd, task by task.

**Goal:** Add a curated, per-product Modules taxonomy with full CRUD (create/rename/delete-with-reassignment-to-Unassigned), backed by a new `product_modules` Postgres table and a new D37 injectable adapter (`setModulesAdapter`).
**Branch:** `feature/a1-modules-taxonomy-crud`
**Worktree:** current session worktree (already isolated; no nested `git worktree add`)
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-a1-modules-taxonomy-crud.js` (this story's file)

---

## Ambiguity resolved before coding (recorded in decisions.md)

The DoR contract names `product_modules (id, product_id, tenant_id, name, created_at)` as the only new table, but also says "a new `modules` foreign key column on the existing epic-taxonomy representation" and AC3/the test plan require that "epics assigned to [a deleted module] are reassigned to Unassigned" via an UPDATE call. There is no persisted `epics` table in this codebase — epic groupings are computed at sync time from `pipeline-state.json` into the `product_rollups.taxonomy` JSONB cache (see `product-rollup.js`). The only persisted, product-scoped per-feature row is `journeys`. Resolution: add a nullable `module_id` column to the existing `journeys` table (`ON DELETE SET NULL`), and treat "epic assigned to a module" as "journey/feature assigned to a module" for storage purposes. This is the concrete table A2 (reassign epics between modules) will write to. Logged in `decisions.md` as an ARCH entry.

The DoR contract's "What will be built" section lists only POST/PUT/DELETE routes, but AC1 ("appears in the product's module list on next page load") and the test plan's own AC1 integration test ("POST ... then GET the module list again") require a GET endpoint. Per CLAUDE.md's B1/D1 rule ("when the contract and test plan conflict, the contract is the authoring defect"), a `GET /products/:id/modules` handler is added. Logged in `decisions.md`.

---

## File map

```
Create:
  src/web-ui/adapters/modules-adapter.js   — D37 adapter: setModulesAdapter + listModules/createModule/renameModule/deleteModule
  tests/check-a1-modules-taxonomy-crud.js  — unit + integration + NFR tests for AC1-AC6

Modify:
  src/web-ui/routes/products.js  — add handleGetProductModules / handlePostProductModule / handlePutProductModule / handleDeleteProductModule
  src/web-ui/server.js           — product_modules + journeys.module_id migrations; wire setModulesAdapter(_creditsPool); register the 4 new routes
```

---

## Task 1: modules-adapter.js — create + duplicate rejection (AC1, AC4)

**Files:**
- Create: `src/web-ui/adapters/modules-adapter.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/check-a1-modules-taxonomy-crud.js (new file, first tests)
var assert = require('assert');
var passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS]', name); },
    function(err) { failed++; console.log('  [FAIL]', name, '--', err && err.message || err); }
  );
}

var modulesAdapter = require('../src/web-ui/adapters/modules-adapter');

function makeFakeModulesPool() {
  var rows = []; var seq = 1;
  return {
    _rows: rows,
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      var p = params || [];
      if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE PRODUCT_ID = $1 AND TENANT_ID = $2 AND NAME = $3') === 0) {
        var dup = rows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1] && r.name === p[2]; });
        return { rows: dup };
      }
      if (s.indexOf('INSERT INTO PRODUCT_MODULES') === 0) {
        var row = { id: 'mod-' + (seq++), product_id: p[0], tenant_id: p[1], name: p[2], created_at: new Date().toISOString() };
        rows.push(row);
        return { rows: [row] };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  await test('createModule succeeds for a genuinely new name (AC1)', async function() {
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());
    var m = await modulesAdapter.createModule('p1', 't1', 'Governance & Gate Enforcement');
    assert.ok(m.id, 'expected a generated id');
    assert.strictEqual(m.name, 'Governance & Gate Enforcement');
  });

  await test('createModule rejects a duplicate name within the same product (AC4)', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    await modulesAdapter.createModule('p1', 't1', 'Governance');
    var threw = false;
    try { await modulesAdapter.createModule('p1', 't1', 'Governance'); }
    catch (e) { threw = true; assert.strictEqual(e.code, 'DUPLICATE_MODULE'); }
    assert.ok(threw, 'expected a rejection for a duplicate name');
    assert.strictEqual(pool._rows.filter(function(r) { return r.name === 'Governance'; }).length, 1, 'no second module record created');
  });

  console.log('\n[a1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `Cannot find module '../src/web-ui/adapters/modules-adapter'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/web-ui/adapters/modules-adapter.js
'use strict';

// a1 (D37): injectable Postgres adapter for the new product_modules table.
// Stub default throws -- never returns null/empty (CLAUDE.md D37 rule 1).
var _modulesDb = null;

function setModulesAdapter(pool) {
  _modulesDb = pool;
}

function _requireAdapter() {
  if (!_modulesDb) {
    throw new Error('Adapter not wired: modulesDb. Call setModulesAdapter() before use.');
  }
  return _modulesDb;
}

async function listModules(productId, tenantId) {
  var db = _requireAdapter();
  var r = await db.query(
    'SELECT id, name, created_at FROM product_modules WHERE product_id = $1 AND tenant_id = $2 ORDER BY created_at ASC',
    [productId, tenantId]
  );
  return r.rows;
}

async function createModule(productId, tenantId, name) {
  var db = _requireAdapter();
  var dup = await db.query(
    'SELECT id FROM product_modules WHERE product_id = $1 AND tenant_id = $2 AND name = $3',
    [productId, tenantId, name]
  );
  if (dup.rows.length > 0) {
    var err = new Error('A module named "' + name + '" already exists for this product.');
    err.code = 'DUPLICATE_MODULE';
    throw err;
  }
  var r = await db.query(
    'INSERT INTO product_modules (product_id, tenant_id, name) VALUES ($1, $2, $3) RETURNING id, name, created_at',
    [productId, tenantId, name]
  );
  return r.rows[0];
}

module.exports = { setModulesAdapter, listModules, createModule };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `2 passed, 0 failed` (so far)

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the pre-existing baseline count.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/modules-adapter.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): add modules-adapter createModule with duplicate-name rejection"
```

---

## Task 2: modules-adapter.js — renameModule preserves id (AC2)

**Files:**
- Modify: `src/web-ui/adapters/modules-adapter.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
await test('renameModule updates the name without creating a new record (AC2)', async function() {
  var pool = makeFakeModulesPool();
  modulesAdapter.setModulesAdapter(pool);
  var created = await modulesAdapter.createModule('p1', 't1', 'Old Name');
  var renamed = await modulesAdapter.renameModule('p1', 't1', created.id, 'New Name');
  assert.strictEqual(renamed.id, created.id, 'id must not change on rename');
  assert.strictEqual(renamed.name, 'New Name');
  assert.strictEqual(pool._rows.length, 1, 'rename must not create a second record');
});
```

Extend `makeFakeModulesPool` with the two extra branches renameModule needs:
```js
if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE ID = $1 AND PRODUCT_ID = $2 AND TENANT_ID = $3') === 0) {
  var owner = rows.filter(function(r) { return r.id === p[0] && r.product_id === p[1] && r.tenant_id === p[2]; });
  return { rows: owner };
}
if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE PRODUCT_ID = $1 AND TENANT_ID = $2 AND NAME = $3 AND ID !=') === 0) {
  var dupExcl = rows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1] && r.name === p[2] && r.id !== p[3]; });
  return { rows: dupExcl };
}
if (s.indexOf('UPDATE PRODUCT_MODULES SET NAME = $1 WHERE ID = $2') === 0) {
  var target = rows.find(function(r) { return r.id === p[1]; });
  if (target) { target.name = p[0]; }
  return { rows: target ? [target] : [] };
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `TypeError: modulesAdapter.renameModule is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
async function renameModule(productId, tenantId, moduleId, newName) {
  var db = _requireAdapter();
  var owner = await db.query(
    'SELECT id FROM product_modules WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
    [moduleId, productId, tenantId]
  );
  if (!owner.rows.length) {
    var nf = new Error('Module not found');
    nf.code = 'NOT_FOUND';
    throw nf;
  }
  var dup = await db.query(
    'SELECT id FROM product_modules WHERE product_id = $1 AND tenant_id = $2 AND name = $3 AND id != $4',
    [productId, tenantId, newName, moduleId]
  );
  if (dup.rows.length > 0) {
    var err = new Error('A module named "' + newName + '" already exists for this product.');
    err.code = 'DUPLICATE_MODULE';
    throw err;
  }
  var r = await db.query(
    'UPDATE product_modules SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
    [newName, moduleId]
  );
  return r.rows[0];
}

module.exports = { setModulesAdapter, listModules, createModule, renameModule };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/modules-adapter.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): add modules-adapter renameModule preserving module id"
```

---

## Task 3: modules-adapter.js — deleteModule reassigns journeys to Unassigned (AC3)

**Files:**
- Modify: `src/web-ui/adapters/modules-adapter.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
await test('deleteModule reassigns referencing journeys to Unassigned and removes the module (AC3)', async function() {
  var pool = makeFakeModulesPool();
  // seed two journeys referencing the module we're about to create+delete
  pool._journeys = [
    { journey_id: 'j1', product_id: 'p1', module_id: null },
    { journey_id: 'j2', product_id: 'p1', module_id: null }
  ];
  modulesAdapter.setModulesAdapter(pool);
  var created = await modulesAdapter.createModule('p1', 't1', 'Temp Module');
  pool._journeys.forEach(function(j) { j.module_id = created.id; });
  await modulesAdapter.deleteModule('p1', 't1', created.id);
  assert.strictEqual(pool._rows.length, 0, 'module record must be removed');
  pool._journeys.forEach(function(j) {
    assert.strictEqual(j.module_id, null, 'every journey previously assigned must be reassigned to Unassigned (null)');
  });
});
```

Extend `makeFakeModulesPool` with:
```js
if (s.indexOf('UPDATE JOURNEYS SET MODULE_ID = NULL WHERE MODULE_ID = $1') === 0) {
  (this._journeys || []).forEach(function(j) { if (j.module_id === p[0]) { j.module_id = null; } });
  return { rows: [] };
}
if (s.indexOf('DELETE FROM PRODUCT_MODULES WHERE ID = $1') === 0) {
  var idx = rows.findIndex(function(r) { return r.id === p[0]; });
  if (idx !== -1) { rows.splice(idx, 1); }
  return { rows: [] };
}
```
(Note: `this` inside the object literal's `query` function refers to the pool object itself when called as `pool.query(...)`, matching the other fake pools' style in this repo — if any call site invokes it detached, bind explicitly.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `TypeError: modulesAdapter.deleteModule is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
async function deleteModule(productId, tenantId, moduleId) {
  var db = _requireAdapter();
  var owner = await db.query(
    'SELECT id FROM product_modules WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
    [moduleId, productId, tenantId]
  );
  if (!owner.rows.length) {
    var nf = new Error('Module not found');
    nf.code = 'NOT_FOUND';
    throw nf;
  }
  // AC3: explicit UPDATE, not reliance on ON DELETE SET NULL alone, so the
  // reassignment is directly assertable (matches handleDeleteProduct's own
  // "explicit DELETEs, not cascade-reliance-alone" convention in products.js).
  await db.query('UPDATE journeys SET module_id = NULL WHERE module_id = $1', [moduleId]);
  await db.query('DELETE FROM product_modules WHERE id = $1', [moduleId]);
  return { id: moduleId };
}

module.exports = { setModulesAdapter, listModules, createModule, renameModule, deleteModule };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/modules-adapter.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): add modules-adapter deleteModule with Unassigned reassignment"
```

---

## Task 4: products.js route handlers — POST create + GET list (AC1 integration)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
var productsRoute; // re-required fresh per integration block below

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

await test('POST /products/:id/modules persists a module and it appears in the next GET (AC1)', async function() {
  delete require.cache[require.resolve('../src/web-ui/routes/products.js')];
  productsRoute = require('../src/web-ui/routes/products.js');
  var fakePool = makeFakeModulesPool();
  modulesAdapter.setModulesAdapter(fakePool);
  var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

  var req1 = { params: { id: 'p1' }, session: { tenantId: 't1' }, body: { name: 'Governance & Gate Enforcement' } };
  var status1 = null, body1 = null;
  var res1 = { status: function(c) { status1 = c; return { json: function(b) { body1 = b; } }; } };
  await productsRoute.handlePostProductModule(req1, res1, null, ownerPool);
  assert.strictEqual(status1, 201);
  assert.ok(body1 && body1.module && body1.module.id, 'expected the created module in the response');

  var req2 = { params: { id: 'p1' }, session: { tenantId: 't1' } };
  var body2 = null;
  var res2 = { status: function() { return { json: function(b) { body2 = b; } }; }, json: function(b) { body2 = b; } };
  await productsRoute.handleGetProductModules(req2, res2, null, ownerPool);
  assert.ok(body2.modules.some(function(m) { return m.name === 'Governance & Gate Enforcement'; }), 'expected the created module in the next GET');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `TypeError: productsRoute.handlePostProductModule is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/routes/products.js` (near the other product-scoped handlers), plus the require at the top of the file:

```js
var _modulesAdapter = require('../adapters/modules-adapter'); // a1

async function handleGetProductModules(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  var modules = await _modulesAdapter.listModules(productId, tenantId);
  if (res.status) { res.status(200).json({ modules: modules }); }
  else if (res.json) { res.json({ modules: modules }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ modules: modules })); }
}

async function handlePostProductModule(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var name = ((req.body && req.body.name) || '').trim();

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!name) {
    if (res.status) { res.status(400).json({ error: 'Module name is required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Module name is required.' })); }
    return;
  }

  var moduleRow;
  try {
    moduleRow = await _modulesAdapter.createModule(productId, tenantId, name);
  } catch (err) {
    if (err && err.code === 'DUPLICATE_MODULE') {
      if (res.status) { res.status(409).json({ error: err.message }); }
      else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
      return;
    }
    throw err;
  }

  _ph.capture(tenantId, 'module_created', { productId: productId, tenantId: tenantId, moduleId: moduleRow.id });

  if (res.status) { res.status(201).json({ module: moduleRow }); }
  else { res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ module: moduleRow })); }
}
```

Add both to the `module.exports` block at the bottom of `products.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): add GET/POST /products/:id/modules route handlers"
```

---

## Task 5: products.js route handler — PUT rename (AC2 integration)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
await test('PUT /products/:id/modules/:moduleId renames and preserves epic/journey assignment references (AC2 integration)', async function() {
  delete require.cache[require.resolve('../src/web-ui/routes/products.js')];
  productsRoute = require('../src/web-ui/routes/products.js');
  var fakePool = makeFakeModulesPool();
  modulesAdapter.setModulesAdapter(fakePool);
  var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
  var created = await modulesAdapter.createModule('p1', 't1', 'Old Name');

  var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 't1' }, body: { name: 'New Name' } };
  var status = null, body = null;
  var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
  await productsRoute.handlePutProductModule(req, res, null, ownerPool);
  assert.strictEqual(status, 200);
  assert.strictEqual(body.module.id, created.id, 'module id must be unchanged after rename');
  assert.strictEqual(body.module.name, 'New Name');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `TypeError: productsRoute.handlePutProductModule is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
async function handlePutProductModule(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var productId = req.params && req.params.id;
  var moduleId = req.params && req.params.moduleId;
  var tenantId = req.session && req.session.tenantId;
  var name = ((req.body && req.body.name) || '').trim();

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!name) {
    if (res.status) { res.status(400).json({ error: 'Module name is required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Module name is required.' })); }
    return;
  }

  var moduleRow;
  try {
    moduleRow = await _modulesAdapter.renameModule(productId, tenantId, moduleId, name);
  } catch (err) {
    if (err && err.code === 'NOT_FOUND') {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    if (err && err.code === 'DUPLICATE_MODULE') {
      if (res.status) { res.status(409).json({ error: err.message }); }
      else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
      return;
    }
    throw err;
  }

  if (res.status) { res.status(200).json({ module: moduleRow }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ module: moduleRow })); }
}
```

Add to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): add PUT /products/:id/modules/:moduleId rename handler"
```

---

## Task 6: products.js route handler — DELETE with reassignment (AC3 integration)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
await test('DELETE /products/:id/modules/:moduleId reassigns its journeys/epics to Unassigned (AC3 integration)', async function() {
  delete require.cache[require.resolve('../src/web-ui/routes/products.js')];
  productsRoute = require('../src/web-ui/routes/products.js');
  var fakePool = makeFakeModulesPool();
  fakePool._journeys = [{ journey_id: 'j1', product_id: 'p1', module_id: null }];
  modulesAdapter.setModulesAdapter(fakePool);
  var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
  var created = await modulesAdapter.createModule('p1', 't1', 'Temp');
  fakePool._journeys[0].module_id = created.id;

  var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 't1' } };
  var status = null, body = null;
  var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
  await productsRoute.handleDeleteProductModule(req, res, null, ownerPool);
  assert.strictEqual(status, 200);
  assert.strictEqual(body.deleted, true);
  assert.strictEqual(fakePool._journeys[0].module_id, null, 'journey/epic must be reassigned to Unassigned, not dropped');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: `TypeError: productsRoute.handleDeleteProductModule is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
async function handleDeleteProductModule(req, res, _next, pool, posthog) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var moduleId = req.params && req.params.moduleId;
  var tenantId = req.session && req.session.tenantId;

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  try {
    await _modulesAdapter.deleteModule(productId, tenantId, moduleId);
  } catch (err) {
    if (err && err.code === 'NOT_FOUND') {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    throw err;
  }

  if (res.status) { res.status(200).json({ deleted: true, module_id: moduleId }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ deleted: true, module_id: moduleId })); }
}
```

Add to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): add DELETE /products/:id/modules/:moduleId handler with reassignment"
```

---

## Task 7: per-product scoping integration test (AC5)

**Files:**
- Test only: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
await test('Module list for product B never includes product A modules (AC5)', async function() {
  delete require.cache[require.resolve('../src/web-ui/routes/products.js')];
  productsRoute = require('../src/web-ui/routes/products.js');
  var fakePool = makeFakeModulesPool();
  modulesAdapter.setModulesAdapter(fakePool);
  var ownerPool = makeProductsOwnerPool([
    { product_id: 'p1', tenant_id: 't1' },
    { product_id: 'p2', tenant_id: 't1' }
  ]);
  await modulesAdapter.createModule('p1', 't1', 'Governance');
  await modulesAdapter.createModule('p1', 't1', 'Billing');

  var req = { params: { id: 'p2' }, session: { tenantId: 't1' } };
  var body = null;
  var res = { status: function() { return { json: function(b) { body = b; } }; }, json: function(b) { body = b; } };
  await productsRoute.handleGetProductModules(req, res, null, ownerPool);
  assert.strictEqual(body.modules.length, 0, 'product B must see zero of product A\'s modules');
});
```

This test should already pass once Task 4 is implemented (it exercises no new production code — it is a scoping regression guard). If it fails, the WHERE clause in `listModules` (Task 1) is missing the `product_id` filter — fix `modules-adapter.js`, not the test.

- [ ] **Step 2: Run test**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected: passes immediately (regression guard, not new behaviour).

- [ ] **Step 3: Commit**

```bash
git add tests/check-a1-modules-taxonomy-crud.js
git commit -m "test(a1): pin per-product module-list scoping (AC5)"
```

---

## Task 8: wire server.js — migrations, adapter, and routes (D37 production wiring — separate task per D37 rule 3)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-a1-modules-taxonomy-crud.js` (grep-based wiring assertions, matching `check-pr-s2-products-route.js`'s own convention)

- [ ] **Step 1: Write the failing test**

```js
await test('server.js wires setModulesAdapter to the shared Postgres pool (D37 production wiring)', function() {
  var fs = require('fs');
  var src = fs.readFileSync(require('path').resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
  assert.ok(/setModulesAdapter\(/.test(src), 'expected server.js to call setModulesAdapter(...)');
  assert.ok(/product_modules/.test(src), 'expected server.js to create the product_modules table');
  assert.ok(/journeys ADD COLUMN IF NOT EXISTS module_id/.test(src), 'expected server.js to add journeys.module_id');
});

await test('server.js registers the 4 module route handlers', function() {
  var fs = require('fs');
  var src = fs.readFileSync(require('path').resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
  ['handleGetProductModules', 'handlePostProductModule', 'handlePutProductModule', 'handleDeleteProductModule'].forEach(function(name) {
    assert.ok(new RegExp(name).test(src), 'expected server.js to reference ' + name);
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: both assertions fail (server.js has no reference yet).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`:

1. Add to the destructured require of `./routes/products` (existing line ~53):
```js
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handlePostProductSync, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handleDeleteProduct, handlePostProductRepoCreate, handlePutProductEdit, handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule } = require('./routes/products');
```

2. Add near the other adapter imports (top of file):
```js
const { setModulesAdapter } = require('./adapters/modules-adapter'); // a1
```

3. Inside the `if (process.env.DATABASE_URL) { ... }` block, alongside the other `_creditsPool` table migrations (after the `journeys.product_id` migration, psh-s1):
```js
// a1: product_modules table -- curated per-product Modules taxonomy
_creditsPool.query(`CREATE TABLE IF NOT EXISTS product_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  tenant_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`).then(function() {
  console.log('[a1] product_modules table ready');
}).catch(function(err) {
  console.error('[a1] product_modules migration failed:', err.message);
});

// a1: journeys.module_id -- the storage layer A2 (reassign epics between
// modules) writes to. NULL = "Unassigned". ON DELETE SET NULL is a DB-level
// safety net; the DELETE handler also issues an explicit UPDATE first (see
// modules-adapter.js deleteModule) so the reassignment is directly
// assertable, not solely reliant on cascade behaviour.
_creditsPool.query(`ALTER TABLE journeys ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES product_modules(id) ON DELETE SET NULL`).then(function() {
  console.log('[a1] journeys.module_id column ready');
}).catch(function(err) {
  console.error('[a1] journeys.module_id migration failed:', err.message);
});

// a1 D37 wiring: wire the real Postgres modules adapter (same _creditsPool
// already wired for products/credits above -- a genuinely new data-access
// layer for a genuinely new table, not an existing adapter repurposed).
setModulesAdapter(_creditsPool);
console.log('[a1] modules adapter wired');
```

4. Register the 4 routes in the request router (find the existing `/products/:id` style route-matching block used for `handlePostProductRepoCreate`/`handlePutProductEdit` etc., and add matching entries for:
   - `GET /products/:id/modules` → `handleGetProductModules`
   - `POST /products/:id/modules` → `handlePostProductModule`
   - `PUT /products/:id/modules/:moduleId` → `handlePutProductModule`
   - `DELETE /products/:id/modules/:moduleId` → `handleDeleteProductModule`

   Follow the exact existing route-matching pattern already used for the sibling `/products/:id/...` routes in this file (regex + method check) — do not introduce a new routing mechanism.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-a1-modules-taxonomy-crud.js
git commit -m "feat(a1): wire product_modules migrations, D37 adapter, and routes in server.js"
```

---

## Task 9: D37 wiring behavioural-correctness test (AC6) + cross-tenant security NFR + performance NFR

**Files:**
- Test only: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Write the failing test**

```js
await test('setModulesAdapter wiring resolves two different products to two different, correct results (AC6, D37 wiring)', async function() {
  // A stateful fake pool implementing the REAL product_modules query shapes
  // (not a canned/request-shaped mock) -- this exercises the ACTUAL
  // createModule/listModules functions end-to-end, proving the wiring is
  // behaviourally correct, not merely that a function reference was
  // assigned. Matches this repo's own tir-s1 wiring-test convention.
  var pool = makeFakeModulesPool();
  modulesAdapter.setModulesAdapter(pool);

  await modulesAdapter.createModule('prod-a', 't1', 'Governance');
  await modulesAdapter.createModule('prod-a', 't1', 'Billing');
  await modulesAdapter.createModule('prod-b', 't1', 'Onboarding');

  var modulesA = (await modulesAdapter.listModules('prod-a', 't1')).map(function(m) { return m.name; }).sort();
  var modulesB = (await modulesAdapter.listModules('prod-b', 't1')).map(function(m) { return m.name; }).sort();

  assert.deepStrictEqual(modulesA, ['Billing', 'Governance'], 'product A must resolve to exactly its own two modules');
  assert.deepStrictEqual(modulesB, ['Onboarding'], 'product B must resolve to exactly its own one module');
  assert.notDeepStrictEqual(modulesA, modulesB, 'the two products must resolve to genuinely different result sets');
});

await test('Cross-tenant module create/rename/delete is rejected (Security NFR)', async function() {
  delete require.cache[require.resolve('../src/web-ui/routes/products.js')];
  productsRoute = require('../src/web-ui/routes/products.js');
  var fakePool = makeFakeModulesPool();
  modulesAdapter.setModulesAdapter(fakePool);
  var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 'tenant-owner' }]);

  var req = { params: { id: 'p1' }, session: { tenantId: 'tenant-attacker' }, body: { name: 'Injected' } };
  var status = null;
  var res = { status: function(c) { status = c; return { json: function() {} }; } };
  await productsRoute.handlePostProductModule(req, res, null, ownerPool);
  assert.strictEqual(status, 404, 'cross-tenant module create must be rejected (404, not 403 -- FORBIDDEN-vs-NOT_FOUND policy)');
  assert.strictEqual(fakePool._rows.length, 0, 'zero rows must be created for a rejected cross-tenant request');
});

await test('Module CRUD completes within budget for a large product (Performance NFR, <500ms for 200 epics)', async function() {
  var pool = makeFakeModulesPool();
  pool._journeys = [];
  for (var i = 0; i < 200; i++) { pool._journeys.push({ journey_id: 'j' + i, product_id: 'perf-p', module_id: null }); }
  modulesAdapter.setModulesAdapter(pool);
  var start = Date.now();
  var created = await modulesAdapter.createModule('perf-p', 't1', 'Perf Module');
  await modulesAdapter.renameModule('perf-p', 't1', created.id, 'Perf Module Renamed');
  pool._journeys.forEach(function(j) { j.module_id = created.id; });
  await modulesAdapter.deleteModule('perf-p', 't1', created.id);
  var elapsed = Date.now() - start;
  assert.ok(elapsed < 500, 'expected create+rename+delete cycle under 500ms, took ' + elapsed + 'ms');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: fails only if any earlier task's implementation is incomplete/incorrect — at this point in the plan all three should pass immediately since they exercise already-implemented functions. If AC6's test fails, re-check `listModules`'s WHERE clause; if the security NFR test fails, re-check the ownership 404 check in `handlePostProductModule`.

- [ ] **Step 3: No new implementation needed** — these are pinning/regression tests over Tasks 1–6's real implementation, per the D37 rule that the wiring test must assert real behavioural correctness rather than introducing yet another code path.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: all tests in the file passing, e.g. `[a1] Results: 12 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-a1-modules-taxonomy-crud.js
git commit -m "test(a1): pin D37 wiring correctness (AC6), cross-tenant rejection, and perf NFR"
```

---

## Task 10: decisions.md entries + final full-suite verification

**Files:**
- Modify: `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md`

- [ ] Append two ARCH entries (per CLAUDE.md's decisions.md mandate) recording:
  1. The `journeys.module_id` interpretation of "epic assigned to a module" (no persisted `epics` table exists; journeys is the closest persisted per-feature row; A2 will build on this).
  2. The addition of `GET /products/:id/modules`, not named in the DoR contract's "What will be built" list, added because AC1 and the test plan's own AC1 integration test require it (CLAUDE.md B1/D1: contract is the authoring defect when it conflicts with ACs/test plan).
- [ ] Run `node scripts/run-all-tests.js` one final time; confirm 0 new failures vs the branch-setup baseline.
- [ ] Proceed to `/verify-completion`.
