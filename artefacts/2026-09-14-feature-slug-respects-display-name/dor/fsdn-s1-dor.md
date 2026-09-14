# Definition of Ready Checklist

## Definition of Ready: Feature-creation via a product's "New feature" panel should build a human-readable featureSlug from the operator's given name

**Story reference:** artefacts/2026-09-14-feature-slug-respects-display-name/stories/fsdn-s1-slugify-display-name-on-product-feature-create.md
**Test plan reference:** artefacts/2026-09-14-feature-slug-respects-display-name/test-plans/fsdn-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator creating a new feature via a product's 'New feature' panel" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6/6, AC2 gets 2 dedicated tests |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix — directly closes a real gap the operator found first-hand this session |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — reuse of the existing `_slugify` helper and preservation of `fdn-s1`'s fallback were both identified by reading the real code before writing the story |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No rendered UI change — server-side slug construction only |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Availability all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — a plain function export (`_slugify`) reused via `require`, not a global mutable `let _x = defaultFn; function setX(fn)` seam |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Behavioural tests using the real `_slugify` implementation — no mocking of the logic under test | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Feature-creation via a product's "New feature" panel should build a human-readable featureSlug from the operator's given name -- artefacts/2026-09-14-feature-slug-respects-display-name/stories/fsdn-s1-slugify-display-name-on-product-feature-create.md
Test plan: artefacts/2026-09-14-feature-slug-respects-display-name/test-plans/fsdn-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Export `_slugify` from journey.js's module.exports (mirrors the
  `_readPipelineFeatures` export precedent added the same week).
- In products.js's handlePostProductFeature (~line 3363), when
  `displayName` is non-null and `_slugify(displayName)` is non-empty,
  build `featureSlug = today + '-' + _slugify(displayName)` (today =
  `new Date().toISOString().slice(0, 10)`, same pattern as
  handlePostJourney). Otherwise (displayName null, OR slugify produces
  an empty string), keep the existing `'new-feature-' +
  journeyId.slice(0, 8)` fallback exactly as today.
- Do NOT touch fdn-s1's displayName parsing/trimming logic, or the
  "New feature" panel's HTML/UI.
- Do NOT add slug-collision de-duplication -- out of scope.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — a small, well-scoped consistency fix between two already-existing code paths; operator explicitly requested a short-track fix)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-14

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
