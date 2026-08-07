## Test Plan: Render discovery scope and feature/epic taxonomy grouping

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s7.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e2-dimensions.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Features grouped under parent epic, ungrouped listed separately | 2 tests | — | — | — | — | 🟢 |
| AC2 | Discovery-artefact scope summary/link shown per feature | 1 test | — | — | — | — | 🟢 |
| AC3 | Zero-epic product shows a flat list, no misleading empty epics section | 1 test | — | — | — | — | 🟢 |
| AC4 | Taxonomy view's own total matches the cached rollup record's own total | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture cached rollup records mirroring this repo's own real mixed epic-nested/flat structure.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture with 2 epics (each containing 2 features) plus 1 ungrouped flat feature | Synthetic | None | Modelled on this platform's own real `pipeline-state.json` shape |
| AC2 | Fixture feature with a populated `discoveryArtefact` path | Synthetic | None | |
| AC3 | Fixture with zero epics, only flat features | Synthetic | None | |
| AC4 | Same fixture as AC1 (5 total features: 4 epic-nested + 1 ungrouped) | Synthetic | None | Confirms this story's own internal count consistency, independent of pr-s4 |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### groups features under their parent epic and lists ungrouped features separately

- **Verifies:** AC1
- **Precondition:** Fixture with Epic A (2 features), Epic B (2 features), and 1 flat ungrouped feature.
- **Action:** Run the taxonomy-grouping function.
- **Expected result:** Output has Epic A's 2 features nested under it, Epic B's 2 features nested under it, and the 1 ungrouped feature listed in a separate section — no feature appears in the wrong group or is missing.
- **Edge case:** No.

### a feature appearing in both an epic and (incorrectly) a flat list is not double-counted

- **Verifies:** AC1
- **Precondition:** Fixture with a feature that has a non-empty `epics[].stories[]` entry but also has a stale/empty top-level `stories: []` field — mirroring how this repo's own real epic-nested features are actually shaped.
- **Action:** Run the taxonomy-grouping function.
- **Expected result:** This feature appears exactly once, under its epic — not also listed as an ungrouped flat feature because of the leftover empty top-level field.
- **Edge case:** Yes — the same ambiguous-shape edge case pr-s2's AC4 targets for DoD-status counting, applied here to taxonomy grouping.

### a feature's discovery-artefact path renders as a scope summary or link, not just its name

- **Verifies:** AC2
- **Precondition:** Fixture feature with `discoveryArtefact: "artefacts/example-feature/discovery.md"`.
- **Action:** Run the per-feature taxonomy-entry rendering function.
- **Expected result:** The rendered entry includes either a one-line scope summary or a link referencing that path — not only the feature's slug/name with no further context.
- **Edge case:** No.

### a product with zero epics renders a flat list with no empty epics section

- **Verifies:** AC3
- **Precondition:** Fixture with 4 features, none using `epics[].stories[]`.
- **Action:** Run the taxonomy-grouping function.
- **Expected result:** Output is a flat list of all 4 features; no "Epics" heading/section renders with zero items underneath it.
- **Edge case:** Yes — the all-flat boundary case.

### the taxonomy view's own total feature count matches the cached rollup record's total

- **Verifies:** AC4
- **Precondition:** Fixture with 5 total features (4 epic-nested across 2 epics, 1 ungrouped) — a known total established directly from the cache record, not from any other story's rendering.
- **Action:** Sum the taxonomy view's own rendered feature count (grouped + ungrouped) and compare it against the cache record's own total feature count field.
- **Expected result:** Both counts equal 5 — confirmed using only this story's own data and pr-s2's cache record, with no dependency on pr-s4's rendered output.
- **Edge case:** No.

---

## Integration Tests

### GET /products/:id renders the taxonomy view with a count matching the cache record

- **Verifies:** AC4
- **Components involved:** `products.js` route handler, `_renderProductView`, the taxonomy-grouping function, pr-s2's cache table.
- **Precondition:** A cache row exists with the AC1/AC4 fixture data (5 total features).
- **Action:** Send `GET /products/:productId`.
- **Expected result:** The rendered taxonomy section's total feature count (summed across groups) equals 5, matching the cache record.

---

## NFR Tests

### Taxonomy rendering makes no additional API or DB calls

- **NFR addressed:** Performance
- **Measurement method:** Confirm no additional `global.fetch` or DB read calls beyond pr-s2's own baseline.
- **Pass threshold:** Zero additional external calls.
- **Tool:** Assertion on mock call counts.

### Epic groups and feature items use a correct heading hierarchy for screen readers

- **NFR addressed:** Accessibility
- **Measurement method:** Inspect rendered markup for heading levels (e.g. epic group as a heading one level above its nested features) and keyboard-focusability of each item.
- **Pass threshold:** Heading hierarchy is correctly nested; every feature/epic item is reachable via keyboard tab order.
- **Tool:** Assertion against rendered markup structure.

---

## Out of Scope for This Test Plan

- Full discovery-artefact content rendering — explicitly out of scope for this story (summary/link only).
- Editing/reorganising taxonomy from this view — explicitly out of scope, read-only display only.
- The cross-story consistency check against pr-s4's own rendered health view — per review finding 7-M1, this was moved to the epic level (`pr-e2-dimensions.md`'s "Epic-level integration check") and is explicitly not part of either individual story's test plan.
- Full browser E2E testing — no AC here is CSS-layout-dependent; ADR-018 recommends an E2E spec as a DoR-time architecture-guardrail addition, not required by this test plan's own AC coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cross-story total-count consistency (this story's view vs. pr-s4's view) is not covered by either story's own test plan | Per review finding 7-M1, an AC requiring two different stories to both be implemented isn't independently testable within either story | Tracked as an epic-level integration check in `pr-e2-dimensions.md`, to be confirmed once both pr-s4 and pr-s7 are implemented — not silently dropped, just correctly scoped above the story level |
