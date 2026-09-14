# Definition of Ready Checklist

## Definition of Ready: Collapsed group counts reflect the currently-filtered item count, not the unfiltered total

**Story reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s3-live-group-counts.md
**Test plan reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator viewing a product's feature list with Active only checked or a search/health filter applied" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix — directly closes a gap the operator reported immediately after `pflx-s2` reached production |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — deliberately scoped to counts only, not the health-signal glyph or health-chip totals, to keep this fix minimal and match `pflx-s2`'s own established boundary |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Verified via real jsdom DOM-state assertions (textContent), not visual/pixel rendering |
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
Story: Collapsed group counts reflect the currently-filtered item count, not the unfiltered total -- artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s3-live-group-counts.md
Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In products.js's inline <script>, add a new pvcSyncGroupCounts()
  function: for each `.a4-module-section`, find its `.a4-module-body`
  and its `.a4-module-count` span; set the span's textContent to
  '(' + (count of `.pvc-item:not([hidden])` within that body) + ')'.
- Call pvcSyncGroupCounts() inside pvcApplyFilters(), alongside the
  existing pvcSyncGroupExpansion() call (pflx-s1) -- after the per-row
  hidden/visible pass, same as that function.
- Do NOT touch `.a4-module-signal` (the health-rollup glyph) or the
  existing health-chip counts.
- Do NOT auto-hide or remove a group that reaches a (0) count.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a small, mechanical correction to an under-scoped AC in already-shipped work; operator reported this immediately after using the live feature)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
