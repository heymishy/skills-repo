# pncg-s1 — Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `artefacts/2026-08-26-products-nav-coverage-gap/test-plans/pncg-s1-test-plan.md` pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/pncg-s1`
**Worktree:** `.worktrees/pncg-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) — individual files via `node tests/check-<name>.js`

---

## ⚠️ Correction to the story/DoR's manifest — found during implementation planning

The story and DoR both list `handleGetProductNew` (`src/web-ui/routes/products.js`, `GET /products/new`) as "already had pool" (same tier as `handleGetOrgKanban`/`handleGetProductKanban`/`handleGetProductRoadmap`/`handleGetGuardrailsForm`). **This is incorrect** — confirmed by reading the actual function: `function handleGetProductNew(req, res) {` takes no `pool` parameter, and its `server.js` call site (`authGuard(req, res, async () => { handleGetProductNew(req, res); });`, line ~3307) doesn't pass one either. It needs the identical pool-threading fix as the `journey.js` sites, not a simple call-site swap. This does not change the AC or test outcome (AC3 already covers "thread pool where missing") — only the task categorization below reflects the correction. Log this in `workspace/capture-log.md` as a minor artefact-accuracy note when this story reaches DoD.

---

## File map

```
Modify:
  src/web-ui/routes/products.js       — add renderShellWithNav helper + export it; swap 5 call sites
                                          (4 already have pool; handleGetProductNew needs pool threaded)
  src/web-ui/routes/journey.js        — thread pool through 6 handlers; swap their renderShell calls
  src/web-ui/routes/settings.js       — swap 1 call site (pool already via factory closure)
  src/web-ui/routes/team-management.js — swap 2 call sites (pool already via factory closure)
  src/web-ui/routes/admin-credits.js  — thread pool through; swap 1 call site
  src/web-ui/routes/admin-mock-gateway.js — thread pool through; swap 1 call site
  src/web-ui/routes/artefact.js       — thread pool through; swap 2 call sites (both in handleArtefactRoute)
  src/web-ui/routes/billing.js        — thread pool through; swap 1 call site
  src/web-ui/routes/features.js       — thread pool through; swap 1 call site
  src/web-ui/server.js                — pass _pshPool at every call site whose handler gained a new pool param

Create:
  tests/check-pncg-s1-shared-nav-wrapper.js       — 3 unit tests for renderShellWithNav
  tests/check-pncg-s1-nav-coverage-structural.js  — 1 structural test covering all 22 sites
  tests/check-pncg-s1-nav-coverage-functional.js  — 4 targeted integration tests
```

---

## Task 1: Add the `renderShellWithNav` shared helper (AC1)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Create: `tests/check-pncg-s1-shared-nav-wrapper.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-pncg-s1-shared-nav-wrapper.js`:

```javascript
'use strict';

// tests/check-pncg-s1-shared-nav-wrapper.js — AC1 unit tests for pncg-s1's
// new renderShellWithNav helper.
// Story: artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md

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

function makeMockPool(products) {
  return {
    query: async function(sql, params) {
      if (sql.includes('FROM products')) { return { rows: products }; }
      if (sql.includes('product_id IS NULL')) { return { rows: [] }; }
      if (sql.includes('WHERE product_id = $1')) { return { rows: [] }; }
      return { rows: [] };
    }
  };
}

(async function() {
  var productsRoute = require(PRODUCTS_ROUTE_PATH);

  await test('renderShellWithNavIncludesProductsSection (AC1)', async function() {
    var pool = makeMockPool([{ product_id: 'p1', name: 'Acme', created_at: '2026-01-01' }]);
    var html = await productsRoute.renderShellWithNav(pool, 'tenant-1', {
      title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'x' }, active: 'test'
    });
    assertTrue(html.indexOf('class="sw-product-nav-list"') !== -1, 'expected the Products nav section to be present');
    assertTrue(html.indexOf('Acme') !== -1, 'expected the product name to appear');
  });

  await test('renderShellWithNavPreservesOtherOpts (AC1)', async function() {
    var pool = makeMockPool([]);
    var html = await productsRoute.renderShellWithNav(pool, 'tenant-1', {
      title: 'Distinctive Title XYZ', bodyContent: '<p>distinctive body content</p>', user: { login: 'x' }, active: 'test'
    });
    assertTrue(html.indexOf('Distinctive Title XYZ') !== -1, 'expected the title to pass through unchanged');
    assertTrue(html.indexOf('distinctive body content') !== -1, 'expected the body content to pass through unchanged');
  });

  await test('renderShellWithNavRespectsExplicitActiveProductId (AC1)', async function() {
    var pool = makeMockPool([
      { product_id: 'p1', name: 'Product One', created_at: '2026-01-01' },
      { product_id: 'p2', name: 'Product Two', created_at: '2026-01-02' }
    ]);
    var html = await productsRoute.renderShellWithNav(pool, 'tenant-1', {
      title: 'Test', bodyContent: '', user: { login: 'x' }, active: 'test', activeProductId: 'p2'
    });
    var p2Row = html.slice(html.indexOf('Product Two') - 300, html.indexOf('Product Two') + 50);
    assertTrue(p2Row.indexOf('sw-product-nav-item--active') !== -1, 'expected Product Two\'s nav row to carry the active class');
    var p1Row = html.slice(html.indexOf('Product One') - 300, html.indexOf('Product One') + 50);
    assertTrue(p1Row.indexOf('sw-product-nav-item--active') === -1, 'expected Product One\'s nav row NOT to carry the active class');
  });

  console.log('\n[pncg-s1] Wrapper results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-pncg-s1-shared-nav-wrapper.js
```

Expected output: a `TypeError` or `undefined is not a function` for `productsRoute.renderShellWithNav` — the function doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/products.js`, add this new function directly after `getProductsNavSummary` (around line 2171, right after its closing `}`):

```javascript
// pncg-s1: shared wrapper so every route handler that wants the persistent
// Products sidebar doesn't have to remember to call getProductsNavSummary
// and thread its 3 fields into renderShell itself -- forgetting this is
// exactly the bug class this story fixes (see decisions.md, ARCH entry).
// Lives here (not html-shell.js) to avoid a circular dependency:
// html-shell.js must not require products.js, since products.js already
// requires html-shell.js for renderShell.
async function renderShellWithNav(pool, tenantId, opts) {
  var navSummary = await getProductsNavSummary(pool, tenantId);
  var mergedOpts = Object.assign({}, opts, {
    products: navSummary.products,
    activeProductId: opts.activeProductId || null,
    noProductJourneyCount: navSummary.noProductJourneyCount
  });
  return _htmlShell.renderShell(mergedOpts);
}
```

Then add it to `module.exports` (in the block starting around line 3860), directly after the existing `getProductsNavSummary` line:

```javascript
  // pan-s1: shared products-for-sidebar summary, also consumed by routes/journey.js
  getProductsNavSummary,
  // pncg-s1: shared renderShell + nav-fetch wrapper, also consumed by every
  // other route file fixed by this story
  renderShellWithNav,
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-pncg-s1-shared-nav-wrapper.js
```

Expected output: all 3 tests `[PASS]` — `[pncg-s1] Wrapper results: 3 passed, 0 failed`

- [ ] **Step 5: Run a quick regression check**

```bash
node tests/check-a1-modules-taxonomy-crud.js
node tests/check-bvnd-s1-board-view-products-nav.js
```

Expected output: both fully green — confirms adding the new function/export didn't disturb `getProductsNavSummary`'s existing callers.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-pncg-s1-shared-nav-wrapper.js
git commit -m "feat: add renderShellWithNav shared helper for the Products sidebar"
```

---

## Task 2: Wire products.js's own 5 call sites (AC2)

**Files:**
- Modify: `src/web-ui/routes/products.js`

All 5 changes are call-site swaps from `_htmlShell.renderShell(...)` to `await renderShellWithNav(pool, tenantId, ...)`. Four of the five handlers already receive `pool`; `handleGetProductNew` does not and needs it threaded (see the correction note at the top of this plan) — that one handler also needs a `server.js` call-site update (folded into this task since it's a single one-line change there, not worth a separate task).

- [ ] **Step 1: `handleGetOrgKanban`** — change:
```javascript
  _sendKanbanHtml(res, _htmlShell.renderShell({
    title: 'Kanban board',
    bodyContent: html,
    user: { login: req.session && req.session.login },
    active: 'dashboard',
    isAdmin: isAdmin
  }));
```
to:
```javascript
  _sendKanbanHtml(res, await renderShellWithNav(_pool, tenantId, {
    title: 'Kanban board',
    bodyContent: html,
    user: { login: req.session && req.session.login },
    active: 'dashboard',
    isAdmin: isAdmin
  }));
```
(`_pool` and `tenantId` are already local variables in this function — confirm their exact names by reading the function's top before editing, in case they differ slightly from this plan's assumption.)

- [ ] **Step 2: `handleGetProductKanban`** — identical pattern, same before/after shape as Step 1, in that function's own body (confirm its own local `pool`/`tenantId` variable names the same way).

- [ ] **Step 3: `handleGetProductRoadmap`** — change:
```javascript
  return _htmlShell.renderShell({ title: 'Roadmap', bodyContent: body, user: { login: login }, active: 'dashboard', crumbs: [productName, 'Roadmap'], isAdmin: isAdmin });
```
to:
```javascript
  return renderShellWithNav(pool, req.session.tenantId, { title: 'Roadmap', bodyContent: body, user: { login: login }, active: 'dashboard', crumbs: [productName, 'Roadmap'], isAdmin: isAdmin, activeProductId: productId });
```
(this function already has `pool` as a direct parameter per its signature `async function handleGetProductRoadmap(req, res, _next, pool)`; `productId` is already in scope, matching how `_renderProductView`'s sibling functions pass it — pass it as `activeProductId` since this page belongs to a specific product, unlike org-wide pages.)

- [ ] **Step 4: `handleGetGuardrailsForm`** — same pattern as Step 3 (signature is `async function handleGetGuardrailsForm(req, res, _next, pool)`), pass `activeProductId: productId` the same way.

- [ ] **Step 5: `handleGetProductNew`** (the corrected one — needs pool threaded):

In `src/web-ui/routes/products.js`, change:
```javascript
function handleGetProductNew(req, res) {
```
to:
```javascript
function handleGetProductNew(req, res, pool) {
```
and change:
```javascript
  var html = _renderProductNew(login, error, isAdmin, _csrf.generateCsrfToken(req));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
```
to:
```javascript
  renderShellWithNavForProductNew(req, res, pool, login, error, isAdmin);
```
Actually — simpler: since `_renderProductNew` builds the FULL page body already wrapped in its own `renderShell` call internally (check: `_renderProductNew` at line 184 likely calls `_htmlShell.renderShell` itself, not `handleGetProductNew`) — **before editing, read `_renderProductNew`'s own body in full** to confirm whether the `renderShell` call is inside `_renderProductNew` (the render helper) or `handleGetProductNew` (the handler). If it's inside `_renderProductNew`, that function itself needs `pool`/`tenantId` threaded as new parameters (matching the `_renderProductDashboard`/`fresc-s1` precedent of a pure render-helper function), and `handleGetProductNew` needs to fetch `getProductsNavSummary` itself and pass the result into `_renderProductNew`, OR `_renderProductNew` becomes async and calls `renderShellWithNav` itself. Choose whichever keeps the change smallest and most consistent with this file's existing `_renderProductView`/`_renderProductDashboard` pattern (those take pre-fetched data as parameters, not a pool) — **prefer fetching `getProductsNavSummary` in `handleGetProductNew` and passing `products`/`noProductJourneyCount` into `_renderProductNew` as new parameters**, matching how `_renderProductView` already receives `navProducts`/`noProductJourneyCount` as plain data, not a pool. Update `_renderProductNew`'s own internal `renderShell` call to include these.

In `src/web-ui/server.js`, change:
```javascript
    authGuard(req, res, async () => { handleGetProductNew(req, res); });
```
to:
```javascript
    authGuard(req, res, async () => { await handleGetProductNew(req, res, _pshPool); });
```

- [ ] **Step 6: Run regression + the story's own tests so far**

```bash
node tests/check-pncg-s1-shared-nav-wrapper.js
node tests/check-a1-modules-taxonomy-crud.js
node tests/check-bvnd-s1-board-view-products-nav.js
```

Expected output: all green (the structural/functional coverage tests for THIS task's sites don't exist yet — Task 6 writes them; this step is just confirming no regression from the edits so far).

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/products.js src/web-ui/server.js
git commit -m "feat: wire products.js's 5 pages to the shared Products-nav helper"
```

---

## Task 3: Thread pool through and wire journey.js's 6 handlers (AC2, AC3)

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Modify: `src/web-ui/server.js`

**Fully worked example — `handleGetStageReview`:**

In `src/web-ui/routes/journey.js`, change the function signature:
```javascript
async function handleGetStageReview(req, res) {
```
to:
```javascript
async function handleGetStageReview(req, res, pool) {
```

Change the render call (near the end of the function):
```javascript
  var html = renderShell({ title: 'Review: ' + stageLabel, bodyContent: body, user: { login: req.session.login || '' }, active: 'journey' });
```
to:
```javascript
  var html = await renderShellWithNav(pool, req.session.tenantId, { title: 'Review: ' + stageLabel, bodyContent: body, user: { login: req.session.login || '' }, active: 'journey' });
```

(`renderShellWithNav` needs to be imported at the top of `journey.js` — check whether it's already imported alongside `_getProductsNavSummary`; if not, add: `var _renderShellWithNav = require('./products').renderShellWithNav;` next to the existing `_getProductsNavSummary` import line, and use `_renderShellWithNav` as the call name instead of `renderShellWithNav` to match this file's own existing import-aliasing convention.)

In `src/web-ui/server.js`, change:
```javascript
    await handleGetStageReview(req, res);
```
to:
```javascript
    await handleGetStageReview(req, res, _pshPool);
```

**Apply the identical pattern to the other 5 handlers** — same 3-part change (function signature gains `pool`, the `renderShell(` call becomes `await _renderShellWithNav(pool, req.session.tenantId, ...)`, the `server.js` call site passes `_pshPool`):

| Handler | `journey.js` line (approx, confirm before editing) | `server.js` call site (approx, confirm before editing) |
|---------|---------------------------------------------------|----------------------------------------------------------|
| `handleGetReferenceModal` | ~1579 | ~2861 (note: already wrapped in `authGuard(req, res, async () => { ... })` — thread `pool` into that inner arrow function too) |
| `handleGetReference` | ~1747 | ~2847 |
| `handleGetStories` | ~2426 | ~2912 |
| `handleGetJourneyById` | ~2797 (not `async` — confirm whether it needs to become `async` given `renderShellWithNav` is itself async; if so, update its own callers too) | ~2809 |
| `handleGetWizard` | ~3922 (has 3 internal `renderShell` calls — fix all 3 branches in the same signature/import change) | confirm this handler's own call site by searching for `handleGetWizard(` in `server.js` |

- [ ] **Run regression check after all 6 are done:**

```bash
node tests/check-a1-modules-taxonomy-crud.js
node tests/check-bvnd-s1-board-view-products-nav.js
```

(No dedicated journey.js test files are named here because none of this story's own new tests target journey.js individually — Task 6's structural test covers all 6 of these sites, and `handleGetJourneyById`'s existing pre-existing test suite, if any, should also be spot-run: search `tests/*.js` for references to `handleGetJourneyById`/`handleGetStageReview`/etc. and run any that exist before moving on.)

- [ ] **Commit:**

```bash
git add src/web-ui/routes/journey.js src/web-ui/server.js
git commit -m "feat: thread pool through and wire journey.js's 6 pages to the shared Products-nav helper"
```

---

## Task 4: Wire settings.js and team-management.js (AC2)

**Files:**
- Modify: `src/web-ui/routes/settings.js`
- Modify: `src/web-ui/routes/team-management.js`

Both files already have `pool` available via their `createXHandlers(pool)` factory closures — no signature change needed, only the call-site swap. `renderShellWithNav` needs importing in both files the same way `journey.js` does.

- [ ] **`settings.js`:** change:
```javascript
  return _htmlShell.renderShell({
    title: 'Settings — Skills Platform',
    ...
```
to:
```javascript
  return renderShellWithNav(pool, req.session && req.session.tenantId, {
    title: 'Settings — Skills Platform',
    ...
```
(`pool` here is the factory's own closed-over parameter, not a new one — confirm the exact variable name at the top of `createSettingsHandlers(pool)` before editing.)

- [ ] **`team-management.js`:** same pattern for both `handleGetTeamMembers` and `handleGetCreateInviteForm` — change:
```javascript
    var html = htmlShell.renderShell({
      title: 'Team members',
      ...
```
to:
```javascript
    var html = await renderShellWithNav(pool, req.session && req.session.tenantId, {
      title: 'Team members',
      ...
```
(mark the enclosing function `async` if it isn't already, since `renderShellWithNav` is async — check both `handleGetTeamMembers` and `handleGetCreateInviteForm`'s current `async`/non-async status and their own callers in `server.js` before editing, since making a previously-sync function async can require an `await` at its own call site too.)

- [ ] **Run regression:**

```bash
node tests/check-a1-modules-taxonomy-crud.js
```

(search `tests/*.js` for any existing settings.js/team-management.js test files and run those too, if found)

- [ ] **Commit:**

```bash
git add src/web-ui/routes/settings.js src/web-ui/routes/team-management.js
git commit -m "feat: wire settings.js and team-management.js to the shared Products-nav helper"
```

---

## Task 5: Thread pool through and wire the remaining 5 files (AC2, AC3)

**Files:**
- Modify: `src/web-ui/routes/admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js`
- Modify: `src/web-ui/server.js`

**Fully worked example — `billing.js`'s `handleGetBillingSuccess`:**

Change the function signature:
```javascript
async function handleGetBillingSuccess(req, res) {
```
to:
```javascript
async function handleGetBillingSuccess(req, res, pool) {
```

Change the render call:
```javascript
  var html = renderShell({
    title:       'Payment successful',
    bodyContent: bodyContent,
    user:        { login: req.session.login || '' }
  });
```
to:
```javascript
  var html = await renderShellWithNav(pool, req.session.tenantId, {
    title:       'Payment successful',
    bodyContent: bodyContent,
    user:        { login: req.session.login || '' }
  });
```

(Import `renderShellWithNav` at the top of `billing.js`, next to its existing `var { renderShell, escHtml } = require('../utils/html-shell');` line — add `var { renderShellWithNav } = require('./products');` as a new line. Note: `products.js` does not currently import anything from `billing.js`, so this does not create a circular dependency — confirm this remains true before finalizing.)

In `src/web-ui/server.js`, change:
```javascript
    await handleGetBillingSuccess(req, res);
```
to:
```javascript
    await handleGetBillingSuccess(req, res, _pshPool);
```

**Apply the identical pattern to the other 4 handlers** — same signature/import/call-site shape:

| File | Function | Notes |
|------|----------|-------|
| `admin-credits.js` | `adminCreditsGet` | Confirm this file's exact `module.exports` naming — it exports `adminCreditsGet` (not `handleGet...`) per its own existing convention; keep that name, only add the `pool` parameter and the `renderShellWithNav` import/call-site swap |
| `admin-mock-gateway.js` | `adminMockGatewayGet` | Same as above |
| `artefact.js` | `handleArtefactRoute` (2 internal render call sites — the GitHub-sourced success branch and the Postgres-fallback success branch) | Fix both branches in this one function/signature change; this file already imports `renderShell` directly (`const { renderShell, escHtml: shellEscHtml } = require('../utils/html-shell');`) — add `renderShellWithNav` from `./products` the same way |
| `features.js` | `handleGetFeatureArtefacts` | Note this handler's signature is `(req, res, featureSlug)` — pool becomes a 4th parameter, not the 3rd; check its own `server.js` call site (`await handleGetFeatureArtefacts(req, res, featureSlug);`) and update the parameter order to match |

- [ ] **Run regression check after all 5 files are done:**

```bash
node scripts/run-all-tests.js
```

Run the FULL suite here (not just a targeted subset) — this task touches the most files with the least existing direct test coverage of any task in this story, so the full-suite run is the right checkpoint per this skill's own "widely-shared code" judgement call, not the default targeted-file-only rule.

- [ ] **Commit:**

```bash
git add src/web-ui/routes/admin-credits.js src/web-ui/routes/admin-mock-gateway.js src/web-ui/routes/artefact.js src/web-ui/routes/billing.js src/web-ui/routes/features.js src/web-ui/server.js
git commit -m "feat: thread pool through and wire the remaining 5 files to the shared Products-nav helper"
```

---

## Task 6: Write the structural test and the 4 functional integration tests (AC2, AC3)

**Files:**
- Create: `tests/check-pncg-s1-nav-coverage-structural.js`
- Create: `tests/check-pncg-s1-nav-coverage-functional.js`

- [ ] **Step 1: Write the structural test**

Follow the test plan's own manifest table and brace-depth-counting approach exactly (`artefacts/2026-08-26-products-nav-coverage-gap/test-plans/pncg-s1-test-plan.md`, "Structural Test" section) — implement the `_extractFunctionBody(src, functionNamePattern)` helper using brace-depth counting (not fixed-line-offset), build the 19-row manifest table from that same section, and assert both checks per row (call-count match, pool-accessibility). Update the manifest's `poolParamRequired`/expected-call-site values if Tasks 2-5 ended up doing anything slightly different from this plan's assumptions (e.g. if `_renderProductNew` needed a different threading shape than a direct `pool` parameter per Task 2 Step 5's own noted ambiguity) — the test should assert what was ACTUALLY built, not blindly copy the plan's original guess.

- [ ] **Step 2: Write the 4 functional tests**

Follow the test plan's own "Integration Tests" section exactly (`orgKanbanNowIncludesProductsSection`, `settingsNowIncludesProductsSection`, `journeyWizardAllThreeViewsIncludeProductsSection`, `teamMembersNowIncludesProductsSection`) — each needs a mock `pool` matching that specific handler's OWN existing query shape (read the handler's actual current queries before writing its mock, don't guess the shape) plus the `getProductsNavSummary` shape reused from Task 1's test file.

- [ ] **Step 3: Run both new test files — must pass**

```bash
node tests/check-pncg-s1-nav-coverage-structural.js
node tests/check-pncg-s1-nav-coverage-functional.js
```

Expected output: structural test reports 0 failures across all 19 manifest rows; functional test reports 4/4 passed.

- [ ] **Step 4: Commit**

```bash
git add tests/check-pncg-s1-nav-coverage-structural.js tests/check-pncg-s1-nav-coverage-functional.js
git commit -m "test: add structural (all 22 sites) and functional coverage tests for pncg-s1"
```

---

## Task 7: Full-suite regression run and final check (AC4)

- [ ] **Step 1: Run the full suite**

```bash
node scripts/run-all-tests.js
```

Expected output: same or better than the branch-setup baseline — 552 (or 553+, now including this story's new test files) file(s) run, only the pre-existing `tests/check-p3.5-validate-trace.js` flake (per `tests/known-baseline-failures.json`) allowed to fail. If any OTHER file fails, stop and investigate before proceeding — do not assume it's unrelated.

- [ ] **Step 2: Spot-check every one of the 22 pages' own pre-existing test files individually if any weren't already covered by the full-suite run's own file list** (they should all be included in the full-suite run already — this step is a final confirmation, not a separate discovery pass).

- [ ] **Step 3: Update pipeline-state.json**

```bash
node bin/skills advance 2026-08-26-products-nav-coverage-gap pncg-s1 testPlan.passing=8 acVerified=4
```

(8 = 3 unit + 4 integration + 1 structural test-file-level count, matching the test plan's own `totalTests` field — adjust if the actual final test count differs once Task 6 is done.)

Then proceed to `/verify-completion`.
