'use strict';

// tests/check-fps-s1-progress-proxy.js -- fps-s1
// Story: artefacts/2026-07-25-feature-display-name-and-progress/stories/fps-s1-progress-proxy-for-unknown-health.md
// Test plan: artefacts/2026-07-25-feature-display-name-and-progress/test-plans/fps-s1-progress-proxy-test-plan.md
//
// Covers:
//   AC1: unknown health + N>0 artefacts -> stage + count label
//   AC2: unknown health + 0 artefacts -> stage + "no artefacts yet"
//   AC3: unknown health, no journeyId -> plain fallback text
//   AC4: bulk read throws -> graceful fallback, no page break
//   AC5: green/amber/red rows completely unchanged
//   AC6: exactly one batched call per render

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

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function baseRollupRow(healthPerFeature, testCoveragePerFeature) {
  return {
    health_counts: { perFeature: healthPerFeature || [] },
    test_coverage: { perFeature: testCoveragePerFeature || [], noData: !(testCoveragePerFeature && testCoveragePerFeature.length) },
    ac_coverage: {},
    taxonomy: { groups: [], ungrouped: [] },
    synced_at: new Date().toISOString()
  };
}

(async function() {
  var modulesAdapter = require(MODULES_ADAPTER_PATH);
  modulesAdapter.setModulesAdapter({ query: async function() { return { rows: [] }; } });

  // ===========================================================================
  // AC1/AC2 -- unknown health + artefact counts
  // ===========================================================================
  await test('unknownHealthWithArtefactsShowsStageAndCount (AC1)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'definition', health: 'green' }];
    var rollupRow = baseRollupRow([], []); // no perFeature entry for feat-1 -> defaults to 'unknown'
    var html = productsRoute._renderProductView('P', 'p1', features, 'login', rollupRow, false, 'o', 'r', [], 'csrf', {}, { j1: 3 });
    assert.ok(/definition\s*·\s*3 artefacts/.test(html), 'expected "definition · 3 artefacts" in output, got: ' + html.match(/data-a4-coverage[^<]*</)[0]);
  });

  await test('unknownHealthWithZeroArtefactsShowsNoArtefactsYet (AC2)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var features = [{ journey_id: 'j2', featureSlug: 'feat-2', stage: 'definition', health: 'green' }];
    var rollupRow = baseRollupRow([], []);
    var html = productsRoute._renderProductView('P', 'p1', features, 'login', rollupRow, false, 'o', 'r', [], 'csrf', {}, { j2: 0 });
    assert.ok(/definition\s*·\s*no artefacts yet/.test(html), 'expected "definition · no artefacts yet" in output');
  });

  // ===========================================================================
  // AC3 -- no resolvable journeyId falls back to plain text
  // ===========================================================================
  await test('unknownHealthNoJourneyIdFallsBackToPlainText (AC3)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    // Taxonomy-only item: comes through mergeFeatureSources with no journeyId.
    var rollupRow = baseRollupRow([], []);
    rollupRow.taxonomy = { groups: [], ungrouped: [{ slug: 'tax-only-1', name: 'Tax Only' }] };
    var html = productsRoute._renderProductView('P', 'p1', [], 'login', rollupRow, false, 'o', 'r', [], 'csrf', {}, { 'some-other-journey': 5 });
    assert.ok(html.indexOf('No test data yet') !== -1, 'expected the plain fallback text for a no-journeyId item');
  });

  await test('unknownHealthWithJourneyIdNotInCountsMapFallsBackToPlainText (AC3/AC4)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var features = [{ journey_id: 'j-missing', featureSlug: 'feat-missing', stage: 'discovery', health: 'green' }];
    var rollupRow = baseRollupRow([], []);
    var html = productsRoute._renderProductView('P', 'p1', features, 'login', rollupRow, false, 'o', 'r', [], 'csrf', {}, {});
    assert.ok(html.indexOf('No test data yet') !== -1, 'expected the plain fallback when the counts map has no entry for this journey');
  });

  // ===========================================================================
  // AC4 -- missing/undefined counts map (bulk read failure at the caller) never throws
  // ===========================================================================
  await test('bulkReadFailureDoesNotBreakPageRender (AC4)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var features = [{ journey_id: 'j3', featureSlug: 'feat-3', stage: 'discovery', health: 'green' }];
    var rollupRow = baseRollupRow([], []);
    var html;
    assert.doesNotThrow(function() {
      // No 12th arg at all -- simulates the caller's own try/catch defaulting to {} (or omitting it).
      html = productsRoute._renderProductView('P', 'p1', features, 'login', rollupRow, false, 'o', 'r', [], 'csrf', {});
    });
    assert.ok(html.indexOf('No test data yet') !== -1, 'expected graceful plain-text fallback, not a crash');
  });

  // ===========================================================================
  // AC5 -- real health values completely unchanged
  // ===========================================================================
  await test('realHealthRowsUnchanged (AC5)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var features = [
      { journey_id: 'jg', featureSlug: 'feat-green', stage: 'discovery', health: 'green' },
      { journey_id: 'ja', featureSlug: 'feat-amber', stage: 'discovery', health: 'amber' },
      { journey_id: 'jr', featureSlug: 'feat-red', stage: 'discovery', health: 'red' }
    ];
    var rollupRow = baseRollupRow(
      [
        { slug: 'feat-green', health: 'green' },
        { slug: 'feat-amber', health: 'amber' },
        { slug: 'feat-red', health: 'red' }
      ],
      [
        { slug: 'feat-green', percentage: 90 },
        { slug: 'feat-amber', percentage: 40 }
        // feat-red deliberately has no coverage % entry -- still must NOT get the progress proxy
      ]
    );
    // Artefact counts present for ALL of them -- proves they're ignored for non-unknown health.
    var html = productsRoute._renderProductView('P', 'p1', features, 'login', rollupRow, false, 'o', 'r', [], 'csrf', {}, { jg: 5, ja: 5, jr: 5 });

    assert.ok(html.indexOf('90%') !== -1, 'expected green feature to keep its real 90% label');
    assert.ok(html.indexOf('40%') !== -1, 'expected amber feature to keep its real 40% label');
    assert.ok(html.indexOf('No test data yet') !== -1, 'expected red feature (real signal, no pct) to keep the plain fallback, not a progress proxy');
    assert.ok(!/discovery\s*·\s*5 artefact/.test(html), 'expected no progress-proxy wording for any real-health row');
  });

  // ===========================================================================
  // AC6 -- exactly one batched call per render (integration, via handleGetProductView)
  // ===========================================================================
  await test('exactlyOneBatchedCallPerRender (AC6)', async function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var callCount = 0;
    productsRoute.setGetArtefactCountsBulk(async function(journeyIds) {
      callCount++;
      var map = {};
      (journeyIds || []).forEach(function(id) { map[id] = 2; });
      return map;
    });

    var journeyRows = [
      { journey_id: 'j1', feature_slug: 'f1', stage: 'discovery' },
      { journey_id: 'j2', feature_slug: 'f2', stage: 'discovery' },
      { journey_id: 'j3', feature_slug: 'f3', stage: 'discovery' },
      { journey_id: 'j4', feature_slug: 'f4', stage: 'discovery' },
      { journey_id: 'j5', feature_slug: 'f5', stage: 'discovery' }
    ];
    var pool = {
      query: async function(sql) {
        if (/FROM products WHERE/.test(sql)) return { rows: [{ product_id: 'p1', name: 'P', tenant_id: 'tenant-1', repo_owner: null, repo_name: null }] };
        if (/FROM journeys WHERE/.test(sql)) return { rows: journeyRows };
        if (/product_rollup/.test(sql)) return { rows: [] };
        return { rows: [] };
      }
    };
    var req = { params: { id: 'p1' }, session: { tenantId: 'tenant-1', login: 'u' } };
    var res = {
      _status: null, _body: '',
      writeHead: function(s) { res._status = s; },
      end: function(b) { res._body += (b || ''); }
    };
    await productsRoute.handleGetProductView(req, res, null, pool);

    assert.strictEqual(res._status, 200, 'expected the render to actually succeed, not fail silently before reaching the bulk read');
    assert.strictEqual(callCount, 1, 'expected exactly 1 batched call to _getArtefactCountsBulk regardless of the ' + journeyRows.length + ' features, got ' + callCount);
  });

  console.log('\n[fps-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
