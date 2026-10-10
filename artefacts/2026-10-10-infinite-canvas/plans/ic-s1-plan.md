# Render journey stages as connected nodes on a drawflow canvas, replacing the linear list — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Serve drawflow.js via the proven zero-build pattern and render the Canvas tab's stages as connected drawflow nodes, while leaving the Customer experience and Delivery tabs' own rendering completely untouched.
**Branch:** `feature/ic-s1`
**Worktree:** `.worktrees/ic-s1`
**Test command:** `npm test` (unit/integration: `node scripts/run-all-tests.js`)

---

## Architecture note — read before starting (critical, not optional)

`handleGetJourneyCanvas`'s current `bodyContent` renders ALL THREE views (Canvas, Customer experience, Delivery) from the SAME DOM at once — `.sw-stage-card` (name, health, Edit-stage, Map-feature, moment-of-truth) is **always visible regardless of active view**; only the two annotation blocks (`.sw-stage-annotations--customer-experience`, `.sw-stage-annotations--delivery`) are CSS-toggled via a `.sw-journey-canvas--view-*` modifier class on the outer wrapper (confirmed by reading the real CSS: `.sw-stage-annotations{display:none}`, `.sw-journey-canvas--view-delivery .sw-stage-annotations--delivery{display:block}`, same pattern for customer-experience — there is NO existing rule hiding `.sw-stage-card` itself per view).

This means a drawflow node **cannot simply replace `.sw-stage-card` in place** — doing so would break the Customer experience/Delivery views, which rely on `.sw-stage-card` remaining in normal document flow directly above their own annotation rows. The correct, safe approach (confirmed by reading the real rendering code, not assumed):

1. Leave the existing `#sw-journey-stages` block (containing `.sw-stage-card` + both annotation divs, built by the current `stagesHtml`) **completely unchanged** in the server-rendered HTML.
2. Add a **new, separate** `<div id="sw-drawflow-canvas">` sibling element, populated by a new `<script>` block that builds drawflow nodes from the SAME per-stage data already embedded as `stageData` (see the existing `var stageData={};` JS object literal already built into the page).
3. Add two new CSS rules: hide `#sw-journey-stages` when the canvas view is active, hide `#sw-drawflow-canvas` when it is not. This is the exact same "CSS-only view toggle, zero server round-trip" architecture this file already uses — just one more view-scoped element pair, not a new mechanism.

This duplicates per-stage action markup (Edit-stage/Map-feature/health/moment-of-truth) between the legacy list (used by Customer-experience/Delivery) and the new canvas nodes (used by Canvas view) — this is intentional and safe, not wasteful: it guarantees zero regression risk to the other two views, which this story's own AC2 and this feature's own Out of Scope explicitly require.

---

## File map

```
Create:
  tests/check-ic-s1-canvas-render.js   — all 9 tests for this story

Modify:
  src/web-ui/routes/public.js          — new /vendor/drawflow.min.js + .css asset handlers
  src/web-ui/server.js                 — route dispatch for the 2 new asset paths
  src/web-ui/routes/journeys.js        — new #sw-drawflow-canvas block + CSS + client script in handleGetJourneyCanvas
  package.json / package-lock.json     — add drawflow as a real dependency
```

---

## Task 1: Serve drawflow.min.js and drawflow.min.css via the zero-build vendor pattern

**Files:**
- Modify: `src/web-ui/routes/public.js`
- Modify: `src/web-ui/server.js`
- Test: `tests/check-ic-s1-canvas-render.js` (AC5 tests, first 2 of 9)

- [ ] **Step 1: Install drawflow**

```bash
npm install drawflow
```

Confirm it landed as a real dependency (not devDependency) in `package.json`:

```bash
grep '"drawflow"' package.json
```

Expected output: a line under `"dependencies"` (not `"devDependencies"`), e.g. `"drawflow": "^0.0.59",`

- [ ] **Step 2: Write the failing tests**

