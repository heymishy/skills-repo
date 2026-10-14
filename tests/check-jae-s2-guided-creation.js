'use strict';
// check-jae-s2-guided-creation.js -- unit tests for jae-s2
// (Epic: journey-authoring-guided-creation, 2026-10-14-journey-authoring-experience).
//
// Covers: AC1 (panel auto-opens after a successful stage-name save), AC2
// (focus moves to the first editable field), AC3 (closing the auto-opened
// panel without further input leaves the stage saved with just its name),
// AC4 (active view unchanged, no reload), AC5 (resolves review 1-H1 --
// openPanel resets the save-indicator's stale state on every open).
//
// Reuses check-jcx-s7-panel-feedback-and-polish.js's own extractFirstScript/
// buildDom jsdom pattern.
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
  } catch (e) { /* ignore in jsdom versions that disallow redefining location.reload */ }
  dom.window.__reloadCalled = function() { return reloadCalled; };
  dom.window.eval(scriptSrc);
  return dom;
}

function jsonResponse(ok, body) {
  return Promise.resolve({ ok: ok, json: function() { return Promise.resolve(body); }, status: ok ? 200 : 400 });
}

async function addStageAndSave(win, name) {
  var addBtn = win.document.getElementById('sw-add-stage-btn');
  addBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  var input = win.document.querySelector('.sw-stage-name-input');
  input.value = name;
  input.dispatchEvent(new win.Event('blur'));
  await new Promise(function(resolve) { win.setTimeout(resolve, 0); });
  await new Promise(function(resolve) { win.setTimeout(resolve, 0); });
}

