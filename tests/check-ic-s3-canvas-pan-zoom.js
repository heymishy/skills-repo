'use strict';
// check-ic-s3-canvas-pan-zoom.js -- TDD tests for ic-s3 (Epic: canvas-replacement-for-journey-stages,
// 2026-10-10-infinite-canvas). Story: artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
// Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s3-test-plan.md
//
// Unlike ic-s1/ic-s2's own tests (which only inspect generated HTML/script
// as TEXT), these tests actually EXECUTE the real generated output against
// the real drawflow library in jsdom, following the established pattern
// from tests/check-csd-s1-derisk-canvas-mermaid.js (new JSDOM(html,
// {runScripts:'outside-only'}) + dom.window.eval(scriptSrc)) -- because
// this story's own ACs are about real library behaviour (editor.zoom,
// editor.canvas_x/y actually changing), which text inspection cannot prove.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

function stageRow(id, name, position, extra) {
  return Object.assign({ id, name, position, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false, position_x: null, position_y: null }, extra || {});
}
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

const DRAWFLOW_SRC = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'drawflow', 'dist', 'drawflow.min.js'), 'utf8');

/**
 * Builds a real, executing jsdom instance from the real handleGetJourneyCanvas
 * output, with a real captured handle to the real drawflow editor instance.
 * Returns { dom, win, editor, container }. Caller must call dom.window.close().
 */
