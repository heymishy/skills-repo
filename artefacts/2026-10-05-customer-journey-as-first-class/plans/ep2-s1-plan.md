# Feature picker: read pipeline-state.json and render feature list in modal — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every unit test in the test plan pass (7 tests covering all 4 ACs).
**Branch:** `feature/cj-ep2-s1`
**Worktree:** `.worktrees/cj-ep2-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-ep2-s1-feature-picker.js  — 7 unit tests covering AC1-AC4

Modify:
  src/web-ui/routes/journeys.js  — handleGetJourneyCanvas gains: a pipeline-state.json
                                    read (new _repoRootAdapter import), a "Map feature"
                                    button per stage card, a feature-picker modal with
                                    explicit error/empty/populated states, client-side
                                    filter script, and close/Escape handling
```

---

## Task 1: Read pipeline-state.json and render the feature list (AC1, AC3)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s1-feature-picker.js`

- [ ] **Step 1: Write the failing tests**

```javascript
'use strict';
// check-ep2-s1-feature-picker.js -- TDD tests for ep2-s1 (Epic 2, customer-journey
// feature). Story: artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
const assert = require('assert');
const fs = require('fs');

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

(async function() {
  var journeys = require('../src/web-ui/routes/journeys');

  console.log('\nAC1 -- feature picker modal lists features from pipeline-state.json with name and slug');
  await (async () => {
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
    console.log('  ok');
  })();

  console.log('\nAC1 (boundary) -- feature picker renders a distinct empty state with zero features, not the AC3 error state');
  await (async () => {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('No features found') !== -1, 'expected a zero-features message');
    assert.ok(out.indexOf('could not be loaded') === -1, 'zero-features state must NOT show the AC3 error text');
    console.log('  ok');
  })();

  console.log('\nAC3 -- explicit error state when pipeline-state.json cannot be read (ENOENT)');
  await (async () => {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState(function() { throw new Error('ENOENT: no such file'); }, async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Features could not be loaded. Check that pipeline-state.json exists.') !== -1, 'expected the exact AC3 error text');
    console.log('  ok');
  })();

  console.log('\nAC3 -- same explicit error state when pipeline-state.json contains invalid JSON');
  await (async () => {
    var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null }, []);
    var out = await withMockedPipelineState('{not valid json', async () => {
      var { req, res } = makeMockReqRes();
      await journeys.handleGetJourneyCanvas(req, res, null, pool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Features could not be loaded. Check that pipeline-state.json exists.') !== -1, 'expected the exact AC3 error text on JSON.parse failure');
    console.log('  ok');
  })();

  console.log('\n(shape) -- handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path');
  await (async () => {
    var src = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys'), 'utf8');
    assert.ok(src.indexOf('_repoRootAdapter.getRepoRoot(req)') !== -1, 'expected a call to _repoRootAdapter.getRepoRoot(req)');
    assert.ok(/\.github['"],\s*['"]pipeline-state\.json/.test(src), "expected a path.join(..., '.github', 'pipeline-state.json') construction");
    console.log('  ok');
  })();

  console.log('\nAll ep2-s1 Task 1 tests passed.');
})();
```

- [ ] **Step 2: Run tests — must fail**

```bash
node tests/check-ep2-s1-feature-picker.js
```

Expected output: `TypeError: journeys.handleGetJourneyCanvas is not a function` or assertion failures — the feature picker markup does not exist yet.

- [ ] **Step 3: Implement**

In `src/web-ui/routes/journeys.js`, add the import at the top of the file (after the existing `_csrf` require):

```javascript
var _repoRootAdapter = require('../adapters/repo-root'); // ep2-s1 -- reuses the existing local-disk repo-root pattern, already used by products.js
```

Inside `handleGetJourneyCanvas`, immediately after the existing `var stages = sr.rows || [];` line, add:

```javascript
  // ep2-s1 -- read pipeline-state.json fresh on every canvas load (ADR-029:
  // local filesystem is canonical, never cached/duplicated in Postgres).
  // Deliberately NOT reusing products.js's own silent { features: [] }
  // fallback -- AC3 requires a visible, distinct error state, not an
  // empty list indistinguishable from "this file genuinely has zero
  // features" (see decisions.md D10 / the test-plan's own grounding notes).
  var features = [];
  var featuresLoadError = false;
  try {
    var repoRoot = _repoRootAdapter.getRepoRoot(req);
    var pipelineStatePath = require('path').join(repoRoot, '.github', 'pipeline-state.json');
    var pipelineState = JSON.parse(require('fs').readFileSync(pipelineStatePath, 'utf8'));
    features = pipelineState.features || [];
  } catch (_) {
    featuresLoadError = true;
  }
```

