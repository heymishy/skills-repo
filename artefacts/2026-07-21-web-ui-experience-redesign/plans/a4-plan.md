# Render the product view grouped by module with dual health/coverage indicators and a scale gauge — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Extend `_renderProductView` in `src/web-ui/routes/products.js` to group the product's epics (journeys) under their assigned module (A1/A2 data), render health (A3) and test-coverage as two visually distinct indicators, add a scale gauge with a proportional distribution strip, keep a clean flat fallback for zero modules, and give module sections a real CSS expand/collapse transition.
**Branch:** `feature/a4-module-grouped-rendering-scale-gauge`
**Worktree:** current session worktree
**Test command:** `node tests/check-a4-module-grouped-rendering.js` (new); `node tests/check-pr-s2-products-route.js` (regression); full suite via `npm test`; `npx playwright test tests/e2e/a4-module-expand-collapse.spec.js` (AC5, not in the `npm test` chain, per ADR-018)

---

## Task 0 (investigation, no production code) — Trace what "epic" and "coverage" actually map to for module grouping

This story's Architecture Constraints say to extend `_renderProductView`'s existing sections, not replace them. Before writing any grouping code, the real data model must be traced — the same discipline A3's Task 0 and c2's mock-shape-verification decisions used.

**Findings (recorded here and in `decisions.md` before implementation):**

1. `journeys.module_id` (A1) and `reassignEpic(productId, tenantId, journeyId, moduleId)` (A2) both key off `journeys.journey_id` — the only persisted, product-scoped "epic" entity with a real module assignment. The pre-existing "Epics" section on the product view (`taxonomyHtml`, built from `rollupRow.taxonomy`) is a completely separate, JSONB-cached read of the *connected repo's* `pipeline-state.json` epic/story nesting, computed by `computeTaxonomyRollup` — it carries no `journey_id` anywhere and has zero relationship to `journeys.module_id` (confirmed directly in `decisions.md`'s A2 ARCH entry). Grouping *that* section by module is not buildable without inventing a new join key that doesn't exist in either table today, which would be new-data-model scope, not a rendering change.
2. The flat `features` list already at the bottom of `_renderProductView` (built directly from the `journeys` query in `handleGetProductView`) **is** keyed by `journey_id` and (once the query below is extended) `module_id` — these are the same real, already-assignable entities A1/A2's CRUD operates on. This is the "epic" AC1 refers to for module grouping. The taxonomy section above it is left untouched, per the story's own Architecture Constraint ("extending rather than replacing the existing ... taxonomy rendering sections").
3. `journeys.feature_slug` is set from the operator-chosen feature slug at `/discovery` start (`journeyStore.createJourney(featureSlug, ...)` in `routes/journey.js`) — the same slug convention as a top-level `pipeline-state.json` `features[].slug` once that feature is merged and synced. `computeHealthCounts`'s `perFeature` array (A3) is keyed by exactly this same `feature.slug`, so `journeys.feature_slug` can be matched against `healthCounts.perFeature[].slug` for a real, honest per-epic health value (falls back to `unknown` when no match exists, using the same `HEALTH_LABELS`/`HEALTH_COLORS` map already defined in `_renderProductView`).
4. **No equivalent per-top-level-feature test-coverage aggregate exists.** `computeTestCoverageRollup` (pr-s5) only returns coverage nested under an *epic* (`groups[].items[]`, keyed by *story* slug) or flat by *story* slug (`ungrouped[]`) — never rolled up to the parent top-level feature. Extending `computeTestCoverageRollup` itself to also track a parent-feature key is a genuine rollup-computation change (out of scope for a rendering-only story whose DoR contract lists only `products.js` as a touch point — this is exactly the kind of dedicated investigation A3 itself required as its *own* story, not a side effect of A4). Resolution: match `journeys.feature_slug` against `testCoverage.perFeature` — the flat list `computeTestCoverageRollup` already populates across *every* story it processes (both grouped and ungrouped) — by slug. When a story slug happens to equal the journey's feature slug, show the real percentage; otherwise render the existing "No test data yet" fallback (already established by pr-s5/AC4), never a fabricated number. This is honest: real data when it exists, an explicit no-data state otherwise.
5. AC3's "N epics and M total stories": N = count of grouped epics (the `features`/journeys array length — same entities as AC1's grouping). M = `taxonomy.totalCount` (already computed by `computeTaxonomyRollup`, the one authoritative "how many stories does this synced product have" number) when a rollup exists, else `0`.
6. Distribution-strip segment size = count of epics (journeys) assigned to each module ÷ total epic count — the only sizing measure directly tied to real module assignment. An "Unassigned" segment is included when any epic has no module.
7. **Complexity check-in (per DoR Warning W2):** this investigation did not reveal complexity beyond the story's Complexity Rating of 2 — no new table, migration, or write path is needed; the join is a slug match over already-computed rollup fields, and the "no per-feature coverage data" gap is closed with an honest fallback rather than new backend work.

