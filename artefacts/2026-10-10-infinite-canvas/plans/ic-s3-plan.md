# Implementation Plan: Canvas pan and zoom (ic-s3)

**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
**DoR:** artefacts/2026-10-10-infinite-canvas/dor/ic-s3-dor.md
**Test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s3-test-plan.md
**Worktree:** `.worktrees/ic-s3` on `feature/ic-s3`

---

## Architecture note — this story is almost entirely a regression-guard, not new production code

Direct source inspection of `node_modules/drawflow/dist/drawflow.min.js` (not assumption, not documentation alone) confirms all 4 ACs are already satisfied by drawflow's own default, already-shipped behaviour, with **zero production code changes anticipated**:

- **AC1 (Ctrl+scroll zooms, plain scroll doesn't):** the library's own wheel handler is `zoom_enter(e,t){e.ctrlKey&&(e.preventDefault(),e.deltaY>0?this.zoom_out():this.zoom_in())}` — wired via `this.container.addEventListener("wheel",this.zoom_enter.bind(this))` inside `editor.start()`, which `ic-s1`'s own init code already calls. When `ctrlKey` is true, it calls `preventDefault()` and zooms; when false, it does nothing at all. This is `ic-s1`'s own already-shipped `editor.start()` call — no new wiring needed.
- **AC2 (dragging empty space pans):** drawflow's own `click()`/pointer handlers already distinguish a click on `.parent-drawflow`/`.drawflow` (the canvas background) from a click on a node, and pan only in the former case — also wired by `editor.start()`.
- **AC3 (pan/zoom not persisted):** trivially true by construction — nothing in `ic-s1`'s or `ic-s2`'s own code ever reads or writes `editor.zoom`/`editor.canvas_x`/`editor.canvas_y` to/from the server; a fresh page load always constructs a fresh `editor` with drawflow's own defaults (`zoom: 1`, implicit `canvas_x/y: 0`).
- **AC4 (containment, no outer-page scroll leak):** `zoom_enter`'s own unconditional `e.preventDefault()` on the `ctrlKey: true` branch already stops the browser's default scroll/zoom action for that gesture, which is what would otherwise propagate to an ancestor scroll container.

This was independently confirmed in this feature's own spike (`spikes/zero-build-canvas-library-outcome.md`): "`editor.zoom` changed `1.0` → `1.1`; `editor.canvas_x/y` changed `{0,0}` → `{-183,-46}`" via real synthetic-event dispatch in a live browser, and re-confirmed in this plan's own preparation via a direct prototype harness run against the real library (see Task 1 Step 3's own harness, already validated working before this plan was written — `editor.zoom` went `1` → `1.1` on a synthetic `ctrlKey: true` WheelEvent, stayed `1.1` on a plain one, `defaultPrevented` was `true`).

**Therefore this story has exactly one task: write the 4 tests, confirm they pass against the unmodified codebase.** If any test surprisingly fails against real `ic-s1`/`ic-s2` code, that is itself the finding — investigate and fix the real cause (likely a CSS/container issue, not drawflow's own JS), do not weaken the test to match broken behaviour.

### The JSDOM real-execution harness (new technique for this feature, not yet used by `ic-s1`/`ic-s2`'s own tests)

`ic-s1`/`ic-s2`'s own tests only ever inspect the generated HTML/script as **text** (regex assertions on the string `handleGetJourneyCanvas` returns) — they never actually execute drawflow. This story's own ACs are about real library *behaviour* (`editor.zoom`, `editor.canvas_x/y` changing in response to real events), which text inspection cannot prove. This repo already has an established precedent for executing real generated output in `jsdom` against a real library — `tests/check-csd-s1-derisk-canvas-mermaid.js` (`new JSDOM(html, { runScripts: 'outside-only' })`, then `dom.window.eval(scriptSrc)` to manually run an extracted inline script). This plan's own harness follows that same established pattern, adapted for drawflow:

1. Call the real `handleGetJourneyCanvas` (mock pool, same shape `ic-s1`/`ic-s2`'s own tests already use) to get real HTML.
2. Build a `JSDOM` instance from that HTML with `runScripts: 'outside-only'`.
3. `dom.window.eval()` the real `node_modules/drawflow/dist/drawflow.min.js` source — defines `window.Drawflow` for real, not a mock.
4. **Capture a handle to the real `editor` instance without touching production code**, via a constructor-wrapper eval'd into the window *before* the generated init script runs: `window.Drawflow` is replaced with a thin function that constructs the real original constructor (saved first as `__RealDrawflow`) and also stashes the result on `window.__testEditor` — valid JS: a constructor function that explicitly `return`s an object makes `new Wrapper(el)` evaluate to that returned object, standard language behaviour, not a hack specific to this library.
5. Extract the correct inline `<script>` from the real HTML — **the page contains multiple inline `<script>` blocks that happen to share an identical opening preamble** (`var journeyId=...;var csrfToken=...;` — confirmed by direct inspection during this plan's own prototype run, not a duplication bug, just two different generated scripts with the same conventional preamble). Identify the right one by searching for `__icS1NodeIds` (a string unique to `ic-s1`'s own canvas-init script), not by array position.
6. `dom.window.eval()` that real, unmodified init script — this actually constructs the real `editor`, actually calls `editor.start()`, actually wires the real event listeners.
7. Dispatch real synthetic `WheelEvent`/`MouseEvent` objects at `#sw-drawflow-canvas` and read `editor.zoom`/`editor.canvas_x`/`editor.canvas_y` directly off the captured real instance.

---

## Task 1: Write all 4 tests against the real, unmodified codebase

**Files:**
- Test: `tests/check-ic-s3-canvas-pan-zoom.js` (new file, all 4 tests)

- [x] **Step 1: Write the test file**

Create `tests/check-ic-s3-canvas-pan-zoom.js`:

```javascript
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
```

- [x] **Step 2: Run the tests — expected to PASS immediately against the unmodified codebase**

```bash
node tests/check-ic-s3-canvas-pan-zoom.js
```

Expected: `Results: 4 passed, 0 failed`. **This is not a RED step in the usual TDD sense** — per this plan's own Architecture note, all 4 ACs are already satisfied by `ic-s1`'s own already-shipped `editor.start()` call and drawflow's own default behaviour; these tests exist to *prove and guard* that, not to drive new code. If any test unexpectedly fails here, that is itself a real finding — stop and investigate the actual cause (check the real search-anchors this plan's own harness relies on: the `__icS1NodeIds` marker string, the `#sw-drawflow-canvas` element id, the real `drawflow.min.js` file at the expected `node_modules` path) before assuming the AC itself is wrong.

- [x] **Step 3: Run the full suite — no regressions**

```bash
npm test
```

No production code is touched by this task, so a regression here would mean this new test file itself has broken something else (e.g. a global leaked from `dom.window.eval`) — investigate if so, do not ignore.

- [x] **Step 4: Commit**

```bash
git add tests/check-ic-s3-canvas-pan-zoom.js
git commit -m "test: verify canvas pan/zoom via real jsdom execution against drawflow (ic-s3 AC1-AC4)"
```

---

## Final check before opening a PR

- [x] Run the full suite one more time (`npm test`) and confirm 0 failures
- [x] **Live browser render check (mandatory per `/verify-completion`):** even though this story's own ACs are confirmed via real-library jsdom execution (not text-only assertions, a materially stronger test than `ic-s1`'s own original tests), `ic-s1`'s and `ic-s2`'s own sessions both found real defects that only a REAL browser caught (missing vendor `<script>` tag; wrong-id-type `addConnection`; click-delegation scope; CSS-visibility scoping) that no jsdom test — including a real-execution one — would necessarily catch, since jsdom is still not a real browser's own paint/layout/compositing pipeline. Load the real rendered canvas in Chrome, confirm: (a) `Ctrl+scroll` visibly zooms, (b) dragging empty canvas space visibly pans, (c) the page itself does not scroll/jump when either interaction happens, (d) reloading after panning/zooming returns to the default view. Do not skip this on the assumption that the stronger jsdom tests already cover it — different failure classes.
- [x] Switch to Customer experience and Delivery tabs, confirm they render EXACTLY as before — zero regression (this story's diff, if any beyond the new test file, should be none at all, but verify).
- [ ] Open a draft PR (never ready for review)
