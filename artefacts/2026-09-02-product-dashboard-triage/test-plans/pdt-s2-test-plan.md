## Test Plan: Add a Triage Summary Strip for Blocked/Warning Counts

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s2.md
**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Strip renders showing Blocked/Warning counts when ≥1 exists | 1 | — | — | — | — | 🟢 |
| AC2 | Clicking a count filters to that health state | 1 | — | — | — | — | 🟢 |
| AC3 | Zero blocked/warning shows a clear "nothing blocked" state | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No triggering language found. The strip's click-through behaviour is a link/anchor pointing at the existing health-filter-chip mechanism's own URL/anchor pattern — testable by asserting the rendered `href` matches the expected filtered-view target, not by simulating real browser navigation.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses `_renderProductView`'s own fixture pattern (`healthCounts` object with `green`/`amber`/`red`/`unknown` counts).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture `rollupRow.health_counts` with non-zero `red`/`amber` | Synthetic, in-test | None | |
| AC2 | Same fixture — assert the strip's Blocked link targets the same filter mechanism the existing health chips already use | Synthetic, in-test | None | |
| AC3 | A fixture `rollupRow.health_counts` with `red: 0, amber: 0` | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Strip renders Blocked and Warning counts when present
- **Verifies:** AC1
- **Precondition:** Fixture with `health_counts: {green: 50, amber: 3, red: 1, unknown: 10}`
- **Action:** Call `_renderProductView(...)`
- **Expected result:** The returned HTML contains a summary strip showing "1" for Blocked and "3" for Warning, rendered above the feature list
- **Edge case:** No

### Strip's Blocked count links to the existing Blocked filter
- **Verifies:** AC2
- **Precondition:** Same fixture
- **Action:** Extract the strip's Blocked-count link `href` (or equivalent click-target attribute) from the HTML
- **Expected result:** The link targets the same filter mechanism the existing "Blocked" health chip already uses — not a second, parallel filtering implementation
- **Edge case:** No

### Zero Blocked and zero Warning shows a clear "nothing blocked" state
- **Verifies:** AC3
- **Precondition:** Fixture with `health_counts: {green: 60, amber: 0, red: 0, unknown: 5}`
- **Action:** Call `_renderProductView(...)`
- **Expected result:** The strip renders a clear positive-state message (e.g. "Nothing blocked") rather than being empty, missing, or showing a bare "0 / 0"
- **Edge case:** Yes

---

## Integration Tests

None — covered by direct unit-level calls to `_renderProductView`, matching this repo's established convention for this function.

---

## NFR Tests

### Strip data reuses existing computation — no new query
- **NFR addressed:** Performance
- **Measurement method:** Code review confirms the strip reads from the same `healthCounts` object already passed into `_renderProductView` — no new database call introduced
- **Pass threshold:** No new query/computation function added
- **Tool:** Manual code review (structural — not independently automatable as a runtime assertion)

### Strip counts are real, keyboard-operable links
- **NFR addressed:** Accessibility
- **Measurement method:** Assert the Blocked/Warning counts render as `<a>` elements with a real `href`, not `<div>`/`<span>` elements with only a JS click handler
- **Pass threshold:** Markup inspection confirms real anchor elements
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner)

---

## Out of Scope for This Test Plan

- The "stalled 30+ days" and "new this week" counts — explicitly deferred per the story's own Out of Scope.
- Testing the underlying health-filter-chip mechanism itself — pre-existing, unmodified behaviour this story only links into.

---

## Test Gaps and Risks

None.
