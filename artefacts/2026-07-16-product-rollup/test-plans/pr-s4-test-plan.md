## Test Plan: Render aggregate health on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s4.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Count of features by health status, labelled correctly | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Any red feature → overall signal red | 2 tests | — | — | — | — | 🟢 |
| AC3 | No red, at least one amber → overall signal amber | 1 test | — | — | — | — | 🟢 |
| AC4 | All green (or zero features) → overall signal green | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture cached rollup records with known per-feature health values, no real API calls needed at all (this story reads only from pr-s2's already-cached data).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A cache-row fixture with features at all 4 health values (green, amber, red, unknown) | Synthetic | None | One fixture covers the whole count-and-label assertion |
| AC2 | Two fixtures: (a) 1 red + several green/amber, (b) 1 red + zero others | Synthetic | None | Confirms precedence holds regardless of how many non-red features exist |
| AC3 | A fixture with 0 red, 1+ amber, some green | Synthetic | None | |
| AC4 | Two fixtures: (a) all green, (b) zero features | Synthetic | None | Zero-features is a genuine edge case worth its own fixture, not assumed to behave like "all green" |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### counts features correctly across all four health statuses

- **Verifies:** AC1
- **Precondition:** Fixture rollup record with 3 green, 2 amber, 1 red, 1 unknown features.
- **Action:** Run the health-count aggregation function.
- **Expected result:** Output object has `{ green: 3, amber: 2, red: 1, unknown: 1 }`, and each count renders with the existing label convention (✓ Healthy / ⚠ Warning / ✕ Blocked / ? Unknown).
- **Edge case:** No.

### one red feature among many green/amber features yields an overall red signal

- **Verifies:** AC2
- **Precondition:** Fixture with 10 green, 5 amber, 1 red.
- **Action:** Run the overall-signal derivation function.
- **Expected result:** Overall signal is `red`.
- **Edge case:** No.

### a single red feature with zero other features still yields red

- **Verifies:** AC2
- **Precondition:** Fixture with exactly 1 feature, health = red.
- **Action:** Run the overall-signal derivation function.
- **Expected result:** Overall signal is `red`.
- **Edge case:** Yes — the minimal-input boundary case for the precedence rule.

### no red features, at least one amber, yields an overall amber signal

- **Verifies:** AC3
- **Precondition:** Fixture with 5 green, 2 amber, 0 red.
- **Action:** Run the overall-signal derivation function.
- **Expected result:** Overall signal is `amber`.
- **Edge case:** No.

### all-green features yield an overall green signal

- **Verifies:** AC4
- **Precondition:** Fixture with 8 green features, 0 amber/red/unknown.
- **Action:** Run the overall-signal derivation function.
- **Expected result:** Overall signal is `green`.
- **Edge case:** No.

### zero features yields an overall green signal, not an error or undefined

- **Verifies:** AC4
- **Precondition:** Fixture rollup record with an empty feature list.
- **Action:** Run the overall-signal derivation function.
- **Expected result:** Overall signal is `green` (per the story's own AC4 wording, "or the product has zero features") — the function does not throw or return `undefined`/`null`.
- **Edge case:** Yes — the empty-input boundary case.

---

## Integration Tests

### GET /products/:id renders the health count and overall signal together

- **Verifies:** AC1
- **Components involved:** `products.js` route handler, `_renderProductView`, the health-aggregation functions.
- **Precondition:** A cache row exists with a known mixed-health fixture.
- **Action:** Send `GET /products/:productId`.
- **Expected result:** Response body contains both the per-status counts and the single overall signal, using the established label convention.

---

## NFR Tests

### Health aggregation makes no additional API or DB calls beyond the existing cache read

- **NFR addressed:** Performance
- **Measurement method:** Count `global.fetch` and DB read invocations during a health-rollup render, confirming it's the same count as pr-s2's own baseline read (no extra calls added by this story).
- **Pass threshold:** Zero additional external calls attributable to health aggregation specifically.
- **Tool:** Assertion on mock call counts.

### Health status is distinguishable without colour alone

- **NFR addressed:** Accessibility
- **Measurement method:** Inspect rendered markup for each status to confirm a text label or icon accompanies any colour-coded element.
- **Pass threshold:** Every status (green/amber/red/unknown) has a non-colour indicator present in the markup.
- **Tool:** Assertion against rendered markup.

---

## Out of Scope for This Test Plan

- A weighted/percentage health score — explicitly out of scope for this story.
- Drill-down into which specific features are red/amber — explicitly out of scope for this story.
- Full browser E2E testing — no AC here is CSS-layout-dependent; ADR-018 recommends an E2E spec as a DoR-time architecture-guardrail addition, not required by this test plan's own AC coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
