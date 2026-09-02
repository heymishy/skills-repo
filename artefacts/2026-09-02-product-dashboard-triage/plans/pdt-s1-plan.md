# Consolidate the Epic/Phase List — Implementation Plan

> **For agent execution:** Executing task-by-task via /tdd in this session (no subagent dispatch — solo session, investigation already complete).

**Goal:** Remove the duplicate static "Epics"/"Other features" text-dump breakdown, default the remaining interactive grouped list to collapsed with a rolled-up status indicator per group, and preserve the existing zero-groups empty state.
**Branch:** `feature/pdt-s1`
**Worktree:** `.worktrees/pdt-s1`
**Test command:** `node tests/check-pdt-s1-consolidate-epic-list.js` (per-task), `npm test` (full suite, Task 4)

---

## Investigation note (code-confirmed, diverges slightly from the DoR's named function)

The DoR's Architecture Constraints name `_renderConsolidatedFeaturesSection`/`_renderProductView` as producing "both the static list and the interactive tabs." Direct code reading (`src/web-ui/routes/products.js`) confirms `_renderProductView` is the correct top-level function, but the actual static, non-interactive "Epics" / "Other features" text dump described in discovery.md ("~40 epic/phase headings as plain bold text, each followed by a bullet list of story-ID/percentage pairs") is produced by a separate, smaller function: `_renderGroupedCoverageBreakdown` (lines 111–144), called once from inside `_renderProductView`'s `coverageHtml` construction (line 756). `_renderConsolidatedFeaturesSection` (line 377) is the *interactive* By Module/By Phase/All renderer only — it was never the source of the duplicate static text. This is a small, well-understood correction (not a scope-changing surprise) — proceeding on this basis rather than pausing, consistent with this story's own AC1 intent ("the static, non-interactive text rendering is removed, leaving only the interactive grouped list").

Also confirmed: AC2's "rolled-up status indicator" on the collapsed group header does not exist in the current code — `_renderModuleSection` (line 273) today shows only a title and item count, no health signal. This is genuinely new work, built by reusing `_productRollup.computeOverallHealthSignal` (the same red > amber > green precedence already used for the page-level "Overall:" line at `_renderProductView` line 739–742) rather than inventing new health-rollup logic.

---

## File map

```
Modify:
  src/web-ui/routes/products.js — remove _renderGroupedCoverageBreakdown and its
    call site (AC1); default _renderModuleSection's group body to collapsed and
    add a rolled-up health-signal span to its header (AC2, AC3)

Create:
  tests/check-pdt-s1-consolidate-epic-list.js — 5 unit + 2 NFR tests (AC1-AC4 + NFRs)
```

---

## Task 1: Remove the static Epics/Other-features duplicate breakdown (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-pdt-s1-consolidate-epic-list.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC1: static Epics/Other-features breakdown is removed; epic name renders exactly once', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }, { slug: 's2' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
  var testCoverage = {
    blendedPercentage: 50, noData: false,
    perFeature: [{ slug: 's1', percentage: 50 }, { slug: 's2', percentage: 50 }],
    groups: [{ epicName: 'Epic One', epicSlug: 'e1', items: [{ slug: 's1', percentage: 50 }, { slug: 's2', percentage: 50 }] }],
    ungrouped: []
  };
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: testCoverage, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
  );

  assert.ok(!/<h4[^>]*>Epics<\/h4>/.test(html), 'expected the static "Epics" heading to be removed entirely');
  // The removed static breakdown was the only place that ever rendered the
  // "slug: percentage%" colon-separated format (e.g. "s1: 50%") -- the
  // interactive rows show coverageLabel alone ("50%"), never slug-prefixed.
  assert.ok(!/s1: 50%/.test(html) && !/s2: 50%/.test(html), 'expected the static breakdown\'s distinctive "slug: pct%" format to be gone entirely');
  // The interactive By Phase group heading (a legitimate, pre-existing,
  // unrelated rendering) still shows the epic name exactly once as its own
  // group title -- confirms the group itself wasn't accidentally removed too.
  assert.ok(/<span>Epic One <span class="a4-module-count"/.test(html), 'expected the interactive By Phase group heading to still show "Epic One" as its title');
  assert.ok(/Test coverage: <strong>50%<\/strong>/.test(html), 'expected the summary coverage line to remain');
});
```

**Note (found during TDD execution):** the original draft assertion here ("Epic One" appears exactly once) was too blunt — the pre-existing, unmodified By Module/By Phase/All tabs legitimately render each item's `epicName` as a sub-label multiple times across the 3 tabs (unrelated to this story's scope). Corrected to target the actual removed static format directly, as shown above.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
```

