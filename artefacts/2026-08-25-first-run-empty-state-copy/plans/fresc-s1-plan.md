# fresc-s1 — Add orientation copy to two first-run empty states, and gate the Modules card on feature count — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `artefacts/2026-08-25-first-run-empty-state-copy/test-plans/fresc-s1-test-plan.md` pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/fresc-s1`
**Worktree:** `.worktrees/fresc-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) — individual files run standalone via `node tests/check-<name>.js`

---

## File map

```
Modify:
  src/web-ui/routes/products.js          — gate the Modules card on features.length > 1 (AC1);
                                            add an explanatory line inside _renderModulesManagement (AC2);
                                            add an explanatory line inside _renderProductDashboard's
                                            empty-state branch, shared by list view and board view (AC3)
  tests/check-a1-modules-taxonomy-crud.js — repair 5 pre-existing tests whose fixtures currently
                                            produce 0 features and assert the Modules card IS present
                                            (AC1 collateral — see DoR "Pre-existing test repair required")

Create:
  tests/check-fresc-s1-empty-state-clarity-copy.js — 8 new tests covering AC1-AC4
```

---

## Task 1: Repair pre-existing Modules-card tests to use a 2-feature fixture

This task is a preparatory fixture repair, not a red/green cycle — the 5 tests below currently pass (the Modules card renders unconditionally today) and will keep passing after this repair, because the repair only changes *what feature count they exercise the card under*, not the assertions themselves. The purpose is to do this *before* Task 2 adds the visibility gate, so Task 2's own test run isolates genuinely new failures from this already-understood, already-fixed collateral change.

**Files:**
- Modify: `tests/check-a1-modules-taxonomy-crud.js`

- [ ] **Step 1: Confirm current state — run the file standalone, all passing**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: all tests `[PASS]`, ending in a summary line with `0` failed (this file uses its own `passed`/`failed` counters — check the process exits 0).

- [ ] **Step 2: Apply the fixture repair**

Five call sites currently pass `features: []` (or, for the integration test, a mock pool returning 0 journey rows) while asserting the Modules card is present. Change each to a 2-feature fixture:

```javascript
// Line 469 — was:
var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [], TEST_CSRF);
// becomes:
var html = productsRoute._renderProductView('Acme', 'p1', [{ journey_id: 'j1' }, { journey_id: 'j2' }], 'x', null, false, null, null, [], TEST_CSRF);
```

```javascript
// Line 478 — was:
var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, modules, TEST_CSRF);
// becomes:
var html = productsRoute._renderProductView('Acme', 'p1', [{ journey_id: 'j1' }, { journey_id: 'j2' }], 'x', null, false, null, null, modules, TEST_CSRF);
```

```javascript
// Line 489 — was:
var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, modules, TEST_CSRF);
// becomes:
var html = productsRoute._renderProductView('Acme', 'p1', [{ journey_id: 'j1' }, { journey_id: 'j2' }], 'x', null, false, null, null, modules, TEST_CSRF);
```

```javascript
// Line 496 — was:
var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [], TEST_CSRF);
// becomes:
var html = productsRoute._renderProductView('Acme', 'p1', [{ journey_id: 'j1' }, { journey_id: 'j2' }], 'x', null, false, null, null, [], TEST_CSRF);
```

```javascript
// Lines 507-516 — the integration test's mock pool — was:
var fullPool = {
  query: async function(sql, params) {
    if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
      return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
    }
    if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
    if (/FROM journeys/.test(sql)) { return { rows: [] }; }
    return ownerPool.query(sql, params);
  }
};
// becomes:
var fullPool = {
  query: async function(sql, params) {
    if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
      return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
    }
    if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
    if (/FROM journeys/.test(sql)) {
      return { rows: [
        { journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery', display_name: null },
        { journey_id: 'j2', feature_slug: 'feat-b', stage: 'discovery', display_name: null }
      ] };
    }
    return ownerPool.query(sql, params);
  }
};
```

- [ ] **Step 3: Run the repaired file standalone — must still fully pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: same as Step 1 — all `[PASS]`, 0 failed. The repair changes the feature count these tests exercise, not their pass/fail outcome, because the visibility gate doesn't exist yet.

- [ ] **Step 4: Commit**

```bash
git add tests/check-a1-modules-taxonomy-crud.js
git commit -m "test: repair a1 Modules-card tests to use a 2-feature fixture ahead of fresc-s1's visibility gate"
```

---

## Task 2: Gate the Modules card on features.length > 1 (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Create: `tests/check-fresc-s1-empty-state-clarity-copy.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-fresc-s1-empty-state-clarity-copy.js`:

```javascript
'use strict';

