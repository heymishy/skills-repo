'use strict';
// check-jae-s5-delivery-swimlane-grid.js -- TDD tests for jae-s5 (Epic:
// journey-authoring-delivery-view-grid, 2026-10-14-journey-authoring-experience).
// Story: artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
// Mirrors check-jcx-s6-swimlane-grid.js's own test harness exactly (same
// mock pool shape, same withMockedPipelineState/renderCanvas helpers) --
// not a new pattern.
const assert = require('assert');
const fs = require('fs');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function withMockedPipelineState(jsonString, fn) {
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

function stageRow(id, name, extra) {
  return Object.assign({
    id: id, name: name, position: 0, description: null,
    customer_actions: null, touchpoints: null, channel: null,
    emotion: null, pain_points: null, opportunities: null,
    moment_of_truth: false, position_x: null, position_y: null
  }, extra || {});
}

function makeCanvasMockPool(journeyRow, stageRows, mappingRows) {
  mappingRows = mappingRows || [];
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      if (/^SELECT .* FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder'/.test(s)) {
        return Promise.resolve({ rows: [] });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        var jMatch = journeyRow && params[0] === journeyRow.id;
        return Promise.resolve({ rows: jMatch ? mappingRows : [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

async function renderCanvas(journeyRow, stageRows, mappingRows) {
  const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
  const canvasPool = makeCanvasMockPool(journeyRow, stageRows, mappingRows);
  return withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
    const req = { session: { tenantId: 't1' }, params: { id: journeyRow.id } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleGetJourneyCanvas(req, res, null, canvasPool);
    return res._b.bodyContent;
  });
}

// Scopes a regex match to the Delivery grid's own wrapper only -- the page
// also embeds a full JSON.stringify(stages) blob elsewhere (stageDataJson,
// for the edit side panel), so an unscoped html.indexOf() on stage text is
// a false-positive trap (same one check-jcx-s6-swimlane-grid.js's own
// comment names for the CX grid).
function extractDeliveryGridHtml(html) {
  var startMarker = 'sw-stage-annotations--delivery sw-delivery-swimlane-grid';
  var start = html.indexOf(startMarker);
  assert.ok(start !== -1, 'expected to find the Delivery grid wrapper in the rendered HTML');
  // The wrapper div's own closing point isn't trivially findable by string
  // search alone across nested divs; return from the marker to the next
  // sibling's own id to bound the search window generously.
  var end = html.indexOf('id="sw-stage-reorder-error"', start);
  assert.ok(end !== -1, 'expected to find the sw-stage-reorder-error sibling after the Delivery grid');
  return html.slice(start, end);
}

(async function() {
  // -- AC1: one column per stage, header + 2 data rows share one
  //    grid-template-columns --
  try {
    const stages = [
      stageRow('s1', 'Evaluate'),
      stageRow('s2', 'Discover'),
      stageRow('s3', 'Purchase')
    ];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    const expectedTemplate = 'grid-template-columns:repeat(3, minmax(200px, 1fr))';
    const occurrences = gridHtml.split(expectedTemplate).length - 1;
    assert.strictEqual(occurrences, 3, 'expected the header row + 2 data rows to each carry the identical grid-template-columns string (3 occurrences)');
    assert.ok(gridHtml.indexOf('Coverage status') !== -1, 'expected a "Coverage status" row label');
    assert.ok(gridHtml.indexOf('Mapped features') !== -1, 'expected a "Mapped features" row label');
    pass('AC1: header + 2 data rows share one grid-template-columns, 3 stage columns');
  } catch (e) { fail('AC1: header + 2 data rows share one grid-template-columns, 3 stage columns', e); }

  // -- AC2: zero-mapping stage shows the existing empty-state text --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('<p class="sw-stage-annotations-empty">No features mapped</p>') !== -1,
      'expected the exact existing empty-state markup, byte-identical to buildDeliveryAnnotations\'s own output');
    pass('AC2: zero-mapping stage shows the existing "No features mapped" empty state');
  } catch (e) { fail('AC2: zero-mapping stage shows the existing "No features mapped" empty state', e); }

  // -- AC3: Map feature button reachable and identically wired --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const mappings = [{ id: 'm1', journey_stage_id: 's1', feature_slug: 'f1', metric_keys: [], mapping_state: 'active' }];
    // featuresBySlug is populated from pipeline-state.json features -- the
    // mocked empty {features:[]} means f1 resolves to "not found", which is
    // fine here: we're only asserting the button's own markup/wiring, not
    // the mapping-resolution behaviour (already covered by
    // check-ep2-s2-feature-mapping-save.js).
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, mappings);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('<button type="button" class="sw-stage-map-feature" data-stage-id="s1">Map feature</button>') !== -1,
      'expected the exact existing Map feature button markup inside the grid cell');
    pass('AC3: Map feature button reachable and identically wired inside the grid cell');
  } catch (e) { fail('AC3: Map feature button reachable and identically wired inside the grid cell', e); }

  // -- AC4: Add placeholder form reachable and identically wired --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('<button type="button" class="sw-stage-add-placeholder" data-stage-id="s1">Add placeholder</button>') !== -1,
      'expected the exact existing Add placeholder button markup inside the grid cell');
    assert.ok(gridHtml.indexOf('<form class="sw-placeholder-add-form" data-stage-id="s1">') !== -1,
      'expected the exact existing placeholder-add-form markup inside the grid cell');
    pass('AC4: Add placeholder form reachable and identically wired inside the grid cell');
  } catch (e) { fail('AC4: Add placeholder form reachable and identically wired inside the grid cell', e); }

  // -- AC5: reorder buttons render in the header cell, unchanged wiring,
  //    including the single-stage edge case --
  try {
    const stages = [stageRow('s1', 'Evaluate'), stageRow('s2', 'Discover')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(/data-stage-id="s1" data-direction="up" disabled aria-label="Move stage up"/.test(gridHtml),
      'expected the first stage\'s own "up" button to be disabled');
    assert.ok(/data-stage-id="s2" data-direction="down" disabled aria-label="Move stage down"/.test(gridHtml),
      'expected the last stage\'s own "down" button to be disabled');
    pass('AC5: reorder buttons render in the header cell with correct disabled state');

    const singleStage = [stageRow('s1', 'Evaluate')];
    const singleHtml = await renderCanvas({ id: 'j1', name: 'J', description: null }, singleStage, []);
    const singleGridHtml = extractDeliveryGridHtml(singleHtml);
    assert.ok(singleGridHtml.indexOf('sw-stage-reorder-controls') === -1,
      'expected NO reorder controls at all for a single-stage journey');
    pass('AC5 (edge case): single-stage journey renders no reorder controls');
  } catch (e) { fail('AC5: reorder buttons render in the header cell with correct disabled state', e); }

  // -- AC6: 0-stage journey shows the existing empty-state fallback --
  try {
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, [], []);
    const gridHtml = extractDeliveryGridHtml(html);
    assert.ok(gridHtml.indexOf('No stages yet. Add your first stage.') !== -1,
      'expected the existing 0-stage fallback message');
    assert.ok(gridHtml.indexOf('sw-cx-grid-row') === -1,
      'expected NO grid-row markup at all for a 0-stage journey');
    pass('AC6: 0-stage journey shows the existing empty-state fallback, no empty grid shell');
  } catch (e) { fail('AC6: 0-stage journey shows the existing empty-state fallback, no empty grid shell', e); }

  // -- AC7: one shared accessible list covers every stage --
  try {
    const stages = [
      stageRow('s1', 'Evaluate'),
      stageRow('s2', 'Discover')
    ];
    const mappings = [{ id: 'm1', journey_stage_id: 's1', feature_slug: 'f1', metric_keys: ['k1'], mapping_state: 'active' }];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, mappings);
    const gridHtml = extractDeliveryGridHtml(html);
    const listMatch = gridHtml.match(/<ul class="sw-delivery-a11y-list sw-visually-hidden">([\s\S]*?)<\/ul>/);
    assert.ok(listMatch, 'expected exactly one sw-delivery-a11y-list');
    const liCount = (listMatch[1].match(/<li>/g) || []).length;
    assert.strictEqual(liCount, 2, 'expected exactly one <li> per stage');
    assert.ok(listMatch[1].indexOf('Evaluate') !== -1 && listMatch[1].indexOf('Discover') !== -1,
      'expected both stage names present in document order');
    pass('AC7: one shared accessible list covers every stage, one <li> each');
  } catch (e) { fail('AC7: one shared accessible list covers every stage, one <li> each', e); }

  // -- AC5 (added at /implementation-plan): reorder success reloads,
  //    failure does not (decisions.md 2026-10-15) --
  try {
    const source = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys.js'), 'utf8');
    assert.ok(source.indexOf('document.getElementById("sw-journey-stages")') === -1,
      'expected NO remaining reference to the removed #sw-journey-stages id');
    assert.ok(/querySelector\(".sw-stage-annotations--delivery.sw-delivery-swimlane-grid"\)/.test(source),
      'expected list/jcxList to be re-targeted at the new Delivery grid wrapper');
    assert.ok(/window\.location\.reload\(\)/.test(source),
      'expected a reload call in the reorder success handler');
    assert.ok(source.indexOf('function reorderDom(') === -1,
      'expected the old DOM-move reorderDom function to be removed, not left dead');
    assert.ok(source.indexOf('function getStageIds(') === -1,
      'expected the old getStageIds function to be removed, not left dead');
    assert.ok(source.indexOf('addEventListener("dragstart"') === -1,
      'expected drag-and-drop reordering to be removed from the Delivery grid (out of scope, decisions.md 2026-10-15)');
    pass('AC5: reorder mechanism rewritten -- reload on success, no dead DOM-move code, no drag-and-drop');
  } catch (e) { fail('AC5: reorder mechanism rewritten -- reload on success, no dead DOM-move code, no drag-and-drop', e); }

  // -- Architecture Constraints: #sw-journey-stages and its dead CSS are
  //    actually deleted, not left as unused markup (decisions.md 2026-10-15) --
  try {
    const source = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys.js'), 'utf8');
    assert.ok(source.indexOf('id="sw-journey-stages"') === -1,
      'expected the #sw-journey-stages element itself to be removed from bodyContent');
    assert.ok(source.indexOf('var stagesHtml') === -1,
      'expected the stagesHtml card-loop variable to be removed, not left unused');
    assert.ok(source.indexOf('.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}') === -1,
      'expected the first dead display:none CSS rule to be removed');
    assert.ok(source.indexOf('.sw-journey-canvas--view-customer-experience #sw-journey-stages{display:none}') === -1,
      'expected the second dead display:none CSS rule to be removed');
    pass('Architecture Constraints: #sw-journey-stages and its 2 dead CSS rules are fully removed');
  } catch (e) { fail('Architecture Constraints: #sw-journey-stages and its 2 dead CSS rules are fully removed', e); }

  // -- ADR-028 compliance: both grids call the same canonical shell
  //    builder (source-level assertion, matching architecture-guardrails.md's
  //    own named "Shared-mechanism proof via source assertion" pattern) --
  try {
    const source = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys.js'), 'utf8');
    const shellDefCount = (source.match(/function buildSwimlaneGridShell\(/g) || []).length;
    assert.strictEqual(shellDefCount, 1, 'expected exactly ONE buildSwimlaneGridShell definition');
    const formulaCount = (source.match(/'repeat\(' \+ stagesForGrid\.length \+ ', minmax\(200px, 1fr\)\)'/g) || []).length;
    assert.strictEqual(formulaCount, 1, 'expected the grid-template-columns formula computed in exactly ONE place in the source, not independently re-derived by a second grid function');
    const deliveryCallsShell = /function buildDeliverySwimlaneGrid[\s\S]*?buildSwimlaneGridShell\(/.test(source);
    const cxCallsShell = /function buildCustomerExperienceSwimlaneGrid[\s\S]*?buildSwimlaneGridShell\(/.test(source);
    assert.ok(deliveryCallsShell, 'expected buildDeliverySwimlaneGrid to call buildSwimlaneGridShell');
    assert.ok(cxCallsShell, 'expected buildCustomerExperienceSwimlaneGrid to call buildSwimlaneGridShell');
    pass('ADR-028: both grid functions call the one canonical buildSwimlaneGridShell, formula computed once');
  } catch (e) { fail('ADR-028: both grid functions call the one canonical buildSwimlaneGridShell, formula computed once', e); }

  console.log(`\n[jae-s5-delivery-swimlane-grid] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