Then, in the stage card rendering (inside the `stages.map(function(s, idx) { ... })` callback), add a "Map feature" button to the returned markup — right after the existing "Edit stage" link:

```javascript
        return (
          '<div class="sw-stage-card" data-stage-id="' + escHtml(s.id) + '" draggable="true">' +
            '<span class="sw-stage-name">' + escHtml(s.name) + '</span>' +
            (s.moment_of_truth
              ? '<span class="sw-stage-moment-badge">' + MOMENT_OF_TRUTH_ICON + ' Moment of truth</span>'
              : '') +
            reorderControls +
            '<a href="#" class="sw-stage-edit" data-stage-id="' + escHtml(s.id) + '">Edit stage</a>' +
            '<button type="button" class="sw-stage-map-feature" data-stage-id="' + escHtml(s.id) + '">Map feature</button>' +
          '</div>'
        );
```

Immediately after the existing `var csrfToken = await _csrf.generateCsrfToken(req);` line (and before `panelHtml`), add the feature-picker modal construction:

```javascript
  // ep2-s1 -- feature picker modal. Three mutually exclusive body states,
  // never conflated: a read/parse failure (AC3), a genuinely empty
  // pipeline-state.json (AC1 boundary), and the populated list (AC1/AC2).
  var featureItemsHtml = features.map(function(f) {
    var slug = escHtml(f.slug || '');
    var name = escHtml(f.name || f.slug || '');
    return '<li class="sw-feature-picker-item" data-slug="' + slug.toLowerCase() + '" data-name="' + name.toLowerCase() + '" role="option">' +
      '<span class="sw-feature-picker-name">' + name + '</span>' +
      '<span class="sw-feature-picker-slug">' + slug + '</span>' +
    '</li>';
  }).join('');

  var featurePickerBodyHtml;
  if (featuresLoadError) {
    featurePickerBodyHtml = '<p id="sw-feature-picker-error" class="sw-feature-picker-message" role="status">Features could not be loaded. Check that pipeline-state.json exists.</p>';
  } else if (features.length === 0) {
    featurePickerBodyHtml = '<p id="sw-feature-picker-none" class="sw-feature-picker-message" role="status">No features found in pipeline-state.json.</p>';
  } else {
    featurePickerBodyHtml =
      '<label class="sw-feature-picker-search-label" for="sw-feature-picker-search">Search features' +
        '<input id="sw-feature-picker-search" type="text" placeholder="Filter by name or slug…" aria-label="Search features" oninput="swFilterFeaturePicker()">' +
      '</label>' +
      '<ul id="sw-feature-picker-list" role="listbox" aria-label="Pipeline features" class="sw-feature-picker-list">' +
        featureItemsHtml +
      '</ul>' +
      '<p id="sw-feature-picker-empty" class="sw-feature-picker-empty" role="status" style="display:none">No features match your search.</p>';
  }

  var featurePickerModalHtml =
    '<div id="sw-feature-picker-modal" class="sw-feature-picker-modal" role="dialog" aria-modal="true" aria-labelledby="sw-feature-picker-title" aria-hidden="true">' +
      '<div class="sw-feature-picker-header">' +
        '<h2 id="sw-feature-picker-title">Map feature</h2>' +
        '<button type="button" id="sw-feature-picker-close" aria-label="Close feature picker">✕</button>' +
      '</div>' +
      featurePickerBodyHtml +
    '</div>' +
    '<style>' +
      '.sw-feature-picker-modal{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'width:420px;max-width:90vw;max-height:70vh;overflow-y:auto;background:var(--surface);' +
        'border:1px solid var(--line);border-radius:8px;padding:20px;z-index:110;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.24)}' +
      '.sw-feature-picker-modal--open{display:block}' +
      '.sw-feature-picker-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}' +
      '.sw-feature-picker-search-label{display:block;font-size:13px;color:var(--ink-2);margin-bottom:10px}' +
      '.sw-feature-picker-search-label input{display:block;width:100%;margin-top:6px;background:var(--bg);' +
        'color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-size:13px}' +
      '.sw-feature-picker-list{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:6px;max-height:300px;overflow-y:auto}' +
      '.sw-feature-picker-item{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-bottom:1px solid var(--line)}' +
      '.sw-feature-picker-item:last-child{border-bottom:none}' +
      '.sw-feature-picker-item--hidden{display:none}' +
      '.sw-feature-picker-name{font-size:13px;color:var(--ink)}' +
      '.sw-feature-picker-slug{font-size:11px;color:var(--ink-2)}' +
      '.sw-feature-picker-message{font-size:13px;color:var(--ink-2)}' +
      '.sw-feature-picker-empty{font-size:12px;color:var(--muted)}' +
      '.sw-stage-map-feature{margin-left:8px}' +
    '</style>';
```

