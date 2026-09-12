# Implementation Plan: enfr-s1

**Story:** artefacts/2026-09-12-ep1-s1-nfr-coverage-backfill/stories/enfr-s1-dedicated-tests-for-ep1-s1-nfrs.md
**Test plan:** artefacts/2026-09-12-ep1-s1-nfr-coverage-backfill/test-plans/enfr-s1-test-plan.md

## Tasks

1. Create `tests/check-enfr-s1-journey-merge-nfr-coverage.js`, reusing the `_scratchRoot`/`writeState()` harness pattern from `tests/check-ep1-s1-journey-feature-merge.js`.
2. T1 (AC1): write a `stalled`-stage feature via `writeState()`, call `journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot)`, assert it is included.
3. T2 (AC2): copy this repo's real `.github/pipeline-state.json` into the scratch root, time the merge call, assert it completes in under 2000ms.
4. Re-run `tests/check-ep1-s1-journey-feature-merge.js` unmodified — confirm all 8 tests still pass.
5. Run the full `npm test` suite in background — confirm no new failures beyond the known pre-existing baseline.
6. Clean test-pollution junk (`artefacts/test-slug/ideate.md` revert, `workspace/test-tmp-*` removal).
7. Commit, push, open draft PR, gate-advance to `branch-complete`.

## Notes

No change to `src/web-ui/routes/journey.js` — test-only story, per Architecture Constraints.
