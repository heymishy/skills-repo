## Test Plan: De-emphasize Unknown Health Visually

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s3.md
**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Unknown items render in quiet grey text, no colored badge | 1 | — | — | — | — | 🟢 |
| AC2 | Real Healthy/Warning/Blocked items keep their existing colored badge (regression) | 1 | — | — | — | — | 🟢 |
| AC3 | Overall summary line uses the same de-emphasized treatment when itself unknown | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No triggering language found. This is a color/class assignment check (does the item have `HEALTH_COLORS.unknown`'s value vs. a real color, does it carry a badge-background class vs. not) — testable by inspecting the rendered HTML's style/class attributes directly, not real-browser color rendering or layout.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses `_renderProductView`'s own fixture pattern, same as `check-shb-s1-story-health-badge-fix.js`.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture item with no `healthBySlug` match (falls back to `unknown`) | Synthetic, in-test | None | |
| AC2 | A fixture item with a real `green`/`amber`/`red` health value | Synthetic, in-test | None | |
| AC3 | A fixture `rollupRow` with no `health_counts` at all (so `overallSignal` itself resolves to `unknown`) | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Unknown-health item renders in quiet grey text, no colored badge
- **Verifies:** AC1
- **Precondition:** Fixture item with no matching `healthBySlug` entry (health resolves to `unknown`)
- **Action:** Call `_renderProductView(...)`
- **Expected result:** The item's health indicator renders using the muted/grey token (not one of the Healthy/Warning/Blocked colors), and does not carry a colored badge-background style
- **Edge case:** No

### Real health values keep their existing colored badge (regression)
- **Verifies:** AC2
- **Precondition:** Fixture items with `green`, `amber`, and `red` health values respectively
- **Action:** Call `_renderProductView(...)`
- **Expected result:** All three still render with their existing distinct colors and badge styling, unchanged from today
- **Edge case:** No

### Overall summary line uses the de-emphasized treatment when itself unknown
- **Verifies:** AC3
- **Precondition:** Fixture `rollupRow` with `health_counts: null` (no rollup data at all — `overallSignal` resolves to `unknown`)
- **Action:** Call `_renderProductView(...)`
- **Expected result:** The "Overall:" summary line also renders using the quiet/grey treatment, not a competing colored badge
- **Edge case:** Yes — the top-level summary is a separate code path from the per-item badges and must be independently verified

---

## Integration Tests

None — covered by direct unit-level calls to `_renderProductView`, matching this repo's established convention.

---

## NFR Tests

### De-emphasized Unknown treatment remains readable
- **NFR addressed:** Accessibility
- **Measurement method:** Assert the chosen muted color token meets a minimum contrast ratio against the page's background color (WCAG 2.1 AA — 4.5:1 for normal text)
- **Pass threshold:** Computed contrast ratio ≥ 4.5:1
- **Tool:** Node.js assert-based test helper computing contrast from the two hex/token values

---

## Out of Scope for This Test Plan

- Computing real health for currently-Unknown items — explicitly out of scope per the story and discovery.

---

## Test Gaps and Risks

None.
