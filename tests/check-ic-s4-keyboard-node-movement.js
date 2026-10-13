'use strict';
// check-ic-s4-keyboard-node-movement.js -- TDD tests for ic-s4 (Epic: canvas-replacement-for-journey-stages,
// 2026-10-10-infinite-canvas). Story: artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
// Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s4-test-plan.md
//
// Real-jsdom-execution tests, following check-ic-s3-canvas-pan-zoom.js's own
// established buildRealCanvas harness -- these ACs are about real library
// behaviour (tabindex on real node elements, real position mutation, real
// fetch calls), which text-only assertion cannot prove.
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
      if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
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
 * output, with a real captured handle to the real drawflow editor instance
 * and a mocked window.fetch to capture save requests. Caller must call
 * dom.window.close().
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

  const fetchCalls = [];
  win.fetch = function(url, opts) {
    fetchCalls.push({ url: url, body: opts && opts.body ? JSON.parse(opts.body) : null });
    return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } });
  };

  dom.window.eval(DRAWFLOW_SRC);
  dom.window.eval(
    'var __RealDrawflow = window.Drawflow;' +
    'window.Drawflow = function(el) { var inst = new __RealDrawflow(el); window.__testEditor = inst; return inst; };' +
    'window.Drawflow.prototype = __RealDrawflow.prototype;'
  );
  dom.window.eval(initScript);

  const editor = win.__testEditor;
  const container = win.document.getElementById('sw-drawflow-canvas');
  return { dom: dom, win: win, editor: editor, container: container, fetchCalls: fetchCalls };
}

(async function() {
  // -- AC1a: every canvas node has tabindex="0" -----------------------------
  try {
    const { dom, container } = await buildRealCanvas([stageRow('s1', 'Discover', 0), stageRow('s2', 'Evaluate', 1)]);
    const nodes = container.querySelectorAll('.sw-drawflow-node');
    assert.strictEqual(nodes.length, 2, 'expected 2 real drawflow node elements');
    nodes.forEach(function(n) {
      assert.strictEqual(n.getAttribute('tabindex'), '0', 'expected every canvas node to have tabindex="0"');
    });
    dom.window.close();
    pass('AC1a: every canvas node has tabindex="0"');
  } catch (e) { fail('AC1a: every canvas node has tabindex="0"', e); }

  // -- AC1b: arrow key moves a focused node and saves the new position -----
  try {
    const { dom, win, container, fetchCalls } = await buildRealCanvas([stageRow('s1', 'Discover', 0)]);
    const node = container.querySelector('.sw-drawflow-node');
    const startLeft = parseFloat(node.style.left);
    const startTop = parseFloat(node.style.top);
    node.focus();
    assert.strictEqual(win.document.activeElement, node, 'expected the node to actually be focused (precondition)');
    const ev = new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    win.document.dispatchEvent(ev);
    assert.strictEqual(parseFloat(node.style.left), startLeft + 20, 'expected the node to move right by the fixed step (20px)');
    assert.strictEqual(parseFloat(node.style.top), startTop, 'expected vertical position to be unchanged for a horizontal move');
    assert.strictEqual(fetchCalls.length, 1, 'expected exactly one save request after the arrow key move');
    assert.ok(/\/stages\/s1\/position$/.test(fetchCalls[0].url), 'expected the save request to target stage s1\'s own position route, got ' + fetchCalls[0].url);
    assert.strictEqual(fetchCalls[0].body.x, startLeft + 20, 'expected the saved x to match the new position');
    assert.strictEqual(fetchCalls[0].body.y, startTop, 'expected the saved y to be unchanged');
    dom.window.close();
    pass('AC1b: an arrow key moves the focused node by a fixed step and saves it via the position route');
  } catch (e) { fail('AC1b: an arrow key moves the focused node by a fixed step and saves it via the position route', e); }

  // -- AC4: mouse-drag and keyboard movement save via the exact same route --
  try {
    const { dom, win, container, fetchCalls } = await buildRealCanvas([stageRow('s1', 'Discover', 0)]);
    const node = container.querySelector('.sw-drawflow-node');
    function fireMouse(type, x, y, target) {
      const ev = new win.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
      target.dispatchEvent(ev);
    }
    fireMouse('mousedown', 100, 100, node);
    fireMouse('mousemove', 180, 160, container);
    fireMouse('mouseup', 180, 160, container);
    assert.strictEqual(fetchCalls.length, 1, 'expected one save request from the real mouse drag');
    const dragBody = fetchCalls[0].body;

    node.focus();
    const ev2 = new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    win.document.dispatchEvent(ev2);
    assert.strictEqual(fetchCalls.length, 2, 'expected a second save request from the keyboard move');
    const keyBody = fetchCalls[1].body;

    assert.strictEqual(fetchCalls[0].url, fetchCalls[1].url, 'expected mouse-drag and keyboard movement to save to the exact same route');
    assert.deepStrictEqual(Object.keys(dragBody).sort(), Object.keys(keyBody).sort(), 'expected both save payloads to use the exact same field names -- no divergent or parallel data model');
    assert.ok('x' in dragBody && 'y' in dragBody, 'expected x/y fields in the mouse-drag save payload');
    assert.ok('x' in keyBody && 'y' in keyBody, 'expected x/y fields in the keyboard-move save payload');
    dom.window.close();
    pass('AC4: mouse-drag and keyboard movement save position via the exact same route and field names');
  } catch (e) { fail('AC4: mouse-drag and keyboard movement save position via the exact same route and field names', e); }

  // -- AC5: repeated arrow-key presses move cumulatively, not a one-shot nudge --
  try {
    const { dom, win, container } = await buildRealCanvas([stageRow('s1', 'Discover', 0)]);
    const node = container.querySelector('.sw-drawflow-node');
    const startLeft = parseFloat(node.style.left);
    node.focus();
    function pressArrowRight() {
      const ev = new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      win.document.dispatchEvent(ev);
    }
    pressArrowRight();
    assert.strictEqual(parseFloat(node.style.left), startLeft + 20, 'expected the first press to move by one fixed step');
    pressArrowRight();
    assert.strictEqual(parseFloat(node.style.left), startLeft + 40, 'expected the second press to move by a further fixed step (cumulative), not clamp to a single nudge');
    dom.window.close();
    pass('AC5: holding/repeating the arrow key keeps moving the node by the fixed step each time');
  } catch (e) { fail('AC5: holding/repeating the arrow key keeps moving the node by the fixed step each time', e); }

  console.log(`\n[ic-s4-keyboard-node-movement] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
