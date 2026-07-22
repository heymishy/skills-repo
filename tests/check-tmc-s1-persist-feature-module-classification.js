'use strict';

// tests/check-tmc-s1-persist-feature-module-classification.js — tmc-s1
//
// Unit + integration tests for tmc-s1 (Persist a feature-to-module join so
// any product's real synced features can be classified and rendered by
// module, at multi-tenant/multi-hundred-feature scale). Covers AC1-AC7 from
// artefacts/2026-07-22-taxonomy-module-classification/test-plans/tmc-s1-test-plan.md.
//
// Follows this repo's own hand-rolled test()/assert style (see
// tests/check-a1-modules-taxonomy-crud.js, tests/check-bri-s3.4-cross-tenant-isolation.js)
// -- no Jest/Mocha.

var assert = require('assert');
var path = require('path');

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
var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── In-memory fake pool -- narrow, explicit branches only, mirrors the
// existing product_modules fake pool convention (check-a1-modules-taxonomy-
// crud.js) extended with a feature_module_assignments table and a query
// counter (AC2/AC3's "exactly one query" assertions need this). ──────────
function makeFakeModulesPool(opts) {
  opts = opts || {};
  var moduleRows = opts.moduleRows || [];
  var assignmentRows = opts.assignmentRows || [];
  var queryCount = { value: 0 };
  var pool = {
    _moduleRows: moduleRows,
    _assignmentRows: assignmentRows,
    _queryCount: queryCount,
    query: async function(sql, params) {
      queryCount.value++;
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      var p = params || [];

      if (s.indexOf('SELECT FEATURE_SLUG, MODULE_ID FROM FEATURE_MODULE_ASSIGNMENTS WHERE PRODUCT_ID = $1 AND TENANT_ID = $2') === 0) {
        var listed = assignmentRows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1]; });
        return { rows: listed };
      }

      if (s.indexOf('INSERT INTO FEATURE_MODULE_ASSIGNMENTS') === 0) {
        var productId = p[0], tenantId = p[1], moduleId = p[2], slugs = p[3];
        var moduleExists = moduleRows.some(function(m) { return m.id === moduleId && m.product_id === productId && m.tenant_id === tenantId; });
        if (!moduleExists) { return { rows: [] }; }
        var returned = [];
        slugs.forEach(function(slug) {
          var existing = assignmentRows.find(function(r) { return r.product_id === productId && r.feature_slug === slug; });
          if (existing) { existing.module_id = moduleId; }
          else { assignmentRows.push({ product_id: productId, tenant_id: tenantId, feature_slug: slug, module_id: moduleId }); }
          returned.push({ feature_slug: slug });
        });
        return { rows: returned };
      }

      if (s.indexOf('UPDATE FEATURE_MODULE_ASSIGNMENTS SET MODULE_ID = NULL WHERE MODULE_ID = $1') === 0) {
        var affected = 0;
        assignmentRows.forEach(function(r) { if (r.module_id === p[0]) { r.module_id = null; affected++; } });
        return { rows: [], rowCount: affected };
      }

      if (s.indexOf('DELETE FROM FEATURE_MODULE_ASSIGNMENTS WHERE PRODUCT_ID = $1 AND TENANT_ID = $2 AND FEATURE_SLUG = $3') === 0) {
        var idx = assignmentRows.findIndex(function(r) { return r.product_id === p[0] && r.tenant_id === p[1] && r.feature_slug === p[2]; });
        if (idx !== -1) { assignmentRows.splice(idx, 1); return { rows: [], rowCount: 1 }; }
        return { rows: [], rowCount: 0 };
      }

      // product_modules passthrough (reused for AC3/AC4's module-ownership checks)
      if (s.indexOf('SELECT ID, NAME, CREATED_AT FROM PRODUCT_MODULES WHERE PRODUCT_ID = $1 AND TENANT_ID = $2') === 0) {
        return { rows: moduleRows.filter(function(r) { return r.product_id === p[0] && r.tenant_id === p[1]; }) };
      }
      if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE ID = $1 AND PRODUCT_ID = $2 AND TENANT_ID = $3') === 0) {
        return { rows: moduleRows.filter(function(r) { return r.id === p[0] && r.product_id === p[1] && r.tenant_id === p[2]; }) };
      }
      if (s.indexOf('UPDATE JOURNEYS SET MODULE_ID = NULL WHERE MODULE_ID = $1') === 0) {
        return { rows: [] };
      }
      if (s.indexOf('DELETE FROM PRODUCT_MODULES WHERE ID = $1') === 0) {
        var midx = moduleRows.findIndex(function(r) { return r.id === p[0]; });
        if (midx !== -1) { moduleRows.splice(midx, 1); }
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
  var productRollup = require(PRODUCT_ROLLUP_PATH);

  // ===========================================================================
  // AC2 — single query regardless of feature count
  // ===========================================================================
  await test('getFeatureModuleAssignments issues exactly one query for 300 slugs (AC2)', async function() {
    var assignmentRows = [];
    for (var i = 0; i < 300; i++) {
      assignmentRows.push({ product_id: 'p1', tenant_id: 't1', feature_slug: 'feat-' + i, module_id: 'mod-1' });
    }
    var pool = makeFakeModulesPool({ assignmentRows: assignmentRows });
    modulesAdapter.setModulesAdapter(pool);
    var map = await modulesAdapter.getFeatureModuleAssignments('p1', 't1');
    assert.strictEqual(Object.keys(map).length, 300, 'expected all 300 assignments back');
    assert.strictEqual(pool._queryCount.value, 1, 'expected exactly one query for the fetch, got ' + pool._queryCount.value);
  });

  await test('getFeatureModuleAssignments returns {} for a product with zero assignments, still one query', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    var map = await modulesAdapter.getFeatureModuleAssignments('p1', 't1');
    assert.deepStrictEqual(map, {});
    assert.strictEqual(pool._queryCount.value, 1);
  });

  // ===========================================================================
  // AC3 — bulk assign is one round trip regardless of batch size
  // ===========================================================================
  await test('bulkAssignFeaturesToModule issues exactly one query at 2 slugs (AC3)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var result = await modulesAdapter.bulkAssignFeaturesToModule('p1', 't1', ['feat-a', 'feat-b'], 'mod-1');
    assert.strictEqual(result.assigned, 2);
    assert.strictEqual(pool._queryCount.value, 1, 'expected exactly one query, got ' + pool._queryCount.value);
  });

  await test('bulkAssignFeaturesToModule issues exactly one query at 250 slugs (AC3)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var slugs = [];
    for (var i = 0; i < 250; i++) { slugs.push('feat-' + i); }
    var result = await modulesAdapter.bulkAssignFeaturesToModule('p1', 't1', slugs, 'mod-1');
    assert.strictEqual(result.assigned, 250);
    assert.strictEqual(pool._queryCount.value, 1, 'expected exactly one query, got ' + pool._queryCount.value);
  });

  await test('bulkAssignFeaturesToModule rejects an empty slug list with zero queries issued', async function() {
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    var threw = false;
    try {
      await modulesAdapter.bulkAssignFeaturesToModule('p1', 't1', [], 'mod-1');
    } catch (e) {
      threw = true;
    }
    assert.ok(threw, 'expected a rejection for an empty slug list');
    assert.strictEqual(pool._queryCount.value, 0, 'expected zero queries for a rejected empty-list call');
  });

  // ===========================================================================
  // AC4 (module-scoping half) — target module belonging to a different product
  // ===========================================================================
  await test('bulkAssignFeaturesToModule rejects a target module belonging to a different product (AC4)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p2', tenant_id: 't2', name: 'Other Product Module' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var threw = false;
    try {
      await modulesAdapter.bulkAssignFeaturesToModule('p1', 't1', ['feat-a'], 'mod-1');
    } catch (e) {
      threw = true;
      assert.strictEqual(e.code, 'MODULE_NOT_FOUND');
    }
    assert.ok(threw, 'expected MODULE_NOT_FOUND for a cross-product module target');
    assert.strictEqual(pool._assignmentRows.length, 0, 'no assignment row should have been written');
  });

  // ===========================================================================
  // AC6 — deleteModule reassigns feature_module_assignments to NULL before deleting the module
  // ===========================================================================
  await test('deleteModule sets feature_module_assignments.module_id to NULL, module row removed, assignment rows survive (AC6)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Temp' }];
    var assignmentRows = [
      { product_id: 'p1', tenant_id: 't1', feature_slug: 'feat-a', module_id: 'mod-1' },
      { product_id: 'p1', tenant_id: 't1', feature_slug: 'feat-b', module_id: 'mod-1' }
    ];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows, assignmentRows: assignmentRows });
    modulesAdapter.setModulesAdapter(pool);
    await modulesAdapter.deleteModule('p1', 't1', 'mod-1');
    assert.strictEqual(pool._moduleRows.length, 0, 'module row must be removed');
    assert.strictEqual(assignmentRows.length, 2, 'assignment rows must still exist (not orphaned/deleted)');
    assignmentRows.forEach(function(r) {
      assert.strictEqual(r.module_id, null, 'every assignment previously pointing at the deleted module must be nulled');
    });
  });

  await test('deleteModule with zero assignments proceeds with a no-op UPDATE', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Empty' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    await modulesAdapter.deleteModule('p1', 't1', 'mod-1');
    assert.strictEqual(pool._moduleRows.length, 0);
  });

  // ===========================================================================
  // AC5 (data-shape half) — groupTaxonomyByModule joins taxonomy against the assignment map
  // ===========================================================================
  await test('groupTaxonomyByModule buckets items by module and puts the rest in Unclassified (AC5)', function() {
    var taxonomy = {
      groups: [
        { epicSlug: 'epic-a', epicName: 'Epic A', items: [{ slug: 'feat-1' }, { slug: 'feat-2' }] },
        { epicSlug: 'epic-b', epicName: 'Epic B', items: [{ slug: 'feat-3' }, { slug: 'feat-4' }] }
      ],
      ungrouped: [{ slug: 'feat-5', name: 'Feature Five' }, { slug: 'feat-6', name: 'Feature Six' }]
    };
    var assignmentMap = { 'feat-1': 'mod-1', 'feat-3': 'mod-2', 'feat-5': 'mod-1' };
    var modules = [{ id: 'mod-1', name: 'Module One' }, { id: 'mod-2', name: 'Module Two' }];

    var result = productRollup.groupTaxonomyByModule(taxonomy, assignmentMap, modules);

    assert.strictEqual(result.totalCount, 6, 'no item should be dropped or duplicated');
    var mod1 = result.byModule.find(function(b) { return b.moduleId === 'mod-1'; });
    var mod2 = result.byModule.find(function(b) { return b.moduleId === 'mod-2'; });
    assert.strictEqual(mod1.items.length, 2, 'feat-1 and feat-5 should be under Module One');
    assert.strictEqual(mod2.items.length, 1, 'feat-3 should be under Module Two');
    assert.strictEqual(result.unclassified.length, 3, 'feat-2, feat-4, feat-6 should be Unclassified');
  });

  await test('groupTaxonomyByModule with an empty assignment map puts everything in Unclassified (edge case)', function() {
    var taxonomy = { groups: [{ epicSlug: 'e1', epicName: 'E1', items: [{ slug: 'a' }, { slug: 'b' }] }], ungrouped: [{ slug: 'c' }] };
    var result = productRollup.groupTaxonomyByModule(taxonomy, {}, [{ id: 'mod-1', name: 'M1' }]);
    assert.strictEqual(result.byModule.length, 0);
    assert.strictEqual(result.unclassified.length, 3);
    assert.strictEqual(result.totalCount, 3);
  });

  // ===========================================================================
  // AC1 — assignment survives a second /product-sync run
  // ===========================================================================
  await test('a feature module assignment survives a second syncProductRollup run (AC1)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);

    var rollupWrites = [];
    var syncPool = {
      query: async function(sql, params) {
        if (String(sql).indexOf('INSERT INTO product_rollups') !== -1) {
          rollupWrites.push(params);
          return { rows: [] };
        }
        return pool.query(sql, params);
      }
    };

    await modulesAdapter.bulkAssignFeaturesToModule('p1', 't1', ['tmc-fixture-a'], 'mod-1');

    var pipelineStateFixture1 = { features: [{ slug: 'tmc-fixture-a', name: 'Fixture A', health: 'green' }] };
    var pipelineStateFixture2 = { features: [{ slug: 'tmc-fixture-a', name: 'Fixture A', health: 'red' }] };
    var adapterModule = {
      getPipelineStateFetchAdapter: function() {
        var call = 0;
        return async function() {
          call++;
          var content = call === 1 ? pipelineStateFixture1 : pipelineStateFixture2;
          return { content: Buffer.from(JSON.stringify(content)).toString('base64') };
        };
      }()
    };
    // getPipelineStateFetchAdapter must be a function returning the fetch fn each call
    adapterModule.getPipelineStateFetchAdapter = (function() {
      var call = 0;
      return function() {
        call++;
        var content = call === 1 ? pipelineStateFixture1 : pipelineStateFixture2;
        return async function() { return { content: Buffer.from(JSON.stringify(content)).toString('base64') }; };
      };
    })();

    await productRollup.syncProductRollup(syncPool, adapterModule, { productId: 'p1', repoOwner: 'o', repoName: 'r', accessToken: 'tok' });
    var afterFirstSync = await modulesAdapter.getFeatureModuleAssignments('p1', 't1');
    assert.strictEqual(afterFirstSync['tmc-fixture-a'], 'mod-1');

    await productRollup.syncProductRollup(syncPool, adapterModule, { productId: 'p1', repoOwner: 'o', repoName: 'r', accessToken: 'tok' });
    var afterSecondSync = await modulesAdapter.getFeatureModuleAssignments('p1', 't1');
    assert.strictEqual(afterSecondSync['tmc-fixture-a'], 'mod-1', 'assignment must survive a second, content-changed sync');
    assert.strictEqual(rollupWrites.length, 2, 'expected the taxonomy JSONB to have actually been overwritten twice');
  });

  // ===========================================================================
  // AC4 — cross-tenant isolation
  // ===========================================================================
  await test('getFeatureModuleAssignments never returns another tenant\'s assignments (AC4)', async function() {
    var assignmentRows = [
      { product_id: 'pA', tenant_id: 'tenantA', feature_slug: 'feat-1', module_id: 'mod-1' },
      { product_id: 'pA', tenant_id: 'tenantA', feature_slug: 'feat-2', module_id: 'mod-1' }
    ];
    var pool = makeFakeModulesPool({ assignmentRows: assignmentRows });
    modulesAdapter.setModulesAdapter(pool);
    var leaked = await modulesAdapter.getFeatureModuleAssignments('pA', 'tenantB');
    assert.deepStrictEqual(leaked, {}, 'tenant B must never see tenant A\'s assignments for product A');
  });

  await test('bulkAssignFeaturesToModule cannot write into another tenant\'s product (AC4)', async function() {
    var moduleRows = [{ id: 'mod-1', product_id: 'pA', tenant_id: 'tenantA', name: 'Module A' }];
    var assignmentRows = [{ product_id: 'pA', tenant_id: 'tenantA', feature_slug: 'feat-1', module_id: 'mod-1' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows, assignmentRows: assignmentRows });
    modulesAdapter.setModulesAdapter(pool);
    var before = assignmentRows.slice();
    var threw = false;
    try {
      // tenantB attempts to write against pA's module using its own (wrong) tenantId
      await modulesAdapter.bulkAssignFeaturesToModule('pA', 'tenantB', ['feat-2'], 'mod-1');
    } catch (e) {
      threw = true;
      assert.strictEqual(e.code, 'MODULE_NOT_FOUND');
    }
    assert.ok(threw, 'expected rejection when tenantB targets a module scoped to tenantA');
    assert.strictEqual(assignmentRows.length, before.length, 'tenant A\'s pre-existing assignment must be unchanged');
  });

  // ===========================================================================
  // AC5 (integration) — real handleGetProductView-level render with partial classification
  // ===========================================================================
  await test('handleGetProductView groups taxonomy by module when assignments exist, with an Unclassified bucket (AC5)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var moduleRows = [
      { id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Module One' },
      { id: 'mod-2', product_id: 'p1', tenant_id: 't1', name: 'Module Two' }
    ];
    var assignmentRows = [
      { product_id: 'p1', tenant_id: 't1', feature_slug: 'feat-1', module_id: 'mod-1' },
      { product_id: 'p1', tenant_id: 't1', feature_slug: 'feat-3', module_id: 'mod-2' }
    ];
    var modulesPool = makeFakeModulesPool({ moduleRows: moduleRows, assignmentRows: assignmentRows });
    modulesAdapter.setModulesAdapter(modulesPool);

    var taxonomy = {
      groups: [{ epicSlug: 'e1', epicName: 'Epic One', items: [{ slug: 'feat-1' }, { slug: 'feat-2' }] }],
      ungrouped: [{ slug: 'feat-3', name: 'Feature Three' }, { slug: 'feat-4', name: 'Feature Four' }]
    };
    var mainPool = {
      query: async function(sql, params) {
        var s = String(sql).replace(/\s+/g, ' ').trim();
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(s)) {
          return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'o', repo_name: 'r' }] };
        }
        if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at FROM product_rollups/i.test(s)) {
          return { rows: [{ dod_status_counts: {}, health_counts: {}, test_coverage: {}, ac_coverage: {}, taxonomy: taxonomy, synced_at: new Date().toISOString() }] };
        }
        if (/SELECT journey_id, feature_slug, module_id, data->>'activeSkill' AS stage FROM journeys/i.test(s)) {
          return { rows: [] };
        }
        return modulesPool.query(sql, params);
      }
    };

    var req = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var html = null;
    var res = { writeHead: function() {}, end: function(b) { html = b; } };
    await productsRoute.handleGetProductView(req, res, null, mainPool);

    assert.ok(html.indexOf('Module One') !== -1, 'expected Module One heading in the rendered HTML');
    assert.ok(html.indexOf('Module Two') !== -1, 'expected Module Two heading in the rendered HTML');
    assert.ok(html.indexOf('Unclassified') !== -1, 'expected an Unclassified heading for feat-2/feat-4');
    // grouped items (feat-1/feat-2) have no `name` field in this fixture, so
    // they render by slug; ungrouped items (feat-3/feat-4) have a `name`
    // field and render by name (item.name || item.slug), matching the
    // pre-existing ungrouped-section convention this story preserves.
    assert.ok(html.indexOf('feat-1') !== -1, 'expected feat-1 to appear in the render');
    assert.ok(html.indexOf('feat-2') !== -1, 'expected feat-2 to appear in the render');
    assert.ok(html.indexOf('Feature Three') !== -1, 'expected Feature Three to appear in the render');
    assert.ok(html.indexOf('Feature Four') !== -1, 'expected Feature Four to appear in the render');
  });

  await test('handleGetProductView renders the pre-existing Epics taxonomy exactly when zero assignments exist (AC5 regression safety)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());

    var taxonomy = {
      groups: [{ epicSlug: 'e1', epicName: 'Epic One', items: [{ slug: 'feat-1' }] }],
      ungrouped: [{ slug: 'feat-2', name: 'Feature Two' }]
    };
    var mainPool = {
      query: async function(sql) {
        var s = String(sql).replace(/\s+/g, ' ').trim();
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(s)) {
          return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'o', repo_name: 'r' }] };
        }
        if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at FROM product_rollups/i.test(s)) {
          return { rows: [{ dod_status_counts: {}, health_counts: {}, test_coverage: {}, ac_coverage: {}, taxonomy: taxonomy, synced_at: new Date().toISOString() }] };
        }
        if (/SELECT journey_id, feature_slug, module_id, data->>'activeSkill' AS stage FROM journeys/i.test(s)) {
          return { rows: [] };
        }
        return { rows: [] };
      }
    };

    var req = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var html = null;
    var res = { writeHead: function() {}, end: function(b) { html = b; } };
    await productsRoute.handleGetProductView(req, res, null, mainPool);

    assert.ok(html.indexOf('>Epics<') !== -1, 'expected the pre-existing Epics heading, unchanged, when zero assignments exist');
    assert.ok(html.indexOf('Features by module') === -1, 'must NOT show the module-grouped heading when there are zero assignments');
  });

  // ===========================================================================
  // AC7 — CSRF-protected bulk-assign route
  // ===========================================================================
  await test('POST /products/:id/modules/bulk-assign rejects a missing CSRF token (403, zero writes) (AC7)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { featureSlugs: ['feat-1'], moduleId: 'mod-1' } };
    var status = null;
    var res = { writeHead: function(c) { status = c; }, end: function() {}, status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePostBulkAssignFeatureModules(req, res, null, ownerPool);
    assert.strictEqual(status, 403);
    assert.strictEqual(pool._assignmentRows.length, 0, 'no assignment row should be written when CSRF is missing');
  });

  await test('POST /products/:id/modules/bulk-assign rejects a mismatched CSRF token (403, zero writes) (AC7)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { featureSlugs: ['feat-1'], moduleId: 'mod-1', _csrf: 'wrong-token' } };
    var status = null;
    var res = { writeHead: function(c) { status = c; }, end: function() {}, status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePostBulkAssignFeatureModules(req, res, null, ownerPool);
    assert.strictEqual(status, 403);
    assert.strictEqual(pool._assignmentRows.length, 0);
  });

  await test('POST /products/:id/modules/bulk-assign succeeds with a valid CSRF token (control case) (AC7)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var moduleRows = [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Governance' }];
    var pool = makeFakeModulesPool({ moduleRows: moduleRows });
    modulesAdapter.setModulesAdapter(pool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { featureSlugs: ['feat-1', 'feat-2'], moduleId: 'mod-1', _csrf: TEST_CSRF } };
    var status = null, body = null;
    var res = { status: function(c) { status = c; return { json: function(b) { body = b; } }; } };
    await productsRoute.handlePostBulkAssignFeatureModules(req, res, null, ownerPool);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.assigned, 2);
    assert.strictEqual(pool._assignmentRows.length, 2);
  });

  await test('POST /products/:id/modules/bulk-assign rejects an empty featureSlugs array (400)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var pool = makeFakeModulesPool();
    modulesAdapter.setModulesAdapter(pool);
    var ownerPool = makeProductsOwnerPool([{ product_id: 'p1', tenant_id: 't1' }]);

    var req = { params: { id: 'p1' }, session: { tenantId: 't1', csrfToken: TEST_CSRF }, body: { featureSlugs: [], moduleId: 'mod-1', _csrf: TEST_CSRF } };
    var status = null;
    var res = { status: function(c) { status = c; return { json: function() {} }; } };
    await productsRoute.handlePostBulkAssignFeatureModules(req, res, null, ownerPool);
    assert.strictEqual(status, 400);
  });

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
