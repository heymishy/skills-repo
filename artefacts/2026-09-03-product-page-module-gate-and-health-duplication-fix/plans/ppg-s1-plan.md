# Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Two fixes: (1) remove the `modules.length === 0` gate that skips `pdt-s1`'s own tabbed/grouped/collapsed UI, reusing already-correct zero-modules grouping behaviour unchanged; (2) consolidate health counts from 3 duplicate displays onto the single interactive chip bar.
**Branch:** `feature/ppg-s1`
**Worktree:** `.worktrees/ppg-s1`
**Test command:** `npm test` (full suite) / `node tests/check-ppg-s1-decouple-modules-gate.js` (this story's own file)

---

## File map

```
Create:
  tests/check-ppg-s1-decouple-modules-gate.js  — 6 tests for AC1-AC6

Modify:
  src/web-ui/routes/products.js  — _renderConsolidatedFeaturesSection (remove modules-gate,
                                    add defaultTab, gate bulkAssignBarHtml, add counts to
                                    healthChips); _renderProductView (remove triageStripHtml,
                                    simplify healthHtml, pass healthCounts through)
  tests/check-pdt-s2-triage-summary-strip.js  — rewritten: asserts the new consolidated
                                    chip-bar behaviour instead of the removed pdt-triage-strip
```

---

## Task 1: Decouple the grouped/tabbed UI from requiring custom Modules (AC1, AC2, AC3, AC6)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-ppg-s1-decouple-modules-gate.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/check-ppg-s1-decouple-modules-gate.js
'use strict';
var assert = require('assert');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var productsRoute = require(PRODUCTS_ROUTE_PATH);

function itemsFixture() {
  return [
    { slug: 'p0.1', name: 'P0.1', epicName: 'Phase 0', health: 'green', coverageLabel: '100%' },
    { slug: 'p0.2', name: 'P0.2', epicName: 'Phase 0', health: 'amber', coverageLabel: '50%' },
    { slug: 'p1.1', name: 'P1.1', epicName: 'Phase 1', health: 'red', coverageLabel: '0%' }
  ];
}

console.log('\n[ppg-s1] AC1 -- zero-modules product renders the full tabbed/filterable UI, not a flat list');

test('zero-modules: tabs, search, and health-filter chip bar all render', function() {
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'ph0', epicName: 'Phase 0', items: [{ slug: 'p0.1' }, { slug: 'p0.2' }] }], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/class="pvc-tabs"/.test(html), 'expected the tabs bar to render');
  assert.ok(/id="pvc-tab-phase"/.test(html), 'expected the By Phase tab to render');
  assert.ok(/id="pvc-tab-module"/.test(html), 'expected the By Module tab to render');
  assert.ok(/id="pvc-tab-all"/.test(html), 'expected the All tab to render');
  assert.ok(/class="pvc-search"/.test(html), 'expected the search box to render');
  assert.ok(/class="pvc-health-chip/.test(html), 'expected the health-filter chip bar to render');
});

console.log('\n[ppg-s1] AC2 -- zero-modules By Module tab shows exactly one Unclassified group, no bulk-assign bar');

test('zero-modules: By Module tab shows one Unclassified(N) group, no bmau-bar', function() {
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'ph0', epicName: 'Phase 0', items: [{ slug: 'p0.1' }, { slug: 'p0.2' }] }], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  var modulePanel = html.match(/id="pvc-tab-panel-module"[\s\S]*?(?=id="pvc-tab-panel-phase")/)[0];
  assert.ok(/Unclassified/.test(modulePanel), 'expected an Unclassified group in the By Module panel');
  assert.ok(/Unclassified.*\(3\)/.test(modulePanel), 'expected the Unclassified group to show the correct item count (3)');
  assert.ok(!/bmau-bar/.test(modulePanel), 'expected no bulk-assign bar when there are zero modules to assign to');
});

console.log('\n[ppg-s1] AC3/AC6 -- default active tab: By Phase for zero modules, By Module for >=1 module');

