# Definition of Ready Checklist

## Definition of Ready: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**Story reference:** artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
**Test plan reference:** artefacts/2026-09-04-feature-artefact-page-story-grouping/test-plans/fapg-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs (2 primary + 4 regression guards) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1/AC3/AC4 each covered by 2 tests (data-layer + route-level) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric this whole investigation thread has targeted; real, confirmed data from `2026-04-14-skills-platform-phase3` (21 stories) cited as evidence |
| H6 | Complexity is rated | ✅ | Rating 2, Stable — larger surface than prior stories in this sequence, but every piece reuses an already-established pattern; both open design questions confirmed with the operator before writing |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on `fal-s1`, `pefl-s1`, `aada-s1`, `prlf-s1`, `frsr-s1` — all merged, DoD-complete. No incomplete-upstream risk. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — precise data source, classification algorithm, rendering approach, and explicit boundaries with `fal-s1`'s own resolver all named. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — presence/shape assertions on server-rendered HTML strings; the accordion's own open/closed behaviour is native browser `<details>` semantics, not custom CSS/JS |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-04-feature-artefact-page-story-grouping/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as pcr-s1/pst-s1/pgft-s1/psbf-s1/ppg-s1/fal-s1/pefl-s1/aada-s1/prlf-s1 precedent** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("let's do this new design and the short track story"), sequenced as Story 3 of 3, with two rounds of `AskUserQuestion` resolving the query-approach and single-story-UX design questions before this DoR was written. Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced — `getFeatureStoryStructure` is a plain function reading a local file, not a swappable adapter point |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | This is the largest story in this session's own sequence — new file classification logic, new local-file read, new conditional rendering path | **Acknowledged — proceed.** Both real design-risk points (query performance trade-off, single-story UX) were surfaced explicitly and resolved with the operator via `AskUserQuestion` before writing this DoR, not decided unilaterally. Every individual building block (local-first reads, bare-string story handling, the existing resume-link mechanism, native `<details>` accordion) reuses an already-shipped, already-tested pattern from this exact session. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's own Coverage gaps table is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug — artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
Test plan: artefacts/2026-09-04-feature-artefact-page-story-grouping/test-plans/fapg-s1-test-plan.md
DoR contract: artefacts/2026-09-04-feature-artefact-page-story-grouping/dor/fapg-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Follow the DoR contract's
own 5-part implementation plan precisely:

1. getFeatureStoryStructure(repoRoot, featureSlug): reads
   path.join(repoRoot, '.github', 'pipeline-state.json') via
   fs.readFileSync + JSON.parse. Returns null if the file or feature is
   missing. Otherwise returns { epics: [{epicName, epicSlug, storySlugs}],
   flatStorySlugs }, extracting each story slug via
   `typeof story === 'string' ? story : (story.slug || story.id)`.

2. groupArtefactsByStory(artefacts, storyStructure): pure function.
   Collects all story slugs from both epics[].storySlugs and
   flatStorySlugs, sorts longest-first, classifies each artefact by
   matching its basename against `{storySlug}-` prefixes. Returns
   { featureLevel, epics: [{epicName, epicSlug, stories: [{slug,
   artefacts}]}], flatStories: [{slug, artefacts}] }.

3. renderGroupedArtefactIndexHtml(grouped, featureSlug, resumeLookup):
   renders grouped.featureLevel via the SAME per-type-grouped rendering
   renderArtefactIndexHtml already does today (extract a shared helper,
   do not duplicate the markup). Renders epics/flatStories as native
   <details class="epic">/<details class="story-row"> elements, each
   story's own artefacts rendered via the same shared per-artefact-list
   helper.

4. In handleGetFeatureArtefacts: after fetching artefacts (unchanged),
   call getFeatureStoryStructure(repoRoot, resolvedSlug). If null, or its
   total story count is <=1, render via the EXISTING, UNCHANGED
   renderArtefactIndexHtml (AC2/AC4). Otherwise call groupArtefactsByStory
   and render via renderGroupedArtefactIndexHtml (AC1).

Constraints:
- Do NOT modify _resolveFeatureContext (fal-s1's own Postgres
  taxonomy-scan resolver) or its NFR-Performance skip-when-fast-path-
  resolves behaviour.
- Do NOT build a GitHub-API fallback for reading pipeline-state.json --
  getFeatureStoryStructure returning null and falling back to today's
  flat rendering is the complete, correct answer for that case.
- Do NOT modify _resolveResumeLinksForFeature or its resumeLookup shape --
  reused as-is in both the feature-level and per-story rendering.
- Do NOT modify _renderStoryBreadcrumb or _resolveFeatureContext's own
  breadcrumb-producing logic.
- The single-story (<=1 real stories) case must produce byte-for-byte
  identical output to today's renderArtefactIndexHtml -- write a test
  asserting this if not already covered (it is, AC2).
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

**Oversight level:** Medium — largest story in this session's own sequence, touching the shared `renderArtefactIndexHtml`/`handleGetFeatureArtefacts` functions built by several prior stories (`wuce.20`, `frsr-s1`, `fdn-s1`, `alrf-s4`, `alrf-s10`, `dfr-s1`, `pdt-s4`, `fal-s1`), warranting tech-lead-equivalent awareness even though the design was collaboratively confirmed before implementation.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-04, via two rounds of design-question confirmation before this DoR was written.
