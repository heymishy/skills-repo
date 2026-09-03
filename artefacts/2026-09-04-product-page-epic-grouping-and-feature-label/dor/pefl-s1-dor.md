# Definition of Ready Checklist

## Definition of Ready: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic

**Story reference:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
**Test plan reference:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/test-plans/pefl-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (2 primary + 3 regression guards) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric `dashboard-triage`/`ppg-s1` targeted; live-verified via a pasted production example (`cdg.3`–`cdg.7` all repeating the same epic-name text) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on `fal-s1`, `ppg-s1`, `shb-s1` — all merged, DoD-complete. No incomplete-upstream risk. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, 4 precisely-scoped fixes each naming the exact function/parameter changed. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — presence/shape assertions on server-rendered HTML strings and direct function-return assertions, matching this route's own established convention |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1/psbf-s1/ppg-s1/fal-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session feedback and confirmed scoping (two rounds of clarifying questions, both proposed fixes explicitly confirmed as "Recommended"). Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — pure rendering/template change |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in the third-parameter threading or the defaultTab priority logic | **Acknowledged — proceed.** Root cause was diagnosed via direct code reading and a real, pasted live-production example (not guessed); the fix pattern (an optional context-flag parameter, a thin wrapper function) directly mirrors `ppg-s1`'s own already-shipped, already-tested `_renderPvcItemRowWithCheckbox` convention. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's own Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic — artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
Test plan: artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/test-plans/pefl-s1-test-plan.md
DoR contract: artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/dor/pefl-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Two fixes:

(1) product-rollup.js's computeTaxonomyRollup: add `featureName: feature.name`
to the epic-nested item mapping, alongside the existing `slug`/`featureSlug`.
No change to groupItemsByPhase/groupItemsByModule -- they push item objects
through unchanged, so the new field survives bucketing automatically.

(2) products.js: add a third, optional parameter `preferFeatureName` to
_renderPvcItemRow. When truthy, subLabel = item.stage || item.featureName || '';
when falsy/omitted (every existing call site), byte-for-byte identical to
today. Add a thin wrapper `_renderPvcItemRowForPhase` (matching the existing
_renderPvcItemRowWithCheckbox convention) that calls
_renderPvcItemRow(item, false, true), and use it in place of the bare
_renderPvcItemRow reference in the By Phase tab's own two .map(...) calls
only -- By Module and All tabs keep the unchanged 1/2-argument calls.
Also change defaultTab from `modules.length === 0 ? 'phase' : 'module'` to
`byPhase.byPhase.length > 1 ? 'phase' : (modules.length === 0 ? 'phase' : 'module')`
-- reuse the already-computed `byPhase` value, do not call groupItemsByPhase
a second time.

Constraints:
- Do NOT change the epic group header's own text (_renderModuleSection,
  called with p.epicName as the label) -- only child rows underneath change.
- Do NOT change _renderPvcItemRowWithCheckbox's own call shape or behaviour.
- Every existing call to _renderPvcItemRow(item) or _renderPvcItemRow(item, includeCheckbox)
  (By Module tab, All tab, and every pre-existing test) must render byte-for-byte
  identical output to before this story -- the new third parameter must default
  to falsy/off.
- No new npm dependencies. No schema or query change.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches shared rendering code built by several previously-independent stories (`pdt-s1`, `pvc-s1`, `ppg-s1`, `fal-s1`, `shb-s1`, `bmau-s1`), warranting tech-lead-equivalent awareness even though every underlying data function is reused unchanged and the new parameter defaults to fully backward-compatible behaviour.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-04, via two rounds of scoping confirmation before this DoR was written.
