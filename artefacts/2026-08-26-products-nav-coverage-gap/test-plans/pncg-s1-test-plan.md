## Test Plan: pncg-s1 — Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it

**Story reference:** `artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md`
**Epic reference:** none (short-track)
**Test plan author:** Claude (agent)
**Date:** 2026-08-26
**Test file(s):** `tests/check-pncg-s1-shared-nav-wrapper.js` (unit, AC1), `tests/check-pncg-s1-nav-coverage-structural.js` (structural, AC2 full coverage), `tests/check-pncg-s1-nav-coverage-functional.js` (integration, AC2/AC3 spot-checks)
**Test runner:** confirmed from `package.json` — `"test": "node scripts/run-all-tests.js"`; individual files run standalone via `node tests/check-<name>.js`.

---

## Why three files, and a hybrid strategy, not 22 independent functional tests

Given the sheer number of sites (22 render call sites across 19 distinct handler functions in 10 files), writing 22 fully independent functional integration tests — each requiring a realistic mock `pool` matching that handler's own specific query shape — would be a very large, slow-to-write, slow-to-maintain test file for what is structurally the same one-line defect repeated 22 times. Instead:

1. **Structural test (comprehensive, all 22 sites):** reads each handler's actual source and asserts it calls `renderShellWithNav(` (not raw `renderShell(`) at every one of its known render call sites. This directly verifies the actual fix was applied everywhere, is cheap to write and run, and — importantly — will catch a future regression if someone reverts one call site back to raw `renderShell` (which a purely functional test suite would only catch if that specific site happened to be one of the functionally-tested ones).
2. **Functional tests (targeted, high-value subset):** a handful of genuine end-to-end integration tests, chosen to (a) cover the story's own most consequential site (`/org/kanban`, the original live report), (b) prove the fix works via both pool-access patterns in play (direct parameter vs. factory-closure), and (c) prove AC3's pool-threading actually works, not just that source text changed.
3. **Unit tests for the new helper itself:** `renderShellWithNav` is new code, not a modified existing function — it gets its own direct unit coverage independent of any call site.

This is documented explicitly here (not silently chosen) so the coverage-gap trade-off is visible at DoR sign-off, not discovered later.

---

## AC Coverage

