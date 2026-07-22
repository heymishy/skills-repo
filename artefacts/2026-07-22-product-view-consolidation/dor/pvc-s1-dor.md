## Definition of Ready: Consolidate product view features section with tabs and filters

**Story reference:** `artefacts/2026-07-22-product-view-consolidation/stories/pvc-s1-consolidate-and-tab-features-view.md`
**Test plan reference:** `artefacts/2026-07-22-product-view-consolidation/test-plans/pvc-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

**CONTRACT REVIEW:** Contract Proposal (see `pvc-s1-dor-contract.md`) reviewed against all 9 ACs and the test plan. No mismatches found. ✅ Contract review passed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "an operator viewing a product with a connected repo and curated modules" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 9 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC9 covered (U1-U5, IT1-IT5) |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | "Usability/legibility of the product view" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, Run 1, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps (1 explicitly-noted manual-only item, not a gap) |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies (a1/a4/tmc-s1) all merged; no `schemaDepends` needed — reads existing JS return shapes, not schema fields |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints incl. explicit reuse of settings.js's tab pattern |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — filter/tab markup presence is what's tested, not pixel layout |
| H-NFR | NFR profile / story NFR field | ✅ | Story's own NFR section populated (performance, accessibility, security, scale) — feature-level NFR profile not created separately since this is a small, bounded render-layer story; story-level NFRs suffice per H-NFR's "or story has explicit NFRs" allowance |
| H-NFR-profile | NFR profile presence check | ✅ N/A | Story NFRs are concrete and specific (not "None"), but scoped small enough that a dedicated feature nfr-profile.md would duplicate the story's own NFR section; proceeding with story-level NFRs, consistent with H-NFR's stated alternative |
| H-ADAPTER | N/A | ✅ N/A | No new adapter — this story is render-layer only |

**All hard blocks pass.**

**H-MIG / H-INF applicability check:** Neither `hasMigrationTrack` nor `hasInfraTrack` apply — no schema change, no infrastructure change. Both skipped per their own documented trigger conditions.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | — | None raised |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script not yet reviewed by a human before coding begins | Operator to review `pvc-s1-verification.md` before/alongside coding |
| W5 | No uncertain gap-table items | ✅ | — | The one noted gap (manual live-interaction check) is explicitly resolved as a manual step, not left uncertain |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Consolidate product view features section with tabs and filters — artefacts/2026-07-22-product-view-consolidation/stories/pvc-s1-consolidate-and-tab-features-view.md
Test plan: artefacts/2026-07-22-product-view-consolidation/test-plans/pvc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New functions in product-rollup.js: mergeFeatureSources(taxonomy,
  journeyFeatures) and groupItemsByPhase(items). Generalize
  groupTaxonomyByModule's internals into groupItemsByModule(items,
  assignmentMap, modules) -- KEEP groupTaxonomyByModule exported and working
  (it can become a thin wrapper: flatten taxonomy to items, call
  groupItemsByModule) so tmc-s1's existing tests are not broken.
- Merge key is feature_slug. On overlap, taxonomy metadata (name, epicName,
  discoveryArtefact) wins; journey stage/journey_id still carried onto the
  merged item.
- Reuse settings.js's exact tab pattern (sw-settings-tab* classes,
  swShowSettingsTab JS shape) but namespaced as pvc-tab*/pvcShowTab to avoid
  any collision -- do not invent a different tab mechanism.
- Reuse a4's existing _renderModuleSection/_renderEpicRow/a4ToggleModule
  markup for the By Module tab's collapsible sections -- do not rewrite that
  rendering from scratch.
- Health filter chips and search input are plain <button>/<input> elements
  with a small vanilla JS filter function operating on data-health/
  data-search attributes on each item row -- no new library, no framework.
- Zero-modules case (AC9): must render IDENTICALLY to today's existing
  flat/simple fallback -- no tabs, no filter chips introduced when there are
  no modules at all.
- All names/slugs through _escapeHtml, matching this repo's convention.
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only (solo-operator context)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed via explicit "consolidate + build tabs/filtering" instruction this turn
