'use strict';
// check-cnsf-s1-canvas-node-token-styling.js -- TDD tests for cnsf-s1
// (2026-10-15-canvas-node-styling-fix).
// Story: artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

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

async function renderCanvas() {
  const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');
  const stages = [{ id: 's1', name: 'Evaluate', position: 0, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false, position_x: null, position_y: null }];
  const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, stages);
  return withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
    const req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleGetJourneyCanvas(req, res, null, pool);
    return res._b.bodyContent;
  });
}

// Isolates the <style>...</style> block from the rendered HTML.
function extractStyleBlock(html) {
  var start = html.indexOf('<style>');
  var end = html.indexOf('</style>');
  assert.ok(start !== -1 && end !== -1, 'expected a <style> block in the rendered HTML');
  return html.slice(start + '<style>'.length, end);
}

(async function() {
  var styleBlock;
  try {
    styleBlock = extractStyleBlock(await renderCanvas());
  } catch (e) {
    fail('setup: render canvas and extract style block', e);
    console.log(`\n[cnsf-s1-canvas-node-token-styling] Results: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }

  // -- AC1: node override rule present --
  try {
    assert.ok(/#sw-drawflow-canvas \.drawflow-node\{background:var\(--surface\);color:var\(--ink\);border:1px solid var\(--line\);border-radius:8px\}/.test(styleBlock),
      'expected the node override rule with exactly these 4 properties, in this order');
    pass('AC1: node override rule present (background/color/border/radius, tokens only)');
  } catch (e) { fail('AC1: node override rule present (background/color/border/radius, tokens only)', e); }

  // -- AC2: selected-state override rule present --
  try {
    assert.ok(/#sw-drawflow-canvas \.drawflow-node\.selected\{background:var\(--accent-soft\);border-color:var\(--accent\)\}/.test(styleBlock),
      'expected the selected-state override rule');
    pass('AC2: selected-state override rule present');
  } catch (e) { fail('AC2: selected-state override rule present', e); }

  // -- AC3: port override rule present, input and output identical --
  try {
    assert.ok(/#sw-drawflow-canvas \.drawflow-node \.input,#sw-drawflow-canvas \.drawflow-node \.output\{background:var\(--surface\);border:2px solid var\(--line\)\}/.test(styleBlock),
      'expected one combined rule covering both .input and .output with identical declarations');
    pass('AC3: port override rule present, input and output identical');
  } catch (e) { fail('AC3: port override rule present, input and output identical', e); }

  // -- AC4: connector override rule present --
  try {
    assert.ok(/#sw-drawflow-canvas \.connection \.main-path\{stroke:var\(--line\);stroke-width:2px\}/.test(styleBlock),
      'expected the connector override rule');
    pass('AC4: connector override rule present');
  } catch (e) { fail('AC4: connector override rule present', e); }

  // -- AC5: no hard-coded hex literal in any override rule --
  try {
    var overrideBlock = [
      styleBlock.match(/#sw-drawflow-canvas \.drawflow-node\{[^}]*\}/),
      styleBlock.match(/#sw-drawflow-canvas \.drawflow-node\.selected\{[^}]*\}/),
      styleBlock.match(/#sw-drawflow-canvas \.drawflow-node \.input,#sw-drawflow-canvas \.drawflow-node \.output\{[^}]*\}/),
      styleBlock.match(/#sw-drawflow-canvas \.connection \.main-path\{[^}]*\}/)
    ].map(function(m) { assert.ok(m, 'expected to find the override rule to scan for hex literals'); return m[0]; }).join('');
    assert.ok(!/#[0-9a-fA-F]{3,6}/.test(overrideBlock), 'expected zero hard-coded hex colours in the 4 override rules -- tokens only');
    pass('AC5: no hard-coded hex literal in any override rule (token-only, dark-mode-safe)');
  } catch (e) { fail('AC5: no hard-coded hex literal in any override rule (token-only, dark-mode-safe)', e); }

  // -- AC1-AC4 (integration): cascade-specificity proof against the REAL
  //    vendor rule text, read fresh from node_modules at test time.
  //
  //    jsdom's own CSSOM does NOT resolve CSS custom properties in
  //    getComputedStyle (confirmed directly: even a trivial, no-competing-
  //    rule :root{--c:#111}/var(--c) case resolves to transparent, not
  //    #111) -- this is a jsdom limitation, not a defect in the shipped
  //    CSS. Cascade/specificity winner determination does not depend on
  //    whether a declaration's VALUE is a literal or a var() reference --
  //    only the SELECTOR's specificity decides which declaration applies.
  //    So this test substitutes literal placeholder hex values for the
  //    override rule's own var(--token) references before injecting it
  //    into jsdom -- proving the override's selector genuinely outranks
  //    the real vendor selector, while the separate string-level AC1-AC5
  //    tests above already confirm production code uses var(), not these
  //    placeholders. --
  try {
    var vendorCssPath = require.resolve('drawflow/dist/drawflow.min.css');
    var vendorCss = fs.readFileSync(vendorCssPath, 'utf8');
    var resolvedOverrides = styleBlock
      .match(/#sw-drawflow-canvas (?:\.drawflow-node|\.connection)[^}]*\}/g)
      .join('\n')
      .replace(/var\(--surface\)/g, '#111111')
      .replace(/var\(--line\)/g, '#222222')
      .replace(/var\(--ink\)/g, '#333333')
      .replace(/var\(--accent-soft\)/g, '#555555')
      .replace(/var\(--accent\)/g, '#444444');
    assert.ok(resolvedOverrides.indexOf('#sw-drawflow-canvas') !== -1, 'expected to isolate the 4 override rules from the style block');
    var combinedCss = vendorCss + '\n' + resolvedOverrides;
    var dom = new JSDOM(
      '<!DOCTYPE html><html><head><style>' + combinedCss + '</style></head><body>' +
      '<div id="sw-drawflow-canvas">' +
        '<div class="drawflow-node" id="node-1"></div>' +
        '<div class="drawflow-node selected" id="node-2"></div>' +
        '<div class="drawflow-node" id="node-3"><div class="input"></div><div class="output"></div></div>' +
        '<svg><g class="connection"><path class="main-path"></path></g></svg>' +
      '</div>' +
      '</body></html>'
    );
    var doc = dom.window.document;
    var win = dom.window;

    var node1 = doc.getElementById('node-1');
    assert.strictEqual(win.getComputedStyle(node1).backgroundColor, 'rgb(17, 17, 17)', 'expected node background to resolve to the override placeholder (#111111), not the vendor #0ff');

    var node2 = doc.getElementById('node-2');
    assert.strictEqual(win.getComputedStyle(node2).backgroundColor, 'rgb(85, 85, 85)', 'expected selected node background to resolve to the override placeholder (#555555), not the vendor red');

    var input = doc.querySelector('.input');
    var output = doc.querySelector('.output');
    assert.strictEqual(win.getComputedStyle(input).backgroundColor, 'rgb(17, 17, 17)', 'expected input port background to resolve to the override placeholder, not the vendor #ff0');
    assert.strictEqual(win.getComputedStyle(output).backgroundColor, 'rgb(17, 17, 17)', 'expected output port background to resolve to the override placeholder, not the vendor #fff');
    assert.strictEqual(win.getComputedStyle(input).backgroundColor, win.getComputedStyle(output).backgroundColor, 'expected input and output ports to resolve identically');

    var mainPath = doc.querySelector('.main-path');
    assert.strictEqual(win.getComputedStyle(mainPath).stroke, '#222222', 'expected connector stroke to resolve to the override placeholder (#222222), not the vendor #4682b4');
    assert.strictEqual(win.getComputedStyle(mainPath).strokeWidth, '2px', 'expected connector stroke-width to resolve to 2px, not the vendor 5px');

    pass('AC1-AC4 (integration): override rules win the cascade against the real vendor CSS');
  } catch (e) { fail('AC1-AC4 (integration): override rules win the cascade against the real vendor CSS', e); }

  console.log(`\n[cnsf-s1-canvas-node-token-styling] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