| AC | Description | Unit | Integration | Structural | Manual | Gap type | Risk |
|----|-------------|------|-------------|------------|--------|----------|------|
| AC1 | New `renderShellWithNav` helper | 3 | — | — | — | — | 🟢 |
| AC2 | All 22 sites show Products section | — | 4 | 1 (covers all 22) | — | — | 🟢 |
| AC3 | Pool threaded where missing | — | 2 (subset) | 1 (shared with AC2's structural test, extended to check function signatures) | — | — | 🟢 |
| AC4 | No regression | — | — | — | — | — | 🟢 (covered by re-running each of the 22 pages' own pre-existing test files + full suite) |

---

## Coverage gaps

**Acknowledged, not blocking:** 15 of the 22 sites are covered only by the structural test (proving the call-site change was made), not also by a dedicated functional integration test (proving the rendered output is correct end-to-end for that specific handler's own data shape). The 4 functional spot-checks (`/org/kanban`, `/settings`, `/journey/wizard` all 3 views, `/team/members`) were chosen to cover: the original reported bug, both pool-access patterns (direct parameter vs. factory closure), and one handler needing AC3's pool-threading. This is a deliberate coverage-depth trade-off given the site count, not an oversight — see rationale above. Gap type: `Untestable-by-nature` does not apply (these ARE testable); this is a scope/effort trade-off, recorded per the test-plan skill's own gap-table requirement.

---

## Test Data Strategy

**Source:** Synthetic — every target function takes a mock `pool.query`/`req`/`res`, matching the established pattern in `check-a1-modules-taxonomy-crud.js`, `check-bvnd-s1-board-view-products-nav.js`, and `check-fresc-s1-empty-state-clarity-copy.js`. No real database.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all test data is constructed inline.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock `pool` returning products/journeys rows | Synthetic, inline | None | Reuses `getProductsNavSummary`'s existing query shape (already proven in `check-a1-modules-taxonomy-crud.js` and `check-bvnd-s1-board-view-products-nav.js`) |
| AC2 (structural) | Raw source file text | Read from disk (`fs.readFileSync`) | None | Not "test data" in the traditional sense — the test reads the actual implementation files |
| AC2/AC3 (functional) | Per-handler mock `pool`/`req`/`res` for the 4 spot-checked handlers | Synthetic, inline | None | Each handler's own query shape confirmed by reading its source before writing its test (see Integration Tests below) |

### PCI / sensitivity constraints

None.

### Gaps

None — test data is fully available and self-contained.

---

## Unit Tests

### renderShellWithNavIncludesProductsSection

- **Verifies:** AC1
- **Precondition:** Mock `pool` returning 1 product row, 0 journey rows for it, 0 no-product journeys
- **Action:** Call `renderShellWithNav(mockPool, 'tenant-1', { title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'x' }, active: 'test' })`
- **Expected result:** Returned HTML contains `class="sw-product-nav-list"` (the unconditional wrapper `html-shell.js`'s `renderProductsSection` always emits once `products` is not `undefined`) and contains the product's name
- **Edge case:** No

### renderShellWithNavPreservesOtherOpts

- **Verifies:** AC1
- **Precondition:** Same mock pool as above
- **Action:** Call `renderShellWithNav(mockPool, 'tenant-1', { title: 'Distinctive Title XYZ', bodyContent: '<p>distinctive body content</p>', user: { login: 'x' }, active: 'test' })`
- **Expected result:** Returned HTML still contains `'Distinctive Title XYZ'` and `'distinctive body content'` — confirms the helper merges in `products`/`activeProductId`/`noProductJourneyCount` without dropping or altering any other caller-supplied option
- **Edge case:** No

### renderShellWithNavRespectsExplicitActiveProductId

- **Verifies:** AC1
- **Precondition:** Mock `pool` returning 2 products, `p1` and `p2`
- **Action:** Call `renderShellWithNav(mockPool, 'tenant-1', { title: 'Test', bodyContent: '', user: { login: 'x' }, active: 'test', activeProductId: 'p2' })`
- **Expected result:** The rendered nav item for `p2` carries the `sw-product-nav-item--active` class; `p1`'s does not — confirms `activeProductId` is threaded through, not silently overridden by the helper
- **Edge case:** Yes — explicit override of a value the helper itself doesn't compute

---

## Integration Tests

### orgKanbanNowIncludesProductsSection

- **Verifies:** AC2 (`/org/kanban`, the story's originating report)
- **Components involved:** `handleGetOrgKanban`, mock `pool` (products + per-product journeys, matching that handler's existing query shape), mock `posthog`
- **Precondition:** Mock pool returning 1 product with 0 journeys, tenant has the `ORG_KANBAN_VIEW` flag enabled (mock `_postHogFlags.isEnabledOrDefault` or use its existing test-double pattern, matching how this file's own pre-existing tests already stub this flag check)
- **Action:** Call `handleGetOrgKanban(req, res, null, mockPool, mockPosthog)`
- **Expected result:** Response body contains `class="sw-product-nav-list"` and the product's name
- **Edge case:** No

### settingsNowIncludesProductsSection

- **Verifies:** AC2, AC3-adjacent (`/settings` — proves the fix works through the `createSettingsHandlers(pool)` factory-closure access pattern, not just a direct function parameter)
- **Components involved:** `createSettingsHandlers(pool)`'s returned `handleGetSettings`, mock `pool`
- **Precondition:** Mock pool returning identity-links data (matching `handleGetSettings`'s existing query shape) plus a products/journeys shape for `getProductsNavSummary`
- **Action:** Build handlers via `createSettingsHandlers(mockPool)`, call the returned `handleGetSettings(req, res)`
- **Expected result:** Response body contains `class="sw-product-nav-list"`
- **Edge case:** No

### journeyWizardAllThreeViewsIncludeProductsSection

- **Verifies:** AC2, AC3 (`/journey/wizard` — proves the pool-threading fix for a handler that previously had NO `pool` parameter at all)
- **Components involved:** `handleGetWizard` (post-fix signature expected to accept `pool` as a new parameter), mock `pool`
- **Precondition:** Mock pool covering whatever `handleGetWizard`'s existing (pre-fix) logic already queries, plus the `getProductsNavSummary` shape
- **Action:** Call `handleGetWizard(req, res, mockPool)` three times, with `req.query` set to `{}` (default), `{ view: 'existing' }`, `{ view: 'resume' }` respectively
- **Expected result:** All 3 responses contain `class="sw-product-nav-list"` — confirms all 3 internal render branches were fixed, not just one
- **Edge case:** Yes — all 3 branches of one handler, not just the default

### teamMembersNowIncludesProductsSection

- **Verifies:** AC2, AC3-adjacent (`/team/members` — second confirmation of the factory-closure access pattern, in a different file than `/settings`, plus this file's own `handleGetCreateInviteForm` sibling shares the same factory)
- **Components involved:** `team-management.js`'s handler factory, mock `pool`
- **Precondition:** Mock pool covering `handleGetTeamMembers`'s existing query shape plus `getProductsNavSummary`'s shape
- **Action:** Build handlers via the file's own factory function with the mock pool, call the returned `handleGetTeamMembers(req, res)`
- **Expected result:** Response body contains `class="sw-product-nav-list"`
- **Edge case:** No

---

## Structural Test (comprehensive coverage of all 22 sites)

### everyConfirmedSiteCallsRenderShellWithNav

- **Verifies:** AC2 (all 22 sites), AC3 (pool-parameter presence at the sites that needed it)
- **Approach:** For each entry in the manifest table below, read the named source file, locate the named function's body (start = the function's declaration line; end = the line where that function's own brace depth returns to zero, tracked by counting `{`/`}` characters from the start — do not use a fixed-offset or fixed-indentation search, since indentation and nesting depth vary across the 10 files involved), and assert:
  1. The function body contains exactly as many occurrences of `renderShellWithNav(` as the manifest's `expectedCallSites` value for that entry, and zero occurrences of a bare `renderShell(` call that isn't part of `renderShellWithNav(`'s own name (i.e. `renderShell(` not preceded by `render` — a simple regex distinguishing `renderShellWithNav(` from `renderShell(` as a standalone call is sufficient, since no other function name in this codebase contains `renderShell` as a substring — confirm this assumption with a quick repo-wide grep before relying on it, and fall back to an explicit exclusion list if it doesn't hold).
  2. If the manifest entry's `poolParamRequired` is `true`, the function's own declaration line includes a `pool` parameter.

**Manifest table (drives the test — one row per function, not per individual `renderShell` call site):**

| File | Function | Expected `renderShellWithNav(` call sites | `poolParamRequired` |
|------|----------|-------------------------------------------|----------------------|
| `src/web-ui/routes/products.js` | `handleGetOrgKanban` | 1 | already had `pool` |
| `src/web-ui/routes/products.js` | `handleGetProductKanban` | 1 | already had `pool` |
| `src/web-ui/routes/products.js` | `handleGetProductNew` | 1 | already had `pool` |
| `src/web-ui/routes/products.js` | `handleGetProductRoadmap` | 1 | already had `pool` |
| `src/web-ui/routes/products.js` | `handleGetGuardrailsForm` | 1 | already had `pool` |
| `src/web-ui/routes/journey.js` | `handleGetStageReview` | 1 | true |
| `src/web-ui/routes/journey.js` | `handleGetReferenceModal` | 1 | true |
| `src/web-ui/routes/journey.js` | `handleGetReference` | 1 | true |
| `src/web-ui/routes/journey.js` | `handleGetStories` | 1 | true |
| `src/web-ui/routes/journey.js` | `handleGetJourneyById` | 1 | true |
| `src/web-ui/routes/journey.js` | `handleGetWizard` | 3 | true |
| `src/web-ui/routes/settings.js` | `handleGetSettings` | 1 | already had (factory closure) |
| `src/web-ui/routes/team-management.js` | `handleGetTeamMembers` | 1 | already had (factory closure) |
| `src/web-ui/routes/team-management.js` | `handleGetCreateInviteForm` | 1 | already had (factory closure) |
| `src/web-ui/routes/admin-credits.js` | `adminCreditsGet` | 1 | true (to be confirmed at implementation time whether via parameter or a factory closure — assert `pool` is accessible by whichever mechanism the implementer used, not specifically a bare parameter) |
| `src/web-ui/routes/admin-mock-gateway.js` | `adminMockGatewayGet` | 1 | true (same caveat as above) |
| `src/web-ui/routes/artefact.js` | `handleArtefactRoute` | 2 | true (same caveat as above) |
| `src/web-ui/routes/billing.js` | `handleGetBillingSuccess` | 1 | true (same caveat as above) |
| `src/web-ui/routes/features.js` | `handleGetFeatureArtefacts` | 1 | true (same caveat as above) |

Sum of "Expected call sites" column = 22, matching the story's confirmed site count.

**Expected result:** All 19 manifest rows pass both assertions — 0 failures.

- **Edge case:** `handleGetWizard` (3 sites in one function) and `handleArtefactRoute` (2 sites in one function) are the two rows where brace-depth extraction must correctly capture the WHOLE function body across multiple internal branches, not stop at the first inner `}` — this is exactly why brace-depth counting is specified instead of a fixed-line-count or first-closing-brace approach.

---

## NFR Tests

None — confirmed with story owner. Story's NFR section states "None — reviewed 2026-08-26."

---

## Out of Scope for This Test Plan

- Full functional integration tests for the 15 sites covered only by the structural test (see "Coverage gaps" above for the explicit trade-off rationale).
- Visual/styling verification of the Products section on any of the 22 pages — no CSS-layout-dependent AC exists in this story; the structural and functional tests both assert on markup presence, not visual rendering.
- Performance/latency impact of `getProductsNavSummary` now running on more page loads — explicitly out of scope per the story's own NFR section.
- The 3 already-correct call sites and every genuine error/redirect/fragment render identified during the audit — not part of the 22-site list, not retested here.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| 15 of 22 sites lack a dedicated functional integration test | Site count makes full functional coverage disproportionately expensive relative to the mechanical nature of the defect | Structural test covers all 22 sites' actual code change; 4 functional spot-checks cover both pool-access patterns and the trickiest multi-branch cases (`handleGetWizard`) |
| Exact pool-threading mechanism for `admin-credits.js`, `admin-mock-gateway.js`, `artefact.js`, `billing.js`, `features.js` was not fully confirmed before DoR | These 5 files showed no existing `pool` parameter, module-level pool reference, or factory-closure pattern on inspection — the implementer must determine and apply the right mechanism per file | Structural test's `poolParamRequired` check is written to accept "pool accessible by whichever mechanism" rather than assuming a specific one, so it validates the outcome (pool is reachable) without over-constraining the implementation approach |
