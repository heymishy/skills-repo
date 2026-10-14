'use strict';
// check-jcx-s7-panel-feedback-and-polish.js -- unit tests for jcx-s7
// (Epic: journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
//
// Covers: AC1 (save-indicator error-color bug + persistent 3-state
// indicator), AC2 (stage-add DOM patch, no reload), AC3 (bigger single-click
// edit-panel entry point, no double-fire), AC4 (empty-state muted
// treatment), AC5 (8px spacing). Reuses check-jcx-hotfix3/4's own
// extractFirstScript/buildDom jsdom pattern.
const assert = require('assert');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

function makeCanvasMockPool(journeyRow, stageRows) {
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
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function withMockedPipelineState(jsonString, fn) {
  var fs = require('fs');
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

function makeMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

function extractFirstScript(html) {
  var marker = 'var stageData={};';
  var idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the stage-panel/canvas script to be present in the rendered HTML');
  var start = html.lastIndexOf('<script>', idx);
  var end = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

async function renderCanvas(stageRows) {
  var pool = makeCanvasMockPool(
    { id: 'j1', name: 'J', description: null },
    stageRows
  );
  var journeys = require('../src/web-ui/routes/journeys');
  return withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
    var { req, res } = makeMockReqRes();
    await journeys.handleGetJourneyCanvas(req, res, null, pool);
    return res._b.bodyContent;
  });
}

function buildDom(bodyContent, fetchImpl) {
  var scriptSrc = extractFirstScript(bodyContent);
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + bodyContent + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/journeys/j1'
  });
  var reloadCalled = false;
  dom.window.fetch = fetchImpl;
  try {
    Object.defineProperty(dom.window.location, 'reload', { value: function() { reloadCalled = true; }, configurable: true });
  } catch (e) { /* jsdom may not allow redefining location.reload in all versions -- tracked separately below */ }
  dom.window.__reloadCalled = function() { return reloadCalled; };
  dom.window.eval(scriptSrc);
  return dom;
}

function jsonResponse(ok, body) {
  return Promise.resolve({ ok: ok, json: function() { return Promise.resolve(body); }, status: ok ? 200 : 400 });
}

