# Definition of Ready Checklist

## Definition of Ready: Default the product features list to active (non-definition-of-done) features only

**Story reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s2-default-active-only-feature-list.md
**Test plan reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator viewing a product's feature list" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6 |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track UX fix — directly requested by the operator this session after `pflx-s1`'s investigation surfaced the list's real scale (564 items) |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — the "AND-ed, not overridden by search" interaction rule with `pflx-s1` was deliberately specified to avoid ambiguous cross-story behaviour |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Verified via real jsdom DOM-state assertions, not visual/pixel rendering |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Accessibility all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter introduced — a new data attribute plus one new filter condition in existing client-side logic |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Real script extracted from a real render, evaluated in real jsdom against real DOM state | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Default the product features list to active (non-definition-of-done) features only -- artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s2-default-active-only-feature-list.md
Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In _renderPvcItemRow (products.js), add
  `data-active="' + (item.stage !== 'definition-of-done') + '"'` to
  each rendered `.pvc-item` (both the checkbox and non-checkbox
  branches).
- In _renderConsolidatedFeaturesSection, add a checkbox (checked by
  default) labelled "Active only" next to the existing search input /
  health chips, wired to a new `pvcToggleActiveOnly(el)` function that
  sets a module-level `pvcHideDod` boolean from `el.checked` and calls
  `pvcApplyFilters()`. Initialize `pvcHideDod = true`.
- In pvcApplyFilters(), add: `var stageOk = !pvcHideDod ||
  el.getAttribute('data-active') === 'true';` and require it alongside
  the existing `healthOk && searchOk` conditions.
- Call `pvcApplyFilters()` once, unconditionally, at the end of the
  inline `<script>` block so the active-only default actually applies
  on page load, not only after a user interaction.
- Do NOT change healthCounts computation or the existing health-chip
  labels/counts.
- Do NOT let this default trigger pflx-s1's auto-expand logic (that
  story's own constraint is search-only) -- calling pvcApplyFilters()
  on load with pvcCurrentSearch still '' must not expand anything.
- Open a draft PR when tests pass (implemented together with pflx-s1 in
  the same PR) -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a small, additive UX default explicitly requested by the operator)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
