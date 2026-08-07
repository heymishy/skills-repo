## Test Plan: Render aggregate test coverage on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s5.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Blended aggregate test-coverage percentage | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Features with no testPlan data excluded from numerator/denominator | 1 test | — | — | — | — | 🟢 |
| AC3 | Per-feature test-coverage detail available alongside the blended number | 1 test | — | — | — | — | 🟢 |
| AC4 | Zero-data state shows explicit "No test data yet," not 0%/NaN | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture cached rollup records with known per-feature `testPlan.{totalTests,passing}` values.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture with 3 features at different totalTests/passing ratios | Synthetic | None | Confirms the blended (sum/sum) calculation, not an average of percentages |
| AC2 | Fixture with 2 features that have testPlan data and 1 feature with no testPlan field at all | Synthetic | None | The critical case — confirms exclusion, not a silent 0% |
| AC3 | Same fixture as AC1 | Synthetic | None | Confirms per-feature detail is retrievable, not just the blended total |
| AC4 | Fixture with zero features having any testPlan data | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### computes blended test coverage as sum-of-passing over sum-of-total, not an average of percentages

- **Verifies:** AC1
- **Precondition:** Fixture with Feature A (10 total, 9 passing = 90%), Feature B (2 total, 2 passing = 100%). A naive average would give 95%; the blended calculation gives (9+2)/(10+2) = 91.7%.
- **Action:** Run the test-coverage aggregation function.
- **Expected result:** Result is 91.7% (rounded per implementation convention), confirming sum-of-passing/sum-of-total, not an average-of-percentages — this test would fail if the wrong method were implemented, which is the point.
- **Edge case:** No.

### features with no testPlan field are excluded from the aggregate, not counted as 0%

- **Verifies:** AC2
- **Precondition:** Fixture with Feature A (10 total, 8 passing) and Feature C (no `testPlan` field at all).
- **Action:** Run the aggregation function.
- **Expected result:** Result is 80% (8/10) — Feature C contributes nothing to either the numerator or denominator. (If Feature C were wrongly treated as 0/0 or 0-total, the result would differ or throw a divide-by-zero.)
- **Edge case:** Yes — this is the specific defect AC2 exists to prevent.

### per-feature test-coverage detail is retrievable alongside the blended aggregate

- **Verifies:** AC3
- **Precondition:** Same multi-feature fixture as AC1's test.
- **Action:** Call the function that returns both the blended aggregate and the per-feature breakdown.
- **Expected result:** The returned structure includes both the single blended percentage and an array/map of each feature's own individual percentage.
- **Edge case:** No.

### zero features with testPlan data returns an explicit "no data" state, not 0% or NaN

- **Verifies:** AC4
- **Precondition:** Fixture where every feature lacks a `testPlan` field.
- **Action:** Run the aggregation function.
- **Expected result:** Result is an explicit marker (e.g. `null` or a `{ noData: true }` shape) that the rendering layer maps to "No test data yet" — not `0` and not `NaN`.
- **Edge case:** Yes — the fully-empty boundary case.

---

## Integration Tests

### GET /products/:id renders the blended test-coverage percentage

- **Verifies:** AC1
- **Components involved:** `products.js` route handler, `_renderProductView`, the test-coverage aggregation function.
- **Precondition:** A cache row exists with the AC1 fixture data.
- **Action:** Send `GET /products/:productId`.
- **Expected result:** Response body contains the blended percentage value computed from the fixture.

---

## NFR Tests

### Test-coverage aggregation makes no additional API or DB calls

- **NFR addressed:** Performance
- **Measurement method:** Confirm no additional `global.fetch` or DB read calls beyond pr-s2's own baseline during a test-coverage render.
- **Pass threshold:** Zero additional external calls.
- **Tool:** Assertion on mock call counts.

### Test-coverage percentage and per-feature breakdown are screen-reader readable

- **NFR addressed:** Accessibility
- **Measurement method:** Inspect rendered markup for text content (not just an SVG chart or colour bar with no text equivalent).
- **Pass threshold:** The percentage value and per-feature breakdown are present as readable text content in the DOM.
- **Tool:** Assertion against rendered markup.

---

## Out of Scope for This Test Plan

- Test-coverage trend over time — explicitly out of scope for this story.
- Per-test (not per-feature) detail — explicitly out of scope for this story.
- Full browser E2E testing — no AC here is CSS-layout-dependent; ADR-018 recommends an E2E spec as a DoR-time architecture-guardrail addition, not required by this test plan's own AC coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Calculation method (blended vs. average) is still an open discovery [ASSUMPTION] | Story's own Architecture Constraints flag this as pending `/clarify` confirmation | These tests assert the blended method as currently specified in the story's ACs; if `/clarify` changes the method before DoR, this test plan must be updated to match before implementation begins |
