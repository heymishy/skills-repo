'use strict';
// check-jcx-s6-swimlane-grid.js -- TDD tests for jcx-s6 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
const assert = require('assert');
const fs = require('fs');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// Mirrors check-jcx-s1-placeholder-feature.js's own withMockedPipelineState.
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

(async function() {
  // -- AC4: customer_actions and touchpoints surfaced as their own rows --
  // Scoped to the real sw-cx-swimlane-grid structure specifically -- the
  // page ALSO embeds a full JSON.stringify(stages) blob elsewhere (for the
  // edit side panel's own client-side population, var stageDataJson at
  // journeys.js's own line ~1143), so a loose html.indexOf() on stage text
  // anywhere in the page is a false positive: it would "pass" by matching
  // that embedded JSON, not a real visible swimlane row. Scoping to the
  // grid container's own markup avoids that trap.
  try {
    const stages = [
      stageRow('s1', 'Evaluate', { customer_actions: 'Compares pricing pages', touchpoints: 'Marketing site' }),
      stageRow('s2', 'Discover', { customer_actions: 'Signs up for trial', touchpoints: 'Onboarding emails' })
    ];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    // Index-bounded substring checks instead of closing-tag regex matching
    // (fragile across arbitrarily-nested divs) -- find each row's own
    // opening marker and the NEXT row's opening marker as bounds, and
    // assert the expected text falls strictly between them.
    var swimlaneGridIdx = html.indexOf('sw-cx-swimlane-grid');
    var journeyStagesIdx = html.indexOf('id="sw-journey-stages"');
    assert.ok(swimlaneGridIdx !== -1, 'expected a sw-cx-swimlane-grid container to exist');
    assert.ok(swimlaneGridIdx < journeyStagesIdx, 'expected the swimlane grid to render before #sw-journey-stages');
    var actionsIdx = html.indexOf('sw-cx-grid-row--actions');
    var touchpointsIdx = html.indexOf('sw-cx-grid-row--touchpoints');
    var painPointsIdx = html.indexOf('sw-cx-grid-row--pain-points');
    assert.ok(actionsIdx !== -1 && touchpointsIdx !== -1 && painPointsIdx !== -1, 'expected actions/touchpoints/pain-points row markers to exist');
    var actionsRowText = html.slice(actionsIdx, touchpointsIdx);
    assert.ok(actionsRowText.indexOf('Compares pricing pages') !== -1, 'expected Evaluate stage\'s own customer_actions text inside the actions row');
    assert.ok(actionsRowText.indexOf('Signs up for trial') !== -1, 'expected Discover stage\'s own customer_actions text inside the actions row');
    var touchpointsRowText = html.slice(touchpointsIdx, painPointsIdx);
    assert.ok(touchpointsRowText.indexOf('Marketing site') !== -1, 'expected Evaluate stage\'s own touchpoints text inside the touchpoints row');
    assert.ok(touchpointsRowText.indexOf('Onboarding emails') !== -1, 'expected Discover stage\'s own touchpoints text inside the touchpoints row');
    pass('AC4: customer_actions and touchpoints render as their own swimlane rows (scoped to the real grid, not the embedded JSON blob)');
  } catch (e) { fail('AC4: customer_actions and touchpoints render as their own swimlane rows (scoped to the real grid, not the embedded JSON blob)', e); }

  // -- AC4 (integration): no query-shape change -- the stage SELECT already included these columns --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    let capturedSql = null;
    const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
    const pool = {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT id, name, position, description/.test(s)) { capturedSql = s; return Promise.resolve({ rows: stages }); }
        if (/^SELECT id, name, description, product_id/.test(s)) { return Promise.resolve({ rows: [{ id: 'j1', name: 'J', description: null }] }); }
        return Promise.resolve({ rows: [] });
      }
    };
    await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      const req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
      const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
      await handleGetJourneyCanvas(req, res, null, pool);
    });
    assert.ok(capturedSql && capturedSql.indexOf('customer_actions') !== -1 && capturedSql.indexOf('touchpoints') !== -1, 'expected the stage SELECT to already include customer_actions/touchpoints -- no query change needed for this story');
    pass('AC4 (integration): no query-shape change -- customer_actions/touchpoints were already queried');
  } catch (e) { fail('AC4 (integration): no query-shape change -- customer_actions/touchpoints were already queried', e); }

  // -- AC5: accessible linear structure covers every stage's full field set, in document order --
  try {
    const stages = [
      stageRow('s1', 'Evaluate', { emotion: 'neutral', pain_points: 'Pricing unclear', opportunities: 'Add calculator', customer_actions: 'Compares prices', touchpoints: 'Marketing site' }),
      stageRow('s2', 'Discover', { emotion: 'positive', pain_points: 'Hard to find pricing', opportunities: 'Add pricing calc', customer_actions: 'Signs up', touchpoints: 'Onboarding emails' })
    ];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    var listMatch = html.match(/<ul class="[^"]*sw-visually-hidden[^"]*"[^>]*>[\s\S]*?<\/ul>/);
    assert.ok(listMatch, 'expected an accessible visually-hidden list structure');
    var listHtml = listMatch[0];
    var evalIdx = listHtml.indexOf('Evaluate');
    var discIdx = listHtml.indexOf('Discover');
    assert.ok(evalIdx !== -1 && discIdx !== -1, 'expected both stage names in the accessible list');
    assert.ok(evalIdx < discIdx, 'expected stages in document order (Evaluate before Discover)');
    assert.ok(listHtml.indexOf('Pricing unclear') !== -1, 'expected pain_points text in the accessible list');
    assert.ok(listHtml.indexOf('Add calculator') !== -1, 'expected opportunities text in the accessible list');
    assert.ok(listHtml.indexOf('Compares prices') !== -1, 'expected customer_actions text in the accessible list');
    assert.ok(listHtml.indexOf('Marketing site') !== -1, 'expected touchpoints text in the accessible list');
    assert.ok(listHtml.indexOf('neutral') !== -1 && listHtml.indexOf('positive') !== -1, 'expected emotion text in the accessible list');
    pass('AC5: accessible linear structure covers every stage\'s full field set, in document order');
  } catch (e) { fail('AC5: accessible linear structure covers every stage\'s full field set, in document order', e); }

  // -- AC6: Customer experience container carries a distinct class from Delivery's --
  try {
    const stages = [stageRow('s1', 'Evaluate')];
    const html = await renderCanvas({ id: 'j1', name: 'J', description: null }, stages, []);
    assert.ok(html.indexOf('sw-cx-swimlane-grid') !== -1, 'expected the sw-cx-swimlane-grid class to be present on the Customer experience container');
    // Confirm the Delivery container (sw-stage-annotations--delivery) never carries this class --
    // a simple scoped check since both class strings never overlap by construction.
    var deliveryBlockMatch = html.match(/<div class="sw-stage-annotations sw-stage-annotations--delivery[^"]*"/g) || [];
    deliveryBlockMatch.forEach(function(block) {
      assert.ok(block.indexOf('sw-cx-swimlane-grid') === -1, 'expected no Delivery container to carry the CX-only sw-cx-swimlane-grid class');
    });
    pass('AC6: Customer experience container carries sw-cx-swimlane-grid, Delivery containers do not');
  } catch (e) { fail('AC6: Customer experience container carries sw-cx-swimlane-grid, Delivery containers do not', e); }

  console.log(`\n[jcx-s6-swimlane-grid] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
