'use strict';
// check-ep2-s1-feature-picker.js -- TDD tests for ep2-s1 (Epic 2, customer-journey
// feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Same "extract the real script, run it in real jsdom against a real render"
// technique as pflx-s2 (tests/check-pflx-s2-default-active-only-filter.js).
// Extracts ONLY the second <script> block (the one ep2-s1 Task 2 added,
// containing swFilterFeaturePicker) -- not the first (stage-panel/reorder)
// script, which needs DOM elements this test does not set up.
function extractFeaturePickerScript(html) {
  var marker = 'var fpModal=document.getElementById("sw-feature-picker-modal");';
  var idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the feature-picker filter script to be present in the rendered HTML');
  var start = html.lastIndexOf('<script>', idx);
  var end = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

/**
 * @param {object} journeyRow {id, name, description}
 * @param {Array<object>} stageRows full-row stage data for handleGetJourneyCanvas's own render
 */
function makeCanvasMockPool(journeyRow, stageRows) {
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function makeMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = {
    status: function(c) { this._s = c; return this; },
    json: function(b) { this._b = b; },
    _s: 200, _b: null
  };
  return { req: req, res: res };
}

function withMockedPipelineState(jsonStringOrThrow, fn) {
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) {
      if (typeof jsonStringOrThrow === 'function') { return jsonStringOrThrow(); }
      return jsonStringOrThrow;
    }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  // ── AC1 -- feature picker modal lists features from pipeline-state.json with name and slug ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A' },
      { slug: 'feat-b', name: 'Feature B' }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Feature A') !== -1 && out.indexOf('feat-a') !== -1, 'expected Feature A / feat-a in rendered HTML');
    assert.ok(out.indexOf('Feature B') !== -1 && out.indexOf('feat-b') !== -1, 'expected Feature B / feat-b in rendered HTML');
    pass('AC1 -- feature picker modal lists features from pipeline-state.json with name and slug');
  } catch (e) { fail('AC1 -- feature picker modal lists features from pipeline-state.json with name and slug', e); }

  // ── AC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('No features found') !== -1, 'expected a zero-features message');
    assert.ok(out.indexOf('could not be loaded') === -1, 'zero-features state must NOT show the AC3 error text');
    pass('AC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state');
  } catch (e) { fail('AC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state', e); }

  // ── AC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT) ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState(function() { throw new Error('ENOENT: no such file'); }, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Features could not be loaded. Check that pipeline-state.json exists.') !== -1, 'expected the exact AC3 error text');
    pass('AC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT)');
  } catch (e) { fail('AC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT)', e); }

  // ── AC3 -- same explicit error state when pipeline-state.json contains invalid JSON ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState('{not valid json', async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Features could not be loaded. Check that pipeline-state.json exists.') !== -1, 'expected the exact AC3 error text on JSON.parse failure');
    pass('AC3 -- same explicit error state when pipeline-state.json contains invalid JSON');
  } catch (e) { fail('AC3 -- same explicit error state when pipeline-state.json contains invalid JSON', e); }

  // ── (shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path ──
  try {
    var src = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys'), 'utf8');
    assert.ok(src.indexOf('_repoRootAdapter.getRepoRoot(req)') !== -1, 'expected a call to _repoRootAdapter.getRepoRoot(req)');
    assert.ok(/\.github['"],\s*['"]pipeline-state\.json/.test(src), "expected a path.join(..., '.github', 'pipeline-state.json') construction");
    pass('(shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path');
  } catch (e) { fail('(shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path', e); }

  // ── AC2 -- feature picker includes a filter/search input wired to the rendered list ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A' },
      { slug: 'feat-b', name: 'Feature B' }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(/<input[^>]*oninput="swFilterFeaturePicker\(\)"/.test(out), 'expected a filter <input> with an oninput handler');
    assert.ok(out.indexOf('data-slug="feat-a"') !== -1 && out.indexOf('data-name="feature a"') !== -1, 'expected data-slug/data-name attributes on the rendered item');
    pass('AC2 -- feature picker includes a filter/search input wired to the rendered list');
  } catch (e) { fail('AC2 -- feature picker includes a filter/search input wired to the rendered list', e); }

  // ── AC2 (behavioral) -- swFilterFeaturePicker actually hides non-matching items and toggles the empty-state message ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A' },
      { slug: 'feat-b', name: 'Feature B' },
      { slug: 'other-x', name: 'Something Else' }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var scriptSrc = extractFeaturePickerScript(out);
    var dom = new JSDOM('<!DOCTYPE html><html><body>' + out + '</body></html>', {
      runScripts: 'outside-only',
      url: 'http://localhost/journeys/j1'
    });
    dom.window.eval(scriptSrc);
    var win = dom.window;
    var doc = win.document;

    function items() { return Array.prototype.slice.call(doc.querySelectorAll('.sw-feature-picker-item')); }
    function isHidden(el) { return el.classList.contains('sw-feature-picker-item--hidden'); }
    function byDataSlug(slug) { return items().find(function(el) { return el.getAttribute('data-slug') === slug; }); }

    // Before any filtering: all 3 items visible, empty message not shown.
    assert.strictEqual(items().length, 3, 'expected 3 rendered feature-picker items');
    items().forEach(function(el) { assert.strictEqual(isHidden(el), false, 'expected no item hidden before filtering'); });
    var emptyEl = doc.getElementById('sw-feature-picker-empty');
    assert.notStrictEqual(emptyEl.style.display, 'block', 'expected the empty-state message not to be shown before filtering');

    // Filter to "feat" -- the two feat-* items stay visible, other-x hides.
    doc.getElementById('sw-feature-picker-search').value = 'feat';
    win.swFilterFeaturePicker();
    assert.strictEqual(isHidden(byDataSlug('feat-a')), false, 'expected feat-a to remain visible when filtering for "feat"');
    assert.strictEqual(isHidden(byDataSlug('feat-b')), false, 'expected feat-b to remain visible when filtering for "feat"');
    assert.strictEqual(isHidden(byDataSlug('other-x')), true, 'expected other-x to be hidden when filtering for "feat"');

    // Filter to something matching nothing -- all items hide, empty message shows.
    doc.getElementById('sw-feature-picker-search').value = 'zzz-no-match';
    win.swFilterFeaturePicker();
    items().forEach(function(el) { assert.strictEqual(isHidden(el), true, 'expected all items hidden when nothing matches'); });
    assert.strictEqual(emptyEl.style.display, 'block', 'expected the empty-state message to be shown when nothing matches');

    // Clear the search -- all items become visible again, empty message hides again.
    doc.getElementById('sw-feature-picker-search').value = '';
    win.swFilterFeaturePicker();
    items().forEach(function(el) { assert.strictEqual(isHidden(el), false, 'expected all items visible again once the search is cleared'); });
    assert.strictEqual(emptyEl.style.display, 'none', 'expected the empty-state message to be hidden again once the search is cleared');

    pass('AC2 (behavioral) -- swFilterFeaturePicker actually hides non-matching items and toggles the empty-state message');
  } catch (e) { fail('AC2 (behavioral) -- swFilterFeaturePicker actually hides non-matching items and toggles the empty-state message', e); }

  // ── AC4 -- closing the picker without selecting a feature issues no write ──
  try {
    var src = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys'), 'utf8');
    var modalScriptStart = src.indexOf('sw-feature-picker-close');
    assert.ok(modalScriptStart !== -1, 'expected the feature-picker close button to be wired in the script');
    var scriptSection = src.slice(src.indexOf('fpModal'), src.indexOf('fpModal') + 1200);
    assert.ok(scriptSection.indexOf('fetch(') === -1, 'expected no fetch( call anywhere in the feature-picker close-handling script section');
    assert.ok(scriptSection.indexOf('POST') === -1, 'expected no POST anywhere in the feature-picker close-handling script section');
    pass('AC4 -- closing the picker without selecting a feature issues no write');
  } catch (e) { fail('AC4 -- closing the picker without selecting a feature issues no write', e); }

  // ── AC4 (behavioral) -- clicking "Map feature" opens the modal and focuses search; close button closes it, issues no fetch, and restores focus ──
  try {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      { id: 's1', name: 'Stage 1', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }
    ]);
    var featuresJson = JSON.stringify({ features: [
      { slug: 'feat-a', name: 'Feature A' }
    ] });
    var out = await withMockedPipelineState(featuresJson, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    var scriptSrc = extractFeaturePickerScript(out);
    var dom = new JSDOM('<!DOCTYPE html><html><body>' + out + '</body></html>', {
      runScripts: 'outside-only',
      url: 'http://localhost/journeys/j1'
    });
    dom.window.eval(scriptSrc);
    var win = dom.window;
    var doc = win.document;

    var mapBtn = doc.querySelector('.sw-stage-map-feature');
    assert.ok(mapBtn, 'expected a .sw-stage-map-feature button in the rendered DOM');
    mapBtn.focus();
    mapBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

    var modalEl = doc.getElementById('sw-feature-picker-modal');
    assert.strictEqual(modalEl.classList.contains('sw-feature-picker-modal--open'), true, 'expected the modal to have the --open class after clicking Map feature');
    assert.strictEqual(modalEl.getAttribute('aria-hidden'), 'false', 'expected aria-hidden="false" after opening');
    assert.strictEqual(doc.activeElement, doc.getElementById('sw-feature-picker-search'), 'expected focus to move to the search input after opening');

    var closeBtn = doc.getElementById('sw-feature-picker-close');
    assert.ok(closeBtn, 'expected a close button in the rendered DOM');
    closeBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

    assert.strictEqual(modalEl.classList.contains('sw-feature-picker-modal--open'), false, 'expected the --open class to be removed after closing');
    assert.strictEqual(modalEl.getAttribute('aria-hidden'), 'true', 'expected aria-hidden="true" after closing');
    assert.strictEqual(doc.activeElement, mapBtn, 'expected focus to return to the triggering Map feature button after closing');

    pass('AC4 (behavioral) -- clicking Map feature opens the modal and focuses search; close button closes it and restores focus');
  } catch (e) { fail('AC4 (behavioral) -- clicking Map feature opens the modal and focuses search; close button closes it and restores focus', e); }

  console.log(`\n[ep2-s1-feature-picker] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