- [ ] Append an ARCH decision entry to `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md` recording findings 1–7 above (title: "a4 investigation — module grouping targets the flat features/journeys list, not the taxonomy epics section").

---

## File map

```
Modify:
  src/web-ui/routes/products.js                  — extend _renderProductView (module grouping, dual indicators, scale gauge, expand/collapse) + handleGetProductView (module_id in journeys query, fetch modules list)
  tests/check-a4-module-grouped-rendering.js     — new: unit + integration tests for AC1-AC4 (new file)
  tests/e2e/a4-module-expand-collapse.spec.js    — new: Playwright E2E test for AC5 (not in npm test chain, per ADR-018)
  artefacts/2026-07-21-web-ui-experience-redesign/decisions.md  — Task 0 investigation finding (ARCH entry)
```

---

## Task 1: Query `journeys.module_id` and fetch the product's modules list (setup for AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`handleGetProductView`)
- Test: `tests/check-a4-module-grouped-rendering.js` (new file)

- [ ] **Step 1: Write the failing test**

```js
// tests/check-a4-module-grouped-rendering.js (new file, header + first test)
'use strict';
var assert = require('assert');
var path = require('path');
var passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}
var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');
function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

(async function() {
  console.log('\n[a4] AC1 -- handleGetProductView reads journeys.module_id and the product\'s modules list');

  await test('handleGetProductView queries journeys.module_id and lists modules via modulesAdapter', async function() {
    var modulesAdapter = freshRequire(MODULES_ADAPTER_PATH);
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var fakePool = {
      _rows: [{ id: 'mod-1', product_id: 'p1', tenant_id: 't1', name: 'Web UI', created_at: new Date().toISOString() }],
      query: async function(sql, params) {
        var s = String(sql);
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/i.test(s)) return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
        if (/SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at FROM product_rollups/i.test(s)) return { rows: [] };
        if (/SELECT journey_id, feature_slug, module_id/i.test(s)) return { rows: [{ journey_id: 'j1', feature_slug: 'f1', module_id: 'mod-1', stage: 'discovery' }] };
        if (/SELECT id, name, created_at FROM product_modules/i.test(s)) return { rows: this._rows; };
        return { rows: [] };
      }
    };
    modulesAdapter.setModulesAdapter(fakePool);
    var html = null;
    var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
    var res = { writeHead: function() {}, end: function(body) { html = body; } };
    await productsRoute.handleGetProductView(req, res, null, fakePool);
    assert.ok(/Web UI/.test(html), 'expected the module name "Web UI" to appear in the rendered page');
  });

  console.log('\n[a4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a4-module-grouped-rendering.js
```

Expected output: `[FAIL] handleGetProductView queries journeys.module_id...` — the query for `journeys` doesn't select `module_id` yet, and `_renderProductView` doesn't render module names.

- [ ] **Step 3: Write minimal implementation**

In `handleGetProductView`, change the journeys query and add a modules fetch:

```js
// src/web-ui/routes/products.js -- handleGetProductView, replace the journeys query + features map
var rows = (await _pool.query(
  "SELECT journey_id, feature_slug, module_id, data->>'activeSkill' AS stage FROM journeys WHERE product_id = $1",
  [productId]
)).rows;
var features = rows.map(function(j) {
  return {
    journey_id: j.journey_id,
    stage: j.stage || 'discovery',
    health: 'green',
    featureSlug: j.feature_slug,
    moduleId: j.module_id || null
  };
});
// a4 -- fetch the product's curated modules (A1) for grouping (AC1). The
// adapter's stub default throws (D37) when unwired; in production
// server.js always wires it (a1), so this only ever falls back in test
// doubles that don't care about modules -- matches AC4's own "zero
// modules" flat-fallback spirit rather than masking a real prod gap.
var modules = [];
try {
  modules = await _modulesAdapter.listModules(productId, tenantId);
} catch (_) {
  modules = [];
}
```