// tests/check-fresc-s1-empty-state-clarity-copy.js — AC1-AC4 tests for fresc-s1
// Story: artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md

var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var MODULES_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/modules-adapter.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

var TEST_CSRF = 'test-csrf-token';

function makeFakeModulesPool() {
  return { query: async function() { return { rows: [] }; } };
}

(async function() {
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var modulesAdapter = require(MODULES_ADAPTER_PATH);

  // ===========================================================================
  // AC1 — Modules card hidden at 0 or 1 features
  // ===========================================================================

  await test('modulesCardHiddenWithZeroFeatures (AC1)', function() {
    var html = productsRoute._renderProductView('Acme', 'p1', [], 'x', null, false, null, null, [{ id: 'mod-1', name: 'Billing' }], TEST_CSRF);
    assertTrue(html.indexOf('a1-create-form') === -1, 'expected no create-module form with 0 features');
    assertTrue(html.indexOf('a1-rename-form') === -1, 'expected no rename form with 0 features');
    assertTrue(html.indexOf('a1-delete-btn') === -1, 'expected no delete control with 0 features');
  });

  await test('modulesCardHiddenWithExactlyOneFeature (AC1, boundary)', function() {
    var oneFeature = [{ journey_id: 'j1' }];
    var html = productsRoute._renderProductView('Acme', 'p1', oneFeature, 'x', null, false, null, null, [{ id: 'mod-1', name: 'Billing' }], TEST_CSRF);
    assertTrue(html.indexOf('a1-create-form') === -1, 'expected Modules card still hidden at exactly 1 feature');
  });

  // ===========================================================================
  // Integration — handleGetProductView reflects the gate end to end
  // ===========================================================================

  await test('handleGetProductViewReflectsVisibilityGateEndToEnd (AC1)', async function() {
    modulesAdapter.setModulesAdapter(makeFakeModulesPool());

    function makePool(journeyRows) {
      return {
        query: async function(sql) {
          if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
            return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: null, repo_name: null }] };
          }
          if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
          if (/FROM journeys/.test(sql)) { return { rows: journeyRows }; }
          return { rows: [] };
        }
      };
    }

    function makeRes() {
      var html = null;
      return { html: function() { return html; }, writeHead: function() {}, end: function(b) { html = b; } };
    }

    var reqZero = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var resZero = makeRes();
    await productsRoute.handleGetProductView(reqZero, resZero, null, makePool([]));
    assertTrue(resZero.html().indexOf('a1-create-form') === -1, 'expected Modules card absent with 0 journeys/features');

    var reqTwo = { params: { id: 'p1' }, session: { tenantId: 't1' } };
    var resTwo = makeRes();
    await productsRoute.handleGetProductView(reqTwo, resTwo, null, makePool([
      { journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery', display_name: null },
      { journey_id: 'j2', feature_slug: 'feat-b', stage: 'discovery', display_name: null }
    ]));
    assertTrue(resTwo.html().indexOf('a1-create-form') !== -1, 'expected Modules card present with 2 journeys/features');
  });

  console.log('\n[fresc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fresc-s1-empty-state-clarity-copy.js
```

Expected output: `[FAIL] modulesCardHiddenWithZeroFeatures (AC1) -- expected no create-module form with 0 features` (and similarly for the other two — the gate does not exist yet, so the card always renders).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, change line 932 from:

```javascript
    _renderModulesManagement(productId, modules, csrfToken) +
```

to:

```javascript
    (features.length > 1 ? _renderModulesManagement(productId, modules, csrfToken) : '') +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fresc-s1-empty-state-clarity-copy.js
```

Expected output: `[PASS] modulesCardHiddenWithZeroFeatures (AC1)`, `[PASS] modulesCardHiddenWithExactlyOneFeature (AC1, boundary)`, `[PASS] handleGetProductViewReflectsVisibilityGateEndToEnd (AC1)` — `[fresc-s1] Results: 3 passed, 0 failed`

- [ ] **Step 5: Run the repaired a1 suite — must still fully pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: all `[PASS]`, 0 failed — confirms Task 1's repair correctly anticipated this gate.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-fresc-s1-empty-state-clarity-copy.js
git commit -m "feat: hide the Modules card on products with 0 or 1 features"
```

---

## Task 3: Add explanatory line to the Modules card when it's visible (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Modify: `tests/check-fresc-s1-empty-state-clarity-copy.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-fresc-s1-empty-state-clarity-copy.js`, inside the same `(async function() { ... })()` body, after the AC1 tests and before the "Integration" section:

```javascript
  // ===========================================================================
  // AC2 — Modules card + explanatory line shown at >1 features
  // ===========================================================================

  await test('modulesCardVisibleWithTwoFeatures (AC2)', function() {
    var twoFeatures = [{ journey_id: 'j1' }, { journey_id: 'j2' }];
    var html = productsRoute._renderProductView('Acme', 'p1', twoFeatures, 'x', null, false, null, null, [], TEST_CSRF);
    assertTrue(html.indexOf('a1-create-form') !== -1, 'expected the create-module form to be present with 2 features');
    assertTrue(html.indexOf('a1-modules-hint') !== -1, 'expected the explanatory hint element to be present');
  });

  await test('moduleCrudMarkupUnchangedWhenCardVisible (AC2, AC4 non-regression)', function() {
    var twoFeatures = [{ journey_id: 'j1' }, { journey_id: 'j2' }];
    var modules = [{ id: 'mod-1', name: 'Billing' }];
    var html = productsRoute._renderProductView('Acme', 'p1', twoFeatures, 'x', null, false, null, null, modules, TEST_CSRF);
    assertTrue(html.indexOf('data-module-id="mod-1"') !== -1, 'expected the existing module\'s rename/delete controls to be present');
    assertTrue(html.indexOf('class="a1-rename-form"') !== -1, 'expected a rename form');
    assertTrue(html.indexOf('class="a1-delete-btn"') !== -1, 'expected a delete control');
    assertTrue(html.indexOf('name="_csrf" value="' + TEST_CSRF + '"') !== -1, 'expected CSRF fields to remain wired to the real token');
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fresc-s1-empty-state-clarity-copy.js
```

Expected output: `[FAIL] modulesCardVisibleWithTwoFeatures (AC2) -- expected the explanatory hint element to be present` (the CRUD-markup test should already pass, since Task 2 didn't touch that markup — only the new hint assertion fails).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, inside `_renderModulesManagement` (around line 656), change:

```javascript
      '<div style="font-size:14px;font-weight:600;margin-bottom:10px">Modules</div>' +
```

to:

```javascript
      '<div style="font-size:14px;font-weight:600;margin-bottom:6px">Modules</div>' +
      '<div id="a1-modules-hint" style="font-size:12px;color:var(--muted);margin-bottom:10px">Group related features together for easier organization on the Kanban and Roadmap views.</div>' +
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fresc-s1-empty-state-clarity-copy.js
```

Expected output: `[PASS] modulesCardVisibleWithTwoFeatures (AC2)`, `[PASS] moduleCrudMarkupUnchangedWhenCardVisible (AC2, AC4 non-regression)` — `[fresc-s1] Results: 5 passed, 0 failed`

- [ ] **Step 5: Run the repaired a1 suite — must still fully pass**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

Expected output: all `[PASS]`, 0 failed — the new hint line doesn't touch any markup those tests assert on.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-fresc-s1-empty-state-clarity-copy.js
git commit -m "feat: add an explanatory line to the Modules card"
```

---

## Task 4: Add explanatory line to the empty-products state, list view and board view (AC3)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Modify: `tests/check-fresc-s1-empty-state-clarity-copy.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-fresc-s1-empty-state-clarity-copy.js`, after the AC2 tests and before the "Integration" section:

```javascript
  // ===========================================================================
  // AC3 — Product empty-state explanatory line, list view and board view
  // ===========================================================================

  await test('productEmptyStateIncludesExplanatoryLine (AC3)', function() {
    var html = productsRoute._renderProductDashboard([], 'login', [], null, 0, false);
    assertTrue(html.indexOf('No products yet') !== -1, 'expected existing "No products yet" text to remain');
    assertTrue(html.toLowerCase().indexOf('create your first product') !== -1, 'expected existing CTA link text to remain');
    assertTrue(html.indexOf('sw-products-empty-hint') !== -1, 'expected the explanatory hint element to be present');
  });

  await test('productListNonEmptyStateUnaffected (AC3, non-regression)', function() {
    var oneProduct = [{ product_id: 'p1', name: 'Acme', featureCount: 3, lastUpdated: null }];
    var html = productsRoute._renderProductDashboard(oneProduct, 'login', [], null, 0, false);
    assertTrue(html.indexOf('No products yet') === -1, 'expected empty-state text absent when a product exists');
    assertTrue(html.indexOf('sw-products-empty-hint') === -1, 'expected the hint element absent when a product exists');
  });

```

Append to the "Integration" section (after `handleGetProductViewReflectsVisibilityGateEndToEnd`):

```javascript
  await test('boardViewEmptyStateAlsoIncludesExplanatoryLine (AC3, shared-function regression check)', async function() {
    var pool = {
      query: async function(sql) {
        if (sql.includes('FROM products')) { return { rows: [] }; }
        if (sql.includes('product_id IS NULL')) { return { rows: [] }; }
        return { rows: [] };
      }
    };
    function makeRes() {
      var html = null;
      return { html: function() { return html; }, writeHead: function() {}, end: function(b) { html = b; } };
    }
    var req = { session: { tenantId: 'tenant-empty' }, query: { view: 'board' } };
    var res = makeRes();
    await productsRoute.handleGetDashboard(req, res, null, pool);
    assertTrue(res.html().indexOf('sw-products-empty-hint') !== -1, 'expected the same explanatory hint to appear on the board-view empty state');
  });

```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fresc-s1-empty-state-clarity-copy.js
```

Expected output: `[FAIL] productEmptyStateIncludesExplanatoryLine (AC3) -- expected the explanatory hint element to be present`, `[FAIL] boardViewEmptyStateAlsoIncludesExplanatoryLine (AC3, shared-function regression check) -- expected the same explanatory hint to appear on the board-view empty state` (`productListNonEmptyStateUnaffected` should already pass — nothing yet added for it to catch).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, inside `_renderProductDashboard`'s empty-state branch (around line 148-150), change:

```javascript
    ? '<div style="padding:48px 0;text-align:center;color:var(--muted)">' +
        '<p style="font-size:18px;margin:0 0 16px">No products yet</p>' +
        '<a href="/products/new" style="display:inline-block;padding:10px 20px;background:var(--accent);color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Create your first product →</a>' +
      '</div>'
```

to:

```javascript
    ? '<div style="padding:48px 0;text-align:center;color:var(--muted)">' +
        '<p style="font-size:18px;margin:0 0 12px">No products yet</p>' +
        '<p id="sw-products-empty-hint" style="font-size:14px;margin:0 0 20px;color:var(--muted)">A product is a connected GitHub repo — its epics, features, and journeys all live under it here.</p>' +
        '<a href="/products/new" style="display:inline-block;padding:10px 20px;background:var(--accent);color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Create your first product →</a>' +
      '</div>'
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fresc-s1-empty-state-clarity-copy.js
```

Expected output: all 8 tests `[PASS]` — `[fresc-s1] Results: 8 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same result as the branch-setup baseline — `551` (or `552`, now including the new file) file(s) run, only the pre-existing `tests/check-p3.5-validate-trace.js` flake failing (per `tests/known-baseline-failures.json`), no other new failures. If any other file fails, stop and investigate before proceeding — do not assume it's unrelated.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-fresc-s1-empty-state-clarity-copy.js
git commit -m "feat: add an explanatory line to the empty-products state (list and board view)"
```

---

## After all tasks: update pipeline-state.json

Per this story's DoR Coding Agent Instructions and `CLAUDE.md`'s `skills advance` rule, do not edit `.github/pipeline-state.json` by hand — use:

```bash
node bin/skills advance 2026-08-25-first-run-empty-state-copy fresc-s1 testPlan.passing=8 acVerified=4
```

Then proceed to `/verify-completion`.
