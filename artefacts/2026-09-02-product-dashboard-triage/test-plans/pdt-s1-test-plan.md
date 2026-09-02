## Test Plan: Consolidate the Epic/Phase List

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s1.md
**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Static duplicate list removed, groups render exactly once | 1 | — | — | — | — | 🟢 |
| AC2 | Groups collapsed by default (rows hidden, count + status bar shown) | 2 | — | — | — | — | 🟢 |
| AC3 | Clicking a group header reveals its rows | 1 | — | — | — | — | 🟢 |
| AC4 | Zero-group product shows an empty state, not a broken section | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No triggering language found. Collapse/expand is a markup-attribute state (`<details>`/`open`, or an `aria-expanded`/`hidden` pair) — testable by inspecting the rendered HTML's attributes directly, not by computing real CSS layout or pointer-coordinate behaviour. No drag-drop, no `getBoundingClientRect`, no z-index/stacking dependency. All ACs unit/integration-testable via `_renderProductView`'s returned HTML string, matching this repo's own established convention (`check-shb-s1-story-health-badge-fix.js`).

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — a hand-built `pipelineState`/`rollupRow` fixture passed directly to `_renderProductView`, matching `check-shb-s1-story-health-badge-fix.js`'s own proven pattern.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture product with ≥2 epic/phase groups | Synthetic, in-test | None | |
| AC2 | Same fixture — assert rows are present in the HTML but marked collapsed (e.g. inside a closed `<details>`, or `hidden`/`aria-expanded="false"`) | Synthetic, in-test | None | |
| AC3 | Same fixture — assert the markup that toggles state on click is present (e.g. `<details>` itself is native, or a data attribute a client script binds to) | Synthetic, in-test | None | |
| AC4 | A fixture product with zero features/epics | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Static epic/phase text dump is removed; groups render exactly once
- **Verifies:** AC1
- **Precondition:** Fixture `pipelineState` with 2 epic groups, each with 2 stories
- **Action:** Call `_renderProductView(...)` with this fixture
- **Expected result:** The returned HTML contains each epic/phase group heading exactly once (no duplicate static-list rendering elsewhere in the output)
- **Edge case:** No

### Groups render collapsed by default — rows present in HTML but marked hidden/closed
- **Verifies:** AC2
- **Precondition:** Same fixture
- **Action:** Call `_renderProductView(...)`
- **Expected result:** Each group's row markup is present in the returned HTML (no new data fetch needed to populate it later) but marked in a closed/collapsed state (e.g. `<details>` without an `open` attribute, or equivalent `aria-expanded="false"`)
- **Edge case:** No

### Group header carries a real item count and a rolled-up status indicator
- **Verifies:** AC2
- **Precondition:** Same fixture, with a mix of healthy and warning items in one group
- **Action:** Call `_renderProductView(...)`
- **Expected result:** The group header shows the correct item count and a status indicator reflecting the mixed health state (not silently showing only the first item's health)
- **Edge case:** Yes — mixed-health group, not all-same-health

### Clicking a group header's markup supports revealing its rows
- **Verifies:** AC3
- **Precondition:** Same fixture
- **Action:** Inspect the group's markup structure
- **Expected result:** The markup uses a mechanism that natively supports expand-on-click without a new data fetch (e.g. `<details>`/`<summary>`, confirmed present with correct nesting of the row markup inside)
- **Edge case:** No

### Zero-group product shows an empty state, not a broken section
- **Verifies:** AC4
- **Precondition:** Fixture `pipelineState` with `features: []`
- **Action:** Call `_renderProductView(...)`
- **Expected result:** The groups section renders a clear, human-readable empty-state message; no thrown exception, no blank/broken markup
- **Edge case:** Yes

---

## Integration Tests

None — `_renderProductView` is a pure rendering function; the ACs are fully covered by direct unit-level calls to it, matching this repo's own established convention for this exact function (`check-shb-s1`, `check-a4-module-grouped-rendering.js`).

---

## NFR Tests

### Response size does not regress
- **NFR addressed:** Performance
- **Measurement method:** Compare the byte length of `_renderProductView`'s output for the same fixture before/after — removing a whole duplicate rendering pass should reduce or hold steady, never increase, output size
- **Pass threshold:** Post-change output size ≤ pre-change output size for the same fixture
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner)

### Collapse toggle is keyboard-operable
- **NFR addressed:** Accessibility
- **Measurement method:** Assert the markup uses a native keyboard-operable element (`<details>`/`<summary>`) or, if a custom toggle is used instead, that it carries `tabindex="0"`, a `role`, and `aria-expanded`
- **Pass threshold:** Markup inspection confirms one of the two patterns above
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Real browser keyboard-interaction testing (does pressing Enter actually toggle the `<details>` element) — native `<details>` elements have well-established, browser-guaranteed keyboard behaviour; not re-verified here.
- Testing the By Module/By Phase/All tab switching itself, or the health-filter chips, or the search box — pre-existing, unmodified behaviour.

---

## Test Gaps and Risks

None — all ACs are testable via the same proven, direct-call pattern already established for this exact rendering function.