async function buildRealCanvas(stageRows) {
  const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, stageRows);
  const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
  let html = null;
  const res = { writeHead: function() {}, end: function(body) { html = body; } };
  await handleGetJourneyCanvas(req, res, null, pool);

  const scriptMatches = [...html.matchAll(/<script(?: src="[^"]*")?>([\s\S]*?)<\/script>/g)];
  const initScript = scriptMatches.map(function(m) { return m[1]; }).find(function(s) { return s && s.indexOf('__icS1NodeIds') !== -1; });
  if (!initScript) { throw new Error('could not find the drawflow canvas init script in the generated HTML'); }

  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/journeys/j1' });
  const win = dom.window;

  dom.window.eval(DRAWFLOW_SRC);
  dom.window.eval(
    'var __RealDrawflow = window.Drawflow;' +
    'window.Drawflow = function(el) { var inst = new __RealDrawflow(el); window.__testEditor = inst; return inst; };' +
    'window.Drawflow.prototype = __RealDrawflow.prototype;'
  );
  dom.window.eval(initScript);

  const editor = win.__testEditor;
  const container = win.document.getElementById('sw-drawflow-canvas');
  return { dom: dom, win: win, editor: editor, container: container };
}

(async function() {
  // -- AC1: Ctrl+scroll zooms, plain scroll does not -----------------------
  try {
    const { dom, editor, container, win } = await buildRealCanvas([stageRow('s1', 'Discover', 0), stageRow('s2', 'Evaluate', 1)]);
    assert.strictEqual(editor.zoom, 1, 'expected default zoom of 1');
    const wheelCtrl = new win.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true });
    container.dispatchEvent(wheelCtrl);
    assert.notStrictEqual(editor.zoom, 1, 'expected editor.zoom to change after a Ctrl+scroll WheelEvent');
    const zoomAfterCtrl = editor.zoom;
    const wheelPlain = new win.WheelEvent('wheel', { ctrlKey: false, deltaY: -100, bubbles: true, cancelable: true });
    container.dispatchEvent(wheelPlain);
    assert.strictEqual(editor.zoom, zoomAfterCtrl, 'expected editor.zoom to be UNCHANGED after a plain (non-Ctrl) scroll');
    dom.window.close();
    pass('AC1: Ctrl+scroll zooms the canvas; plain scroll does not');
  } catch (e) { fail('AC1: Ctrl+scroll zooms the canvas; plain scroll does not', e); }

  // -- AC2: dragging empty canvas space pans the view -----------------------
  try {
    const { dom, editor, container, win } = await buildRealCanvas([stageRow('s1', 'Discover', 0), stageRow('s2', 'Evaluate', 1)]);
    assert.strictEqual(editor.canvas_x, 0, 'expected default canvas_x of 0');
    assert.strictEqual(editor.canvas_y, 0, 'expected default canvas_y of 0');
    // Empty space: well away from both auto-layout nodes (idx*220, 120) and
    // their ~200px-wide boxes -- a point that is not inside any node element.
    const emptyX = 2000, emptyY = 2000;
    function fire(type, x, y) {
      const ev = new win.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
      container.dispatchEvent(ev);
    }
    fire('mousedown', emptyX, emptyY);
    fire('mousemove', emptyX + 150, emptyY + 90);
    fire('mouseup', emptyX + 150, emptyY + 90);
    assert.notStrictEqual(editor.canvas_x, 0, 'expected editor.canvas_x to change after dragging empty canvas space');
    assert.notStrictEqual(editor.canvas_y, 0, 'expected editor.canvas_y to change after dragging empty canvas space');
    dom.window.close();
    pass('AC2: dragging empty canvas space pans the view (editor.canvas_x/y change)');
  } catch (e) { fail('AC2: dragging empty canvas space pans the view (editor.canvas_x/y change)', e); }

  // -- AC3: pan/zoom state is session-only, not persisted -------------------
  try {
    const stages = [stageRow('s1', 'Discover', 0), stageRow('s2', 'Evaluate', 1)];
    const first = await buildRealCanvas(stages);
    const wheelCtrl = new first.win.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true });
    first.container.dispatchEvent(wheelCtrl);
    assert.notStrictEqual(first.editor.zoom, 1, 'expected the first editor instance to actually be zoomed, as a precondition');
    first.dom.window.close();

    // Simulate a reload: a fresh handleGetJourneyCanvas call against the
    // SAME stageRows (same backend state) -- position_x/position_y are
    // NEVER written by any pan/zoom interaction (no fetch, no PATCH call
    // exists anywhere in this init script for zoom/pan), so a second,
    // completely independent editor instance must start at the library's
    // own unmodified defaults.
    const second = await buildRealCanvas(stages);
    assert.strictEqual(second.editor.zoom, 1, 'expected a fresh (reloaded) editor instance to start at the default zoom of 1, not the prior instance\'s zoomed value');
    assert.strictEqual(second.editor.canvas_x, 0, 'expected a fresh instance to start at canvas_x 0');
    assert.strictEqual(second.editor.canvas_y, 0, 'expected a fresh instance to start at canvas_y 0');
    second.dom.window.close();
    pass('AC3: pan/zoom state is session-only -- a fresh editor instance always starts at the default, never the prior instance\'s state');
  } catch (e) { fail('AC3: pan/zoom state is session-only -- a fresh editor instance always starts at the default, never the prior instance\'s state', e); }

  // -- AC4: pan/zoom interaction does not leak into the page's own scroll --
  try {
    const { dom, container, win } = await buildRealCanvas([stageRow('s1', 'Discover', 0)]);
    const wheelCtrl = new win.WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true });
    container.dispatchEvent(wheelCtrl);
    assert.strictEqual(wheelCtrl.defaultPrevented, true, 'expected a Ctrl+scroll WheelEvent dispatched at the canvas to have defaultPrevented=true, confirming the browser\'s own default scroll/zoom action (which would otherwise propagate to an ancestor scroll container) is suppressed');
    dom.window.close();
    pass('AC4: a Ctrl+scroll interaction over the canvas calls preventDefault(), containing it rather than leaking to the page\'s own outer scroll');
  } catch (e) { fail('AC4: a Ctrl+scroll interaction over the canvas calls preventDefault(), containing it rather than leaking to the page\'s own outer scroll', e); }

  console.log(`\n[ic-s3-canvas-pan-zoom] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
