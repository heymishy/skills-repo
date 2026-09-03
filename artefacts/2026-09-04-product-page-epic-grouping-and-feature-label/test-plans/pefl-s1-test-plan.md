## Test Plan: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic

**Story reference:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | By Phase tab row sub-label shows feature name, not epic name | 1 | — | — | — | — | 🟢 |
| AC2 (regression) | By Module / All tabs row sub-label unchanged (epic-name fallback) | 1 | — | — | — | — | 🟢 |
| AC3 | Epic-group count > 1 → By Phase is the default tab, regardless of module count | 1 | — | — | — | — | 🟢 |
| AC4 (regression) | Epic-group count ≤ 1 → defaultTab unchanged (module-count logic) | 1 | — | — | — | — | 🟢 |
| AC5 (regression) | New featureName field is additive — existing computeTaxonomyRollup consumers unaffected | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language — presence/shape assertions on server-rendered HTML strings and direct function-return-value assertions, matching this route's own established convention (`pdt-s1`, `pvc-s1`, `ppg-s1`). N/A.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — direct function calls with in-test fixtures, no mocked network/DB calls needed (both touched functions are pure/synchronous)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An item list with 2+ items sharing one `epicName`, each also carrying a distinct `featureName` | Synthetic, in-test | None | |
| AC2 | Same fixture, rendered via the By Module/All-tab row path (2-arg call) | Synthetic, in-test | None | |
| AC3 | A `_renderConsolidatedFeaturesSection` fixture with taxonomy producing 2 distinct epic groups, and ≥1 custom Module | Synthetic, in-test | None | |
| AC4 | Same shape but only 1 epic group | Synthetic, in-test | None | |
| AC5 | A `pipelineState` fixture already used by `fal-s1`'s own bare-string test, re-asserted to also carry the correct `featureSlug`/`slug` alongside the new `featureName` | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### By Phase tab: row sub-label shows the parent feature's name, not the repeated epic name
- **Verifies:** AC1
- **Precondition:** Two items sharing `epicName: 'Phase 2 — skills advance, web UI gate enforcement, and chain-hash trace'`, each with a distinct `featureName` (e.g. `'CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail'`).
- **Action:** Call `_renderPvcItemRow(item, false, true)` (the new third-parameter call shape used by the By Phase tab).
- **Expected result:** The rendered sub-label `<div>` contains the item's `featureName` text, and does NOT contain the `epicName` text.
- **Edge case:** No

### By Module / All tabs: row sub-label behaviour is completely unchanged (regression guard)
- **Verifies:** AC2
- **Precondition:** Same item fixture as above (has both `epicName` and `featureName`).
- **Action:** Call `_renderPvcItemRow(item)` and `_renderPvcItemRow(item, true)` (the existing 1- and 2-argument call shapes, matching every pre-existing call site).
- **Expected result:** Both calls render the sub-label using `epicName` (today's exact behaviour) — `featureName` is not used when the third parameter is omitted/falsy.
- **Edge case:** No

### Epic-group count > 1: By Phase is the default tab regardless of module count
- **Verifies:** AC3
- **Precondition:** A taxonomy/items fixture producing 2 distinct epic groups via `groupItemsByPhase`, AND a non-empty `modules` array (≥1 custom Module) passed to `_renderConsolidatedFeaturesSection`.
- **Action:** Call `_renderConsolidatedFeaturesSection(items, modules, taxonomy, productId, csrfToken, healthCounts)`.
- **Expected result:** The returned HTML has `pvc-tab--active`/`aria-selected="true"` on the By Phase tab button and `pvc-tab-panel--active` on the By Phase panel — not By Module, despite modules.length > 0.
- **Edge case:** Yes — this is the exact case ppg-s1's own original logic got wrong (module count alone decided the default).

### Epic-group count ≤ 1: defaultTab logic is exactly what it was before this story (regression guard)
- **Verifies:** AC4
- **Precondition:** Two fixtures: (a) zero epic groups, zero modules; (b) one epic group, ≥1 modules.
- **Action:** Call `_renderConsolidatedFeaturesSection` for each fixture.
- **Expected result:** (a) defaults to By Phase (matches `ppg-s1`'s own AC3 — zero modules still defaults to phase); (b) defaults to By Module (matches `ppg-s1`'s own AC6 regression guard) — both identical to pre-`pefl-s1` behaviour.
- **Edge case:** No

### computeTaxonomyRollup: featureName is additive, existing fields unaffected (regression guard)
- **Verifies:** AC5
- **Precondition:** A `pipelineState` fixture with one feature (`slug: 'x', name: 'Feature X Display Name'`) containing one epic with two stories, one object-shaped and one bare-string-shaped (reusing `fal-s1`'s own AC2 fixture shape).
- **Action:** Call `computeTaxonomyRollup(pipelineState)`.
- **Expected result:** Each item in `result.groups[0].items` carries `featureName: 'Feature X Display Name'` in addition to its already-correct `slug` and `featureSlug` (both fields' own values match `fal-s1`'s own already-passing test expectations exactly, unaffected by the new field's addition).
- **Edge case:** No

---

## Out of Scope for This Test Plan

- Any test of the epic group header's own rendering (`_renderModuleSection`) — unchanged by this story.
- Any test of `_renderPvcItemRowWithCheckbox`'s own sub-label behaviour — untouched call path, matches AC2's own regression coverage implicitly (it delegates to the same 2-argument `_renderPvcItemRow` shape).
- Any test of `groupItemsByPhase`'s own bucketing logic — unchanged, already covered by its own pre-existing tests.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