(async function() {
  // AC1: panel opens automatically after a successful stage-name save
  try {
    var bodyContent = await renderCanvas([]);
    var dom = buildDom(bodyContent, function() { return jsonResponse(true, { id: 's9', name: 'New stage', position: 0 }); });
    var win = dom.window;
    await addStageAndSave(win, 'New stage');
    var panel = win.document.getElementById('sw-stage-panel');
    assert.ok(panel.classList.contains('sw-stage-panel--open'), 'expected the panel to open automatically after the save succeeds');
    pass('jae-s2 AC1: panel opens automatically after a successful stage-name save');
  } catch (e) { fail('jae-s2 AC1: panel opens automatically after a successful stage-name save', e); }

  // AC2: focus moves to the first editable field
  try {
    var bodyContent2 = await renderCanvas([]);
    var dom2 = buildDom(bodyContent2, function() { return jsonResponse(true, { id: 's9', name: 'New stage', position: 0 }); });
    var win2 = dom2.window;
    await addStageAndSave(win2, 'New stage');
    assert.strictEqual(win2.document.activeElement, win2.document.getElementById('sw-stage-field-description'), 'expected focus to move to the description field on auto-open');
    pass('jae-s2 AC2: focus moves to the first editable field on auto-open');
  } catch (e) { fail('jae-s2 AC2: focus moves to the first editable field on auto-open', e); }

  // AC3: closing the auto-opened panel without further input leaves the stage saved with just its name
  try {
    var bodyContent3 = await renderCanvas([]);
    var fetchCallCount = 0;
    var dom3 = buildDom(bodyContent3, function() {
      fetchCallCount++;
      return jsonResponse(true, { id: 's9', name: 'New stage', position: 0 });
    });
    var win3 = dom3.window;
    await addStageAndSave(win3, 'New stage');
    var callsBeforeClose = fetchCallCount;
    var closeBtn = win3.document.getElementById('sw-stage-panel-close');
    closeBtn.dispatchEvent(new win3.MouseEvent('click', { bubbles: true }));
    var panel3 = win3.document.getElementById('sw-stage-panel');
    assert.ok(!panel3.classList.contains('sw-stage-panel--open'), 'expected the panel to close');
    var card3 = win3.document.querySelector('.sw-stage-card[data-stage-id="s9"]');
    assert.ok(card3 && card3.textContent.indexOf('New stage') !== -1, 'expected the stage card to still show its own name after closing');
    assert.strictEqual(fetchCallCount, callsBeforeClose, 'expected no additional PATCH request -- no field was touched, so autosave never fired');
    pass('jae-s2 AC3: closing the auto-opened panel without further input leaves the stage saved with just its name');
  } catch (e) { fail('jae-s2 AC3: closing the auto-opened panel without further input leaves the stage saved with just its name', e); }

  // AC4: active view unchanged, no reload
  try {
    var bodyContent4 = await renderCanvas([]);
    var dom4 = buildDom(bodyContent4, function() { return jsonResponse(true, { id: 's9', name: 'New stage', position: 0 }); });
    var win4 = dom4.window;
    var canvasRoot4 = win4.document.querySelector('.sw-journey-canvas');
    var cxBtn = win4.document.querySelector('.sw-canvas-view-toggle-btn[data-view="customer-experience"]');
    cxBtn.dispatchEvent(new win4.MouseEvent('click', { bubbles: true }));
    assert.ok(canvasRoot4.className.indexOf('sw-journey-canvas--view-customer-experience') !== -1, 'expected the Customer-experience view to be active before adding a stage');
    await addStageAndSave(win4, 'New stage');
    assert.strictEqual(win4.__reloadCalled(), false, 'expected window.location.reload to never be called');
    assert.ok(canvasRoot4.className.indexOf('sw-journey-canvas--view-customer-experience') !== -1, 'expected the active view to remain Customer-experience after the auto-open, not reset to Canvas');
    pass('jae-s2 AC4: active view unchanged, reload never called');
  } catch (e) { fail('jae-s2 AC4: active view unchanged, reload never called', e); }

  // AC5 (resolves review 1-H1): openPanel resets the save-indicator's stale state on every open
  try {
    var bodyContent5 = await renderCanvas([
      { id: 's1', name: 'Stage 1', position: 0 },
      { id: 's2', name: 'Stage 2', position: 1 }
    ]);
    var dom5 = buildDom(bodyContent5, function() { return jsonResponse(true, {}); });
    var win5 = dom5.window;

    // Stage 1: successful save -> indicator shows "Saved".
    var link1 = win5.document.querySelector('.sw-cx-grid-cell--header[data-stage-id="s1"] .sw-stage-edit') ||
                win5.document.querySelector('.sw-stage-edit[data-stage-id="s1"]');
    link1.dispatchEvent(new win5.MouseEvent('click', { bubbles: true }));
    var field1 = win5.document.getElementById('sw-stage-field-pain_points');
    field1.value = 'stage 1 value';
    field1.dispatchEvent(new win5.Event('blur'));
    await new Promise(function(resolve) { win5.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win5.setTimeout(resolve, 0); });
    var indicator5 = win5.document.getElementById('sw-stage-panel-saved');
    assert.strictEqual(indicator5.textContent, 'Saved', 'expected stage 1\'s save to succeed');
    win5.document.getElementById('sw-stage-panel-close').dispatchEvent(new win5.MouseEvent('click', { bubbles: true }));

    // Stage 2: fails -> indicator shows "Failed to save -- Retry".
    dom5.window.fetch = function() { return jsonResponse(false, { error: 'boom' }); };
    var link2 = win5.document.querySelector('.sw-stage-edit[data-stage-id="s2"]');
    link2.dispatchEvent(new win5.MouseEvent('click', { bubbles: true }));
    var field2 = win5.document.getElementById('sw-stage-field-pain_points');
    field2.value = 'stage 2 value';
    field2.dispatchEvent(new win5.Event('blur'));
    await new Promise(function(resolve) { win5.setTimeout(resolve, 0); });
    await new Promise(function(resolve) { win5.setTimeout(resolve, 0); });
    assert.ok(/Failed to save/.test(indicator5.textContent), 'expected stage 2\'s save to fail');
    win5.document.getElementById('sw-stage-panel-close').dispatchEvent(new win5.MouseEvent('click', { bubbles: true }));

    // Now add a brand-new, third stage -- the indicator must be fully reset.
    dom5.window.fetch = function() { return jsonResponse(true, { id: 's3', name: 'New stage', position: 2 }); };
    await addStageAndSave(win5, 'New stage');
    assert.strictEqual(indicator5.textContent, '', 'expected the indicator text to be empty for a stage that has never been edited');
    assert.ok(!indicator5.classList.contains('sw-stage-panel-saved--error'), 'expected no stale --error class from stage 2');
    assert.ok(!indicator5.classList.contains('sw-stage-panel-saved--visible'), 'expected no stale --visible class carried over');
    pass('jae-s2 AC5: openPanel resets the save-indicator\'s stale state on every open (resolves review 1-H1)');
  } catch (e) { fail('jae-s2 AC5: openPanel resets the save-indicator\'s stale state on every open (resolves review 1-H1)', e); }

  console.log('\n[jae-s2-guided-creation] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
