# Implementation Plan: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**Story reference:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
**DoR contract:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/dor/fal-s1-dor-contract.md
**Worktree:** .worktrees/fal-s1 (branch `feature/fal-s1`)
**Baseline:** 602 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js` — confirmed present on master before this branch existed, same known local-environment gap noted in every prior story's DoD this session)

---

## Task 1: Fix both root causes together (AC1–AC5)

Sequenced as a single task, per the DoR contract's own Assumptions section: AC2's route-handler-level test depends on Fix 1 (bare-string handling) landing first, since the taxonomy fixture it exercises represents `computeTaxonomyRollup`'s own now-fixed output.

**Sub-steps, in TDD order:**
1. Write `tests/check-fal-s1-artefact-lookup-epic-nested-fix.js` (RED) — 5 tests covering AC1–AC4, using a spy-wrapped mock pattern (extends `check-pdt-s4-story-breadcrumb.js`'s established harness) that captures actual call arguments, not just rendered output.
2. Fix `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`) — bare-string story slug extraction.
3. Extract `_resolveBreadcrumbContext` into `_resolveFeatureContext` (`src/web-ui/routes/features.js`), returning `{ breadcrumb, resolvedSlug }`.
4. Wire `handleGetFeatureArtefacts` to call the shared resolver once and thread `resolvedSlug` into `_journeyStore.getJourneyByFeatureSlug` and `_listArtefacts`.
5. Confirm GREEN (new tests + `check-pdt-s4-story-breadcrumb.js` regression guard for AC5).

**Files touched:**
- `src/web-ui/modules/product-rollup.js`
- `src/web-ui/routes/features.js`
- `tests/check-fal-s1-artefact-lookup-epic-nested-fix.js` (new)

**Regression found and fixed within this task, before commit:** the first pass moved the taxonomy-scan resolver call outside the `acceptsHtml` conditional it was previously scoped to — breaking the JSON API path, which some existing callers (`tests/check-alrf-s4-postgres-artefact-fallback.js` AC5/AC6, `tests/check-wuce6-feature-navigation.js`) invoke without a `pool` argument at all. Caught only by a full-suite run (`npm test`), not by running the individually-identified related test files. Fixed by gating the resolver call behind `if (acceptsHtml)`, preserving the exact pre-existing JSON-path behaviour (raw slug, no taxonomy scan) — matching the DoR's own H9 note flagging this exact class of risk in advance.

**TDD verification performed:** before committing, the fix was temporarily stashed (`git stash push -u`, then reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed AC1 and both AC2 tests fail with the expected wrong-slug values (`lphf-s2` / `undefined` / `p3.1a`), while AC3/AC4's regression guards correctly pass either way. This proves the new tests are load-bearing, not vacuously true.

**Status:** Complete. Committed as `cfe86099` on `feature/fal-s1`.

---

## Verification

- New test file: 5/5 passing.
- `tests/check-pdt-s4-story-breadcrumb.js` (AC5 regression guard): 7/7 passing, unmodified.
- Full suite: 603 files run, 1 failed (the known pre-existing `check-p3.5-validate-trace.js`), 0 new failures — confirmed both `check-alrf-s4-postgres-artefact-fallback.js` and `check-wuce6-feature-navigation.js` (initially broken by the JSON-path regression) pass after the fix.