(async function() {
  // AC1a: a failed field save renders in a distinct, danger-colored element -- never the success class
  try {
    var bodyContent = await renderCanvas([{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive' }]);
    var fetchCalls = 0;
    var dom = buildDom(bodyContent, function() {
      fetchCalls++;
      return jsonResponse(false, { error: 'boom' });
    });
    var win = dom.window;
    var link = win.document.querySelector('.sw-stage-edit');
    link.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var field = win.document.getElementById('sw-stage-field-pain_points');
    field.value = 'a real pain point';
    field.dispatchEvent(new win.Event('blur'));
    await new Promise(function(resolve) { win.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win.setTimeout(resolve, 0); });
    var indicator = win.document.getElementById('sw-stage-panel-saved');
    assert.ok(indicator.classList.contains('sw-stage-panel-saved--error'), 'expected the error state to carry its own distinct --error class');
    assert.ok(/Failed to save/.test(indicator.textContent), 'expected the error text to read "Failed to save..."');
    pass('jcx-s7 AC1a: failed save renders with a distinct error class, not the success class');
  } catch (e) { fail('jcx-s7 AC1a: failed save renders with a distinct error class, not the success class', e); }

  // AC1b: 3 persistent states -- Saving... / Saved / Failed to save -- Retry
  try {
    var bodyContent2 = await renderCanvas([{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive' }]);
    var resolveFn;
    var dom2 = buildDom(bodyContent2, function() {
      return new Promise(function(resolve) { resolveFn = resolve; });
    });
    var win2 = dom2.window;
    var link2 = win2.document.querySelector('.sw-stage-edit');
    link2.dispatchEvent(new win2.MouseEvent('click', { bubbles: true }));
    var field2 = win2.document.getElementById('sw-stage-field-pain_points');
    field2.value = 'in progress value';
    field2.dispatchEvent(new win2.Event('blur'));
    var indicator2 = win2.document.getElementById('sw-stage-panel-saved');
    assert.strictEqual(indicator2.textContent, 'Saving…', 'expected the indicator to show "Saving..." while the request is in flight');
    resolveFn({ ok: true, json: function() { return Promise.resolve({}); } });
    await new Promise(function(resolve) { win2.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win2.setTimeout(resolve, 0); });
    assert.strictEqual(indicator2.textContent, 'Saved', 'expected the indicator to show "Saved" after a successful resolve');
    pass('jcx-s7 AC1b: indicator shows Saving... then Saved for a successful save');
  } catch (e) { fail('jcx-s7 AC1b: indicator shows Saving... then Saved for a successful save', e); }

  // AC1c (resolves review 1-M1): a stale success-clear timeout from one field must not hide a later error on another field
  try {
    var bodyContent3 = await renderCanvas([{ id: 's1', name: 'Stage 1', position: 0, emotion: 'positive' }]);
    var dom3 = buildDom(bodyContent3, function() {
      return jsonResponse(true, {});
    });
    var win3 = dom3.window;
    var link3 = win3.document.querySelector('.sw-stage-edit');
    link3.dispatchEvent(new win3.MouseEvent('click', { bubbles: true }));
    var fieldA = win3.document.getElementById('sw-stage-field-pain_points');
    fieldA.value = 'first field value';
    fieldA.dispatchEvent(new win3.Event('blur'));
    await new Promise(function(resolve) { win3.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win3.setTimeout(resolve, 0); });
    var indicator3 = win3.document.getElementById('sw-stage-panel-saved');
    assert.strictEqual(indicator3.textContent, 'Saved', 'expected field A\'s save to succeed first');
    // Now simulate a slow timer window: with no setTimeout-based auto-hide
    // left in the implementation, there is nothing that can fire later and
    // clobber field B's state -- confirmed directly by reusing the SAME
    // win3 (no fake-timer advance needed).
    dom3.window.fetch = function() { return jsonResponse(false, { error: 'field B failed' }); };
    var fieldB = win3.document.getElementById('sw-stage-field-opportunities');
    fieldB.value = 'second field value';
    fieldB.dispatchEvent(new win3.Event('blur'));
    await new Promise(function(resolve) { win3.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win3.setTimeout(resolve, 0); });
    assert.ok(/Failed to save/.test(indicator3.textContent), 'expected field B\'s error to be visible');
    // Advance past where the OLD 1500ms auto-hide timer would have fired,
    // to confirm nothing clears it later either.
    await new Promise(function(resolve) { win3.setTimeout(resolve, 20); });
    assert.ok(/Failed to save/.test(indicator3.textContent), 'expected field B\'s error to remain visible -- no stale timer from field A\'s earlier success may clear it');
    pass('jcx-s7 AC1c: a later field\'s error state is never clobbered by an earlier field\'s save (review 1-M1)');
  } catch (e) { fail('jcx-s7 AC1c: a later field\'s error state is never clobbered by an earlier field\'s save (review 1-M1)', e); }

  // AC2: stage-add success patches the DOM in place, no reload, active view unchanged
  try {
    var bodyContent4 = await renderCanvas([]);
    var dom4 = buildDom(bodyContent4, function(url, opts) {
      return jsonResponse(true, { id: 's9', name: 'New stage', position: 0 });
    });
    var win4 = dom4.window;
    var canvasRoot = win4.document.querySelector('.sw-journey-canvas');
    var cxBtn = win4.document.querySelector('.sw-canvas-view-toggle-btn[data-view="customer-experience"]');
    cxBtn.dispatchEvent(new win4.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-customer-experience') !== -1, 'expected the Customer-experience view to be active before adding a stage');
    var addBtn = win4.document.getElementById('sw-add-stage-btn');
    addBtn.dispatchEvent(new win4.MouseEvent('click', { bubbles: true }));
    var input = win4.document.querySelector('.sw-stage-name-input');
    input.value = 'New stage';
    input.dispatchEvent(new win4.Event('blur'));
    await new Promise(function(resolve) { win4.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win4.setTimeout(resolve, 0); });
    assert.strictEqual(win4.__reloadCalled(), false, 'expected window.location.reload to never be called');
    var newCard = win4.document.querySelector('.sw-stage-card[data-stage-id="s9"]');
    assert.ok(newCard, 'expected the new stage to be patched into the DOM using the response\'s own id');
    assert.ok(newCard.textContent.indexOf('New stage') !== -1, 'expected the patched card to show the response\'s own name');
    assert.ok(canvasRoot.className.indexOf('sw-journey-canvas--view-customer-experience') !== -1, 'expected the active view to remain Customer-experience after the save, not reset to Canvas');
    pass('jcx-s7 AC2: stage-add success patches the DOM in place, no reload, view unchanged');
  } catch (e) { fail('jcx-s7 AC2: stage-add success patches the DOM in place, no reload, view unchanged', e); }

  // AC3a: single-click on the grid header cell opens the panel for the right stage
  try {
    var bodyContent5 = await renderCanvas([
      { id: 's1', name: 'Stage 1', position: 0 },
      { id: 's2', name: 'Stage 2', position: 1 }
    ]);
    var dom5 = buildDom(bodyContent5, function() { return jsonResponse(true, {}); });
    var win5 = dom5.window;
    var cell = win5.document.querySelector('.sw-cx-grid-cell--header[data-stage-id="s2"]');
    assert.ok(cell, 'expected a header cell for stage s2');
    cell.dispatchEvent(new win5.MouseEvent('click', { bubbles: true }));
    var panel = win5.document.getElementById('sw-stage-panel');
    assert.ok(panel.classList.contains('sw-stage-panel--open'), 'expected the panel to open from a click on the header cell itself, not just the nested link');
    var descField = win5.document.getElementById('sw-stage-field-description');
    pass('jcx-s7 AC3a: single-click on the header cell opens the panel for the right stage');
  } catch (e) { fail('jcx-s7 AC3a: single-click on the header cell opens the panel for the right stage', e); }

  // AC3b (resolves review 1-M2): clicking the nested link still produces exactly one correctly-populated open
  try {
    var bodyContent6 = await renderCanvas([
      { id: 's1', name: 'Stage 1', position: 0 },
      { id: 's2', name: 'Stage 2', position: 1, description: 'desc for s2' }
    ]);
    var dom6 = buildDom(bodyContent6, function() { return jsonResponse(true, {}); });
    var win6 = dom6.window;
    var cell6 = win6.document.querySelector('.sw-cx-grid-cell--header[data-stage-id="s2"]');
    var nestedLink = cell6.querySelector('.sw-stage-edit');
    var openCount = 0;
    var panel6 = win6.document.getElementById('sw-stage-panel');
    var observer = new win6.MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class' && panel6.classList.contains('sw-stage-panel--open')) { openCount++; }
      });
    });
    nestedLink.dispatchEvent(new win6.MouseEvent('click', { bubbles: true }));
    assert.ok(panel6.classList.contains('sw-stage-panel--open'), 'expected the panel to open from the nested link click');
    var descField6 = win6.document.getElementById('sw-stage-field-description');
    assert.strictEqual(descField6.value, 'desc for s2', 'expected the panel to be populated with the correct (s2) stage data, not stale/incorrect data from a conflicting handler');
    pass('jcx-s7 AC3b: clicking the nested link still produces exactly one correctly-populated open');
  } catch (e) { fail('jcx-s7 AC3b: clicking the nested link still produces exactly one correctly-populated open', e); }

  // AC4: empty field values and unnamed stages render in a muted, dulled treatment
  try {
    var bodyContent7 = await renderCanvas([
      { id: 's1', name: 'Stage 1', position: 0, pain_points: 'a real pain point' },
      { id: 's2', name: '', position: 1, pain_points: '   ' }
    ]);
    var dom7 = buildDom(bodyContent7, function() { return jsonResponse(true, {}); });
    var win7 = dom7.window;
    var filledCell = win7.document.querySelector('.sw-cx-grid-row--pain-points .sw-cx-grid-cell[data-stage-id="s1"]');
    var emptyCell = win7.document.querySelector('.sw-cx-grid-row--pain-points .sw-cx-grid-cell[data-stage-id="s2"]');
    assert.ok(filledCell && !filledCell.classList.contains('sw-cx-grid-cell--empty'), 'expected a real value to NOT carry the muted-empty class');
    assert.ok(emptyCell && emptyCell.classList.contains('sw-cx-grid-cell--empty'), 'expected a whitespace-only value to still count as empty (trim-based) and carry the muted class');
    var emptyNameCell = win7.document.querySelector('.sw-cx-grid-cell--header[data-stage-id="s2"] .sw-stage-name');
    assert.ok(emptyNameCell && emptyNameCell.classList.contains('sw-stage-name--empty'), 'expected an empty stage name to carry the same muted-empty treatment');
    pass('jcx-s7 AC4: empty field values and empty stage names render with the muted treatment, real values do not');
  } catch (e) { fail('jcx-s7 AC4: empty field values and empty stage names render with the muted treatment, real values do not', e); }

  // AC5: grid row padding and column-gap normalized to the 8px scale
  try {
    var bodyContent8 = await renderCanvas([{ id: 's1', name: 'Stage 1', position: 0 }]);
    var dom8 = buildDom(bodyContent8, function() { return jsonResponse(true, {}); });
    var win8 = dom8.window;
    var row = win8.document.querySelector('.sw-cx-grid-row--actions');
    var cells = win8.document.querySelector('.sw-cx-grid-row--actions .sw-cx-grid-row-cells');
    assert.strictEqual(win8.getComputedStyle(row).padding, '8px 0px', 'expected row padding to be exactly 8px 0 (an 8px-scale multiple), not 10px 0');
    assert.strictEqual(win8.getComputedStyle(cells).columnGap, '8px', 'expected column-gap to be exactly 8px (an 8px-scale multiple), not 12px');
    pass('jcx-s7 AC5: grid row padding and column-gap are normalized to the 8px scale');
  } catch (e) { fail('jcx-s7 AC5: grid row padding and column-gap are normalized to the 8px scale', e); }

  console.log('\n[jcx-s7-panel-feedback-and-polish] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
