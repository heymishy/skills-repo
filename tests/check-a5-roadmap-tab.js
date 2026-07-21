'use strict';

// tests/check-a5-roadmap-tab.js
// a5 -- Surface discovery-only and ideation-only work in a Roadmap tab
// Story: artefacts/2026-07-21-web-ui-experience-redesign/stories/a5-roadmap-tab.md
// Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a5-test-plan.md

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0; var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; console.log('  [FAIL]', name, '--', err.message);
  }
}

function makeFixtureDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'a5-roadmap-'));
}

var roadmapScan = require(path.resolve(__dirname, '../src/web-ui/modules/roadmap-scan'));

console.log('\n[a5] scanRoadmapArtefacts exists');
test('roadmap-scan.js exports scanRoadmapArtefacts', function() {
  assert.strictEqual(typeof roadmapScan.scanRoadmapArtefacts, 'function');
});

console.log('\n[a5] AC1 -- discovery-only artefact with no pipeline-state entry is roadmap-eligible');
test('a feature with only discovery.md and no pipeline-state entry is detected', function() {
  var dir = makeFixtureDir();
  var featureDir = path.join(dir, '2026-05-01-widget-thing');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'discovery.md'),
    '# Discovery: Widget Thing\n\n**Status:** Approved\n**Created:** 2026-05-01\n');
  var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].slug, '2026-05-01-widget-thing');
  assert.strictEqual(result[0].title, 'Widget Thing');
  assert.strictEqual(result[0].stage, 'Discovery');
  assert.strictEqual(result[0].date, '2026-05-01');
});

console.log('\n[a5] AC2 -- ideate-only artefact gets a distinct stage label');
test('a feature with only ideate.md is labelled "Ideate only", distinct from "Discovery"', function() {
  var dir = makeFixtureDir();
  var featureDir = path.join(dir, '2026-05-02-gizmo-idea');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'ideate.md'),
    '# Ideation Artefact -- Gizmo Idea\n\n**Session date:** 2026-05-02\n');
  var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].stage, 'Ideate only');
  assert.notStrictEqual(result[0].stage, 'Discovery');
});

test('a feature with BOTH discovery.md and ideate.md is still labelled "Ideate only" (AC2: "with or without a corresponding discovery.md")', function() {
  var dir = makeFixtureDir();
  var featureDir = path.join(dir, '2026-05-05-both-artefacts');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Both Artefacts\n**Created:** 2026-05-05\n');
  fs.writeFileSync(path.join(featureDir, 'ideate.md'), '# Ideation Artefact -- Both Artefacts\n**Session date:** 2026-05-05\n');
  var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].stage, 'Ideate only');
});

console.log('\n[a5] AC3 -- already-tracked feature is excluded');
test('a feature already tracked in pipeline-state.json does not appear', function() {
  var dir = makeFixtureDir();
  var featureDir = path.join(dir, '2026-05-03-tracked-feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Tracked Feature\n**Created:** 2026-05-03\n');
  var pipelineState = { features: [{ slug: '2026-05-03-tracked-feature', stage: 'definition' }] };
  var result = roadmapScan.scanRoadmapArtefacts(dir, pipelineState);
  assert.strictEqual(result.length, 0);
});

console.log('\n[a5] AC4 -- zero early-stage artefacts returns an empty array, not an error');
test('an empty artefacts directory returns [] with no exception', function() {
  var dir = makeFixtureDir();
  var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
  assert.deepStrictEqual(result, []);
});

test('a non-existent artefacts directory returns [] with no exception', function() {
  var result = roadmapScan.scanRoadmapArtefacts(path.join(os.tmpdir(), 'a5-does-not-exist-' + Date.now()), { features: [] });
  assert.deepStrictEqual(result, []);
});

console.log('\n[a5] NFR -- artefact scan completes in under 1 second for 100 feature folders');
test('scanRoadmapArtefacts scans 100 feature folders in under 1 second', function() {
  var dir = makeFixtureDir();
  for (var i = 0; i < 100; i++) {
    var featureDir = path.join(dir, '2026-01-01-feature-' + i);
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Feature ' + i + '\n**Created:** 2026-01-01\n');
  }
  var start = Date.now();
  var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
  var elapsedMs = Date.now() - start;
  assert.strictEqual(result.length, 100);
  assert.ok(elapsedMs < 1000, 'Expected scan to complete in under 1000ms, took ' + elapsedMs + 'ms');
});

