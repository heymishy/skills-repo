'use strict';

// tests/check-wnl-s3-dashboard-no-product-entry.js — wnl-s3
// Story: artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
// Test plan: artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s3-test-plan.md
//
// AC1-AC6 integration tests for the /dashboard no-product-work entry point.

var path = require('path');
var fs = require('fs');
var os = require('os');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('[wnl-s3] PASS: ' + name); },
    function(err) { failed++; console.log('[wnl-s3] FAIL: ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var REPO_ROOT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

var productsRoute = require(PRODUCTS_ROUTE_PATH);
var repoRootAdapter = require(REPO_ROOT_ADAPTER_PATH);
var journeyStore = require(JOURNEY_STORE_PATH);

// ── Fixture helpers ──────────────────────────────────────────────────────────

function makePool(noProductRows, productRows) {
  return {
    query: async function(sql) {
      if (/SELECT product_id, name, created_at FROM products/.test(sql)) {
        return { rows: productRows || [] };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/.test(sql)) {
        return { rows: [] };
      }
      if (/product_id IS NULL/.test(sql)) {
        return { rows: noProductRows || [] };
      }
      return { rows: [] };
    }
  };
}

function makeRes() {
  var html = null;
  return { html: function() { return html; }, writeHead: function() {}, end: function(b) { html = b; } };
}

function makeFixtureRepoRoot(features) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wnl-s3-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.github', 'pipeline-state.json'),
    JSON.stringify({ features: features }, null, 2),
    'utf8'
  );
  return dir;
}

function makeReq(tenantId) {
  return { session: { tenantId: tenantId }, query: {} };
}

// Ensure journey-store's own in-memory map is never empty (avoids its D37
// "no adapter configured" throw) and gives us a known, real featureSlug to
// use as the "already has a journey" case in AC4's negative test.
var KNOWN_JOURNEY_SLUG = 'wnl-s3-test-known-journey-' + Date.now();
journeyStore.createJourney(KNOWN_JOURNEY_SLUG, 'default');

(async function() {
  // ===========================================================================
  // AC1 — entry point shown for a real Postgres no-product journey
  // ===========================================================================

  await test('entry-point-shown-for-postgres-no-product-journey (AC1)', async function() {
    var tmpRoot = makeFixtureRepoRoot([]); // no pipeline-state features involved in this case
    repoRootAdapter.setRepoRoot(tmpRoot);
    var pool = makePool([{ journey_id: 'j1' }], []);
    var req = makeReq('tenant-ac1');
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    assertTrue(res.html().indexOf('No product work') !== -1, 'expected the No product work entry point to appear');
  });

  // ===========================================================================
  // AC2 — entry point shown for a CLI-only, not-yet-backfilled feature
  // (the story's own primary root-cause fix — Postgres count is 0 here)
  // ===========================================================================

  await test('entry-point-shown-for-cli-only-unbackfilled-feature (AC2)', async function() {
    var cliOnlySlug = 'wnl-s3-test-cli-only-' + Date.now();
    var tmpRoot = makeFixtureRepoRoot([
      { slug: cliOnlySlug, name: 'A CLI-only feature', stage: 'discovery', updatedAt: '2026-09-10T00:00:00.000Z' }
    ]);
    repoRootAdapter.setRepoRoot(tmpRoot);
    var pool = makePool([], []); // 0 Postgres no-product rows -- a naive Postgres-only check would show nothing here
    var req = makeReq('tenant-ac2');
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    assertTrue(res.html().indexOf('No product work') !== -1, 'expected the entry point even though Postgres reports 0 no-product journeys -- this is the exact bug this story fixes');
  });

  // ===========================================================================
  // AC3 — entry point links to the existing /journey no-product list
  // ===========================================================================

  await test('entry-point-links-to-existing-journey-no-product-list (AC3)', async function() {
    var tmpRoot = makeFixtureRepoRoot([]);
    repoRootAdapter.setRepoRoot(tmpRoot);
    var pool = makePool([{ journey_id: 'j1' }], []);
    var req = makeReq('tenant-ac3');
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    var html = res.html();
    var segments = html.split('<a ');
    var ownSegment = segments.find(function(seg) { return seg.indexOf('No product work') !== -1; });
    assertTrue(!!ownSegment, 'expected the entry point to be present');
    var hrefMatch = ownSegment.match(/^href="([^"]*)"/);
    assertTrue(!!hrefMatch, 'expected the entry point\'s own <a> tag to start with href=');
    assertTrue(hrefMatch[1] === '/journey', 'expected the entry point to link to /journey, not a new route (got: ' + (hrefMatch && hrefMatch[1]) + ')');
  });

  // ===========================================================================
  // AC4 — no entry point when there's genuinely no no-product work
  // ===========================================================================

  await test('no-entry-point-when-genuinely-empty (AC4)', async function() {
    // Fixture's only feature is the one already known to journey-store (KNOWN_JOURNEY_SLUG) --
    // it must NOT be treated as unbackfilled.
    var tmpRoot = makeFixtureRepoRoot([
      { slug: KNOWN_JOURNEY_SLUG, name: 'Already has a journey', stage: 'discovery', updatedAt: '2026-09-10T00:00:00.000Z' }
    ]);
    repoRootAdapter.setRepoRoot(tmpRoot);
    var pool = makePool([], []); // 0 Postgres no-product rows
    var req = makeReq('tenant-ac4');
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    assertTrue(res.html().indexOf('No product work') === -1, 'expected no entry point when neither Postgres nor pipeline-state has genuine no-product work');
  });

  // ===========================================================================
  // AC5 (regression guard) — existing product cards unaffected
  // ===========================================================================

  await test('existing-product-cards-unaffected (AC5)', async function() {
    var tmpRoot = makeFixtureRepoRoot([]);
    repoRootAdapter.setRepoRoot(tmpRoot);
    var pool = makePool([], [
      { product_id: 'p1', name: 'Acme', created_at: '2026-09-01T00:00:00.000Z' }
    ]);
    var req = makeReq('tenant-ac5');
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    var html = res.html();
    assertTrue(html.indexOf('href="/products/p1"') !== -1, 'expected the existing product card link to render unchanged');
    assertTrue(html.indexOf('Acme') !== -1, 'expected the existing product name to render unchanged');
  });

  // ===========================================================================
  // AC6 (regression guard) — sidebar's own existing "No product" link unaffected
  // ===========================================================================

  await test('sidebar-no-product-link-unaffected (AC6)', async function() {
    var tmpRoot = makeFixtureRepoRoot([]);
    repoRootAdapter.setRepoRoot(tmpRoot);
    var pool = makePool([{ journey_id: 'j1' }], []);
    var req = makeReq('tenant-ac6');
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    var html = res.html();
    assertTrue(html.indexOf('sw-product-nav-item--no-product') !== -1, 'expected the sidebar\'s own existing "No product" nav item to still render');
  });

  repoRootAdapter.setRepoRoot(null);

  console.log('\n[wnl-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
