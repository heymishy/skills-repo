## Test Plan: Epic-nested story rows always show "Unknown" health instead of their real health

**Story reference:** artefacts/2026-08-10-story-health-badge-fix/stories/shb-s1-per-story-health-badge-fix.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Epic-nested story inherits parent feature's health | 2 tests | — | — | — | — | 🟢 |
| AC2 | Non-epic-nested items unaffected (regression guard) | 1 test | — | — | — | — | 🟢 |
| AC3 | Genuinely-unmatched fallback preserved | 1 test | — | — | — | — | 🟢 |
| AC4 | Rollup vs. row-level badges no longer contradict, for a real merged product page | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Hand-authored `pipeline-state.json`-shaped fixtures and hand-authored taxonomy/health-counts fixtures, matching `computeTaxonomyRollup`/`computeHealthCounts`'s real input/output shapes.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A feature with `epics[].stories[]` and `health: 'amber'` | Hand-authored | None | |
| AC2 | A feature with flat/no epics (ungrouped taxonomy path) | Hand-authored | None | |
| AC3 | A story whose parent feature has no `health` field at all | Hand-authored | None | |
| AC4 | A small merged product page render with both a Healthy-feature story and a Warning-feature story | Hand-authored | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### computeTaxonomyRollup_epicNestedStory_carriesFeatureSlug

- **Verifies:** AC1 (data-layer half)
- **Precondition:** `pipelineState.features` has one feature with `slug: 'feat-a'`, `epics: [{slug: 'e1', name: 'Epic 1', stories: [{slug: 's1'}]}]`.
- **Action:** `computeTaxonomyRollup(pipelineState)`.
- **Expected result:** The returned `groups[0].items[0]` has `featureSlug === 'feat-a'` (in addition to the existing `slug: 's1'`).
- **Edge case:** Yes — this is the exact field the fix adds.

### productsRoute_epicNestedStory_inheritsParentFeatureHealth

- **Verifies:** AC1 (render-layer half)
- **Precondition:** Taxonomy item `{slug: 's1', featureSlug: 'feat-a', epicSlug: 'e1', epicName: 'Epic 1'}`; `healthBySlug = {'feat-a': 'amber'}` (simulating `computeHealthCounts`'s real output for that feature).
- **Action:** Run the merge/enrich step that currently lives at `products.js:655-670` (extracted or exercised via the route handler).
- **Expected result:** The merged item for `s1` has `health: 'amber'`, not `'unknown'`.
- **Edge case:** Yes — this is the exact defect being fixed.

### productsRoute_nonEpicNestedItem_unaffected

- **Verifies:** AC2
- **Precondition:** `pipelineState.features` has one feature with `slug: 'feat-b'`, no `epics` array (or empty), `health: 'green'`. `healthBySlug = {'feat-b': 'green'}`.
- **Action:** Same as above.
- **Expected result:** The merged item for `feat-b` still has `health: 'green'` — identical to current (pre-fix) behaviour.
- **Edge case:** Yes — regression guard for the already-correct path.

### productsRoute_unresolvableParentHealth_fallsBackToUnknown

- **Verifies:** AC3
- **Precondition:** Taxonomy item `{slug: 's2', featureSlug: 'feat-c', ...}`; `healthBySlug` has no `'feat-c'` key at all (feature missing or has no `health` field).
- **Action:** Same as above.
- **Expected result:** The merged item for `s2` has `health: 'unknown'` — the honest fallback is preserved, not fabricated.
- **Edge case:** Yes — proves the fix doesn't overcorrect into inventing data.

### productsRoute_rollupAndRowBadges_noLongerContradict

- **Verifies:** AC4
- **Precondition:** A small product with two features: `feat-a` (`health: 'green'`, one epic-nested story `s1`) and `feat-b` (`health: 'amber'`, one epic-nested story `s2`). Real `computeHealthCounts` + `computeTaxonomyRollup` + the fixed merge step run end to end.
- **Action:** Render (or compute the data for) both the top rollup and the per-row list.
- **Expected result:** Rollup shows `green: 1, amber: 1, unknown: 0`; row for `s1` shows `✓ Healthy`; row for `s2` shows `⚠ Warning`. No row shows `? Unknown` for either.
- **Edge case:** Yes — the exact end-to-end symptom observed live (624/624 rows Unknown vs. a correct top rollup), now proven closed.

---

## Integration Tests

None required beyond the unit tests above — `productsRoute_rollupAndRowBadges_noLongerContradict` already exercises the real `computeHealthCounts`/`computeTaxonomyRollup`/merge functions together, which is the meaningful integration surface for this fix.

---

## NFR Tests

None beyond the ACs above — Correctness is the primary and only NFR in scope, fully covered by AC1–AC4.

---

## Out of Scope for This Test Plan

- Any change to `computeHealthCounts` itself — untouched, no new tests needed for it.
- Live confirmation against real staging Postgres/pipeline-state.json data — building and testing the fix is this story's scope; a live re-check of the `skills-framework` product page is a natural post-merge smoke step but not a blocking test.

---

## Test Gaps and Risks

None identified as blocking.
