'use strict';

// tests/check-pdt-s4-story-breadcrumb.js — pdt-s4
//
// A story's detail page (/features/:id) could dead-end with no way back --
// confirmed live: a bare "No artefacts found for this feature" page, no
// breadcrumb, no context, especially for an epic-nested story ID (e.g.
// dic.5) that is never itself a journeyStore feature slug. This adds a
// breadcrumb: the common case resolves the Product directly via the
// already-available journeyForPage.productId; the epic-nested case runs a
// tenant-scoped reverse lookup across this tenant's already-synced taxonomy
// (product_rollups.taxonomy) to find the parent product + epic name
// together, degrading gracefully to a bare "Back to product list" link when
// neither resolves.
//
// Covers AC1-AC3 from
// artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s4-test-plan.md.

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

var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
}

function makeRes() {
  var state = { status: 200, body: '' };
  return {
    writeHead: function(code) { state.status = code; },
    end: function(body) { state.body = body || ''; },
    _get: function() { return state; }
  };
}

(async function() {
  // ===========================================================================
  // AC1 -- Product breadcrumb segment for the common (direct-resolve) case
  // ===========================================================================
  await test('AC1: Product breadcrumb segment renders using journeyForPage.productId when resolvable', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql, params) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) {
        return { rows: params[0] === 'product-abc' ? [{ name: 'Acme Product' }] : [] };
      }
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
    var body = res._get().body;
    assert.ok(/Acme Product/.test(body), 'expected the breadcrumb to show the resolved product name, got: ' + body.slice(0, 400));
    assert.ok(/href="\/products\/product-abc"/.test(body), 'expected the product segment to link to /products/product-abc');
  });

  // ===========================================================================
  // AC1a -- Phase/Epic reverse lookup, and graceful degradation
  // ===========================================================================
  await test('AC1a: Phase/Epic segment resolves via reverse lookup when the story is nested in a known feature', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/dic/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return null; }, // dic.5 is not itself a journeyStore feature
      getArtefactsForJourney: async function() { return []; }
    });
    var taxonomy = { groups: [{ epicSlug: 'e1', epicName: 'Discovery Improvements', items: [{ slug: 'dic.5', featureSlug: 'dic' }] }], ungrouped: [] };
    var pool = { query: async function(sql, params) {
      if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) {
        return { rows: params[0] === 't1' ? [{ product_id: 'product-dic', name: 'Discovery Product', taxonomy: taxonomy }] : [] };
      }
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'dic.5', pool);
    var body = res._get().body;
    assert.ok(/Discovery Product/.test(body), 'expected the resolved product name from the reverse lookup');
    assert.ok(/Discovery Improvements/.test(body), 'expected the resolved epic name in the breadcrumb');
    assert.ok(/href="\/products\/product-dic"/.test(body), 'expected the product segment to link to /products/product-dic');
  });

  await test('AC1a: Phase/Epic segment gracefully omits when not resolvable -- no broken breadcrumb', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [], grouped: {}, noArtefacts: true }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return null; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function() { return { rows: [] }; } }; // nothing resolvable anywhere
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    var threw = false;
    try {
      await routes.handleGetFeatureArtefacts(req, res, 'totally-unknown-slug', pool);
    } catch (e) { threw = true; }
    assert.ok(!threw, 'expected no thrown exception for the fully-unresolvable case');
    var body = res._get().body;
    assert.ok(/Back to product list/.test(body), 'expected the bare "Back to product list" fallback link');
    assert.ok(/href="\/dashboard"/.test(body), 'expected the fallback link to target /dashboard');
  });

  // ===========================================================================
  // AC2 -- clicking the product name navigates back to the product page
  // ===========================================================================
  await test('AC2 (integration): the breadcrumb product link resolves to that product page via handleGetProductView', async function() {
    var featuresRoutes = freshRequire(FEATURES_PATH);
    featuresRoutes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    featuresRoutes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql, params) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(sql)) return { rows: [{ name: 'Acme Product', tenant_id: 't1', repo_owner: null, repo_name: null }] };
      if (/FROM product_rollups WHERE product_id/i.test(sql)) return { rows: [] };
      if (/FROM journeys WHERE product_id/i.test(sql)) return { rows: [] };
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await featuresRoutes.handleGetFeatureArtefacts(req, res, 'x', pool);
    var breadcrumbBlock = /<nav aria-label="Breadcrumb"[\s\S]{0,400}?<\/nav>/.exec(res._get().body);
    assert.ok(breadcrumbBlock, 'expected a <nav aria-label="Breadcrumb"> block in the response');
    var breadcrumbHref = /<a href="(\/products\/[^"]+)"/.exec(breadcrumbBlock[0]);
    assert.ok(breadcrumbHref, 'expected a product link href inside the breadcrumb specifically (not elsewhere on the page, e.g. the nav sidebar\'s own /products/new link)');
    assert.strictEqual(breadcrumbHref[1], '/products/product-abc');

    var productsRoutes = freshRequire(PRODUCTS_PATH);
    var req2 = { params: { id: 'product-abc' }, session: { tenantId: 't1', login: 'user' } };
    var res2 = makeRes();
    await productsRoutes.handleGetProductView(req2, res2, null, pool);
    assert.strictEqual(res2._get().status, 200, 'expected the linked product page to resolve with a 200, not a 404');
    assert.ok(/Acme Product/.test(res2._get().body), 'expected the linked product page to be the same product');
  });

  // ===========================================================================
  // AC3 -- no-artefacts case still shows the breadcrumb, never a bare dead end
  // ===========================================================================
  await test('AC3: no-artefacts case still shows the breadcrumb and the honest empty message together', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [], grouped: {}, noArtefacts: true }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql, params) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
    var body = res._get().body;
    assert.ok(/Acme Product/.test(body), 'expected the resolvable breadcrumb segment to still render');
    assert.ok(/No artefacts found for this feature/.test(body), 'expected the existing honest empty-state message to still render');
  });

  // ===========================================================================
  // NFR-Performance -- reverse lookup skipped when the direct path resolves
  // ===========================================================================
  await test('NFR-Performance: the reverse lookup is not attempted when the direct (common-case) path already resolved', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var reverseLookupCalled = false;
    var pool = { query: async function(sql, params) {
      if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) { reverseLookupCalled = true; return { rows: [] }; }
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
    assert.ok(!reverseLookupCalled, 'expected the heavier reverse-lookup query to be skipped entirely when journeyForPage.productId already resolved');
  });

  // ===========================================================================
  // NFR-Accessibility -- breadcrumb segments are real, keyboard-navigable links
  // ===========================================================================
  await test('NFR-Accessibility: breadcrumb segments are real, keyboard-navigable <a> elements', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'x', pool);
    var body = res._get().body;
    assert.ok(/<nav aria-label="Breadcrumb"/.test(body), 'expected a semantic <nav aria-label="Breadcrumb"> wrapper');
    assert.ok(/<a href="\/products\/product-abc"/.test(body), 'expected the product segment to be a real <a href> element, not a span/div with a click handler');
  });

  console.log('\n[check-pdt-s4-story-breadcrumb] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
