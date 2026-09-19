# Implementation Plan: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md (dsa-s2)

**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**DoR:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s2-dor.md
**Worktree:** `.worktrees/dsa-s2`, branch `feature/dsa-s2`

**This is the SECOND implementation plan for this story.** The first (Tasks 1-3, all committed) targeted `routes/dashboard.js`, which was found to be confirmed dead code — `GET /dashboard` never dispatches there in any real configuration. See `decisions.md`'s CRITICAL finding entry for the full empirical proof. This plan targets the REAL, live route.

## Pre-flight facts (verified before writing this plan, do not re-derive)

- **Real routing, empirically confirmed twice (once by a subagent, once independently by the orchestrating session, real server + real authenticated request both times):** `server.js:2743-2748` — `if (_pshPool) { authGuard(..., () => _handleGetDashboard(req, res, null, _pshPool)) } else { await handleDashboard(req, res) }`. `_pshPool` is truthy in every real config (`server.js:441` production, `server.js:1900` `NODE_ENV=test`) — the `else` branch (`dashboard.js`'s dead `handleDashboard`) is itself unreachable.
- **Real target function, exported:** `_renderProductDashboard(products, login, navProducts, activeProductId, noProductJourneyCount, isAdmin, hasNoProductWork, impersonation)` — `routes/products.js:172`, exported at `products.js:4427`. Called from `handleGetDashboard` (`products.js:2573`, non-`?view=board` branch) at `products.js:2646`.
- **Real current body content** (`products.js:198-208`): a `max-width:720px` div with an `<h1>Products</h1>` header + "New product" button, a `cardsHtml` product-card grid (or the zero-products onboarding CTA when `products.length === 0`), a `noProductEntryHtml` ("No product work →" link, shown when `hasNoProductWork`), and an "org kanban" link.
- **The zero-products onboarding branch (`products.length === 0`, `products.js:174-178`) is a real, load-bearing user flow and MUST be preserved unchanged (AC8).** Only the `products.length > 0` branch's content is replaced by this story.
- **Design decision for the has-products branch (resolving the story's own explicitly-flagged open question):** since `renderShell`'s sidebar already provides full product navigation (already real, already sufficient, not rebuilt by this story), and `DESIGN.md`'s mock shows NO product-card grid in the main content area (the mock's sidebar owns product navigation, matching this codebase's own real sidebar), the has-products branch's card-grid content is REPLACED by the mock-derived personal dashboard content (greeting, skill grid, pending actions, recent sessions) — not shown alongside it. The `noProductEntryHtml`/org-kanban link's own fate is decided in Task 1 below (recommend: keep the org-kanban link somewhere in the new layout, since it has no other home; the `noProductEntryHtml` link is a real, working link to `/journey` for no-product-scoped work and should also be preserved, most naturally near the bottom of the new content, matching its current position).
- **`renderDashboard` (`views/dashboard-view.js`) is a fully-built, already-correct, already-token-correct pure view function** — REUSE it directly (`require('../views/dashboard-view').renderDashboard`), do not reimplement its markup inline in `products.js`. Confirmed its inline `<style>` block only references already-correct token names.
- **Reuse mechanism for Tasks 1-3's data-wiring functions, decided here (resolving review finding [3-L1]):** direct import from `routes/dashboard.js` — `const { _mapPendingActionsForDashboard, _deriveDashboardJourneyData, _formatCompletedAgo } = require('./dashboard');`. This is simpler than extracting a new shared module, keeps `dashboard.js`'s own existing tests unchanged (still importing from the same file), and matches this codebase's own precedent of cross-route-file imports (e.g. `server.js` already imports `renderShellWithNav` from `products.js` for `artefact.js`'s own use). `dashboard.js`'s own dead `handleDashboard`/`_DASHBOARD_SKILLS_CATALOG` are NOT touched — only these 3 already-exported functions are consumed.
- **Static skills catalog:** reuse the exact same 6-entry `_DASHBOARD_SKILLS_CATALOG` array already defined in `dashboard.js` (also already exported-adjacent — confirm at Task 1 time whether to import it directly or duplicate the small array; importing is preferred for single-source-of-truth, but the array itself is trivial enough that duplication is low-risk if a circular-import concern arises).
- **`getPendingActions`/`listJourneys` real signatures, tenant-filter fix, and empty-state text** — all unchanged from Tasks 1-3's own work, already verified correct including the tenant-filter correctness fix (`!(j.tenantId && j.tenantId !== sessionTenantId)`, matching `routes/artefact.js`'s own convention). `products.js`'s own `handleGetDashboard` already resolves `tenantId` locally (`products.js:2575`) — reuse that.
- **Real empty-state text to preserve exactly:** "Nothing waiting." (pending actions), "No recent sessions." (recent sessions) — both already baked into `renderDashboard`'s own markup, no changes needed there.