Create `tests/check-ic-s1-canvas-render.js` with this header and the first 2 tests (AC5):

```javascript
'use strict';
// check-ic-s1-canvas-render.js -- TDD tests for ic-s1 (Epic: canvas-replacement-for-journey-stages,
// 2026-10-10-infinite-canvas). Story: artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
// Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { handleDrawflowJsAsset, handleDrawflowCssAsset } = require('../src/web-ui/routes/public');

  // -- AC5: zero-build asset serving --------------------------------------
  try {
    const headers = {};
    let statusCode, body;
    const res = {
      writeHead: function(code, h) { statusCode = code; Object.assign(headers, h); },
      end: function(b) { body = b; }
    };
    handleDrawflowJsAsset({ headers: {} }, res);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(headers['Content-Type'], 'application/javascript; charset=utf-8');
    assert.ok(Buffer.isBuffer(body) && body.length > 0);
    pass('AC5: GET /vendor/drawflow.min.js returns 200 with the real file read from node_modules');
  } catch (e) { fail('AC5: GET /vendor/drawflow.min.js returns 200 with the real file read from node_modules', e); }

  try {
    const headers = {};
    let statusCode, body;
    const res = {
      writeHead: function(code, h) { statusCode = code; Object.assign(headers, h); },
      end: function(b) { body = b; }
    };
    handleDrawflowCssAsset({ headers: {} }, res);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(headers['Content-Type'], 'text/css; charset=utf-8');
    assert.ok(Buffer.isBuffer(body) && body.length > 0);
    pass('AC5: GET /vendor/drawflow.min.css returns 200 with the real file read from node_modules');
  } catch (e) { fail('AC5: GET /vendor/drawflow.min.css returns 200 with the real file read from node_modules', e); }

  console.log(`\n[ic-s1-canvas-render] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 3: Run test — must fail**

```bash
node tests/check-ic-s1-canvas-render.js
```