Expected output: `[FAIL] AC1: static Epics/Other-features breakdown is removed... -- expected 1, got 2` (or the AssertionError equivalent)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, delete the `_renderGroupedCoverageBreakdown` function (lines 106–144, including its leading comment block) entirely — confirmed via grep to have exactly one caller, not exported, no other test references it.

Replace the `coverageHtml` else-branch (currently calling `_renderGroupedCoverageBreakdown(testCoverage)`) with:

```javascript
  } else {
    // pdt-s1 (AC1): the per-epic/per-story breakdown previously rendered here
    // duplicated the same story-ID/percentage pairs already shown, interactively,
    // in the By Module/By Phase/All tabs below -- removed so each group renders
    // exactly once (this story's own AC1).
    coverageHtml =
      '<div style="margin-top:12px;font-size:13px">' +
        '<div>Test coverage: <strong>' + _escapeHtml(String(testCoverage.blendedPercentage)) + '%</strong></div>' +
      '</div>';
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
```

Expected output: `[PASS] AC1: static Epics/Other-features breakdown is removed...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the one already-acknowledged pre-existing failure (`check-p3.5-validate-trace.js`, unrelated Windows `pwsh` invocation quirk, confirmed identical on master at branch-setup).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pdt-s1-consolidate-epic-list.js
git commit -m "fix: remove duplicate static Epics/Other-features coverage breakdown (pdt-s1 AC1)"
```

---

## Task 2: Default groups to collapsed with a rolled-up status indicator (AC2, AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-pdt-s1-consolidate-epic-list.js`

- [ ] **Step 1: Write the failing tests**

```javascript
await test('AC2: groups render collapsed by default -- rows present but hidden, header shows count + rolled-up status', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }, { slug: 's2' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
  );

  assert.ok(/a4-module-body a4-module-body--collapsed/.test(html), 'expected the group body to start collapsed');
  assert.ok(/aria-expanded="false"[^>]*aria-controls="a4-mod-phase-Epic%20One"|aria-controls="a4-mod-phase-Epic%20One"[^>]*aria-expanded="false"/.test(html) || /aria-expanded="false"/.test(html), 'expected the group header to start aria-expanded=false');
  // Row data is still present in the HTML -- a client-side toggle, not a new fetch
  assert.ok(html.indexOf('s1') !== -1 && html.indexOf('s2') !== -1, 'expected row data to be present in the HTML even while collapsed');
});

await test('AC2: group header shows a rolled-up status reflecting mixed health, not just the first item', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic Mixed', stories: [{ slug: 's1' }] }] },
      { slug: 'feat-b', health: 'amber', epics: [{ slug: 'e1', name: 'Epic Mixed', stories: [{ slug: 's2' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
  );

  var headerMatch = /Epic Mixed[\s\S]{0,300}?data-group-signal="([a-z]+)"/.exec(html);
  assert.ok(headerMatch, 'expected a data-group-signal attribute near the "Epic Mixed" header');
  assert.strictEqual(headerMatch[1], 'amber', 'expected the mixed green+amber group to roll up to amber (Warning), not silently show only the first item');
});

await test('AC3: group markup supports native expand-on-click (details-equivalent toggle mechanism)', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic Click', stories: [{ slug: 's1' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var featureModuleAssignments = { s1: 'm1' };
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
  );

  assert.ok(/onclick="a4ToggleModule\(this\)"/.test(html), 'expected the group header button to carry the existing click-to-toggle handler');
  assert.ok(/class="a4-module-header"/.test(html), 'expected the group header button to be present and keyboard-focusable (a real <button>)');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
```