And extend `_renderProductView`'s call site and signature (append `modules` as a new trailing parameter so every existing caller passing 8 positional args is unaffected):

```js
var html = _renderProductView(productName, productId, features, login, rollupRow, isSyncing, prodRow.repo_owner, prodRow.repo_name, modules);
```

```js
// _renderProductView signature -- append modules as a 9th param (default [])
function _renderProductView(productName, productId, features, login, rollupRow, isSyncing, repoOwner, repoName, modules) {
  modules = modules || [];
  // ... existing body unchanged up to featuresHtml ...
```

For Step 3 of this task, only wire the data through — replace the *existing* flat `featuresHtml` block with a minimal grouped-when-modules-exist branch that at least renders each module's name as a heading (full grouping/indicators arrive in Tasks 2-3):

```js
var featuresHtml;
if (modules.length === 0) {
  // AC4 -- zero-module fallback: keep the pre-existing flat rendering exactly as-is.
  featuresHtml = features.length === 0
    ? '<p style="color:var(--muted);font-size:14px">No features yet.</p>'
    : '<ul style="list-style:none;padding:0;margin:0">' +
        features.map(function(f) {
          return '<li style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:500">' + _escapeHtml(f.featureSlug || f.journey_id) + '</div>' +
              '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(f.stage || '') + '</div>' +
            '</div>' +
            '<span style="font-size:12px;color:' + (f.health === 'red' ? '#ef4444' : f.health === 'amber' ? '#f59e0b' : '#22c55e') + '">' +
              (f.health === 'red' ? '⚠ Blocked' : f.health === 'amber' ? '⚠ Warning' : '✓ Healthy') +
            '</span>' +
          '</li>';
        }).join('') +
      '</ul>';
} else {
  featuresHtml = '<h3 style="font-size:14px;margin:16px 0 8px">' + _escapeHtml(modules[0].name) + '</h3>';
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a4-module-grouped-rendering.js
git commit -m "feat(a4): query journeys.module_id and fetch the product's modules list for grouping"
```

---

## Task 2: Full module grouping with an Unassigned bucket (AC1) and zero-module fallback (AC4)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a4-module-grouped-rendering.js`

- [ ] **Step 1: Write the failing test**

```js
console.log('\n[a4] AC1 -- epics are grouped under their module, with an Unassigned bucket');

await test('_renderProductView groups epics under their assigned module + Unassigned section (AC1)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modules = [{ id: 'mod-a', name: 'Module A' }, { id: 'mod-b', name: 'Module B' }];
  var features = [
    { journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' },
    { journey_id: 'j2', featureSlug: 'feat-2', stage: 'discovery', health: 'green', moduleId: 'mod-b' },
    { journey_id: 'j3', featureSlug: 'feat-3', stage: 'discovery', health: 'green', moduleId: null }
  ];
  var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, modules);
  assert.ok(/Module A/.test(html), 'expected "Module A" heading');
  assert.ok(/Module B/.test(html), 'expected "Module B" heading');
  assert.ok(/Unassigned/.test(html), 'expected an "Unassigned" section');
  assert.ok(/feat-1/.test(html) && /feat-2/.test(html) && /feat-3/.test(html), 'expected all three epics to render');
});

console.log('\n[a4] AC4 -- zero-module product renders a clean flat fallback');

await test('_renderProductView renders the flat fallback list (no module headings) when modules is empty (AC4)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: null }];
  var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, []);
  assert.ok(/feat-1/.test(html), 'expected the feature to still render');
  assert.ok(!/Unassigned/.test(html), 'expected no "Unassigned" heading when there are zero modules at all (flat fallback, not a 1-bucket grouping)');
});

await test('_renderProductView with zero modules and zero features renders without throwing (AC4)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  assert.doesNotThrow(function() {
    productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, []);
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a4-module-grouped-rendering.js
```

Expected output: fails — grouping/Unassigned section not yet implemented (Task 1 only rendered `modules[0].name` as a placeholder heading).

- [ ] **Step 3: Write the implementation**