Finally, wire `featurePickerModalHtml` into `bodyContent` (insert after `panelHtml +` and before the existing `'<script>(function(){' +` line):

```javascript
  var bodyContent =
    '<div class="sw-journey-canvas">' +
      '<h1>' + escHtml(journey.name) + '</h1>' +
      '<div class="sw-journey-stages" id="sw-journey-stages">' +
        stagesHtml +
      '</div>' +
      '<span id="sw-stage-reorder-error" class="sw-stage-reorder-error" aria-live="polite"></span>' +
      '<button type="button" id="sw-add-stage-btn">+ Add stage</button>' +
    '</div>' +
    panelHtml +
    featurePickerModalHtml +
    '<script>(function(){' +
      // ... existing script body UNCHANGED, do not modify ...
```

Do not touch anything inside the existing `<script>(function(){...})()` block in this task — that is Task 2/3's job.

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-ep2-s1-feature-picker.js
```

Expected output: `All ep2-s1 Task 1 tests passed.` (all 5 assertions in the block above pass)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (728 files including the new one, 0 failed)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s1-feature-picker.js
git commit -m "feat: feature picker reads pipeline-state.json with explicit error/empty/populated states (ep2-s1 AC1, AC3)"
```

---

## Task 2: Client-side filter input (AC2)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s1-feature-picker.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep2-s1-feature-picker.js`, inside the `(async function() { ... })()` IIFE, before the final `console.log('\nAll ep2-s1 Task 1 tests passed.')` line (rename that final line to `'All ep2-s1 tests passed.'` once all tasks are done):

```javascript
  console.log('\nAC2 -- feature picker includes a filter/search input wired to the rendered list');
  await (async () => {
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
    console.log('  ok');
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s1-feature-picker.js
```

Expected output: pass (Task 1 already wrote the filter input and `data-*` attributes as part of the modal markup) — **if this unexpectedly passes without any new implementation, that confirms Task 1's markup already satisfies AC2's structural requirement; proceed to Step 3 to add the actual filtering BEHAVIOUR (the `swFilterFeaturePicker` function body), which Task 1 deliberately left unimplemented (the `oninput` handler references a function that does not exist yet).**

- [ ] **Step 3: Implement**

At the very end of `bodyContent`'s construction — after the existing `'})()<\/script>';` line that closes the stage-panel/reorder script — change the final semicolon-terminated assignment to append a second, separate `<script>` block:

```javascript
      // ... existing script body unchanged, ends with: ...
    '})()<\/script>' +
    '<script>(function(){' +
      'var fpModal=document.getElementById("sw-feature-picker-modal");' +
      'var fpSearch=document.getElementById("sw-feature-picker-search");' +
      'window.swFilterFeaturePicker=function(){' +
        'if(!fpSearch)return;' +
        'var q=(fpSearch.value||"").trim().toLowerCase();' +
        'var items=Array.prototype.slice.call(document.querySelectorAll(".sw-feature-picker-item"));' +
        'var anyVisible=false;' +
        'items.forEach(function(li){' +
          'var match=!q||li.getAttribute("data-slug").indexOf(q)!==-1||li.getAttribute("data-name").indexOf(q)!==-1;' +
          'li.classList.toggle("sw-feature-picker-item--hidden",!match);' +
          'if(match)anyVisible=true;' +
        '});' +
        'var emptyEl=document.getElementById("sw-feature-picker-empty");' +
        'if(emptyEl)emptyEl.style.display=(items.length&&!anyVisible)?"block":"none";' +
      '};' +
    '})()<\/script>';
```

