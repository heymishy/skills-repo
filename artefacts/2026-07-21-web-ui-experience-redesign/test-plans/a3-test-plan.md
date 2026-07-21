## Test Plan: Compute health per-feature, distinct from test coverage

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Per-feature health value included alongside aggregate | 1 | — | — | — | — | 🟢 |
| AC2 | Per-feature health not silently equal to coverage-derived value | 1 | — | — | — | — | 🟡 |
| AC2a | Health matches confirmed real signal rule | — | — | — | — | External-dependency | 🔴 |
| AC3 | Existing aggregate consumers unaffected | 1 | 1 | — | — | — | 🟢 |
| AC4 | Per-feature health persisted, not recomputed per-request | — | 1 | — | — | — | 🟢 |

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Concrete health-computation rule not yet known | AC2a | External-dependency | The real source signal for per-feature health has not been confirmed at the code level as of this test plan's writing — it is this story's own first implementation task (per its Architecture Constraints) | Cannot write a concrete test until the investigation resolves. Tracked as a blocking gap — AC2a's test must be written and added to this plan (Run 2) before this story can be considered DoR-complete, per the review's own [2-M1] finding. |

## Test Data Strategy

**Source:** Synthetic fixtures (a `pipeline-state.json`-shaped object with mixed tested/untested features).
**PCI/sensitivity in scope:** No
**Availability:** Available now for AC1/AC2/AC3/AC4; blocked for AC2a pending investigation.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC2, AC3, AC4 | Synthetic pipeline-state fixture with a docs-only (no testPlan) feature and a tested feature | Synthetic | None | |
| AC2a | Real per-feature health rule, TBD | N/A yet | N/A | Blocked — see gap above |

### PCI / sensitivity constraints

None.

### Gaps

AC2a's test data cannot be defined until the investigation named in the story's Architecture Constraints resolves. This is the same gap noted in Coverage gaps above, not a second issue.

---

## Unit Tests

### computeHealthCounts (extended) returns a per-feature breakdown alongside the aggregate
- **Verifies:** AC1
- **Precondition:** A synthetic pipeline-state fixture with 2 features
- **Action:** Call the extended `computeHealthCounts`
- **Expected result:** Return value includes both the existing aggregate shape AND a new per-feature array/map, one entry per feature
- **Edge case:** No

### A docs-only feature's health is not silently equal to a coverage-derived value
- **Verifies:** AC2
- **Precondition:** A feature with zero testPlan data anywhere (coverage would compute as `null`/no-data)
- **Action:** Compute per-feature health for that feature
- **Expected result:** The health value is NOT the literal output of `covStatus(null)` or any direct coverage-percentage mapping — assert the two are computed via genuinely different code paths, not just different-looking output that happens to coincide
- **Edge case:** Yes — this is explicitly the provisional/weaker assertion per the story's AC2; AC2a (currently a gap) is the concrete follow-up

### Existing aggregate health_counts shape is unchanged for existing consumers
- **Verifies:** AC3
- **Precondition:** A pipeline-state fixture matching what today's `computeHealthCounts` already handles
- **Action:** Call the extended function
- **Expected result:** The aggregate portion of the return value is byte-for-byte identical in shape to today's pre-change output for the same input

---

## Integration Tests

### product_rollups sync persists per-feature health alongside the aggregate
- **Verifies:** AC4
- **Components involved:** `syncProductRollup`, mocked `pool.query`
- **Precondition:** A real-shaped fixture pipeline-state
- **Action:** Run sync
- **Expected result:** The INSERT/UPDATE call includes the new per-feature health data in its params

### Existing "Feature health" instrument gauge renders unchanged after this story ships
- **Verifies:** AC3
- **Components involved:** `_renderProductView`, the health-gauge rendering section
- **Precondition:** A rollup row with the extended (aggregate + per-feature) shape
- **Action:** Render the product view
- **Expected result:** The aggregate gauge (green/amber/red counts) renders identically to before this story — this is an additive change, verified by re-running the existing pre-story test for this gauge unmodified and confirming it still passes

---

## NFR Tests

### Per-feature health computation does not materially slow down sync
- **NFR addressed:** Performance
- **Measurement method:** Time `/product-sync` before and after this change against a 150-story fixture
- **Pass threshold:** No order-of-magnitude slowdown (same budget as the existing aggregate computation)
- **Tool:** Manual timing comparison

---

## Out of Scope for This Test Plan

- Rendering per-feature health in the UI — A4's test plan covers that.
- AC2a's concrete test — blocked pending investigation, tracked as an open gap, not silently dropped.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2a has no test yet | The real per-feature health signal source is undetermined as of story-writing time | This story's Architecture Constraints require the investigation as its first implementation task; AC2a's test must be added to this plan (as Run 2) once that investigation resolves, before /definition-of-ready can sign off this story as complete |