Replace the placeholder `else` branch from Task 1 with full grouping:

```js
// src/web-ui/routes/products.js -- _renderProductView, full module grouping (AC1) + flat fallback (AC4)
function _renderEpicRow(f) {
  var color = f.health === 'red' ? '#ef4444' : f.health === 'amber' ? '#f59e0b' : f.health === 'unknown' ? 'var(--muted)' : '#22c55e';
  var label = f.health === 'red' ? '✕ Blocked' : f.health === 'amber' ? '⚠ Warning' : f.health === 'unknown' ? '? Unknown' : '✓ Healthy';
  return '<li style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">' +
    '<div>' +
      '<div style="font-size:14px;font-weight:500">' + _escapeHtml(f.featureSlug || f.journey_id) + '</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(f.stage || '') + '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:12px">' +
      '<span data-a4-health style="font-size:12px;color:' + color + '">' + label + '</span>' +
      '<span data-a4-coverage style="font-size:12px;color:var(--muted)">' + _escapeHtml(f.coverageLabel) + '</span>' +
    '</div>' +
  '</li>';
}

function _renderModuleSection(name, id, groupFeatures) {
  var sectionId = 'a4-mod-' + _escapeHtml(String(id));
  return '<div class="a4-module-section" style="margin-bottom:10px;border:1px solid var(--line);border-radius:8px">' +
    '<button type="button" class="a4-module-header" aria-expanded="true" aria-controls="' + sectionId + '" ' +
      'onclick="a4ToggleModule(this)" ' +
      'style="width:100%;text-align:left;padding:12px 16px;background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;color:var(--ink);display:flex;justify-content:space-between;align-items:center">' +
      '<span>' + _escapeHtml(name) + ' <span style="color:var(--muted);font-weight:400">(' + groupFeatures.length + ')</span></span>' +
      '<span aria-hidden="true">▾</span>' +
    '</button>' +
    '<div id="' + sectionId + '" class="a4-module-body a4-module-body--expanded">' +
      '<div class="a4-module-body-inner">' +
        '<ul style="list-style:none;padding:0 16px 12px;margin:0">' +
          groupFeatures.map(_renderEpicRow).join('') +
        '</ul>' +
      '</div>' +
    '</div>' +
  '</div>';
}

var featuresHtml;
if (modules.length === 0) {
  // AC4 -- zero-module fallback: unchanged pre-a4 flat rendering.
  featuresHtml = features.length === 0
    ? '<p style="color:var(--muted);font-size:14px">No features yet.</p>'
    : '<ul style="list-style:none;padding:0;margin:0">' + features.map(_renderEpicRow).join('') + '</ul>';
} else {
  var byModule = {};
  modules.forEach(function(m) { byModule[m.id] = []; });
  var unassigned = [];
  features.forEach(function(f) {
    if (f.moduleId && byModule[f.moduleId]) { byModule[f.moduleId].push(f); }
    else { unassigned.push(f); }
  });
  featuresHtml =
    '<style>' +
      '.a4-module-body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.25s ease; overflow: hidden; }' +
      '.a4-module-body--collapsed { grid-template-rows: 0fr; }' +
      '.a4-module-body-inner { min-height: 0; overflow: hidden; }' +
    '</style>' +
    modules.map(function(m) { return _renderModuleSection(m.name, m.id, byModule[m.id]); }).join('') +
    (unassigned.length > 0 ? _renderModuleSection('Unassigned', 'unassigned', unassigned) : '') +
    '<script>' +
      'function a4ToggleModule(btn){' +
        'var body=document.getElementById(btn.getAttribute("aria-controls"));' +
        'var collapsed=body.classList.toggle("a4-module-body--collapsed");' +
        'btn.setAttribute("aria-expanded", collapsed ? "false" : "true");' +
      '}' +
    '<\/script>';
}
```

Note: `f.coverageLabel` is populated in Task 3 (currently would render as `undefined` — Task 3 fills it in immediately after, both tasks are committed together as one working slice per the "each task 2-5 minutes" granularity guidance, but the RED/GREEN cycle above already covers AC1/AC4 independently of coverage).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a4-module-grouped-rendering.js
git commit -m "feat(a4): group epics under their assigned module with an Unassigned bucket, flat fallback for zero modules (AC1, AC4)"
```

---

## Task 3: Dual health + coverage indicators, never combined (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a4-module-grouped-rendering.js`

