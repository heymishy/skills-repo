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
  var seq = 1;
  var pool = {
    _rows: rows,
    _journeys: [],
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
  await test('deleteModule reassigns referencing journeys to Unassigned and removes the module (AC3)', async function() {
    var pool = makeFakeModulesPool();
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

  await test('POST /products/:id/modules requires a non-empty name (400)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);
    var req = { params: { id: 'p1' }, session: { tenantId: 't1' }, body: { name: '   ' } };
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

    var req = { params: { id: 'p1' }, session: { tenantId: 't1' }, body: { name: 'Billing' } };
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

    var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 't1' }, body: { name: 'New Name' } };
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
  await test('DELETE /products/:id/modules/:moduleId reassigns its journeys/epics to Unassigned (AC3 integration)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
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

    var req = { params: { id: 'p1' }, session: { tenantId: 'tenant-attacker' }, body: { name: 'Injected' } };
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

    var req = { params: { id: 'p1', moduleId: created.id }, session: { tenantId: 'tenant-attacker' } };
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

  await test('server.js registers the 4 module route handlers', function() {
    var fs = require('fs');
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    ['handleGetProductModules', 'handlePostProductModule', 'handlePutProductModule', 'handleDeleteProductModule'].forEach(function(name) {
      assert.ok(new RegExp(name).test(src), 'expected server.js to reference ' + name);
    });
  });

  console.log('\n[a1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();


