'use strict';

// tests/check-a2-reassign-epics-between-modules.js — a2
//
// Unit + integration + NFR tests for a2 (Reassign an epic to a different
// module). Covers AC1-AC4 from
// artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a2-test-plan.md.
//
// Follows this repo's own hand-rolled test()/assert style (see
// tests/check-a1-modules-taxonomy-crud.js, tests/check-bri-s3.4-cross-tenant-isolation.js)
// -- no Jest/Mocha.

var assert = require('assert');
var path = require('path');

// fix-forward (post-a1/a2): handlePutEpicModule now requires a valid CSRF
// token (see products.js fix-forward entry, decisions.md) -- every test
// invoking it needs a matching session.csrfToken/body._csrf pair.
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
// repo's own check-a1-modules-taxonomy-crud.js convention). Implements
// exactly the query shapes modules-adapter.js issues against
// product_modules and journeys for reassignEpic. ─────────────────────────
function makeFakePool() {
  var moduleRows = [];
  var journeyRows = [];
  var seq = 1;
  var pool = {
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
  // AC1 — reassignEpic moves module reference from X to Y
  // ===========================================================================
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

  // ===========================================================================
  // AC2 — reassignEpic handles the Unassigned starting state
  // ===========================================================================
  await test('reassignEpic moves an unassigned epic (null module) into a real module (AC2)', async function() {
    var pool = makeFakePool();
    modulesAdapter.setModulesAdapter(pool);
    var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
    pool._journeys.push({ journey_id: 'e2', product_id: 'p1', module_id: null });

    var result = await modulesAdapter.reassignEpic('p1', 't1', 'e2', modX.id);
    assert.strictEqual(result.module_id, modX.id, 'expected e2 to now reference Module X');
    assert.strictEqual(pool._journeys[0].module_id, modX.id);
  });

  // ===========================================================================
  // AC3 — reassignEpic to current module is a no-op
  // ===========================================================================
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

  // ===========================================================================
  // AC4 (unit) — reassignEpic rejects a cross-product module
  // ===========================================================================
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

  // ===========================================================================
  // AC1 (integration) — PUT reassigns and returns 200
  // ===========================================================================
  await test('PUT /products/:id/epics/:epicId/module reassigns and returns 200 (AC1 integration)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakePool();
    modulesAdapter.setModulesAdapter(fakePool);
    var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
    var modY = await modulesAdapter.createModule('p1', 't1', 'Module Y');
    fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: modX.id });
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { moduleId: modY.id, _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.module_id, modY.id);
    assert.strictEqual(body.changed, true);
    assert.strictEqual(fakePool._journeys[0].module_id, modY.id, 'underlying journeys row must reflect the reassignment');
  });

  // ===========================================================================
  // AC1 (integration) — same-module reassignment via the route is a no-op
  // ===========================================================================
  await test('PUT /products/:id/epics/:epicId/module reassigning to the current module is a no-op (AC3 integration)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakePool();
    modulesAdapter.setModulesAdapter(fakePool);
    var modX = await modulesAdapter.createModule('p1', 't1', 'Module X');
    fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: modX.id });
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { moduleId: modX.id, _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.changed, false, 'expected a no-op result via the route');
    assert.strictEqual(fakePool._journeys[0].module_id, modX.id, 'module reference must be unchanged');
  });

  // ===========================================================================
  // AC4 (integration) — PUT rejects cross-product module
  // ===========================================================================
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

    var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { moduleId: modBOther.id, _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
    assert.strictEqual(status, 404, 'expected the cross-product reassignment to be rejected');
    assert.strictEqual(fakePool._journeys[0].module_id, null, 'epic\'s module reference must be unchanged');
  });

  // ===========================================================================
  // Cross-tenant security NFR
  // ===========================================================================
  await test('Cross-tenant epic reassignment is rejected (Security NFR)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakePool();
    modulesAdapter.setModulesAdapter(fakePool);
    var modX = await modulesAdapter.createModule('p1', 'tenant-owner', 'Module X');
    fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: null });
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 'tenant-owner' }]);

    var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 'tenant-attacker', csrfToken: TEST_CSRF }, body: { moduleId: modX.id, _csrf: TEST_CSRF } };
    var status = null;
    var res = { status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
    assert.strictEqual(status, 404, 'cross-tenant reassignment must be rejected (404, matching this repo\'s FORBIDDEN-vs-NOT_FOUND policy)');
    assert.strictEqual(fakePool._journeys[0].module_id, null, 'zero rows changed for a rejected cross-tenant request');
  });

  // ===========================================================================
  // Missing moduleId (400)
  // ===========================================================================
  await test('PUT /products/:id/epics/:epicId/module requires a non-empty moduleId (400)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = makeFakePool();
    modulesAdapter.setModulesAdapter(fakePool);
    fakePool._journeys.push({ journey_id: 'e1', product_id: 'p1', module_id: null });
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1', epicId: 'e1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { moduleId: '   ', _csrf: TEST_CSRF } };
    var status = null;
    var res = { status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePutEpicModule(req, res, null, ownerPool);
    assert.strictEqual(status, 400);
  });

  // ===========================================================================
  // Performance NFR — reassignment completes within budget (<200ms)
  // ===========================================================================
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

  // ===========================================================================
  // D37-adjacent production wiring in server.js
  // ===========================================================================
  await test('server.js registers handlePutEpicModule and the PUT epics/:epicId/module route', function() {
    var fs = require('fs');
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(/handlePutEpicModule/.test(src), 'expected server.js to reference handlePutEpicModule');
    assert.ok(/epics\\\/\[\^\/\]\+\\\/module/.test(src), 'expected server.js to route PUT .../epics/:epicId/module');
  });

  console.log('\n[a2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
