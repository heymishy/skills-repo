# Definition of Ready Checklist

## Definition of Ready: Auto-expand collapsed module/phase groups when a search match is inside them

**Story reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s1-auto-expand-collapsed-groups-on-search-match.md
**Test plan reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator searching a product's feature list" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix — directly closes a gap found first-hand this session, confirmed via live production JS inspection |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — the "never re-collapse a group the operator opened manually" rule was identified specifically to avoid a worse regression than the bug being fixed |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Verified via real jsdom DOM-state assertions (class/attribute presence), not visual/pixel rendering |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Real script extracted from a real render, evaluated in real jsdom against real DOM state — not a source-string grep | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Auto-expand collapsed module/phase groups when a search match is inside them -- artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s1-auto-expand-collapsed-groups-on-search-match.md
Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In products.js's pvcApplyFilters(), after the existing per-row
  hidden/visible loop, add a pass over every `.a4-module-body` element:
  for each, check whether it contains at least one visible (non-hidden)
  `.pvc-item`. If yes AND pvcCurrentSearch !== '' AND it currently has
  the `a4-module-body--collapsed` class, remove that class, set
  `data-auto-expanded="true"` on it, and set its paired header's (found
  via `[aria-controls="<body id>"]`) aria-expanded to "true".
- When pvcCurrentSearch === '' (search cleared), find every
  `.a4-module-body[data-auto-expanded="true"]`, re-add
  `a4-module-body--collapsed`, remove the `data-auto-expanded`
  attribute, and set its paired header's aria-expanded back to "false".
- Do NOT trigger this expand/collapse logic from pvcFilterByHealth or
  from pflx-s2's active-only toggle -- only from a non-empty search.
- Do NOT touch a group with zero visible matches, and do NOT touch a
  group that is expanded but has no `data-auto-expanded` marker (it was
  opened manually -- leave it alone entirely, both while expanding
  others and while re-collapsing on search-clear).
- Open a draft PR when tests pass (implemented together with pflx-s2 in
  the same PR, per that story's own Dependencies note) -- do not mark
  ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a well-scoped client-side UX fix backed by direct live-app JS inspection; operator explicitly requested this fix)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