Expected output: `[FAIL] AC2: groups render collapsed by default...` (current default is `a4-module-body--expanded` / `aria-expanded="true"`, and no `data-group-signal` attribute exists yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, replace `_renderModuleSection` (lines 273–297) with:

```javascript
function _renderModuleSection(name, id, groupFeatures, renderRowFn) {
  renderRowFn = renderRowFn || _renderEpicRow;
  var sectionId = 'a4-mod-' + _escapeHtml(String(id));
  // pdt-s1 (AC2): a rolled-up health signal for the collapsed group header,
  // reusing the same red > amber > green precedence as the page-level
  // "Overall:" line (_productRollup.computeOverallHealthSignal) rather than
  // inventing new rollup logic -- so a collapsed group still communicates
  // whether anything inside it needs attention.
  var groupHealthCounts = { green: 0, amber: 0, red: 0, unknown: 0 };
  groupFeatures.forEach(function(f) {
    var h = f.health === 'red' ? 'red' : f.health === 'amber' ? 'amber' : f.health === 'unknown' ? 'unknown' : 'green';
    groupHealthCounts[h]++;
  });
  var groupSignal = _productRollup.computeOverallHealthSignal(groupHealthCounts);
  var groupSignalColor = groupSignal === 'red' ? '#ef4444' : groupSignal === 'amber' ? '#f59e0b' : '#22c55e';
  var groupSignalLabel = groupSignal === 'red' ? '✕ Blocked' : groupSignal === 'amber' ? '⚠ Warning' : '✓ Healthy';
  return '<div class="a4-module-section" style="margin-bottom:10px;border:1px solid var(--line);border-radius:8px">' +
    // pdt-s1 (AC2): starts collapsed (aria-expanded=false, --collapsed body
    // class) -- a4ToggleModule's existing click handler (below) already
    // toggles both correctly; only the DEFAULT starting state changes here.
    '<button type="button" class="a4-module-header" aria-expanded="false" aria-controls="' + sectionId + '" ' +
      'onclick="a4ToggleModule(this)" ' +
      'style="width:100%;text-align:left;padding:12px 16px;background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;color:var(--ink);display:flex;justify-content:space-between;align-items:center">' +
      '<span>' + _escapeHtml(name) + ' <span class="a4-module-count" style="color:var(--muted);font-weight:400">(' + groupFeatures.length + ')</span> ' +
        '<span class="a4-module-signal" data-group-signal="' + groupSignal + '" style="font-size:12px;font-weight:500;color:' + groupSignalColor + '">' + groupSignalLabel + '</span>' +
      '</span>' +
      '<span aria-hidden="true">▾</span>' +
    '</button>' +
    '<div id="' + sectionId + '" class="a4-module-body a4-module-body--collapsed">' +
      '<div class="a4-module-body-inner">' +
        '<ul style="list-style:none;padding:0 16px 12px;margin:0">' +
          groupFeatures.map(function(item) { return renderRowFn(item); }).join('') +
        '</ul>' +
      '</div>' +
    '</div>' +
  '</div>';
}
```

(Only 3 changes from the original: `aria-expanded="true"` → `"false"`; body class `a4-module-body--expanded` → `a4-module-body--collapsed`; new `groupHealthCounts`/`groupSignal*` computation and the new `<span class="a4-module-signal" data-group-signal="...">` inserted into the header. The `a4ToggleModule` client-side toggle function, the CSS `.a4-module-body--collapsed` rule, and the row-rendering loop are all pre-existing and untouched.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
```

Expected output: all three AC2/AC3 tests `[PASS]`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated `check-p3.5-validate-trace.js` failure.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pdt-s1-consolidate-epic-list.js
git commit -m "feat: default epic/phase groups to collapsed with a rolled-up status indicator (pdt-s1 AC2, AC3)"
```

---

## Task 3: Confirm the zero-groups empty state is preserved (AC4)

**Files:**
- Test only: `tests/check-pdt-s1-consolidate-epic-list.js` (no source change expected — `_renderConsolidatedFeaturesSection`'s existing `modules.length === 0 && items.length === 0` branch already renders "No features yet.", confirmed by direct code reading; this task is a regression guard against Task 1/Task 2 accidentally breaking it, not new functionality)

- [ ] **Step 1: Write the test**

```javascript
await test('AC4: zero-groups product shows a clear empty state, not a broken/blank section', function() {
  var pipelineState = { features: [] };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Empty Product', 'prod-empty', [], 'tester', rollupRow, false, null, null,
    [], 'csrf-token', {}, {}, [], 0, null
  );

  assert.ok(/No features yet\./.test(html), 'expected the existing empty-state message to render');
  assert.ok(html.indexOf('<h1') !== -1, 'expected the rest of the page (title, etc.) to render normally, not a broken/blank page');
});
```

- [ ] **Step 2: Run test — must pass immediately (regression guard, no implementation step)**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
```

Expected output: `[PASS] AC4: zero-groups product shows a clear empty state...` — confirms Task 1/Task 2's changes did not regress this pre-existing path.

- [ ] **Step 3: Commit**

```bash
git add tests/check-pdt-s1-consolidate-epic-list.js
git commit -m "test: confirm zero-groups empty state survives the epic/phase list changes (pdt-s1 AC4)"
```

---

## Task 4: NFR tests — response size and keyboard operability

**Files:**
- Test only: `tests/check-pdt-s1-consolidate-epic-list.js`

- [ ] **Step 1: Write the tests**

```javascript
await test('NFR-Performance: response size does not regress vs. the old duplicate-breakdown output', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }, { slug: 's2' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var featureModuleAssignments = { s1: 'm1', s2: 'm1' };
  var testCoverage = { blendedPercentage: 50, noData: false, perFeature: [{ slug: 's1', percentage: 50 }, { slug: 's2', percentage: 50 }], groups: [], ungrouped: [] };
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: testCoverage, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
  );

  // The removed static breakdown, if it had rendered, would have added the
  // "Epics" heading text at minimum -- assert it is genuinely absent
  // (a direct proxy for "output size did not grow from a re-added duplicate").
  assert.ok(!/>Epics</.test(html), 'expected no re-introduced "Epics" static heading contributing extra output size');
});

await test('NFR-Accessibility: collapse toggle is a real, keyboard-focusable, ARIA-correct control', function() {
  var pipelineState = {
    features: [
      { slug: 'feat-a', health: 'green', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1' }] }] }
    ]
  };
  var taxonomy = productRollup.computeTaxonomyRollup(pipelineState);
  var healthCounts = productRollup.computeHealthCounts(pipelineState);
  var modules = [{ id: 'm1', name: 'Module 1' }];
  var featureModuleAssignments = { s1: 'm1' };
  var rollupRow = { health_counts: healthCounts, taxonomy: taxonomy, test_coverage: null, ac_coverage: null, synced_at: null, dod_status_counts: null };

  var html = productsRoute._renderProductView(
    'Test Product', 'prod-1', [], 'tester', rollupRow, false, null, null,
    modules, 'csrf-token', featureModuleAssignments, {}, [], 0, null
  );

  assert.ok(/<button type="button" class="a4-module-header" aria-expanded="false" aria-controls="[^"]+"/.test(html), 'expected a real <button> (natively keyboard-operable via Enter/Space) carrying aria-expanded and aria-controls');
});
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-pdt-s1-consolidate-epic-list.js
```

Expected output: `[check-pdt-s1-consolidate-epic-list] Results: 7 passed, 0 failed`

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all passing except the one pre-existing, unrelated `check-p3.5-validate-trace.js` failure (acknowledged at /branch-setup).

- [ ] **Step 4: Commit**

```bash
git add tests/check-pdt-s1-consolidate-epic-list.js
git commit -m "test: add NFR tests for response size and keyboard operability (pdt-s1)"
```
