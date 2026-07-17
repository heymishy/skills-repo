## Test Plan: Render aggregate AC coverage on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s6.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Blended aggregate AC-coverage percentage | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Features with no acTotal/acVerified excluded from numerator/denominator | 1 test | — | — | — | — | 🟢 |
| AC3 | AC-coverage visually distinguished from test-coverage on the same page | 1 test | — | — | — | — | 🟢 |
| AC4 | Zero-data state shows explicit "No AC data yet," not 0%/NaN | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture cached rollup records with known per-feature `acTotal`/`acVerified` values, mirroring pr-s5's own fixture shape.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture with 3 features at different acTotal/acVerified ratios | Synthetic | None | Same blended-vs-average distinction as pr-s5 AC1 |
| AC2 | Fixture with features that have AC data and one that has none (e.g. pre-DoR feature) | Synthetic | None | Mirrors pr-s5 AC2 exactly, applied to AC-coverage fields |
| AC3 | Both AC-coverage and test-coverage rendered together from one fixture | Synthetic | None | Confirms labelling/visual distinction, not calculation |
| AC4 | Fixture with zero features having any acTotal/acVerified data | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### computes blended AC coverage as sum-of-verified over sum-of-total, not an average of percentages

- **Verifies:** AC1
- **Precondition:** Fixture with Feature A (12 total ACs, 10 verified), Feature B (4 total, 4 verified). A naive average gives (83.3%+100%)/2 = 91.7%; blended gives (10+4)/(12+4) = 87.5%.
- **Action:** Run the AC-coverage aggregation function.
- **Expected result:** Result is 87.5%, confirming the blended method — same defect-catching purpose as pr-s5's equivalent test.
- **Edge case:** No.

### features with no acTotal/acVerified data are excluded from the aggregate, not counted as 0%

- **Verifies:** AC2
- **Precondition:** Fixture with Feature A (12 total, 9 verified) and Feature D (no `acTotal`/`acVerified` fields — a pre-DoR feature).
- **Action:** Run the aggregation function.
- **Expected result:** Result is 75% (9/12) — Feature D contributes nothing to either the numerator or denominator.
- **Edge case:** Yes — mirrors pr-s5's equivalent defect-prevention test.

### zero features with AC data returns an explicit "no data" state, not 0% or NaN

- **Verifies:** AC4
- **Precondition:** Fixture where every feature lacks `acTotal`/`acVerified` fields.
- **Action:** Run the aggregation function.
- **Expected result:** Result is an explicit "no data" marker, mapped to "No AC data yet" by the rendering layer — not `0` and not `NaN`.
- **Edge case:** Yes.

---

## Integration Tests

### GET /products/:id renders both test-coverage and AC-coverage percentages with distinct labels

- **Verifies:** AC1, AC3
- **Components involved:** `products.js` route handler, `_renderProductView`, both aggregation functions (pr-s5's and this story's).
- **Precondition:** A cache row exists with fixture data for both test-plan and AC fields.
- **Action:** Send `GET /products/:productId`.
- **Expected result:** Response body contains both percentages, each under its own distinct, unambiguous label (e.g. "Test coverage: 87%" and "AC coverage: 75%," not two unlabelled numbers next to each other).

---

## NFR Tests

### AC-coverage aggregation makes no additional API or DB calls

- **NFR addressed:** Performance
- **Measurement method:** Confirm no additional `global.fetch` or DB read calls beyond pr-s2's own baseline.
- **Pass threshold:** Zero additional external calls.
- **Tool:** Assertion on mock call counts.

### AC-coverage percentage is screen-reader readable and distinguishable from test-coverage without colour alone

- **NFR addressed:** Accessibility
- **Measurement method:** Inspect rendered markup for distinct text labels on both percentages, not relying on position or colour alone to differentiate them.
- **Pass threshold:** Both percentages have their own readable text label in the DOM.
- **Tool:** Assertion against rendered markup.

---

## Out of Scope for This Test Plan

- AC-coverage trend over time — explicitly out of scope, matching pr-s5.
- Per-AC (not per-feature) detail — explicitly out of scope for this story.
- Full browser E2E testing — no AC here is CSS-layout-dependent; ADR-018 recommends an E2E spec as a DoR-time architecture-guardrail addition, not required by this test plan's own AC coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Calculation method (blended vs. average) is still an open discovery [ASSUMPTION], shared with pr-s5 | Story's own Architecture Constraints flag this as pending `/clarify` confirmation | These tests assert the blended method as currently specified; if `/clarify` changes the method, both pr-s5's and this test plan must be updated together for consistency before implementation begins |
