# Implementation Plan: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**Story reference:** artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
**DoR contract:** artefacts/2026-09-04-feature-artefact-page-story-grouping/dor/fapg-s1-dor-contract.md
**Worktree:** .worktrees/fapg-s1 (branch `feature/fapg-s1`)
**Baseline:** 607 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js` — confirmed present on master before this branch existed, same known local-environment gap noted in every prior story's DoD this session)

---

## Task 1: Story-structure reader and classification (AC1, AC3, AC4 data-layer halves)

**Sub-steps, in TDD order:**
1. Write `tests/check-fapg-s1-group-artefacts-by-story.js` (RED) — 7 tests covering AC1–AC5.
2. New module `src/web-ui/adapters/feature-story-structure.js`: `getFeatureStoryStructure(repoRoot, featureSlug)` reads `.github/pipeline-state.json` from local disk, returns `null` when absent; `groupArtefactsByStory(artefacts, storyStructure)` classifies files against the real slug list, sorted longest-first.
3. Confirm GREEN for the data-layer tests.

**Status:** Complete.

---

## Task 2: Rendering and route wiring (AC1, AC2, AC4, AC5, AC6 route-level halves)

**Sub-steps, in TDD order:**
1. Refactored `renderArtefactIndexHtml` to extract `_renderArtefactListByType` — the shared per-type-grouped rendering both the unchanged single-story path and the new multi-story path now call, with zero markup duplication.
2. New `renderGroupedArtefactIndexHtml(grouped, featureSlug, resumeLookup)` — feature-level artefacts once via the shared helper, then a native `<details>`/`<summary>` epic/story accordion.
3. Wired `handleGetFeatureArtefacts`: after fetching `artefacts` (unchanged), call `getFeatureStoryStructure`. If `null` or total story count ≤1, use the unchanged `renderArtefactIndexHtml`. Otherwise use the new grouped renderer.
4. Confirm GREEN (new tests + `check-pdt-s4-story-breadcrumb.js` + `check-fal-s1-artefact-lookup-epic-nested-fix.js` + `check-alrf-s4-postgres-artefact-fallback.js` regression guards).

**Files touched:**
- `src/web-ui/routes/features.js`
- `src/web-ui/adapters/feature-story-structure.js` (new)
- `tests/check-fapg-s1-group-artefacts-by-story.js` (new)

**TDD verification performed:** before committing, the fix (the entire new module plus the `features.js` changes) was temporarily stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed a genuine `MODULE_NOT_FOUND` failure (the new module doesn't exist without the fix), proving the tests exercise real, necessary code rather than passing vacuously.

**Status:** Complete. Committed as `dea8248a` on `feature/fapg-s1`.

---

## Verification

- New test file: 7/7 passing.
- `tests/check-pdt-s4-story-breadcrumb.js` (regression guard, AC6): 7/7 passing, unmodified.
- `tests/check-fal-s1-artefact-lookup-epic-nested-fix.js` (regression guard): 5/5 passing, unmodified.
- `tests/check-alrf-s4-postgres-artefact-fallback.js` (regression guard): 14/14 passing, unmodified.
- Full suite: 607 files run, 1 failed (the known pre-existing `check-p3.5-validate-trace.js`), 0 new failures.
