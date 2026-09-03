# Definition of Ready Checklist

## Definition of Ready: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**Story reference:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
**Test plan reference:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/test-plans/fal-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (3 + 2 regression guards) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC2 covered by 2 tests (data-layer + routing) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric `dashboard-triage` (`pdt-s1`–`pdt-s4`) and `ppg-s1` targeted; live-verified gap evidence cited (`lphf-s2`, `rb-s4`), plus a repo-wide data check confirming 35 real bare-string-shaped stories affected by the second root cause |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on `pdt-s4` (breadcrumb resolution) and `shb-s1` (taxonomy `featureSlug` field) — both merged, DoD-complete. `ppg-s1` (merged, DoD-complete) is what made this gap visible, not a functional dependency. No incomplete-upstream risk. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (two precisely-scoped fixes, each naming the exact function and line changed; a factual correction was caught and fixed during DoR prep — `_resolveResumeLinksForFeature` takes the journey object, not a slug, so only 2 call sites need the resolved slug threaded through, not 3). No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — this story touches a pure data-transform function and route-handler logic (which slug string is passed where), matching `pdt-s4`'s own established convention for testing this route |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1/psbf-s1/ppg-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to proceed ("Yes short track to solve. Ensure it covers all logic of various epics and stories in this repo"). Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — reuses existing `_journeyStore`/`_listArtefacts` module-level injection points unchanged |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in the taxonomy-scan reuse or the duplicate-slug-collision limitation | **Acknowledged — proceed.** Root causes were diagnosed via direct code reading (not guessed) and confirmed against real repo data (`node -e` distribution check: 35 real bare-string epic-nested stories, 2 real broken-artefact-lookup examples verified live in production). Bounded, well-scoped fix reusing existing, already-tested resolution logic. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's own Coverage gaps table names one residual finding (the pre-existing pdt-s4 test's own blind spot) and explains how this story's own tests close it — not an open gap | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts — artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
Test plan: artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/test-plans/fal-s1-test-plan.md
DoR contract: artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/dor/fal-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Two fixes, sequenced as
one task (Fix 2's own AC2 test depends on Fix 1 landing first):

(1) product-rollup.js's computeTaxonomyRollup: change the epic-nested
story slug extraction from `story.slug || story.id` to
`typeof story === 'string' ? story : (story.slug || story.id)` --
bare-string story references (schema-valid "Format A"/Phase 1-2-style
shape, 35 real cases in this repo, e.g. p3.1a) currently resolve to
`undefined`. No other change to this function. featureSlug assignment
is unchanged.

(2) features.js's handleGetFeatureArtefacts: currently passes the raw
URL story slug directly into _journeyStore.getJourneyByFeatureSlug and
_listArtefacts -- correct only for a genuine top-level feature, wrong
for any story nested inside another feature's epics[].stories[].
Extract _resolveBreadcrumbContext's existing tenant-scoped
taxonomy-scan logic (the loop over product_rollups.taxonomy.groups[].items[]
matching item.slug === featureSlug) into a shared resolver that also
returns the matched item's real featureSlug field (already present in
the taxonomy data once Fix 1 lands for the bare-string case; already
present today for the object-shaped case). Call this resolver once,
before the artefact fetch -- not twice (the breadcrumb rendering
further down the function must reuse the same result, not run its own
second query). Thread the resolved slug into getJourneyByFeatureSlug
and _listArtefacts. Do NOT separately touch _resolveResumeLinksForFeature
-- it takes the journeyForPage object (not a slug) and is corrected
automatically once getJourneyByFeatureSlug uses the resolved slug.
Update the feature_artefacts_accessed audit log call to log the
resolved slug, not the raw one.

Constraints:
- Do NOT modify _listArtefacts's own internal logic (local filesystem
  scan, GitHub API fallback, Postgres merge) -- reuse unchanged.
- Do NOT modify _renderStoryBreadcrumb's own display logic or the
  displayTitle fallback (still the raw story ID) -- unaffected by this
  story's scope.
- Fast path preserved exactly: when journeyForPage already resolves
  directly from the raw slug (the common, top-level-feature case), the
  taxonomy scan must NOT run at all -- write a test asserting the
  taxonomy query was called zero times in that case (AC3).
- When nothing resolves (neither the fast path nor the taxonomy scan),
  "No artefacts found for this feature" must still render exactly as
  it does today (AC4).
- Duplicate story-slug collisions across products/features resolve to
  the first match found -- do not attempt to disambiguate; this is a
  named, pre-existing limitation shared with pdt-s4's own breadcrumb
  resolution, out of scope to redesign here.
- No new npm dependencies. No schema or query change -- reuse the
  exact existing tenant-scoped query.
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

**Oversight level:** Medium — this story touches a shared route handler (`handleGetFeatureArtefacts`) and a shared data-transform function (`computeTaxonomyRollup`) both built by prior independent stories (`pdt-s4`, `shb-s1`, `alrf-s4`, `frsr-s1`, `dsh-s4`, `alrf-s10`, `dfr-s1` — all named in the surrounding code's own comments), warranting tech-lead-equivalent awareness even though the fix reuses existing, already-tested resolution logic without altering any of those prior stories' own behaviour.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-04
