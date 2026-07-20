## Test Plan: Render the product view grouped by module with dual health/coverage indicators and a scale gauge

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Epics grouped by module, Unassigned bucket | 1 | 1 | — | — | — | 🟢 |
| AC2 | Health and coverage shown as two distinct indicators | 1 | 1 | — | — | — | 🟢 |
| AC3 | Scale indicator with proportional visual | 1 | — | — | — | — | 🟢 |
| AC4 | Zero-module fallback renders cleanly | 1 | 1 | — | — | — | 🟢 |
| AC5 | Smooth expand/collapse transition | — | — | 1 | — | CSS-layout-dependent | 🟡 |

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Transition smoothness | AC5 | CSS-layout-dependent | jsdom doesn't compute CSS transitions or real paint timing | E2E test via Playwright (already configured in this repo — `test:e2e` script) asserting the element's computed style includes a transition property and that content is not instantly hidden/shown between two animation-frame checks |

## Test Data Strategy

**Source:** Mixed — synthetic fixtures for unit/integration; the real skills-framework product (already connected, 141+ stories) for a realistic-scale E2E smoke check.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC4 | Synthetic rollup row with modules, epics, health, coverage | Synthetic | None | Matches this session's own established `check-pr-s2-products-route.js` mocking convention |
| AC5 | Real browser session against a running dev server | Local dev server | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC5's noted CSS-layout-dependent handling above.

---

## Unit Tests

### _renderProductView groups epics under their assigned module
- **Verifies:** AC1
- **Precondition:** A rollup row with 2 modules, each with epics assigned, plus one unassigned epic
- **Action:** Render the product view
- **Expected result:** HTML contains each module's name as a heading with its epics nested underneath; a separate "Unassigned" section contains the unassigned epic

### Health pill and coverage bar render as two distinct DOM elements per epic
- **Verifies:** AC2
- **Precondition:** An epic with health="bad" and coverage=80%
- **Action:** Render
- **Expected result:** HTML contains a health-pill element showing "Blocked" AND a separate coverage-bar element showing "80%" — not a single combined element

### Scale gauge shows epic count, story count, and a distribution strip
- **Verifies:** AC3
- **Precondition:** A rollup with 3 modules of different sizes
- **Action:** Render
- **Expected result:** HTML contains the total epic count, total story count, and a distribution-strip element with one segment per module sized proportionally

### Product view with zero modules renders without error
- **Verifies:** AC4
- **Precondition:** A rollup row with an empty modules array
- **Action:** Render
- **Expected result:** No exception thrown; HTML renders a sensible fallback (e.g. a flat ungrouped list) rather than a blank page or crash

---

## Integration Tests

### handleGetProductView renders module grouping end-to-end for a real-shaped rollup row
- **Verifies:** AC1, AC2
- **Components involved:** route handler, `_renderProductView`, mocked `pool.query`
- **Precondition:** A mocked pool returning a rollup row with modules/health/coverage populated
- **Action:** Call the real HTTP handler
- **Expected result:** Response HTML shows the grouped, dual-indicator layout — confirmed via the same end-to-end pattern already established by this session's `check-pr-s2-products-route.js` regression tests

### Zero-module product renders through the real handler without a 500
- **Verifies:** AC4
- **Components involved:** route handler, mocked pool returning a rollup with `modules: []`
- **Action:** Call the real handler
- **Expected result:** Response is 200 with a clean fallback, not a 500 or an empty body

---

## E2E Tests

### Module section expands with a smooth transition, not an instant snap
- **Verifies:** AC5
- **Tool:** Playwright (`test:e2e`)
- **Precondition:** Dev server running, product view open with at least one collapsed module
- **Action:** Click the module header to expand it
- **Expected result:** The element's computed `transition` (or `grid-template-rows`) style is non-zero-duration; a screenshot taken mid-animation differs from both the fully-collapsed and fully-expanded screenshots (confirming an actual transition occurs, not an instant state change)

---

## NFR Tests

### Initial render completes within budget at real scale
- **NFR addressed:** Performance
- **Measurement method:** Time page load against the real skills-framework product (141+ stories) on `wuce-staging`
- **Pass threshold:** Under 2 seconds
- **Tool:** Manual timing (browser dev tools Network tab)

### All operator-authored content is escaped
- **NFR addressed:** Security
- **Measurement method:** Render a module/epic name containing `<script>` and HTML special characters
- **Pass threshold:** Rendered output contains the escaped form only, matching this repo's existing `_escapeHtml` test convention (e.g. `check-rpc-s1-connect-repo.js`'s IT3)
- **Tool:** Unit test, mirroring the existing pattern exactly

---

## Out of Scope for This Test Plan

- Module CRUD itself — A1's test plan covers that.
- The Roadmap tab — A5's test plan covers that.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Transition smoothness (AC5) is E2E-only | jsdom cannot compute CSS transitions | Playwright test + manual verification scenario, both included above |
