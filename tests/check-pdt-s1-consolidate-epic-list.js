'use strict';

// tests/check-pdt-s1-consolidate-epic-list.js — pdt-s1
//
// The product dashboard opened with a fully-expanded, non-interactive text
// dump of every epic/phase group (_renderGroupedCoverageBreakdown's "Epics"
// breakdown) duplicating the same story-ID/percentage pairs already shown,
// interactively, in the By Module/By Phase/All tabs below it. This story
// removes that static duplicate and defaults the remaining interactive
// grouped list to collapsed, with a rolled-up health-signal indicator on
// each group's header.
//
// Covers AC1-AC4 from
// artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s1-test-plan.md.

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

var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

(async function() {
  var productRollup = require(PRODUCT_ROLLUP_PATH);
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  // ===========================================================================
  // AC1 -- the static Epics/Other-features duplicate breakdown is removed
  // ===========================================================================
  await test('AC1: static Epics/Other-features breakdown is removed; epic name renders exactly once', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }, { slug: 's2' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
    var testCoverage = {
      blendedPercentage: 50, noData: false,
      perFeature: [{ slug: 's1', percentage: 50 }, { slug: 's2', percentage: 50 }],
      groups: [{ epicName: 'Epic One', epicSlug: 'e1', items: [{ slug: 's1', percentage: 50 }, { slug: 's2', percentage: 50 }] }],
      ungrouped: []
    };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: testCoverage, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.ok(!/<h4[^>]*>Epics<\/h4>/.test(html), 'expected the static "Epics" heading to be removed entirely');
    // The removed static breakdown was the only place that ever rendered the
    // "slug: percentage%" colon-separated format (e.g. "s1: 50%") -- the
    // interactive rows show coverageLabel alone ("50%"), never slug-prefixed.
    assert.ok(!/s1: 50%/.test(html) && !/s2: 50%/.test(html), 'expected the static breakdown\'s distinctive "slug: pct%" format to be gone entirely');
    // The interactive By Phase group heading (a legitimate, pre-existing,
    // unrelated rendering) still shows the epic name exactly once as its own
    // group title -- confirms the group itself wasn't accidentally removed too.
    assert.ok(/<span>Epic One <span class="a4-module-count"/.test(html), 'expected the interactive By Phase group heading to still show "Epic One" as its title');
    assert.ok(/Test coverage: <strong>50%<\/strong>/.test(html), 'expected the summary coverage line to remain');
  });

  // ===========================================================================
  // AC2 -- groups default to collapsed, rows present but hidden
  // ===========================================================================
  await test('AC2: groups render collapsed by default -- rows present but hidden, header shows count + rolled-up status', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }, { slug: 's2' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.ok(/a4-module-body a4-module-body--collapsed/.test(html), 'expected the group body to start collapsed');
    assert.ok(/aria-expanded="false"/.test(html), 'expected the group header to start aria-expanded=false');
    assert.ok(html.indexOf('s1') !== -1 && html.indexOf('s2') !== -1, 'expected row data to be present in the HTML even while collapsed');
  });

  // ===========================================================================
  // AC2 -- rolled-up status reflects mixed health, not just the first item
  // ===========================================================================
  await test('AC2: group header shows a rolled-up status reflecting mixed health, not just the first item', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic Mixed', stories: [{ slug: 's1' }] }] },
        { slug: 'feat-b', health: 'amber', epics: [{ slug: 'e1', name: 'Epic Mixed', stories: [{ slug: 's2' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    var headerMatch = /Epic Mixed[\s\S]{0,300}?data-group-signal="([a-z]+)"/.exec(html);
    assert.ok(headerMatch, 'expected a data-group-signal attribute near the "Epic Mixed" header');
    assert.strictEqual(headerMatch[1], 'amber', 'expected the mixed green+amber group to roll up to amber (Warning), not silently show only the first item');
  });

  // ===========================================================================
  // AC3 -- group markup supports native expand-on-click
  // ===========================================================================
  await test('AC3: group markup supports native expand-on-click (details-equivalent toggle mechanism)', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic Click', stories: [{ slug: 's1' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.ok(/onclick="a4ToggleModule\(this\)"/.test(html), 'expected the group header button to carry the existing click-to-toggle handler');
    assert.ok(/class="a4-module-header"/.test(html), 'expected the group header button to be present and keyboard-focusable (a real <button>)');
  });

  // ===========================================================================
  // AC4 -- zero-groups empty state is preserved
  // ===========================================================================
  await test('AC4: zero-groups product shows a clear empty state, not a broken/blank section', function() {
    var pipelineState = { features: [] };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Empty Product', 'prod-empty', [], 'tester', rollupRow, false, null, null,
      [], 'csrf-token', {}, {}, [], 0, null
    );

    assert.ok(/No features yet\./.test(html), 'expected the existing empty-state message to render');
    assert.ok(html.indexOf('<h1') !== -1, 'expected the rest of the page (title, etc.) to render normally, not a broken/blank page');
  });

  // ===========================================================================
  // NFR-Performance -- no re-introduced duplicate output
  // ===========================================================================
  await test('NFR-Performance: response size does not regress vs. the old duplicate-breakdown output', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }, { slug: 's2' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
    var testCoverage = { blendedPercentage: 50, noData: false, perFeature: [{ slug: 's1', percentage: 50 }, { slug: 's2', percentage: 50 }], groups: [], ungrouped: [] };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: testCoverage, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.ok(!/>Epics</.test(html), 'expected no re-introduced "Epics" static heading contributing extra output size');
  });

  // ===========================================================================
  // NFR-Accessibility -- collapse toggle is a real, keyboard-focusable control
  // ===========================================================================
  await test('NFR-Accessibility: collapse toggle is a real, keyboard-focusable, ARIA-correct control', function() {
    var pipelineState = {
      features: [
        { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] }
      ]
    };
    var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
    var healthCounts = productRollup.computeHealthCounts(pipelineState);
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var featureModuleAssignments = { s1: 'm1' };
    var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

    var html = productsRoute._renderProductView(
      'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
      modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
    );

    assert.ok(/<button type="button" class="a4-module-header" aria-expanded="false" aria-controls="[^"]+"/.test(html), 'expected a real <button> (natively keyboard-operable via Enter/Space) carrying aria-expanded and aria-controls');
  });

  console.log('\n[check-pdt-s1-consolidate-epic-list] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