console.log('\n[a5] products.js exports handleGetProductRoadmap');
test('products.js exports handleGetProductRoadmap', function() {
  var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products'));
  assert.strictEqual(typeof productsRoute.handleGetProductRoadmap, 'function');
});

console.log('\n[a5] server.js registers GET /products/:id/roadmap');
test('server.js references handleGetProductRoadmap and the /roadmap route pattern', function() {
  var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
  assert.ok(/handleGetProductRoadmap/.test(serverSrc), 'Expected server.js to import/use handleGetProductRoadmap');
  assert.ok(/products\\\/\[\^\/\]\+\\\/roadmap/.test(serverSrc), 'Expected a /products/:id/roadmap route pattern');
});

(async function() {
  console.log('\n[a5] AC4 -- Roadmap tab renders the empty state cleanly when the scan returns nothing');
  await (async function() {
    try {
      var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products'));
      var repoRootAdapter = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-root'));
      var dir = makeFixtureDir();
      var mockPool = { query: async function(sql) {
        if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
        return { rows: [] };
      } };
      repoRootAdapter.setRepoRoot(dir);
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRoute.handleGetProductRoadmap(req, res, null, mockPool);
      repoRootAdapter.setRepoRoot(null);
      if (!/Nothing in early-stage discovery right now/.test(html)) {
        throw new Error('Expected empty-state text, got: ' + (html && html.slice(0, 200)));
      }
      passed++; console.log('  [PASS] Roadmap tab renders the empty state cleanly (AC4)');
    } catch (err) {
      failed++; console.log('  [FAIL] empty roadmap state --', err.message);
    }
  })();

  console.log('\n[a5] AC1 -- Roadmap tab renders a real discovery-only entry with its stage pill');
  await (async function() {
    try {
      var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products'));
      var repoRootAdapter = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-root'));
      var dir = makeFixtureDir();
      var featureDir = path.join(dir, '2026-05-04-real-thing');
      fs.mkdirSync(featureDir, { recursive: true });
      fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Real Thing\n**Created:** 2026-05-04\n');
      var mockPool = { query: async function(sql) {
        if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
        return { rows: [] };
      } };
      repoRootAdapter.setRepoRoot(dir);
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRoute.handleGetProductRoadmap(req, res, null, mockPool);
      repoRootAdapter.setRepoRoot(null);
      if (!/Real Thing/.test(html) || !/Discovery/.test(html) || !/2026-05-04/.test(html)) {
        throw new Error('Expected title/stage/date, got: ' + (html && html.slice(0, 300)));
      }
      passed++; console.log('  [PASS] Roadmap tab renders a real discovery-only entry with title, stage pill, and date (AC1)');
    } catch (err) {
      failed++; console.log('  [FAIL] discovery-only rendering --', err.message);
    }
  })();

  console.log('\n[a5] AC3 -- Roadmap tab excludes a feature already tracked in pipeline-state.json (integration)');
  await (async function() {
    try {
      var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products'));
      var repoRootAdapter = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-root'));
      var dir = makeFixtureDir();
      var featureDir = path.join(dir, '2026-05-06-tracked-integration');
      fs.mkdirSync(featureDir, { recursive: true });
      fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Tracked Integration\n**Created:** 2026-05-06\n');
      fs.mkdirSync(path.join(dir, '..', '.github-a5-unused'), { recursive: true }); // no-op, keeps structure explicit
      var githubDir = path.join(dir, '.github');
      fs.mkdirSync(githubDir, { recursive: true });
      fs.writeFileSync(path.join(githubDir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: '2026-05-06-tracked-integration' }] }));
      var mockPool = { query: async function(sql) {
        if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
        return { rows: [] };
      } };
      repoRootAdapter.setRepoRoot(dir);
      var html = null;
      var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
      var res = { writeHead: function() {}, end: function(body) { html = body; } };
      await productsRoute.handleGetProductRoadmap(req, res, null, mockPool);
      repoRootAdapter.setRepoRoot(null);
      if (/Tracked Integration/.test(html)) {
        throw new Error('Expected the already-tracked feature to be excluded, but it appeared in the rendered page');
      }
      passed++; console.log('  [PASS] Roadmap tab excludes an already-tracked feature (AC3, integration)');
    } catch (err) {
      failed++; console.log('  [FAIL] already-tracked exclusion (integration) --', err.message);
    }
  })();

  console.log('\n[a5-roadmap-tab] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