- [ ] **Step 1: Write the failing test**

```js
console.log('\n[a4] AC2 -- health and coverage render as two distinct elements per epic, never combined');

await test('epic row renders a health pill AND a separate coverage label, not one combined value (AC2)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modules = [{ id: 'mod-a', name: 'Module A' }];
  var rollupRow = {
    health_counts: { green: 0, amber: 0, red: 1, unknown: 0, perFeature: [{ slug: 'feat-1', name: 'Feature One', health: 'red' }] },
    test_coverage: { noData: false, blendedPercentage: 80, perFeature: [{ slug: 'feat-1', percentage: 80 }], groups: [], ungrouped: [{ slug: 'feat-1', percentage: 80 }] }
  };
  var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
  var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', rollupRow, false, null, null, modules);
  assert.ok(/✕ Blocked/.test(html), 'expected the epic\'s own health label (per-feature health from A3, not the hardcoded journey.health) to render as "Blocked"');
  assert.ok(/80%/.test(html), 'expected an 80% coverage label to render');
  // The two must be separate DOM elements, not one merged span/string.
  var healthEl = /data-a4-health[^>]*>([^<]*)</.exec(html);
  var coverageEl = /data-a4-coverage[^>]*>([^<]*)</.exec(html);
  assert.ok(healthEl && coverageEl, 'expected two separately-tagged elements');
  assert.notStrictEqual(healthEl[1], coverageEl[1], 'health and coverage must not be the same rendered value');
});

await test('epic row falls back to "No test data yet" when no per-feature coverage match exists (honest no-data, not fabricated %) (AC2)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modules = [{ id: 'mod-a', name: 'Module A' }];
  var rollupRow = { health_counts: { perFeature: [] }, test_coverage: { noData: false, blendedPercentage: 50, perFeature: [{ slug: 'other-feat', percentage: 50 }] } };
  var features = [{ journey_id: 'j1', featureSlug: 'feat-1', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
  var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', rollupRow, false, null, null, modules);
  assert.ok(/No test data yet/.test(html), 'expected the honest no-data fallback, not a fabricated percentage');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 3: Write the implementation**

Before building `featuresHtml`, compute per-feature health/coverage lookup maps from the already-parsed `healthCounts`/`testCoverage` variables (both already parsed earlier in `_renderProductView` — reuse them, do not re-parse):

```js
// src/web-ui/routes/products.js -- _renderProductView, before the featuresHtml block
var healthBySlug = {};
if (healthCounts && Array.isArray(healthCounts.perFeature)) {
  healthCounts.perFeature.forEach(function(f) { healthBySlug[f.slug] = f.health; });
}
var coverageBySlug = {};
if (testCoverage && Array.isArray(testCoverage.perFeature)) {
  testCoverage.perFeature.forEach(function(f) { coverageBySlug[f.slug] = f.percentage; });
}
features = features.map(function(f) {
  var realHealth = healthBySlug.hasOwnProperty(f.featureSlug) ? healthBySlug[f.featureSlug] : 'unknown';
  var pct = coverageBySlug.hasOwnProperty(f.featureSlug) ? coverageBySlug[f.featureSlug] : null;
  return Object.assign({}, f, {
    health: realHealth,
    coverageLabel: (pct === null) ? 'No test data yet' : (pct + '%')
  });
});
```

(`_renderEpicRow` from Task 2 already reads `f.health` and `f.coverageLabel` — no further changes needed there.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a4-module-grouped-rendering.js
git commit -m "feat(a4): render per-feature health and test-coverage as two distinct, never-combined indicators (AC2)"
```

---

## Task 4: Scale gauge with proportional distribution strip (AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-a4-module-grouped-rendering.js`

- [ ] **Step 1: Write the failing test**