Expected output: `TypeError: handleDrawflowJsAsset is not a function` (or equivalent — the handlers don't exist yet)

- [ ] **Step 4: Add the asset handlers to public.js**

Open `src/web-ui/routes/public.js`. Find the existing `_loadMermaidAsset`/`handleMermaidAsset` pair (search for `csd-s1: mermaid client bundle`). Add this immediately after `handleMermaidAsset`'s closing brace, mirroring its exact pattern:

```javascript
// ic-s1: drawflow client bundle, read once and gzip-compressed once, then
// served from an in-memory cache for every subsequent request -- mirrors
// handleMermaidAsset's own pattern exactly (decisions.md ADR-001).
var _drawflowJsCache = null;
function _loadDrawflowJsAsset() {
  if (_drawflowJsCache) { return _drawflowJsCache; }
  var assetPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'drawflow', 'dist', 'drawflow.min.js');
  var raw = fs.readFileSync(assetPath);
  var gzip = zlib.gzipSync(raw);
  _drawflowJsCache = { raw: raw, gzip: gzip };
  return _drawflowJsCache;
}

var _drawflowCssCache = null;
function _loadDrawflowCssAsset() {
  if (_drawflowCssCache) { return _drawflowCssCache; }
  var assetPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'drawflow', 'dist', 'drawflow.min.css');
  var raw = fs.readFileSync(assetPath);
  var gzip = zlib.gzipSync(raw);
  _drawflowCssCache = { raw: raw, gzip: gzip };
  return _drawflowCssCache;
}

function handleDrawflowJsAsset(req, res) {
  var asset = _loadDrawflowJsAsset();
  var acceptEncoding = (req.headers && req.headers['accept-encoding']) || '';
  var useGzip = acceptEncoding.indexOf('gzip') !== -1;
  var headers = { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=86400' };
  if (useGzip) { headers['Content-Encoding'] = 'gzip'; res.writeHead(200, headers); res.end(asset.gzip); }
  else { res.writeHead(200, headers); res.end(asset.raw); }
}

function handleDrawflowCssAsset(req, res) {
  var asset = _loadDrawflowCssAsset();
  var acceptEncoding = (req.headers && req.headers['accept-encoding']) || '';
  var useGzip = acceptEncoding.indexOf('gzip') !== -1;
  var headers = { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=86400' };
  if (useGzip) { headers['Content-Encoding'] = 'gzip'; res.writeHead(200, headers); res.end(asset.gzip); }
  else { res.writeHead(200, headers); res.end(asset.raw); }
}
```

Update the `module.exports` line at the bottom of `public.js` to add `handleDrawflowJsAsset, handleDrawflowCssAsset` to the existing exported object.

- [ ] **Step 5: Wire the routes in server.js**

Open `src/web-ui/server.js`. Find the existing `require('./routes/public')` line (search for `handleMermaidAsset`) and add the two new names to the destructured require. Find the `/vendor/mermaid.min.js` route dispatch (search for `pathname === '/vendor/mermaid.min.js'`) and add immediately after its `else if` block:

```javascript
  } else if (pathname === '/vendor/drawflow.min.js' && req.method === 'GET') {
    // ic-s1: unauthenticated static asset (drawflow client bundle), same
    // trust level as /vendor/mermaid.min.js (csd-s1) -- no session/tenant
    // data involved.
    handleDrawflowJsAsset(req, res);

  } else if (pathname === '/vendor/drawflow.min.css' && req.method === 'GET') {
    handleDrawflowCssAsset(req, res);
```

- [ ] **Step 6: Run test — must pass**

```bash
node tests/check-ic-s1-canvas-render.js
```

Expected output: `[ic-s1-canvas-render] Results: 2 passed, 0 failed`

- [ ] **Step 7: Run full suite — no regressions**

```bash
npm test
```

Expected output: all 733+ files passing (your new test file adds to this count)

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/routes/public.js src/web-ui/server.js package.json package-lock.json tests/check-ic-s1-canvas-render.js
git commit -m "feat: serve drawflow.js/.css via the zero-build vendor pattern (ic-s1 AC5)"
```

---

## Task 2: Render stages as drawflow nodes with auto-connections, zero regression to the other two views

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ic-s1-canvas-render.js` (remaining 7 tests)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ic-s1-canvas-render.js`, before the final `console.log`/closing block (add a `makeCanvasMockPool` helper at the top of the IIFE, mirroring `check-ep1-s4-stage-reorder.js`'s own helper exactly):

```javascript
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
        if (/^SELECT id, journey_stage_id, feature_slug, metric_keys FROM feature_customer_journey_stage_mappings/.test(s)) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }
    };
  }

  function stageRow(id, name, position, extra) {
    return Object.assign({ id: id, name: name, position: position, description: null, customer_actions: null, touchpoints: null, channel: null, emotion: null, pain_points: null, opportunities: null, moment_of_truth: false }, extra || {});
  }

  const { handleGetJourneyCanvas } = require('../src/web-ui/routes/journeys');

  function makeMockRes() {
    return { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  }

  // -- AC1: nodes in position order, auto-connected ------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      stageRow('s1', 'Discover', 0), stageRow('s2', 'Evaluate', 1), stageRow('s3', 'Buy', 2)
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/id="sw-drawflow-canvas"/.test(html), 'expected a #sw-drawflow-canvas container');
    const idxS1 = html.indexOf('"s1"');
    const idxS2 = html.indexOf('"s2"');
    const idxS3 = html.indexOf('"s3"');
    assert.ok(idxS1 !== -1 && idxS2 !== -1 && idxS3 !== -1 && idxS1 < idxS2 && idxS2 < idxS3, 'expected node data for s1, s2, s3 in position order in the generated script');
    const connectionCount = (html.match(/addConnection/g) || []).length;
    assert.strictEqual(connectionCount, 2, 'expected exactly 2 addConnection calls for 3 sequential stages');
    pass('AC1: 3 stages render as drawflow nodes in position order with 2 auto-connections');
  } catch (e) { fail('AC1: 3 stages render as drawflow nodes in position order with 2 auto-connections', e); }

  // -- AC1 edge case: 1 stage, 0 connections --------------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Only', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const connectionCount = (res._b.bodyContent.match(/addConnection/g) || []).length;
    assert.strictEqual(connectionCount, 0, 'expected 0 connections for a single-stage journey');
    pass('AC1 (edge case): a single-stage journey renders 0 connections');
  } catch (e) { fail('AC1 (edge case): a single-stage journey renders 0 connections', e); }

  // -- AC2: existing per-stage actions preserved in BOTH renderings --------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/sw-stage-edit[^>]*data-stage-id="s1"/.test(html), 'expected Edit-stage control for s1 (legacy list, unchanged)');
    assert.ok(/sw-stage-map-feature[^>]*data-stage-id="s1"/.test(html), 'expected Map-feature control for s1 (legacy list, unchanged)');
    // The SAME action controls must also be reachable from the new canvas node's own HTML content.
    const nodeHtmlMatch = html.match(/addNode\([^)]*"s1"[^)]*\)/);
    assert.ok(nodeHtmlMatch, 'expected an addNode(...) call referencing stage s1');
    pass('AC2: Edit-stage and Map-feature controls exist for s1, both in the legacy list and the new canvas node');
  } catch (e) { fail('AC2: Edit-stage and Map-feature controls exist for s1, both in the legacy list and the new canvas node', e); }

  // -- AC3: moment-of-truth badge on the flagged node only -----------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [
      stageRow('s1', 'Discover', 0, { moment_of_truth: true }),
      stageRow('s2', 'Evaluate', 1, { moment_of_truth: false })
    ]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    const s1NodeCall = html.match(/addNode\([^;]*?"s1"[^;]*?\);/);
    const s2NodeCall = html.match(/addNode\([^;]*?"s2"[^;]*?\);/);
    assert.ok(s1NodeCall && /Moment of truth/.test(s1NodeCall[0]), 'expected s1\'s own node HTML to include the Moment of truth badge');
    assert.ok(s2NodeCall && !/Moment of truth/.test(s2NodeCall[0]), 'expected s2\'s own node HTML to NOT include the badge');
    pass('AC3: moment-of-truth badge appears in the flagged stage\'s own node content only');
  } catch (e) { fail('AC3: moment-of-truth badge appears in the flagged stage\'s own node content only', e); }

  // -- AC4: 0-stage empty state unchanged -----------------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/No stages yet\. Add your first stage\./.test(html), 'expected the unchanged empty-state message');
    assert.ok(!/addNode\(/.test(html), 'expected zero addNode calls for an empty journey');
    pass('AC4: 0-stage journey shows the unchanged empty-state message, no canvas nodes');
  } catch (e) { fail('AC4: 0-stage journey shows the unchanged empty-state message, no canvas nodes', e); }

  // -- AC6: client-side load guard ------------------------------------------
  try {
    const pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, [stageRow('s1', 'Discover', 0)]);
    const req = { session: { tenantId: 'org-1' }, params: { id: 'j1' } };
    const res = makeMockRes();
    await handleGetJourneyCanvas(req, res, null, pool);
    const html = res._b.bodyContent;
    assert.ok(/typeof\s+window\.Drawflow\s*===\s*['"]function['"]/.test(html), 'expected a window.Drawflow load guard before any node-rendering call');
    pass('AC6: client script guards against window.Drawflow being undefined');
  } catch (e) { fail('AC6: client script guards against window.Drawflow being undefined', e); }
```

Move the `console.log`/closing block to after these new tests (it must remain the last thing in the IIFE).

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ic-s1-canvas-render.js
```

Expected output: multiple `[FAIL]` lines — `#sw-drawflow-canvas` not found, no `addNode`/`addConnection` calls exist yet

- [ ] **Step 3: Implement the canvas node rendering**

Open `src/web-ui/routes/journeys.js`. In `handleGetJourneyCanvas`, find the `var bodyContent =` assignment (search for `'<div class="sw-journey-canvas sw-journey-canvas--view-canvas">'`). Add a new `drawflowNodesScript` variable built from the existing `stages` array, right before the `bodyContent` assignment:

```javascript
  // ic-s1 -- drawflow canvas nodes, built from the SAME per-stage data as
  // the legacy list below. Auto-connects stages in sequence order; manual
  // connection-drawing is never exposed to the operator for journeys
  // (epic-level scope decision, decisions.md).
  var drawflowNodesScript = stages.map(function(s, idx) {
    var nodeHtml =
      '<div class="sw-stage-name">' + escHtml(s.name) + '</div>' +
      buildHealthIndicator(s.id) +
      (s.moment_of_truth
        ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>'
        : '') +
      '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit stage</a>' +
      '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>';
    return 'editor.addNode(' + JSON.stringify(s.id) + ', 1, 1, ' + (idx * 220) + ', 120, ' +
      JSON.stringify('sw-drawflow-node') + ', {}, ' + JSON.stringify(nodeHtml) + ');';
  }).join('');
  var drawflowConnectionsScript = stages.slice(0, -1).map(function(s, idx) {
    return 'editor.addConnection(' + JSON.stringify(stages[idx].id) + ', ' + JSON.stringify(stages[idx + 1].id) + ', "output_1", "input_1");';
  }).join('');
```

Then, inside `bodyContent`'s template, immediately after the closing `</div>` of `sw-journey-canvas` wrapper's `#sw-journey-stages` block (i.e. right after the `'+Add stage'` button's closing and the `sw-stage-reorder-error` span, still inside the outer `sw-journey-canvas` div), add the new container:

```javascript
      '<div id="sw-drawflow-canvas"></div>' +
```

And inside the existing `<script>` block (search for `'var stageData={};'`), add the drawflow initialization immediately after the `csrfToken`/`journeyId` variable declarations, before any existing event-wiring code:

```javascript
      'if(typeof window.Drawflow===\"function\"){' +
        'var editor=new window.Drawflow(document.getElementById(\"sw-drawflow-canvas\"));' +
        'editor.reroute=true;' +
        'editor.start();' +
        drawflowNodesScript +
        drawflowConnectionsScript +
      '}else{' +
        'console.error(\"drawflow failed to load -- canvas view unavailable\");' +
        'var el=document.getElementById(\"sw-drawflow-canvas\");' +
        'if(el)el.textContent=\"Canvas failed to load. Please refresh the page.\";' +
      '}' +
```

- [ ] **Step 4: Add the CSS view-toggle rules**

In the same file's existing CSS `<style>` string (search for `.sw-journey-canvas--view-delivery .sw-stage-annotations--delivery{display:block}`), add two new rules:

```javascript
      '.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}' +
      '#sw-drawflow-canvas{display:none;height:600px;width:100%}' +
      '.sw-journey-canvas--view-canvas #sw-drawflow-canvas{display:block}' +
```

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-ic-s1-canvas-render.js
```

Expected output: `[ic-s1-canvas-render] Results: 9 passed, 0 failed`

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: all files passing, especially `tests/check-ep2-s3*.js` and `tests/check-ep3-s1*.js`/`check-ep3-s2*.js` (Delivery/Customer-experience view tests) — these MUST still pass unchanged, confirming zero regression to the other two views.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ic-s1-canvas-render.js
git commit -m "feat: render journey stages as connected drawflow nodes on the Canvas tab (ic-s1)"
```

---

## Final check before opening a PR

- [ ] Run the full suite one more time (`npm test`) and confirm 0 failures
- [ ] Manually verify (or note as a post-merge live check, per this feature's own established precedent): open a journey, confirm the Canvas tab shows nodes/connections, switch to Customer experience and Delivery tabs, confirm they render EXACTLY as before (list view, annotation rows) — this is the single most important manual check for this story
- [ ] Open a draft PR (never ready for review)
