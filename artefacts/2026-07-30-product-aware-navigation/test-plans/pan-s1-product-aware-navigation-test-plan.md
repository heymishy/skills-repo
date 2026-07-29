## Test Plan: List products directly in the sidebar; remove the redundant "Run a Skill" and "Journeys" nav items

**Story reference:** artefacts/2026-07-30-product-aware-navigation/stories/pan-s1-product-aware-navigation.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Products list rendered with name + journey count, active marker | 3 | 1 | — | — | — | 🟢 |
| AC2 | Product row links to /products/:id | 1 | — | — | — | — | 🟢 |
| AC3 | Run a Skill / Journeys removed from NAV_ITEMS | 2 | — | — | — | — | 🟢 |
| AC4 | /journey lists only no-product journeys; sidebar No product entry | 2 | 1 | — | — | — | 🟢 |
| AC5 | Unwired pages' sidebar unchanged (regression guard) | 2 | — | — | — | — | 🟢 |
| AC6 | Journey creation flows unaffected (regression guard) | — | 2 | — | — | — | 🟢 |

---

## Coverage gaps

None — all 6 ACs are fully unit/integration testable against this repo's existing fake-pool/fixture conventions (matching `journey-store-pg.js`'s/`product-repo.js`'s own testing patterns already established this session).

---

## Test Data Strategy