```js
console.log('\n[a4] AC3 -- scale gauge shows epic count, story count, and a proportional distribution strip');

await test('_renderProductView renders a scale gauge with epic/story counts and one distribution segment per module (AC3)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modules = [{ id: 'mod-a', name: 'Module A' }, { id: 'mod-b', name: 'Module B' }, { id: 'mod-c', name: 'Module C' }];
  var features = [
    { journey_id: 'j1', featureSlug: 'f1', stage: 'discovery', health: 'green', moduleId: 'mod-a' },
    { journey_id: 'j2', featureSlug: 'f2', stage: 'discovery', health: 'green', moduleId: 'mod-a' },
    { journey_id: 'j3', featureSlug: 'f3', stage: 'discovery', health: 'green', moduleId: 'mod-b' },
    { journey_id: 'j4', featureSlug: 'f4', stage: 'discovery', health: 'green', moduleId: null }
  ];
  var rollupRow = { taxonomy: { groups: [], ungrouped: [], totalCount: 12 } };
  var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', rollupRow, false, null, null, modules);
  assert.ok(/\b4\b/.test(html), 'expected the total epic count (4) to appear');
  assert.ok(/\b12\b/.test(html), 'expected the total story count (12, from taxonomy.totalCount) to appear');
  var segmentCount = (html.match(/data-a4-dist-segment/g) || []).length;
  assert.strictEqual(segmentCount, 3, 'expected 3 distribution segments: Module A, Module B, Unassigned (Module C has zero epics and contributes no segment)');
});

await test('scale gauge handles zero epics without dividing by zero or throwing (AC3/AC4 overlap)', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  assert.doesNotThrow(function() {
    productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [{ id: 'mod-a', name: 'Module A' }]);
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 3: Write the implementation**

Add a scale-gauge renderer, called just before `featuresHtml` in the `body` assembly:

```js
// src/web-ui/routes/products.js -- new helper, called from _renderProductView
function _renderScaleGauge(features, modules, taxonomy) {
  var epicCount = features.length;
  var storyCount = (taxonomy && typeof taxonomy.totalCount === 'number') ? taxonomy.totalCount : 0;
  if (epicCount === 0) {
    return '<div style="margin-top:16px;font-size:13px;color:var(--muted)">Scale: ' + epicCount + ' epics, ' + storyCount + ' stories</div>';
  }
  var counts = {};
  var unassignedCount = 0;
  features.forEach(function(f) {
    if (f.moduleId) { counts[f.moduleId] = (counts[f.moduleId] || 0) + 1; }
    else { unassignedCount++; }
  });
  var segments = modules
    .filter(function(m) { return counts[m.id] > 0; })
    .map(function(m) { return { name: m.name, count: counts[m.id] }; });
  if (unassignedCount > 0) { segments.push({ name: 'Unassigned', count: unassignedCount }); }
  var stripHtml = segments.map(function(s) {
    var widthPct = (s.count / epicCount) * 100;
    return '<div data-a4-dist-segment title="' + _escapeHtml(s.name) + ': ' + s.count + '" ' +
      'style="width:' + widthPct + '%;background:var(--accent);opacity:' + (0.5 + (0.5 * widthPct / 100)) + ';height:100%"></div>';
  }).join('');
  return '<div style="margin-top:16px">' +
    '<div style="font-size:13px;color:var(--ink)"><strong>' + epicCount + '</strong> epic' + (epicCount === 1 ? '' : 's') + ' &middot; <strong>' + storyCount + '</strong> stor' + (storyCount === 1 ? 'y' : 'ies') + '</div>' +
    '<div style="margin-top:6px;height:10px;border-radius:5px;overflow:hidden;display:flex;background:var(--line)">' + stripHtml + '</div>' +
  '</div>';
}
```

Call it right after `taxonomyHtml` is computed and include it in `body`:

```js
var scaleGaugeHtml = _renderScaleGauge(features, modules, taxonomy);
```

```js
// in the `body` concatenation, add scaleGaugeHtml after taxonomyHtml:
    taxonomyHtml +
    scaleGaugeHtml +
    featuresHtml +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-a4-module-grouped-rendering.js
git commit -m "feat(a4): add a scale gauge with a proportional module distribution strip (AC3)"
```

---

## Task 5: Escaping regression test for module/epic names (Security NFR)

**Files:**
- Test: `tests/check-a4-module-grouped-rendering.js`

- [ ] **Step 1: Write the failing test (should already pass by construction — confirms no regression)**

```js
console.log('\n[a4] Security NFR -- module and epic names are escaped before rendering');

