# Override drawflow's vendor-default node/port/connector colours — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add 4 CSS override rules to `handleGetJourneyCanvas`'s existing style block, replacing drawflow's own hard-coded vendor colours with the app's own design tokens. No markup, no JS, no new file except the test.
**Branch:** `feature/cnsf-s1`
**Worktree:** `.worktrees/cnsf-s1`
**Test command:** `node scripts/run-all-tests.js`

---

## File map

```
Modify:
  src/web-ui/routes/journeys.js                        — add 4 CSS override rules

Create:
  tests/check-cnsf-s1-canvas-node-token-styling.js      — 6 tests (5 unit, 1 integration)
```

---

## Task 1: Add the 4 CSS override rules and their test

**Files:**
- Create: `tests/check-cnsf-s1-canvas-node-token-styling.js`
- Modify: `src/web-ui/routes/journeys.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
// check-cnsf-s1-canvas-node-token-styling.js -- TDD tests for cnsf-s1
// (2026-10-15-canvas-node-styling-fix).
// Story: artefacts/2026-10-15-canvas-node-styling-fix/stories/cnsf-s1-canvas-node-token-styling.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');
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
  //    vendor rule text, read fresh from node_modules at test time --
  try {
    var vendorCssPath = require.resolve('drawflow/dist/drawflow.min.css');
    var vendorCss = fs.readFileSync(vendorCssPath, 'utf8');
    var tokenCss = ':root{--surface:#111111;--line:#222222;--ink:#333333;--accent:#444444;--accent-soft:#555555}';
    var combinedCss = tokenCss + '\n' + vendorCss + '\n' + styleBlock;
    var dom = new JSDOM(
      '<!DOCTYPE html><html><head><style>' + combinedCss + '</style></head><body>' +
      '<div id="sw-drawflow-canvas">' +
        '<div class="drawflow-node" id="node-1"></div>' +
        '<div class="drawflow-node selected" id="node-2"></div>' +
        '<div class="drawflow-node" id="node-3"><div class="input"></div><div class="output"></div></div>' +
        '<svg><path class="main-path"></path></svg>' +
      '</div>' +
      '</body></html>'
    );
    var doc = dom.window.document;
    var win = dom.window;

    var node1 = doc.getElementById('node-1');
    assert.strictEqual(win.getComputedStyle(node1).backgroundColor, 'rgb(17, 17, 17)', 'expected node background to resolve to the --surface placeholder, not the vendor #0ff');

    var node2 = doc.getElementById('node-2');
    assert.strictEqual(win.getComputedStyle(node2).backgroundColor, 'rgb(85, 85, 85)', 'expected selected node background to resolve to the --accent-soft placeholder, not the vendor red');

    var input = doc.querySelector('.input');
    var output = doc.querySelector('.output');
    assert.strictEqual(win.getComputedStyle(input).backgroundColor, 'rgb(17, 17, 17)', 'expected input port background to resolve to the --surface placeholder, not the vendor #ff0');
    assert.strictEqual(win.getComputedStyle(output).backgroundColor, 'rgb(17, 17, 17)', 'expected output port background to resolve to the --surface placeholder, not the vendor #fff');
    assert.strictEqual(win.getComputedStyle(input).backgroundColor, win.getComputedStyle(output).backgroundColor, 'expected input and output ports to resolve identically');

    var mainPath = doc.querySelector('.main-path');
    assert.strictEqual(win.getComputedStyle(mainPath).stroke, 'rgb(34, 34, 34)', 'expected connector stroke to resolve to the --line placeholder, not the vendor #4682b4');
    assert.strictEqual(win.getComputedStyle(mainPath).strokeWidth, '2px', 'expected connector stroke-width to resolve to 2px, not the vendor 5px');

    pass('AC1-AC4 (integration): override rules win the cascade against the real vendor CSS');
  } catch (e) { fail('AC1-AC4 (integration): override rules win the cascade against the real vendor CSS', e); }

  console.log(`\n[cnsf-s1-canvas-node-token-styling] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cnsf-s1-canvas-node-token-styling.js
```

Expected output: AC1–AC5 fail (the override rules don't exist yet); the integration test fails (nodes resolve to the real vendor colours, not the placeholders).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/journeys.js`'s existing style block, find this exact line:

```javascript
      '.sw-stage-health--none{color:var(--danger)}' +
      '.sw-journey-health-summary{font-size:13px;color:var(--ink-2);margin-bottom:8px}' +
    '</style>' +
```

Insert 4 new lines immediately before `'.sw-journey-health-summary{...}'` (i.e. directly after `.sw-stage-health--none`'s own rule, in the same place other late-added small overrides already sit near the end of the block):

```javascript
      '.sw-stage-health--none{color:var(--danger)}' +
      // cnsf-s1 -- override drawflow's own vendor-default node/port/
      // connector colours (background:#0ff, selected:red, input port
      // #ff0, connector stroke #4682b4 -- confirmed via direct read of
      // node_modules/drawflow/dist/drawflow.min.css) with the app's own
      // design tokens. #sw-drawflow-canvas is an ID selector, which always
      // outranks any number of class selectors regardless of source
      // order -- no change to the existing <style>-before-<link> ordering,
      // no !important. Node width/padding/position are untouched
      // (out of scope) -- only colour/border/stroke values are set.
      '#sw-drawflow-canvas .drawflow-node{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:8px}' +
      '#sw-drawflow-canvas .drawflow-node.selected{background:var(--accent-soft);border-color:var(--accent)}' +
      '#sw-drawflow-canvas .drawflow-node .input,#sw-drawflow-canvas .drawflow-node .output{background:var(--surface);border:2px solid var(--line)}' +
      '#sw-drawflow-canvas .connection .main-path{stroke:var(--line);stroke-width:2px}' +
      '.sw-journey-health-summary{font-size:13px;color:var(--ink-2);margin-bottom:8px}' +
    '</style>' +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cnsf-s1-canvas-node-token-styling.js
```

Expected output: `[cnsf-s1-canvas-node-token-styling] Results: 6 passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: 755 file(s) run (754 + this new file), 0 failed.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-cnsf-s1-canvas-node-token-styling.js
git commit -m "fix: override drawflow's vendor-default node/port/connector colours with design tokens"
```
