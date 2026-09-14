# Definition of Ready Checklist

## Definition of Ready: Hide a module/phase group entirely once its current filter leaves it with zero visible items

**Story reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s5-hide-empty-groups.md
**Test plan reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s5-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator with Active only checked on a product's feature list" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track UX follow-up — directly closes a gap the operator reported immediately after live-verifying `pflx-s4` in production |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — explicitly scoped to hide the whole section (not just the body) to actually address the operator's complaint, and to use `hidden` (not just visual CSS) for accessibility |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Verified via real jsdom DOM-state assertions (`hidden` attribute presence), not visual/pixel rendering |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Accessibility all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter introduced — pure client-side DOM logic added to an existing inline script |
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
Story: Hide a module/phase group entirely once its current filter leaves it with zero visible items -- artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s5-hide-empty-groups.md
Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In pvcSyncGroupCounts() (products.js's inline <script>), after
  computing each group's visible count, also toggle the `hidden`
  attribute on its enclosing `.a4-module-section` (the section
  element, not just `.a4-module-body`): hidden when count === 0,
  removed (visible) when count > 0.
- After the per-group loop, for each tab panel (#pvc-tab-panel-module,
  #pvc-tab-panel-phase) check whether every `.a4-module-section` in it
  is hidden; if so, show a "No active features match" message inside
  that panel (create the element once, toggle its own hidden attribute
  -- do not re-render/duplicate it on every pvcApplyFilters() call).
- Do NOT touch the "All" tab (#pvc-tab-panel-all) -- it has no
  `.a4-module-section` elements.
- Do NOT change pvcSyncGroupCounts()'s own count computation.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a small, well-scoped UX follow-up the operator directly confirmed live in production)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