(Task 3 will extend this same new `<script>` block with the open/close handlers — do not duplicate the `(function(){...})()` wrapper.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s1-feature-picker.js
```

Expected output: `All ep2-s1 tests passed.` (AC2 test passes — the `oninput` attribute and `data-*` attributes were already present from Task 1; this step adds the actual filter behaviour the handler invokes)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s1-feature-picker.js
git commit -m "feat: client-side filter for the feature picker's rendered list (ep2-s1 AC2)"
```

---

## Task 3: Close/Escape handling with no server call (AC4)

**Files:**
- Modify: `src/web-ui/routes/journeys.js`
- Test: `tests/check-ep2-s1-feature-picker.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep2-s1-feature-picker.js`, before the final summary line:

```javascript
  console.log('\nAC4 -- closing the picker without selecting a feature issues no write');
  await (async () => {
    var src = fs.readFileSync(require.resolve('../src/web-ui/routes/journeys'), 'utf8');
    var modalScriptStart = src.indexOf('sw-feature-picker-close');
    assert.ok(modalScriptStart !== -1, 'expected the feature-picker close button to be wired in the script');
    var scriptSection = src.slice(src.indexOf('fpModal'), src.indexOf('fpModal') + 1200);
    assert.ok(scriptSection.indexOf('fetch(') === -1, 'expected no fetch( call anywhere in the feature-picker close-handling script section');
    assert.ok(scriptSection.indexOf('POST') === -1, 'expected no POST anywhere in the feature-picker close-handling script section');
    console.log('  ok');
  })();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s1-feature-picker.js
```

Expected output: `AssertionError: expected the feature-picker close button to be wired in the script` — the open/close handlers (referencing `fpModal`, `sw-feature-picker-close`) do not exist yet.

- [ ] **Step 3: Implement**

Extend the same second `<script>` block added in Task 2 (do not add a third `(function(){...})()` wrapper — add these lines inside the existing one, before the `window.swFilterFeaturePicker=function(){...}` assignment):

```javascript
    '<script>(function(){' +
      'var fpModal=document.getElementById("sw-feature-picker-modal");' +
      'var fpClose=document.getElementById("sw-feature-picker-close");' +
      'var fpSearch=document.getElementById("sw-feature-picker-search");' +
      'var fpTriggerEl=null;' +
      'function fpOpen(trigger){' +
        'fpTriggerEl=trigger||document.activeElement;' +
        'fpModal.classList.add("sw-feature-picker-modal--open");' +
        'fpModal.setAttribute("aria-hidden","false");' +
        'if(fpSearch)fpSearch.focus();' +
      '}' +
      'function fpCloseFn(){' +
        'fpModal.classList.remove("sw-feature-picker-modal--open");' +
        'fpModal.setAttribute("aria-hidden","true");' +
        'if(fpTriggerEl&&typeof fpTriggerEl.focus==="function")fpTriggerEl.focus();' +
      '}' +
      'if(fpClose)fpClose.addEventListener("click",fpCloseFn);' +
      'document.addEventListener("keydown",function(evt){' +
        'if(fpModal.classList.contains("sw-feature-picker-modal--open")&&evt.key==="Escape")fpCloseFn();' +
      '});' +
      'Array.prototype.slice.call(document.querySelectorAll(".sw-stage-map-feature")).forEach(function(btn){' +
        'btn.addEventListener("click",function(){fpOpen(btn);});' +
      '});' +
      'window.swFilterFeaturePicker=function(){' +
        'if(!fpSearch)return;' +
        'var q=(fpSearch.value||"").trim().toLowerCase();' +
        'var items=Array.prototype.slice.call(document.querySelectorAll(".sw-feature-picker-item"));' +
        'var anyVisible=false;' +
        'items.forEach(function(li){' +
          'var match=!q||li.getAttribute("data-slug").indexOf(q)!==-1||li.getAttribute("data-name").indexOf(q)!==-1;' +
          'li.classList.toggle("sw-feature-picker-item--hidden",!match);' +
          'if(match)anyVisible=true;' +
        '});' +
        'var emptyEl=document.getElementById("sw-feature-picker-empty");' +
        'if(emptyEl)emptyEl.style.display=(items.length&&!anyVisible)?"block":"none";' +
      '};' +
    '})()<\/script>';
```

This is the complete final form of the second `<script>` block — it supersedes the partial version written in Task 2 Step 3 (same block, now with open/close handlers added above the filter function).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s1-feature-picker.js
```

Expected output: `All ep2-s1 tests passed.` (7/7 tests passing)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 failed

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journeys.js tests/check-ep2-s1-feature-picker.js
git commit -m "feat: feature picker open/close handling, no server call on close (ep2-s1 AC4)"
```

---

## After all tasks

Run `/verify-completion` — full suite + walk through `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep2-s1-verification.md`. A local real-browser render check (matching `ep4-s1`'s/`ep4-s2`'s own precedent) is viable for Scenarios 1, 2, and 4 — `pipeline-state.json` is a real file present in every checkout, so unlike journey/stage data this story's input data does not depend on `fake-test-db.js`. Scenario 3 (broken `pipeline-state.json`) and the empty-features edge case both require a throwaway local copy, per the verification script's own setup notes — do not corrupt the real repo file.