---

## Task 1: Wire `renderDashboard`'s mock content into `_renderProductDashboard`'s has-products branch, preserving the zero-products branch

**Files:**
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Read the exact current state first**

Re-read `_renderProductDashboard` (`products.js:172-220`) and `handleGetDashboard` (`products.js:2573-2664`) in full — confirm line numbers and content match the Pre-flight facts above (this plan was written before any code in this task was touched, but re-confirm regardless).

- [ ] **Step 2: Write the failing test**

Create `tests/check-dsa-s2-product-dashboard-wiring.js`:

```javascript
'use strict';
// tests/check-dsa-s2-product-dashboard-wiring.js -- AC3, AC6, AC8
const assert = require('assert');
const { _renderProductDashboard } = require('../src/web-ui/routes/products');

function testHasProductsRendersMockContentNotCardGrid() {
  const products = [{ product_id: 'p1', name: 'Product One', featureCount: 3, lastUpdated: '2026-09-01T00:00:00.000Z' }];
  const html = _renderProductDashboard(products, 'tester', products, null, 0, false, false, null);
  assert.ok(html.includes('Run a skill'), 'expected the real renderDashboard section header');
  assert.ok(html.includes('sw-skill-grid'), 'expected the real skill-card grid');
  assert.ok(!html.includes('feature3'), 'the old product-card-count text should no longer render for the has-products case'); // sanity check the OLD markup is genuinely gone, not just the new markup added alongside it
}

function testZeroProductsOnboardingPreserved() {
  const html = _renderProductDashboard([], 'tester', [], null, 0, false, false, null);
  assert.ok(html.includes('Create your first product'), 'the zero-products onboarding CTA must still render exactly as it does today (AC8)');
  assert.ok(!html.includes('Run a skill'), 'the new mock content must NOT appear on the zero-products onboarding path');
}

testHasProductsRendersMockContentNotCardGrid();
console.log('  ok - has-products branch renders the real mock content, not the old card grid');
testZeroProductsOnboardingPreserved();
console.log('  ok - zero-products onboarding CTA is preserved and unaffected by the new content (AC8)');
```

- [ ] **Step 3: Run test — must fail**

```bash
node tests/check-dsa-s2-product-dashboard-wiring.js
```

