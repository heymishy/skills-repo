# Definition of Ready Checklist

## Definition of Ready: Populate a real pipeline stage for taxonomy-sourced feature-list items, not just journey-sourced ones

**Story reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s4-populate-stage-for-taxonomy-items.md
**Test plan reference:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s4-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator using Active only on a product's feature list, especially a taxonomy-heavy product" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (4 + 1 regression guard) |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6 (T6 covers AC5's regression guard against the existing suite) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix — directly closes a gap found via the operator's own explicit live-verification request against real production |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency — reads an existing field (`feature.stage`), does not add or change the schema |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — AC4's "absence of data must never mean done" guard was identified specifically to avoid a worse regression (wrongly hiding real in-progress work) than the bug being fixed |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Verified via real jsdom DOM-state assertions and direct function-return assertions, not visual rendering |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Correctness all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter introduced — extends an existing plain data-transform function (`computeHealthCounts`) additively |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Direct function-return and jsdom DOM-state assertions against real production-shaped data | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Populate a real pipeline stage for taxonomy-sourced feature-list items, not just journey-sourced ones -- artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s4-populate-stage-for-taxonomy-items.md
Test plan: artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In product-rollup.js's computeHealthCounts(), add `stage:
  feature.stage` to each perFeature entry pushed (alongside the
  existing slug/name/health), unmodified from the input feature
  object -- do not normalize or default it (undefined stays undefined,
  matching AC4's "absence of data never means done" guard).
- In products.js, build a `stageBySlug` map immediately alongside the
  existing `healthBySlug` construction (same healthCounts.perFeature
  source array, same iteration pattern): `stageBySlug[pf.slug] =
  pf.stage` for entries where pf.stage is truthy (skip undefined
  entries -- do not write `stageBySlug[slug] = undefined` over a
  potentially-real value from elsewhere).
- In the mergedItems .map() callback, resolve the stage lookup key the
  same way healthLookupKey already does (`item.featureSlug ||
  item.slug`), and set `stage: item.stage ||
  (stageBySlug.hasOwnProperty(lookupKey) ? stageBySlug[lookupKey] :
  undefined)` in the returned Object.assign -- item.stage (already
  correctly populated for journey-sourced items) always wins; the
  pipeline-state lookup only fills the gap when it's genuinely absent.
- Do NOT touch mergeFeatureSources()'s own precedence rules for name/
  epicName/discoveryArtefact.
- Do NOT backfill or default a feature's own missing .stage in
  pipeline-state.json.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a well-scoped, evidence-backed fix for a real production gap the operator found and asked to be investigated via direct browser verification)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
