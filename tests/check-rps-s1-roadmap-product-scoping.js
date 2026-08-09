'use strict';

// tests/check-rps-s1-roadmap-product-scoping.js
// rps-s1 -- Scope the Roadmap tab's early-stage artefact scan to the
// product actually being viewed.
// Story: artefacts/2026-08-09-roadmap-product-scoping/stories/rps-s1-roadmap-product-scoping.md
// Test plan: artefacts/2026-08-09-roadmap-product-scoping/test-plans/rps-s1-test-plan.md

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0; var failed = 0;

function makeFixtureDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rps-s1-roadmap-'));
}

function writeArtefactFolder(rootDir, slug, title, created) {
  var featureDir = path.join(rootDir, 'artefacts', slug);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'discovery.md'),
    '# Discovery: ' + title + '\n\n**Created:** ' + created + '\n');
}

(async function() {
  var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products'));
  var repoRootAdapter = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-root'));

  console.log('\n[rps-s1] AC1 -- two products each show only their own roadmap entries');
  await (async function() {
    try {
      var dir = makeFixtureDir();
      writeArtefactFolder(dir, '2026-08-01-product-a-thing', 'Product A Thing', '2026-08-01');
      writeArtefactFolder(dir, '2026-08-01-product-b-thing', 'Product B Thing', '2026-08-01');

      var mockPool = {
        query: async function(sql, params) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) {
            return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          }
          if (/SELECT feature_slug FROM journeys/i.test(sql)) {
            var productId = params[0];
            if (productId === 'p-a') return { rows: [{ feature_slug: '2026-08-01-product-a-thing' }] };
            if (productId === 'p-b') return { rows: [{ feature_slug: '2026-08-01-product-b-thing' }] };
            return { rows: [] };
          }
          return { rows: [] };
        }
      };

      repoRootAdapter.setRepoRoot(dir);

      var htmlA = null;
      await productsRoute.handleGetProductRoadmap(
        { params: { id: 'p-a' }, session: { tenantId: 't1', login: 'x' } },
        { writeHead: function() {}, end: function(body) { htmlA = body; } },
        null, mockPool
      );

      var htmlB = null;
      await productsRoute.handleGetProductRoadmap(
        { params: { id: 'p-b' }, session: { tenantId: 't1', login: 'x' } },
        { writeHead: function() {}, end: function(body) { htmlB = body; } },
        null, mockPool
      );

      repoRootAdapter.setRepoRoot(null);

      assert.ok(/Product A Thing/.test(htmlA), 'Product A roadmap should contain its own entry');
      assert.ok(!/Product B Thing/.test(htmlA), 'Product A roadmap must NOT contain Product B entry');
      assert.ok(/Product B Thing/.test(htmlB), 'Product B roadmap should contain its own entry');
      assert.ok(!/Product A Thing/.test(htmlB), 'Product B roadmap must NOT contain Product A entry');

      passed++; console.log('  [PASS] each product shows only its own roadmap entries');
    } catch (err) {
      failed++; console.log('  [FAIL] AC1 --', err.message);
    }
  })();

  console.log('\n[rps-s1] AC2 -- artefact with no matching journey is excluded from every product');
  await (async function() {
    try {
      var dir = makeFixtureDir();
      writeArtefactFolder(dir, '2026-08-01-orphaned-thing', 'Orphaned Thing', '2026-08-01');

      var mockPool = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) {
            return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          }
          if (/SELECT feature_slug FROM journeys/i.test(sql)) {
            return { rows: [] }; // no journey matches this artefact at all
          }
          return { rows: [] };
        }
      };

      repoRootAdapter.setRepoRoot(dir);
      var html = null;
      await productsRoute.handleGetProductRoadmap(
        { params: { id: 'p-a' }, session: { tenantId: 't1', login: 'x' } },
        { writeHead: function() {}, end: function(body) { html = body; } },
        null, mockPool
      );
      repoRootAdapter.setRepoRoot(null);

      assert.ok(!/Orphaned Thing/.test(html), 'Orphaned artefact (no matching journey) must not appear');
      assert.ok(/Nothing in early-stage discovery right now/.test(html), 'Empty state should render instead');

      passed++; console.log('  [PASS] artefact with no matching journey is excluded');
    } catch (err) {
      failed++; console.log('  [FAIL] AC2 --', err.message);
    }
  })();

  console.log('\n[rps-s1] AC3 -- journeys-lookup query failure fails closed to the empty state');
  await (async function() {
    try {
      var dir = makeFixtureDir();
      writeArtefactFolder(dir, '2026-08-01-should-not-appear', 'Should Not Appear', '2026-08-01');

      var mockPool = {
        query: async function(sql) {
          if (/SELECT name, tenant_id FROM products/i.test(sql)) {
            return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
          }
          if (/SELECT feature_slug FROM journeys/i.test(sql)) {
            throw new Error('simulated transient DB error');
          }
          return { rows: [] };
        }
      };

      repoRootAdapter.setRepoRoot(dir);
      var html = null;
      var threw = false;
      try {
        await productsRoute.handleGetProductRoadmap(
          { params: { id: 'p-a' }, session: { tenantId: 't1', login: 'x' } },
          { writeHead: function() {}, end: function(body) { html = body; } },
          null, mockPool
        );
      } catch (_) { threw = true; }
      repoRootAdapter.setRepoRoot(null);

      assert.strictEqual(threw, false, 'handleGetProductRoadmap must not throw when the journeys lookup fails');
      assert.ok(!/Should Not Appear/.test(html), 'Entry must not appear when the journeys lookup fails');
      assert.ok(/Nothing in early-stage discovery right now/.test(html), 'Empty state should render (fail closed)');

      passed++; console.log('  [PASS] journeys-lookup failure fails closed to the empty state');
    } catch (err) {
      failed++; console.log('  [FAIL] AC3 --', err.message);
    }
  })();

  console.log('\n[rps-s1-roadmap-product-scoping] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