**Source:** Fake pool doubles for unit tests (matching this session's established convention); a temp `pipeline-state.json`-equivalent is not needed here — fixtures are plain in-memory arrays matching the real `products`/`journeys` table row shapes.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture products array `[{product_id, name, featureCount}]` | Fixture | None | |
| AC2 | Same fixture, plus a rendered HTML assertion on the `href` | Fixture | None | |
| AC3 | The real `NAV_ITEMS` array itself | Real source | None | |
| AC4 | Fixture journeys with and without `product_id` | Fixture | None | |
| AC5 | Calling `renderShell` with no `products` key at all | Fixture | None | |
| AC6 | Real `handlePostJourney`/`handlePostProductFeature` fixtures | Fixture | None | |

### Gaps

None.

---

## Unit Tests

### U1 — renderSidebar renders each product with name and journey count (AC1)

- **Verifies:** AC1
- **Precondition:** `renderShell({ ..., products: [{productId:'p1', name:'skills-framework', journeyCount:3}, {productId:'p2', name:'acme-billing-portal', journeyCount:1}] })`
- **Action:** Call `renderShell` with the fixture products array
- **Expected result:** Output HTML contains both product names and their journey counts (`3`, `1`) in the sidebar markup
- **Edge case:** No

### U2 — renderSidebar marks the active product distinctly (AC1)

- **Verifies:** AC1
- **Precondition:** Same fixture as U1, plus `activeProductId: 'p1'`
- **Action:** Call `renderShell`
- **Expected result:** The `p1` product row has a distinct active class/marker; `p2`'s row does not
- **Edge case:** Yes

### U3 — renderSidebar shows the pinned "No product" entry with its own count (AC1, AC4)

- **Verifies:** AC1, AC4
- **Precondition:** `renderShell({ ..., products: [...], noProductJourneyCount: 2 })`
- **Action:** Call `renderShell`
- **Expected result:** A "No product" row appears in the sidebar showing `2`
- **Edge case:** No

### U4 — product row href points to /products/:id (AC2)

- **Verifies:** AC2
- **Precondition:** Fixture with `product_id: 'abc-123'`
- **Action:** Call `renderShell` with that product in the array
- **Expected result:** Rendered HTML contains `href="/products/abc-123"` (or URI-encoded equivalent) for that row
- **Edge case:** No

### U5 — NAV_ITEMS no longer contains a 'skills' or 'journey' id (AC3)

- **Verifies:** AC3
- **Precondition:** None — reads the real, exported `NAV_ITEMS` array
- **Action:** `NAV_ITEMS.find(item => item.id === 'skills')` / `NAV_ITEMS.find(item => item.id === 'journey')`
- **Expected result:** Both return `undefined`
- **Edge case:** No

### U6 — renderSidebar never renders "Run a Skill" or "Journeys" text regardless of active/isAdmin combination (AC3)

- **Verifies:** AC3
- **Precondition:** Call `renderShell` across a matrix of `{isAdmin: true/false} × {active: 'dashboard'/'journey'/'skills'/anything}`
- **Action:** Render each combination
- **Expected result:** None of the outputs contain the literal strings "Run a Skill" or the "Journeys" nav-item markup
- **Edge case:** Yes — the "no combination re-introduces it" regression guard

### U7 — the "start a new feature" flow with no product context still omits productId (AC6, unit-level)

- **Verifies:** AC6
- **Precondition:** Fixture request body with no product context, matching `/journey`'s own creation form
- **Action:** Trace the same code path `handlePostJourney` uses today (unchanged per this story)
- **Expected result:** No `productId` is set on the created journey, confirming the code path itself is untouched
- **Edge case:** No

---

## Integration Tests

### IT1 — handleGetDashboard's products query, extracted into a shared helper, still returns the same shape (AC1)

- **Verifies:** AC1
- **Components involved:** The new shared products-summary helper, a fake pool double
- **Precondition:** Fake pool returning fixture `products`/`journeys` rows
- **Action:** Call the shared helper directly
- **Expected result:** Returns `[{productId, name, journeyCount}]` — the exact same shape `handleGetDashboard`'s own inline logic produced before extraction (regression guard on the extraction itself)

### IT2 — GET /journey (real handler) lists only no-product journeys (AC4)

- **Verifies:** AC4
- **Components involved:** `handleGetJourney`, fixture journeys (some with `productId`, some without)
- **Precondition:** Fixture journey store with 2 journeys assigned to a product and 2 with none
- **Action:** Call the real `handleGetJourney` handler
- **Expected result:** Only the 2 no-product journeys appear in the rendered page body

### IT3 — a page that does NOT pass `products` renders the sidebar byte-for-byte as before this story (AC5)

- **Verifies:** AC5
- **Components involved:** `renderShell`, a snapshot of the pre-story sidebar output for a fixed input
- **Precondition:** Capture `renderShell({ active: 'settings', user: {login: 'x'}, isAdmin: false })`'s output on the pre-story code, and again on the post-story code (with no `products` key supplied)
- **Expected result:** Byte-for-byte identical output — confirms the additive-only nature of the change for unwired pages

### IT4 — handlePostProductFeature (existing, unchanged) still sets productId correctly (AC6)

- **Verifies:** AC6
- **Components involved:** `handlePostProductFeature`, fixture request
- **Precondition:** Fixture request from within a specific product's own page
- **Action:** Call the real handler
- **Expected result:** The created journey has the correct `productId` set — confirms this story didn't regress the existing product-scoped creation path

---

## NFR Tests

None beyond the story's own stated NFRs — no new NFR-specific test needed (the products query's tenant-scoping is already covered by IT1/IT2's fixture assertions).

---

## Out of Scope for This Test Plan

- Testing the ~60 unwired `renderShell` call sites individually — IT3's single representative snapshot test stands in for "the additive-only mechanism works," per the story's own Architecture Constraints; exhaustively testing every unwired page is disproportionate to the risk (they literally don't pass the new parameter, so there's nothing new to break).
- Browser-rendered visual verification of the sidebar's CSS (scroll behaviour, active-state styling) — these are DOM-structure assertions (via string-content checks on the rendered HTML), not CSS-layout-dependent claims requiring a real browser, consistent with this repo's established H-E2E gap classification for non-visual-layout ACs.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot exhaustively test all ~60 unwired `renderShell` call sites | Disproportionate given they receive no new parameter and are unchanged by construction | IT3's representative snapshot test confirms the additive mechanism itself is sound |
