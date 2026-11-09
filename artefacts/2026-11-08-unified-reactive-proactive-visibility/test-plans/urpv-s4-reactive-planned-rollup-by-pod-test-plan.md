## Test Plan: Reactive-vs-planned load rollup by pod

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Test plan author:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Reactive/planned counted with pod attribution, falling back default pod → "Unassigned" | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Pod row shows both counts distinctly, not blended | 1 test | — | — | — | — | 🟢 |
| AC3 | Zero pods configured → single "Unassigned" row with the full split | 1 test | — | — | — | — | 🟢 |
| AC4 | Reachable from the existing consolidated features view without a page navigation | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are rollup-computation and rendering behaviour, fully coverable by Unit/Integration tests.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixtures in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Merged item list with some `track: "short"` items, some `decisions.md`-sourced reactive items, some standard items; `getFeaturePodAssignments` mocked to return pod assignments for a subset, leaving others to fall back | Synthetic | None | |
| AC2 | A pod with both reactive and planned items assigned | Synthetic | None | |
| AC3 | Product-level fixture with no `pod_assignments` rows and no default pod set | Synthetic | None | Models this repo's own personal-scope dogfooded product row |
| AC4 | Already-rendered consolidated features view fixture (existing tab/chip markup) | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Counts track:short and decisions.md-sourced items as reactive, everything else as planned

- **Verifies:** AC1
- **Precondition:** Item list with 3 `track: "short"` items, 2 `decisions.md`-sourced items (from urpv-s3), and 5 `track: "standard"` items.
- **Action:** Run the rollup computation.
- **Expected result:** Total reactive count = 5 (3 + 2); total planned count = 5 — both reactive sources counted together, exactly as the AC specifies.
- **Edge case:** No.

### Resolves pod via getFeaturePodAssignments, falling back to product default pod, then Unassigned

- **Verifies:** AC1
- **Precondition:** Item A has an explicit `pod_assignments` row (pod "alpha"); Item B has no row but the product has a default pod ("beta"); Item C has no row and the product has no default pod.
- **Action:** Run the rollup computation with `getFeaturePodAssignments`/`getProductDefaultPod` mocked accordingly.
- **Expected result:** Item A is attributed to "alpha"; Item B to "beta"; Item C to "Unassigned" — the three-step fallback chain resolves correctly for each case independently.
- **Edge case:** Yes — three distinct resolution paths in one test.

### Pod row shows reactive and planned counts distinctly, not blended

- **Verifies:** AC2
- **Precondition:** Pod "alpha" has 3 reactive items and 12 planned items.
- **Action:** Run the rollup computation and inspect pod "alpha"'s row object.
- **Expected result:** The row has two separate numeric fields (e.g. `reactiveCount: 3`, `plannedCount: 12`) — not a single combined total of 15 with no breakdown.
- **Edge case:** No.

### Zero pods configured produces a single Unassigned row with the full split

- **Verifies:** AC3
- **Precondition:** Product has no `pod_assignments` rows and no default pod for any item.
- **Action:** Run the rollup computation over a mixed reactive/planned item list.
- **Expected result:** Exactly one row is returned, keyed "Unassigned", with `reactiveCount`/`plannedCount` reflecting the full product totals — the feature still functions and shows real data with one bucket instead of several.
- **Edge case:** Yes — the degenerate personal-scope case the AC explicitly names.

---

## Integration Tests

### Rollup is reachable from the existing consolidated features view without a page navigation

- **Verifies:** AC4
- **Components involved:** `_renderConsolidatedFeaturesSection`, the existing health-filter-chip/tab rendering pattern, the new pod rollup
- **Precondition:** A product with the rollup computed and at least 2 pods.
- **Action:** Render `_renderConsolidatedFeaturesSection` and locate the rollup's entry point in the returned markup.
- **Expected result:** The rollup is rendered as an additional tab/chip within the same page response — no separate route, no new top-level page, consistent with the existing tab/chip pattern already shipped on this view.

---

## NFR Tests

### Rollup computation adds no new per-item database query beyond the existing pod-display calls

- **NFR addressed:** Performance
- **Measurement method:** Spy on `getFeaturePodAssignments`/`getProductDefaultPod` call counts when rendering the page with the rollup present vs. a baseline render of the same page without the rollup feature (using the page's pre-existing pod-display logic alone).
- **Pass threshold:** Call counts are equal — the rollup reuses the same calls the page's existing pod-display logic already makes, adding zero new per-item queries.
- **Tool:** The project's configured test runner (`npm test`)

### Reactive/planned counts are rendered as text, not colour alone

- **NFR addressed:** Accessibility (MC-A11Y-02)
- **Measurement method:** Render a pod row; assert the element's `textContent` contains both the reactive and planned numeric values as visible text, independent of any applied colour class.
- **Pass threshold:** Both counts present as text nodes for every rendered row, including the "Unassigned" row.
- **Tool:** The project's configured test runner (`npm test`)

---

## Out of Scope for This Test Plan

- Historical/trend tracking over time — explicitly out of scope per the story; current-snapshot only.
- Per-individual-engineer breakdown within a pod — explicitly scoped to pod-level per the story's Architecture Constraints.
- Any change to pod creation/membership — this story only reads existing pod-assignment data; `pod-assignment-store.js`'s write paths and their own tests are untouched.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 4 ACs are fully covered by Unit/Integration tests against existing, already-wired primitives (`getFeaturePodAssignments`, `getProductDefaultPod`) and the existing tab/chip render pattern | — |