Expected: fails (the mock content isn't wired yet).

- [ ] **Step 4: Write the implementation**

In `src/web-ui/routes/products.js`, add near the top (after existing requires):

```javascript
var _dashboardView = require('../views/dashboard-view'); // dsa-s2 Task 1 -- reuse the real mock-matching view
var _DASHBOARD_SKILLS_CATALOG = require('./dashboard')._DASHBOARD_SKILLS_CATALOG; // dsa-s2 -- confirm this is actually exported at Task 1 time; if not, export it from dashboard.js first (a 1-line addition to that file's own module.exports, not a rewrite)
```

(Confirm `_DASHBOARD_SKILLS_CATALOG` is exported from `dashboard.js` — if it currently is not, add it to that file's `module.exports` as a minimal, additive change before importing it here.)

Modify `_renderProductDashboard`'s `products.length > 0` branch. The exact real signature/call site may need new parameters (pending actions, in-progress count, recent sessions) — plumb these through from `handleGetDashboard` (Task 2 wires the real data; this task can pass empty/placeholder values `{actions: [], pendingActionsCount: 0}` etc. for now, matching the same incremental pattern Tasks 1-3 used originally):

```javascript
function _renderProductDashboard(products, login, navProducts, activeProductId, noProductJourneyCount, isAdmin, hasNoProductWork, impersonation, mockData) {
  mockData = mockData || { pendingActionsCount: 0, actions: [], inProgressCount: 0, recent: [] };
  var body;
  if (products.length === 0) {
    // dsa-s2 AC8: the zero-products onboarding branch is UNCHANGED from its
    // existing real behavior -- do not touch this block's own content/copy.
    body = '<div style="padding:48px 0;text-align:center;color:var(--muted)">' +
        '<p style="font-size:18px;margin:0 0 12px">No products yet</p>' +
        '<p id="sw-products-empty-hint" style="font-size:14px;margin:0 0 20px;color:var(--muted)">A product organizes your epics, features, and journeys — you can connect a GitHub repo to it anytime.</p>' +
        '<a href="/products/new" style="display:inline-block;padding:10px 20px;background:var(--accent);color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Create your first product →</a>' +
      '</div>';
  } else {
    // dsa-s2 Task 1 (AC3, AC6): replace the old product-card grid with the
    // real DESIGN.md-mock-matching dashboard content -- product navigation
    // is already fully served by renderShell's own sidebar, so this main
    // content area no longer needs to duplicate it as a card grid.
    var now = new Date();
    var dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    body = _dashboardView.renderDashboard({
      greetingName: login || 'there',
      dateLabel: dateLabel,
      pendingActionsCount: mockData.pendingActionsCount,
      inProgressCount: mockData.inProgressCount,
      skills: _DASHBOARD_SKILLS_CATALOG,
      actions: mockData.actions,
      recent: mockData.recent
    });
  }
  var noProductEntryHtml = hasNoProductWork
    ? '<a href="/journey" style="display:block;padding:20px;background:var(--surface);border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);margin-top:24px">' +
        '<span style="font-size:16px;font-weight:600">No product work →</span>' +
      '</a>'
    : '';
  body = body + noProductEntryHtml +
    '<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--line)">' +
      '<a href="/org/kanban" style="font-size:14px;color:var(--muted);text-decoration:none">View org kanban →</a>' +
    '</div>';
  return _htmlShell.renderShell({
    title: 'Dashboard',
    bodyContent: body,
    user: { login: login },
    active: 'dashboard',
    products: navProducts,
    activeProductId: activeProductId,
    noProductJourneyCount: noProductJourneyCount,
    isAdmin: isAdmin,
    impersonation: impersonation
  });
}
```

(This is a real, structural change to `_renderProductDashboard` — apply carefully, preserving every parameter and the existing `renderShell` call's own options exactly. The `title` changes from `'Products'` to `'Dashboard'` to match the new content's real purpose — confirm at implementation time whether any existing test asserts the literal string `'Products'` as the page title, and if so, treat that as a real AC4 regression to investigate, not silently override.)

Update the ONE real call site (`handleGetDashboard`, `products.js:2646`) to pass a `mockData` argument — this task passes placeholders; Task 2 wires the real values:

```javascript
var html = _renderProductDashboard(cards, login, navSummary.products, null, navSummary.noProductJourneyCount, isAdmin, hasNoProductWork, impersonation, { pendingActionsCount: 0, actions: [], inProgressCount: 0, recent: [] });
```

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-dsa-s2-product-dashboard-wiring.js
```

- [ ] **Step 6: Run the pre-existing products.js regression suite**

```bash
grep -rl "routes/products\|handleGetDashboard\|_renderProductDashboard" tests/*.js
```

Run every file found — this is a MUCH larger, more heavily-tested file than `dashboard.js` ever was; expect materially more pre-existing tests than Tasks 1-3's own regression suite. Investigate and fix any real failures caused by this task's change (e.g. a test asserting the old `'Products'` title, or asserting product-card-grid markup that no longer renders for has-products sessions) — do not weaken assertions, determine root cause.

- [ ] **Step 7: Run ci-typecheck**

```bash
node scripts/ci-typecheck.js
```

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-dsa-s2-product-dashboard-wiring.js
git commit -m "feat(dsa-s2): wire renderDashboard's real mock content into the live /dashboard route (products.js), preserve zero-products onboarding (AC3, AC6, AC8)"
```

(If `dashboard.js`'s `_DASHBOARD_SKILLS_CATALOG` needed a `module.exports` addition, include that file in this same commit — it's a 1-line additive change, not a separate task.)

---

## Task 2: Wire real pending-actions and journey-derived data (AC5, AC7)

**Files:**
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Read the exact current state first**

Confirm Task 1's `mockData` placeholder parameter is in place. Re-confirm `_mapPendingActionsForDashboard`/`_deriveDashboardJourneyData`/`_formatCompletedAgo`'s real exported signatures from `routes/dashboard.js` (unchanged from Tasks 1-3).

- [ ] **Step 2: Write the failing test**

Extend `tests/check-dsa-s2-product-dashboard-wiring.js` (or create a new file `tests/check-dsa-s2-product-dashboard-data.js` — implementer's choice, prefer extending the existing file for cohesion) with a test asserting `handleGetDashboard` — dispatched with a fake `_getPendingActions` and fake journey data injected — renders the REAL mapped pending-action text and REAL derived recent-session content, not the `0`/`[]` placeholders from Task 1.

- [ ] **Step 3: Run test — must fail**

- [ ] **Step 4: Write the implementation**

In `products.js`, add near the top:

```javascript
var { _mapPendingActionsForDashboard, _deriveDashboardJourneyData, setGetPendingActions: _dashboardSetGetPendingActions } = require('./dashboard'); // dsa-s2 Task 2 -- reuse Tasks 1-3's already-reviewed data-wiring logic
var { getPendingActions: _defaultGetPendingActions } = require('../adapters/action-queue');
var { listJourneys: _listJourneysForDashboard } = require('../modules/journey-store');
```

(Confirm whether `dashboard.js`'s own `_getPendingActions` injectable variable/`setGetPendingActions` function is the right reuse point, or whether `products.js` should wire its own independent call to the adapter directly — since `products.js` doesn't currently import `action-queue.js` at all, a fresh, direct call (`await _defaultGetPendingActions(...)`, no injectable seam needed unless E2E test-seeding requires one — investigate this at Task 3/4 time) may be simpler than threading through `dashboard.js`'s own module-level injectable state. Decide based on what Task 3/4's E2E seeding investigation actually needs.)

In `handleGetDashboard`, before the `_renderProductDashboard(...)` call, add the real data-fetching (mirroring Tasks 1-3's own established try/catch pattern exactly):

```javascript
  var pendingResult;
  try {
    pendingResult = await _defaultGetPendingActions({ id: req.session.userId, login: login }, req.session.accessToken);
  } catch (err) {
    pendingResult = { items: [], bannerMessage: null };
  }
  var mapped = _mapPendingActionsForDashboard(pendingResult);

  var journeys;
  try {
    var repoRoot = process.env.COPILOT_REPO_PATH || require('path').resolve(__dirname, '../..'); // NOTE: products.js is one level shallower than dashboard.js -- confirm this depth independently, do not copy dashboard.js's '../../..' literally
    var allJourneys = _listJourneysForDashboard(repoRoot);
    journeys = allJourneys.filter(function(j) { return !(j.tenantId && j.tenantId !== tenantId); }); // preserves the tenant-filter correctness fix
  } catch (err) {
    journeys = [];
  }
  var journeyData = _deriveDashboardJourneyData(journeys, 5);
```

Update the `_renderProductDashboard(...)` call to pass real `mockData`:

```javascript
{ pendingActionsCount: mapped.pendingActionsCount, actions: mapped.actions, inProgressCount: journeyData.inProgressCount, recent: journeyData.recent }
```

**Verify the repo-root path resolution depth independently** — `products.js` lives at `src/web-ui/routes/products.js`, the SAME directory depth as `dashboard.js`. Do not assume the same `'../../..'` used in `dashboard.js` is correct here without re-deriving it (it should resolve identically since the depth is the same, but confirm with a direct `path.resolve()` check, matching this session's own established discipline of never copying a path-resolution literal without re-verifying).

- [ ] **Step 5: Run test — must pass**

- [ ] **Step 6: Run the full regression suite** (same files as Task 1's Step 6, plus Tasks 1-3's own `check-dsa-s2-*` files to confirm the relocated functions still work correctly from their new caller)

```bash
node tests/check-dsa-s2-dashboard-wiring.js
node tests/check-dsa-s2-pending-actions-mapping.js
node tests/check-dsa-s2-journey-derivation.js
node tests/check-dsa-s2-product-dashboard-wiring.js
```

- [ ] **Step 7: Run ci-typecheck**

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-dsa-s2-product-dashboard-wiring.js
git commit -m "feat(dsa-s2): wire real pending-actions and journey-derived data into the live dashboard (AC5, AC7)"
```

---

## Task 3: E2E tests for AC1-AC3, AC5-AC8 (AC4 covered separately by re-running pre-existing specs)

**Files:**
- Create: `tests/e2e/dsa-s2-dashboard-restyle.spec.js`

- [ ] **Step 1: Investigate before writing**

Read `tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js` and `tests/e2e/psh-s4-dashboard-layout.spec.js`. **Investigate real E2E seeding for AC5/AC7 on the REAL route** — Task 4's earlier BLOCKED report already did substantial investigation here (see its full report, preserved in this session's own history, and `decisions.md`) but was blocked on the routing question, not the seeding question itself — re-read that investigation's findings on `/test/seed-approval-journey` (needs extending with a `completedStages` param, calling the real `completeStage()`) and the lack of an HTTP-reachable seam for `getPendingActions` (may need a new `NODE_ENV=test`-only test-seed endpoint, matching this codebase's own established `/test/seed-*` convention). Confirm these findings still hold now that the real target is `products.js`, and implement whatever real seeding mechanism is needed — this is real, in-scope work for this task, not a separate story.

- [ ] **Step 2: Write the E2E spec**

Cover AC1/AC2 (dark/light tokens on the real `/dashboard`), AC3 (layout matches the mock for a has-products session), AC5 (real pending actions render), AC6 (real skill catalog, real session-start links), AC7 (real in-progress count/recent sessions, populated + empty state), AC8 (zero-products onboarding CTA preserved, using a session that genuinely has zero products — no special seeding needed, this is the absence of a fixture).

- [ ] **Step 3: Run the E2E spec**

```bash
NODE_ENV=test npx playwright test tests/e2e/dsa-s2-dashboard-restyle.spec.js
```

Foreground, wait for it to actually finish. Investigate and fix real bugs found; do not weaken assertions to pass.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/dsa-s2-dashboard-restyle.spec.js [any new test-seed endpoint in server.js, as a separate commit if added]
git commit -m "test(dsa-s2): add E2E coverage for the real, live dashboard restyle with mock content"
```

---

## Task 4: Full regression verification (AC4) + verification script amendment + Node suite + npm test

**Files:** verification script amendment; verification only otherwise.

- [ ] **Step 1: Amend the verification script**

`artefacts/2026-09-18-design-system-adoption/verification-scripts/dsa-s2-verification.md` (if it exists) still describes the dead `dashboard.js` route from the original amendment — update it to describe the real `/dashboard` route (`products.js`), matching the story's own current ACs (including AC8's zero-products check).

- [ ] **Step 2: Run every pre-existing spec touching `products.js`'s `handleGetDashboard`/`_renderProductDashboard`**

```bash
grep -rl "routes/products\|handleGetDashboard\|_renderProductDashboard" tests/ tests/e2e/ 2>/dev/null
```

Run every file found (both Node check-scripts and Playwright specs) — this is a mandatory, exhaustive check given the real target file's much larger surface area than `dashboard.js` ever had. Also explicitly verify `GET /dashboard?view=board` (the kanban route, same handler) renders correctly and is visually unaffected.

- [ ] **Step 3: Run all dsa-s2-specific test files + the new E2E spec together**

```bash
node tests/check-dsa-s2-dashboard-wiring.js
node tests/check-dsa-s2-pending-actions-mapping.js
node tests/check-dsa-s2-journey-derivation.js
node tests/check-dsa-s2-product-dashboard-wiring.js
NODE_ENV=test npx playwright test tests/e2e/dsa-s2-dashboard-restyle.spec.js
```

- [ ] **Step 4: Run the full Node suite**

```bash
npm test
```

Foreground, wait for completion. Expect only the same pre-existing, unrelated failure already confirmed multiple times this session (`tests/check-p3.5-validate-trace.js`).

- [ ] **Step 5: Commit if any fixes were needed** (separate commit, own clear message)

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/routes/products.js` — a real, live, heavily-used, beta-user-facing route file. `/verify-completion`'s mandatory route/handler E2E coverage check applies with EXTRA rigor given the confirmed real stakes (unlike the original plan's dead-code target). At minimum, re-confirm and run: `psh-s4-dashboard-layout.spec.js`, every other spec found by Task 4's own exhaustive grep, and the `?view=board` kanban route check. This story's diff also changes rendered UI output on the platform's primary landing page — `/verify-completion`'s mandatory live browser render check applies and should be treated as especially high-value here, matching `dsa-s1`'s own experience where this exact check caught real defects no automated test found.

Any RISK-ACCEPTs already logged in `decisions.md` for this story carry forward — no new action needed at `/verify-completion` for those.