await test('a module name containing <script> and HTML special characters is escaped, not rendered raw', function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modules = [{ id: 'mod-a', name: '<script>alert(1)</script> & "Ops"' }];
  var features = [{ journey_id: 'j1', featureSlug: 'feat-<b>1</b>', stage: 'discovery', health: 'green', moduleId: 'mod-a' }];
  var html = productsRoute._renderProductView('Acme', 'p1', features, 'x', null, false, null, null, modules);
  assert.ok(!/<script>alert\(1\)<\/script>/.test(html), 'expected the module name\'s <script> tag to be escaped, not rendered raw');
  assert.ok(/&lt;script&gt;/.test(html), 'expected the escaped form of the module name to appear');
  assert.ok(!/feat-<b>1<\/b>/.test(html), 'expected the epic slug\'s HTML to be escaped, not rendered raw');
});
```

- [ ] **Step 2: Run test — must pass immediately** (every render path above already calls `_escapeHtml` on `name`/`featureSlug` — this proves it, matching this repo's own `check-rpc-s1-connect-repo.js` IT3 convention). If it fails, add the missing `_escapeHtml` call — do not weaken the test.

```bash
node tests/check-a4-module-grouped-rendering.js
```

- [ ] **Step 3: Commit**

```bash
git add tests/check-a4-module-grouped-rendering.js
git commit -m "test(a4): confirm module and epic names are escaped before rendering (Security NFR)"
```

---

## Task 6: Playwright E2E — smooth expand/collapse transition (AC5)

**Files:**
- New: `tests/e2e/a4-module-expand-collapse.spec.js`

Per the DoR's H-E2E check, AC5 is CSS-layout-dependent and covered by an automated Playwright test (Playwright is already configured — `test:e2e`), not a RISK-ACCEPT. This spec is **not** part of the `npm test` chain (ADR-018 — `tests/e2e/*.spec.js` is a separate suite run via `npx playwright test`), matching `tests/e2e/b1-nav-toggle.spec.js`'s own header comment convention.

- [ ] **Step 1: Write the test**

```js
// tests/e2e/a4-module-expand-collapse.spec.js
// AC5 -- story artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md
// NOT in npm test chain (ADR-018) -- run with: npx playwright test tests/e2e/a4-module-expand-collapse.spec.js
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('module section expands/collapses with a real CSS transition, not an instant snap (AC5)', async ({ page }) => {
  await page.goto('/dashboard');
  // Navigate to a product with at least one module -- fixtures/auth's default
  // signed-in session lands on /dashboard; open the first product.
  const firstProduct = page.locator('a[href^="/products/"]').first();
  const count = await firstProduct.count();
  if (count === 0) test.skip();
  await firstProduct.click();
  await page.waitForLoadState('networkidle');

  const header = page.locator('.a4-module-header').first();
  const headerCount = await header.count();
  if (headerCount === 0) test.skip(); // no modules configured on this product yet -- AC4 flat fallback, not this test's concern

  const bodyId = await header.getAttribute('aria-controls');
  const body = page.locator('#' + bodyId);

  const transition = await body.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition).not.toBe('0s');

  await header.click();
  await page.waitForTimeout(80); // mid-animation, given a 0.25s transition
  const midHeight = await body.evaluate((el) => el.getBoundingClientRect().height);
  await page.waitForTimeout(300); // let the transition finish
  const endHeight = await body.evaluate((el) => el.getBoundingClientRect().height);
  expect(midHeight).not.toBe(endHeight); // proves an actual transition occurred, not an instant state change
});
```

- [ ] **Step 2: Run (manually, once a dev server + browsers are available — not part of this story's automated `npm test` verification gate)**

```bash
npx playwright test tests/e2e/a4-module-expand-collapse.spec.js
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/a4-module-expand-collapse.spec.js
git commit -m "test(a4): add Playwright E2E coverage for the module section's smooth expand/collapse transition (AC5)"
```

---

## Out of scope for this plan (per story)

- The Modules CRUD UI itself (A1's job).
- The Roadmap tab (A5's job).
- Extending `computeTestCoverageRollup` to track a parent-feature key (see Task 0 finding 4) — a genuine rollup-computation change, not a rendering change; would be its own dedicated story if pursued.
- Grouping the AC-coverage breakdown by module (epic Out of Scope).
- A "Move to ▾" module-reassignment control on this page (not named in this story's ACs; A2's decisions.md flags it as a follow-on once this story's rendering ships).