test('zero-modules: By Phase is the default active tab', function() {
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [{ epicSlug: 'ph0', epicName: 'Phase 0', items: [{ slug: 'p0.1' }, { slug: 'p0.2' }] }], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-phase" role="tab" aria-selected="true"/.test(html), 'expected By Phase tab to be aria-selected=true');
  assert.ok(/id="pvc-tab-panel-phase" class="pvc-tab-panel pvc-tab-panel--active"/.test(html), 'expected the By Phase panel to carry the active class');
  assert.ok(/id="pvc-tab-module" role="tab" aria-selected="false"/.test(html), 'expected By Module tab to NOT be aria-selected when zero modules');
});

test('with-modules: By Module remains the default active tab (regression guard, AC6)', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', modules, 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/id="pvc-tab-module" role="tab" aria-selected="true"/.test(html), 'expected By Module tab to still be the default when >=1 module exists');
  assert.ok(/id="pvc-tab-panel-module" class="pvc-tab-panel pvc-tab-panel--active"/.test(html), 'expected the By Module panel to carry the active class');
});

test('with-modules: bulk-assign bar still renders (regression guard, AC6)', function() {
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var rollupRow = { health_counts: { green: 1, amber: 1, red: 1, unknown: 0 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', modules, 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/bmau-bar/.test(html), 'expected the bulk-assign bar to still render when >=1 module exists');
});

console.log('\n[ppg-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed > 0 ? 1 : 0;
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppg-s1-decouple-modules-gate.js
```

Expected output: the zero-modules tests fail (`pvc-tabs`/`pvc-tab-phase`/etc. absent — the current early return produces only a flat `<ul>`); the with-modules tests pass already (unchanged behaviour today).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`, replace `_renderConsolidatedFeaturesSection`'s opening (currently lines 364-372):

```javascript
function _renderConsolidatedFeaturesSection(items, modules, taxonomy, productId, csrfToken, healthCounts) {
  if (modules.length === 0 && items.length === 0) {
    return '<p style="color:var(--muted);font-size:14px">No features yet.</p>';
  }

  var byModule = _productRollup.groupItemsByModule(items, _pvcAssignmentMapFromItems(items), modules);
  var byPhase = _productRollup.groupItemsByPhase(items);

  var _renderPvcItemRowWithCheckbox = function(item) { return _renderPvcItemRow(item, true); };

  var moduleOptionsHtml = modules.map(function(m) {
    return '<option value="' + _escapeHtml(m.id) + '">' + _escapeHtml(m.name) + '</option>';
  }).join('');
  var bulkAssignBarHtml =
    '<div class="bmau-bar" style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 12px;background:var(--surface);border:1px solid var(--line);border-radius:8px">' +
      '<span id="bmau-selected-count" style="font-size:12.5px;color:var(--muted)">0 selected</span>' +
      '<select id="bmau-module-select" style="padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:13px;background:var(--surface);color:var(--ink)">' +
        moduleOptionsHtml +
      '</select>' +
      '<button type="button" id="bmau-assign-btn" disabled onclick="bmauAssignToModule(\'' + _escapeHtml(productId || '') + '\',\'' + _escapeHtml(csrfToken || '') + '\')" ' +
        'style="padding:6px 12px;border:1px solid var(--accent,#2563eb);border-radius:6px;background:none;color:var(--accent,#2563eb);font-size:12.5px;cursor:pointer">Assign to module</button>' +
    '</div>';

  // ppg-s1 (AC3, AC6): default tab is By Phase when there are zero custom
  // modules (a lone Unclassified bucket is a worse first view than the
  // real phase breakdown), unchanged By Module default otherwise.
  var defaultTab = modules.length === 0 ? 'phase' : 'module';
```

Replace the `byModuleHtml`/`byPhaseHtml` construction (currently lines 398-409):

```javascript
  var byModuleHtml =
    '<div id="pvc-tab-panel-module" class="pvc-tab-panel' + (defaultTab === 'module' ? ' pvc-tab-panel--active' : '') + '" role="tabpanel" aria-labelledby="pvc-tab-module">' +
      // ppg-s1 (AC2): nothing to assign to when there are zero modules.
      (modules.length > 0 ? bulkAssignBarHtml : '') +
      byModule.byModule.map(function(bucket) { return _renderModuleSection(bucket.moduleName, bucket.moduleId, bucket.items, _renderPvcItemRowWithCheckbox); }).join('') +
      (byModule.unclassified.length > 0 ? _renderModuleSection('Unclassified', 'unclassified', byModule.unclassified, _renderPvcItemRowWithCheckbox) : '') +
    '</div>';

  var byPhaseHtml =
    '<div id="pvc-tab-panel-phase" class="pvc-tab-panel' + (defaultTab === 'phase' ? ' pvc-tab-panel--active' : '') + '" role="tabpanel" aria-labelledby="pvc-tab-phase">' +
      byPhase.byPhase.map(function(p) { return _renderModuleSection(p.epicName, 'phase-' + _escapeHtml(p.epicName), p.items, _renderPvcItemRow); }).join('') +
      (byPhase.other.length > 0 ? _renderModuleSection('Other features', 'phase-other', byPhase.other, _renderPvcItemRow) : '') +
    '</div>';
```

Replace the tabs bar markup (currently lines 446-450):

```javascript
    '<div class="pvc-tabs" role="tablist" aria-label="Features view">' +
      '<button type="button" class="pvc-tab' + (defaultTab === 'module' ? ' pvc-tab--active' : '') + '" id="pvc-tab-module" role="tab" aria-selected="' + (defaultTab === 'module' ? 'true' : 'false') + '" onclick="pvcShowTab(\'module\')">By Module</button>' +
      '<button type="button" class="pvc-tab' + (defaultTab === 'phase' ? ' pvc-tab--active' : '') + '" id="pvc-tab-phase" role="tab" aria-selected="' + (defaultTab === 'phase' ? 'true' : 'false') + '" onclick="pvcShowTab(\'phase\')">By Phase</button>' +
      '<button type="button" class="pvc-tab" id="pvc-tab-all" role="tab" aria-selected="false" onclick="pvcShowTab(\'all\')">All</button>' +
    '</div>' +
```

(The `.pvc-tab-panel--active` CSS rule already exists and needs no change — it's applied by class regardless of which panel carries it now.)

- [ ] **Step 4: Update the call site in `_renderProductView`**

Find `var featuresSectionHtml = _renderConsolidatedFeaturesSection(mergedItems, modules, taxonomy, productId, csrfToken);` and pass `healthCounts` through:

```javascript
var featuresSectionHtml = _renderConsolidatedFeaturesSection(mergedItems, modules, taxonomy, productId, csrfToken, healthCounts);
```

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-ppg-s1-decouple-modules-gate.js
```

Expected output: all 5 `[PASS]` lines for AC1/AC2/AC3/AC6.

- [ ] **Step 6: Run pre-existing test files that exercise this code path**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
node tests/check-pvc-s1-consolidate-and-tab-features-view.js
node tests/check-tmc-s1-persist-feature-module-classification.js
```

Expected output: all pass unchanged — none of these fixtures use `modules.length === 0` with a non-empty items list in a way that asserts flat-list-specific markup (confirmed via grep during DoR); the "No features yet." tests (zero items) are unaffected since that exact condition and message are preserved unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-ppg-s1-decouple-modules-gate.js
git commit -m "fix: decouple grouped/tabbed features UI from requiring custom Modules (AC1, AC2, AC3, AC6)"
```

---

## Task 2: Consolidate health counts onto the single interactive chip bar (AC4, AC5)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-ppg-s1-decouple-modules-gate.js` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-ppg-s1-decouple-modules-gate.js`, before the final `console.log('\n[ppg-s1] Results so far...')` line:

```javascript
console.log('\n[ppg-s1] AC4 -- health counts appear once, on the interactive chip bar, with real counts');

test('health-filter chips show real per-status counts; pdt-triage-strip is gone', function() {
  var rollupRow = { health_counts: { green: 50, amber: 3, red: 1, unknown: 10 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  assert.ok(/Warning \(3\)/.test(html), 'expected the Warning chip to show its real count (3)');
  assert.ok(/Blocked \(1\)/.test(html), 'expected the Blocked chip to show its real count (1)');
  assert.ok(/Healthy \(50\)/.test(html), 'expected the Healthy chip to show its real count (50)');
  assert.ok(/Unknown \(10\)/.test(html), 'expected the Unknown chip to show its real count (10)');
  assert.ok(!/pdt-triage-strip/.test(html), 'expected the old separate triage-strip block to be gone');
});

console.log('\n[ppg-s1] AC5 -- Overall line shows only its single derived label, no repeated breakdown');

test('Overall line contains only its own label, no per-status breakdown', function() {
  var rollupRow = { health_counts: { green: 50, amber: 3, red: 1, unknown: 10 }, taxonomy: { groups: [], ungrouped: [{ slug: 'p1.1' }] }, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
  var html = productsRoute._renderProductView('Test Product', 'p1', [], 'tester', rollupRow, false, 'o', 'r', [], 'csrf-token', {}, {}, [], 0, null, false);
  var overallMatch = html.match(/Overall: [^<]*<\/span>\s*<\/div>/);
  assert.ok(overallMatch, 'expected an Overall line to render');
  assert.ok(!/Overall:[\s\S]{0,10}Healthy: 50/.test(html), 'expected no repeated Healthy: N breakdown near the Overall line');
  var overallDiv = html.match(/<div style="margin-top:12px;font-size:13px">[\s\S]{0,150}/)[0];
  assert.ok(!/Blocked: 1/.test(overallDiv), 'expected no Blocked: N text inside the simplified Overall div');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppg-s1-decouple-modules-gate.js
```

Expected output: `[FAIL]` for both new tests — the chip bar currently has no counts, and `pdt-triage-strip`/the old per-status breakdown are both still present.

- [ ] **Step 3: Write the implementation**

In `_renderConsolidatedFeaturesSection`, replace the `healthChips` construction (currently lines 418-421):

```javascript
  var healthChips = ['all', 'green', 'amber', 'red', 'unknown'].map(function(h) {
    var label = h === 'all' ? 'All' : h === 'green' ? 'Healthy' : h === 'amber' ? 'Warning' : h === 'red' ? 'Blocked' : 'Unknown';
    // ppg-s1 (AC4): real per-status counts, consolidating what pdt-s2's own
    // separate triageStripHtml and the Overall line's own per-status
    // breakdown used to duplicate.
    var count = h === 'all' ? items.length : ((healthCounts && healthCounts[h]) || 0);
    return '<button type="button" class="pvc-health-chip' + (h === 'all' ? ' pvc-health-chip--active' : '') + '" data-health-filter="' + h + '" onclick="pvcFilterByHealth(this)">' + _escapeHtml(label) + ' (' + count + ')</button>';
  }).join('');
```

In `_renderProductView`, replace `healthHtml`'s construction (currently lines 736-745) to drop the per-status breakdown:

```javascript
  var healthHtml = healthCounts
    ? '<div style="margin-top:12px;font-size:13px"><span style="font-weight:600;color:' + HEALTH_COLORS[overallSignal] + '">Overall: ' + _escapeHtml(HEALTH_LABELS[overallSignal]) + '</span></div>'
    : '<div style="margin-top:12px;font-size:13px"><span style="font-weight:600;color:' + HEALTH_COLORS.unknown + '">Overall: ' + HEALTH_LABELS.unknown + '</span></div>';
```

Remove `triageStripHtml`'s entire construction block (currently lines 808-833) and its own usage at the `triageStripHtml +` call site (currently around line 959) — delete both entirely.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppg-s1-decouple-modules-gate.js
```

Expected output: all `[PASS]` lines, 7 passed total (5 from Task 1 + 2 from Task 2).

- [ ] **Step 5: Run the now-affected pre-existing test file, then rewrite it**

```bash
node tests/check-pdt-s2-triage-summary-strip.js
```

Expected output: all 5 pre-existing tests now fail (they assert `pdt-triage-strip`, which is gone). Rewrite `tests/check-pdt-s2-triage-summary-strip.js` in full to assert the new consolidated behaviour instead — same file, same purpose (verifying clickable Blocked/Warning triage above the list), updated to match where that function now actually lives:

```javascript
'use strict';

// tests/check-pdt-s2-triage-summary-strip.js — pdt-s2, superseded by ppg-s1
//
// pdt-s2 originally added a separate, standalone triage-strip block above
// the feature list. ppg-s1 found this duplicated the same Blocked/Warning
// counts already shown (non-interactively) on the Overall line, and a
// THIRD time (uncounted) on the health-filter chip bar inside the features
// section. Consolidated onto that single chip bar, now with real counts --
// this file's own tests are rewritten to match, not deleted, since the
// underlying requirement (clickable, above-the-list Blocked/Warning
// triage) is still true, just served by one mechanism instead of two.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');

(async function() {
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  await test('Blocked and Warning counts render as clickable chips with real counts', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 50, amber: 3, red: 1, unknown: 10 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/Blocked \(1\)/.test(html), 'expected the Blocked chip to show count 1');
    assert.ok(/Warning \(3\)/.test(html), 'expected the Warning chip to show count 3');
  });

  await test('chips reuse the real pvcFilterByHealth mechanism', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 50, amber: 3, red: 1, unknown: 10 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    var blockedChipMatch = /<button type="button" class="pvc-health-chip[^"]*" data-health-filter="red" onclick="pvcFilterByHealth\(this\)">[^<]*Blocked \(1\)<\/button>/.exec(html);
    assert.ok(blockedChipMatch, 'expected the Blocked chip to carry the real filter class/handler');
    assert.ok(/function pvcFilterByHealth\(btn\)/.test(html), 'expected the real pvcFilterByHealth handler to be defined on the page');
  });

  await test('zero Blocked and zero Warning still shows real (0) counts on the chips', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 60, amber: 0, red: 0, unknown: 5 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/Blocked \(0\)/.test(html), 'expected the Blocked chip to show (0), not be hidden or replaced with a separate message');
    assert.ok(/Warning \(0\)/.test(html), 'expected the Warning chip to show (0)');
  });

  await test('NFR-Performance: chips reuse existing healthCounts, no new query/computation', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 1, amber: 1, red: 1, unknown: 0 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/Warning \(1\)/.test(html), 'expected the chip to render from the already-computed healthCounts, no new query path');
  });

  await test('NFR-Accessibility: chips are real, keyboard-operable <button> controls', function() {
    var modules = [{ id: 'm1', name: 'Module 1' }];
    var healthCounts = { green: 1, amber: 1, red: 1, unknown: 0 };
    var rollupRow = { health_counts: healthCounts, taxonomy: null, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };
    var html = productsRoute._renderProductView('Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null, modules, 'csrf-token', {}, {}, [], 0, null, false);
    assert.ok(/<button type="button" class="pvc-health-chip/.test(html), 'expected real <button type="button"> elements, natively keyboard-operable via Enter/Space');
  });

  console.log('\n[check-pdt-s2-triage-summary-strip] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
```

- [ ] **Step 6: Run test — must pass**

```bash
node tests/check-pdt-s2-triage-summary-strip.js
node tests/check-ppg-s1-decouple-modules-gate.js
```

Expected output: all pass.

- [ ] **Step 7: Run pdt-s3's own file — confirm no changes needed**

```bash
node tests/check-pdt-s3-deemphasize-unknown-health.js
```

Expected output: all pass unchanged (confirmed at DoR time these only assert the single Overall label, not the removed breakdown).

- [ ] **Step 8: Run full suite — final check**

```bash
npm test
```

Expected output: same baseline (established at branch-setup), 0 new failures beyond the 1 known pre-existing one.

- [ ] **Step 9: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-ppg-s1-decouple-modules-gate.js tests/check-pdt-s2-triage-summary-strip.js
git commit -m "fix: consolidate health counts onto the single interactive chip bar (AC4, AC5)"
```

---

<!-- End of plan. Next: /verify-completion once both tasks are committed. -->
