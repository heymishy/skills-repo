'use strict';

// tests/check-a1-modules-taxonomy-crud.js — a1
//
// Unit + integration + NFR tests for a1 (Curate a Modules taxonomy for a
// product). Covers AC1-AC6 from
// artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a1-test-plan.md.
//
// Follows this repo's own hand-rolled test()/assert style (see
// tests/check-bri-s3.4-cross-tenant-isolation.js) -- no Jest/Mocha.

var assert = require('assert');
var path = require('path');

// fix-forward (post-a1): handlePostProductModule/handlePutProductModule/
// handleDeleteProductModule now require a valid CSRF token (see products.js
// fix-forward entry, decisions.md) -- every test invoking these handlers
// needs a matching session.csrfToken/body._csrf pair.
var TEST_CSRF = 'test-csrf-token';

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');
var PRODUCTS_ROUTE_PATH  = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var SERVER_PATH          = path.resolve(__dirname, '../src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool — narrow, explicit branches only (mirrors this
// repo's own fake-test-db.js documented convention: not a general SQL
// engine). Implements exactly the query shapes modules-adapter.js issues
// against product_modules, plus a _journeys array so deleteModule's
// reassignment UPDATE is directly observable in tests. ──────────────────
function makeFakeModulesPool() {
  var rows = [];
  var assignmentRows = [];
  var seq = 1;
  var pool = {
    _rows: rows,
    _journeys: [],
    _assignmentRows: assignmentRows,
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      var p = params || [];

      if (s.indexOf('SELECT ID, NAME, CREATED_AT FROM PRODUCT_MODULES WHERE PRODUCT_ID = $1 AND TENANT_ID = $2') === 0) {
        var listed = rows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1]; });
        return { rows: listed };
      }
      if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE ID = $1 AND PRODUCT_ID = $2 AND TENANT_ID = $3') === 0) {
        var owner = rows.filter(function(r) { return r.id === p[0] && r.product_id === p[1] && r.tenant_id === p[2]; });
        return { rows: owner };
      }
      if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE PRODUCT_ID = $1 AND TENANT_ID = $2 AND NAME = $3 AND ID !=') === 0) {
        var dupExcl = rows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1] && r.name === p[2] && r.id !== p[3]; });
        return { rows: dupExcl };
      }
      if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE PRODUCT_ID = $1 AND TENANT_ID = $2 AND NAME = $3') === 0) {
        var dup = rows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1] && r.name === p[2]; });
        return { rows: dup };
      }
      if (s.indexOf('INSERT INTO PRODUCT_MODULES') === 0) {
        var row = { id: 'mod-' + (seq++), product_id: p[0], tenant_id: p[1], name: p[2], created_at: new Date().toISOString() };
        rows.push(row);
        return { rows: [row] };
      }
      if (s.indexOf('UPDATE PRODUCT_MODULES SET NAME = $1 WHERE ID = $2') === 0) {
        var target = rows.find(function(r) { return r.id === p[1]; });
        if (target) { target.name = p[0]; }
        return { rows: target ? [target] : [] };
      }
      if (s.indexOf('UPDATE JOURNEYS SET MODULE_ID = NULL WHERE MODULE_ID = $1') === 0) {
        pool._journeys.forEach(function(j) { if (j.module_id === p[0]) { j.module_id = null; } });
        return { rows: [] };
      }
      // tmc-s1 (unification revision): deleteModule now reassigns
      // feature_module_assignments -- the unified table -- rather than
      // journeys.module_id directly (see decisions.md REVISION entry).
      if (s.indexOf('UPDATE FEATURE_MODULE_ASSIGNMENTS SET MODULE_ID = NULL WHERE MODULE_ID = $1') === 0) {
        assignmentRows.forEach(function(r) { if (r.module_id === p[0]) { r.module_id = null; } });
        return { rows: [] };
      }
      if (s.indexOf('DELETE FROM PRODUCT_MODULES WHERE ID = $1') === 0) {
        var idx = rows.findIndex(function(r) { return r.id === p[0]; });
        if (idx !== -1) { rows.splice(idx, 1); }
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
  return pool;
}

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

(async function() {
  var modulesAdapter = require(MODULES_ADAPTER_PATH);

  // ===========================================================================
  // AC1 / AC4 — modules-adapter.js create + duplicate rejection
  // ===========================================================================
  await test('createModule succeeds for a genuinely new name (AC1)', async function() {
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());
    var m = await modulesAdapter.createModule('p1', 't1', 'Governance & Gate Enforcement');
    assert.ok(m.id, 'expected a generated id');
    assert.strictEqual(m.name, 'Governance & Gate Enforcement');
    assert.strictEqual(m.product_id, 'p1');
  });

  await test('createModule rejects a duplicate name within the same product (AC4)', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    await modulesAdapter.createModule('p1', 't1', 'Governance');
    var threw = false;
    try {
      await modulesAdapter.createModule('p1', 't1', 'Governance');
    } catch (e) {
      threw = true;
      assert.strictEqual(e.code, 'DUPLICATE_MODULE');
    }
    assert.ok(threw, 'expected a rejection for a duplicate name');
    assert.strictEqual(pool._rows.filter(function(r) { return r.name === 'Governance'; }).length, 1, 'no second module record created');
  });

  // ===========================================================================
  // AC2 — modules-adapter.js renameModule preserves id
  // ===========================================================================
  await test('renameModule updates the name without creating a new record (AC2)', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    var created = await modulesAdapter.createModule('p1', 't1', 'Old Name');
    var renamed = await modulesAdapter.renameModule('p1', 't1', created.id, 'New Name');
    assert.strictEqual(renamed.id, created.id, 'id must not change on rename');
    assert.strictEqual(renamed.name, 'New Name');
    assert.strictEqual(pool._rows.length, 1, 'rename must not create a second record');
  });

  // ===========================================================================
  // AC3 — modules-adapter.js deleteModule reassigns to Unassigned
  // ===========================================================================
  await test('deleteModule reassigns referencing features to Unassigned and removes the module (AC3, unified table per tmc-s1)', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    var created = await modulesAdapter.createModule('p1', 't1', 'Temp Module');
    pool._assignmentRows.push(
      { product_id: 'p1', tenant_id: 't1', feature_slug: 'j1', module_id: created.id },
      { product_id: 'p1', tenant_id: 't1', feature_slug: 'j2', module_id: created.id }
    );
    await modulesAdapter.deleteModule('p1', 't1', created.id);
    assert.strictEqual(pool._rows.length, 0, 'module record must be removed');
    pool._assignmentRows.forEach(function(r) {
      assert.strictEqual(r.module_id, null, 'every feature previously assigned must be reassigned to Unassigned (null)');
    });
  });

  await test('deleteModule rejects an unknown/foreign module id (NOT_FOUND)', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    var threw = false;
    try {
      await modulesAdapter.deleteModule('p1', 't1', 'does-not-exist');
    } catch (e) {
      threw = true;
      assert.strictEqual(e.code, 'NOT_FOUND');
    }
    assert.ok(threw, 'expected NOT_FOUND for an unknown module id');
  });

  // ===========================================================================
  // AC1 (integration) — POST creates, GET lists it back
  // ===========================================================================
  await test('POST /products/:id/modules persists a module and it appears in the next GET (AC1)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req1 = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { name: 'Governance & Gate Enforcement', _csrf: TEST_CSRF } };
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

  await test('POST /products/:id/modules requires a non-empty name (400)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { name: '   ', _csrf: TEST_CSRF } };
    var status = null;
    var res = { status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePostProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 400);
  });

  await test('POST /products/:id/modules rejects a duplicate name with a clear message (409, AC4 integration)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
    await modulesAdapter.createModule('p1', 't1', 'Billing');

    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { name: 'Billing', _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handlePostProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 409);
    assert.ok(body && body.error, 'expected a clear rejection message');
    assert.strictEqual(fakePool._rows.filter(function(r) { return r.name === 'Billing'; }).length, 1, 'no duplicate module record created');
  });

  // ===========================================================================
  // AC2 (integration) — PUT rename preserves references end-to-end
  // ===========================================================================
  await test('PUT /products/:id/modules/:moduleId renames and preserves the module id (AC2 integration)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
    var created = await modulesAdapter.createModule('p1', 't1', 'Old Name');

    var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { name: 'New Name', _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handlePutProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.module.id, created.id, 'module id must be unchanged after rename');
    assert.strictEqual(body.module.name, 'New Name');
  });

  // ===========================================================================
  // AC3 (integration) — DELETE reassigns journeys/epics to Unassigned
  // ===========================================================================
  await test('DELETE /products/:id/modules/:moduleId reassigns its features to Unassigned (AC3 integration, unified table per tmc-s1)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
    var created = await modulesAdapter.createModule('p1', 't1', 'Temp');
    fakePool._assignmentRows.push({ product_id: 'p1', tenant_id: 't1', feature_slug: 'j1', module_id: created.id });

    var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handleDeleteProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.deleted, true);
    assert.strictEqual(fakePool._assignmentRows[0].module_id, null, 'feature must be reassigned to Unassigned, not dropped');
  });

  // ===========================================================================
  // AC5 — module list for product B never includes product A's modules
  // ===========================================================================
  await test('Module list for product B never includes product A modules (AC5)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
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

  // ===========================================================================
  // Cross-tenant security NFR
  // ===========================================================================
  await test('Cross-tenant module create is rejected (Security NFR)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 'tenant-owner' }]);

    var req = { params: { id: 'p1' }, session: { tenantId: 'tenant-attacker', csrfToken: TEST_CSRF }, body: { name: 'Injected', _csrf: TEST_CSRF } };
    var status = null;
    var res = { status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePostProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 404, 'cross-tenant module create must be rejected (404, not 403 -- FORBIDDEN-vs-NOT_FOUND policy)');
    assert.strictEqual(fakePool._rows.length, 0, 'zero rows must be created for a rejected cross-tenant request');
  });

  await test('Cross-tenant module delete is rejected, zero rows affected (Security NFR)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var created = await modulesAdapter.createModule('p1', 'tenant-owner', 'Real Module');
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 'tenant-owner' }]);

    var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 'tenant-attacker', csrfToken: TEST_CSRF }, body: { _csrf: TEST_CSRF } };
    var status = null;
    var res = { status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handleDeleteProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 404);
    assert.strictEqual(fakePool._rows.length, 1, 'the real module must be untouched by the rejected cross-tenant delete');
  });

  // ===========================================================================
  // AC6 — D37 wiring: two products resolve independently and correctly
  // ===========================================================================
  await test('setModulesAdapter wiring resolves two different products to two different, correct results (AC6, D37 wiring)', async function() {
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

  await test('setModulesAdapter stub throws when unwired (D37 rule 1)', async function() {
    delete require.cache[require.resolve(MODULES_ADAPTER_PATH)];
    var freshAdapter = require(MODULES_ADAPTER_PATH);
    var threw = false;
    try {
      await freshAdapter.listModules('p1', 't1');
    } catch (e) {
      threw = true;
      assert.ok(/Adapter not wired/.test(e.message), 'expected the D37 "Adapter not wired" message, got: ' + e.message);
    }
    assert.ok(threw, 'expected the unwired stub to throw, not return null/empty');
  });

  // ===========================================================================
  // Performance NFR — create+rename+delete cycle under 500ms for 200 epics
  // ===========================================================================
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

  // ===========================================================================
  // D37 production wiring in server.js (grep-based, matches this repo's own
  // check-pr-s2-products-route.js convention)
  // ===========================================================================
  await test('server.js wires setModulesAdapter to the shared Postgres pool and creates the schema (D37 production wiring)', function() {
    var fs = require('fs');
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(/setModulesAdapter\(/.test(src), 'expected server.js to call setModulesAdapter(...)');
    assert.ok(/product_modules/.test(src), 'expected server.js to create the product_modules table');
    assert.ok(/journeys ADD COLUMN IF NOT EXISTS module_id/.test(src), 'expected server.js to add journeys.module_id');
  });

  await test('server.js runs the journeys.module_id migration AFTER product_modules is created, not as a separate unchained query (fix: fresh-deploy race caused "relation product_modules does not exist")', function() {
    var fs = require('fs');
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    var createIdx = src.indexOf('CREATE TABLE IF NOT EXISTS product_modules');
    var alterIdx = src.indexOf('ALTER TABLE journeys ADD COLUMN IF NOT EXISTS module_id');
    assert.ok(createIdx !== -1 && alterIdx !== -1, 'expected both migrations to be present');
    assert.ok(alterIdx > createIdx, 'expected the module_id ALTER TABLE to appear after the product_modules CREATE TABLE');
    // The two migrations must share ONE promise chain (module_id's query
    // fired from inside product_modules' own .then()), not two independent,
    // unchained _creditsPool.query() calls -- unchained calls each race for
    // their own pool connection and can execute out of order on a fresh
    // database, exactly the bug this test guards against. If product_modules
    // had its own independent .catch() (closing its chain) before the ALTER
    // TABLE call even begins, the two are unchained -- the fixed version's
    // single shared .catch() only appears after BOTH migrations.
    var between = src.slice(createIdx, alterIdx);
    assert.ok(!/\.catch\(/.test(between), 'expected no .catch() between the two migrations -- product_modules must not close its own independent chain before journeys.module_id runs; they must share one .then()/.catch() chain');
  });

  await test('server.js registers the 4 module route handlers', function() {
    var fs = require('fs');
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    ['handleGetProductModules', 'handlePostProductModule', 'handlePutProductModule', 'handleDeleteProductModule'].forEach(function(name) {
      assert.ok(new RegExp(name).test(src), 'expected server.js to reference ' + name);
    });
  });

  // ===========================================================================
  // Fix-forward (post-a1) — CSRF protection on the mutating module routes
  // ===========================================================================

  await test('POST /products/:id/modules rejects a request with a missing/wrong CSRF token before any DB write (fix-forward, Security NFR)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { name: 'Should Not Be Created', _csrf: 'wrong-token' } };
    var status = null;
    var res = {
      writeHead: function(s) { status = s; },
      end: function() {}
    };
    await productsRoute.handlePostProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 403, 'expected a 403 for a mismatched CSRF token');
    assert.strictEqual(fakePool._rows.length, 0, 'no module row must be created when the CSRF check fails');
  });

  await test('DELETE /products/:id/modules/:moduleId rejects a request with no CSRF token at all, module untouched (fix-forward, Security NFR)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(fakePool);
    var created = await modulesAdapter.createModule('p1', 't1', 'Protected Module');
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: {} };
    var status = null;
    var res = {
      writeHead: function(s) { status = s; },
      end: function() {}
    };
    await productsRoute.handleDeleteProductModule(req, res, null, ownerPool);
    assert.strictEqual(status, 403, 'expected a 403 for a missing CSRF token');
    assert.strictEqual(fakePool._rows.length, 1, 'the module must still exist -- delete must not proceed without a valid CSRF token');
  });

  // ===========================================================================
  // Fix-forward (post-a1) — the actual "Add module" UI, previously missing
  // entirely (A1 shipped only the API; nothing in the browser could ever
  // create the first module, making A4's module-grouped rendering
  // unreachable through the app -- see decisions.md fix-forward entry)
  // ===========================================================================

  await test('_renderProductView: renders an "Add module" form with a CSRF field matching the session token (fix-forward)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [], TEST_CSRF);
    assert.ok(/id="a1-create-form"/.test(html), 'expected the create-module form to be present');
    assert.ok(html.indexOf('name="_csrf" value="' + TEST_CSRF + '"') !== -1, 'expected the create form\'s CSRF field to carry the real session token');
    assert.ok(/Add module/.test(html), 'expected an Add module submit control');
  });

  await test('_renderProductView: renders a rename form and a delete control for each existing module, both wired to the real CSRF token (fix-forward)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-1', name: 'Billing' }, { id: 'mod-2', name: 'Governance' }];
    var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, modules, TEST_CSRF);
    assert.ok(/data-module-id="mod-1"/.test(html) && /data-module-id="mod-2"/.test(html), 'expected both modules to have their own rename/delete controls');
    assert.ok(/class="a1-rename-form"/.test(html), 'expected a rename form per module');
    assert.ok(/class="a1-delete-btn"/.test(html), 'expected a delete control per module');
    var csrfFieldCount = (html.match(new RegExp('name="_csrf" value="' + TEST_CSRF + '"', 'g')) || []).length;
    assert.ok(csrfFieldCount >= 3, 'expected the CSRF token in the create form plus each module\'s own rename form (got ' + csrfFieldCount + ')');
  });

  await test('_renderProductView: a module name containing HTML/script content is escaped in the management UI, never rendered raw (fix-forward, Security NFR)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var modules = [{ id: 'mod-1', name: '<script>alert(1)</script>' }];
    var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, modules, TEST_CSRF);
    assert.ok(html.indexOf('<script>alert(1)</script>') === -1, 'expected the raw script tag to never appear unescaped');
    assert.ok(html.indexOf('&lt;script&gt;') !== -1, 'expected the module name to be HTML-escaped');
  });

  await test('_renderProductView: zero modules renders the create form but no rename/delete controls (fix-forward, matches AC4\'s clean fallback)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [], TEST_CSRF);
    assert.ok(/id="a1-create-form"/.test(html), 'expected the create form to still be present with zero modules');
    assert.ok(!/class="a1-rename-form"/.test(html), 'expected zero rename forms when there are zero modules');
    assert.ok(!/class="a1-delete-btn"/.test(html), 'expected zero delete controls when there are zero modules');
  });

  await test('handleGetProductView: the real HTML response includes a CSRF token generated from the live session (fix-forward, integration)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
    // no rollup row, no journeys -- exercises the plain product-view path
    var fullPool = {
      query: async function(sql, params) {
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
          return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
        }
        if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
        if (/FROM journeys/.test(sql)) { return { rows: [] }; }
        return ownerPool.query(sql, params);
      }
    };
    var req = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var html = null;
    var res = {
      writeHead: function() {},
      end: function(b) { html = b; }
    };
    await productsRoute.handleGetProductView(req, res, null, fullPool);
    assert.ok(html, 'expected a real HTML response');
    assert.ok(/id="a1-create-form"/.test(html), 'expected the create-module form in the real handler\'s output');
    assert.ok(req.session.csrfToken, 'expected generateCsrfToken to have populated req.session.csrfToken as a side effect');
    assert.ok(html.indexOf('name="_csrf" value="' + req.session.csrfToken + '"') !== -1, 'expected the rendered form\'s CSRF field to match the real session token, not a stale/placeholder value');
  });

  console.log('\n[a1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();


