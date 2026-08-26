# Implementation Plan: jspf-s1 — Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites

**Story:** artefacts/2026-08-26-journey-stage-view-postgres-fallback/stories/jspf-s1-postgres-fallback-for-stage-view.md
**Test plan:** artefacts/2026-08-26-journey-stage-view-postgres-fallback/test-plans/jspf-s1-test-plan.md
**DoR:** artefacts/2026-08-26-journey-stage-view-postgres-fallback/dor/jspf-s1-dor.md
**Worktree:** .worktrees/jspf-s1 (branch `jspf-s1`, based on origin/master @ 0c6c9acb)

---

## Tasks

### Task 1 — Shared helper: `resolveArtefactFromDiskOrPg`
- Add to `src/web-ui/routes/journey.js`.
- Signature: `async function resolveArtefactFromDiskOrPg(repoRoot, artefactRelPath, journeyId, stageName)`.
- Logic: disk read (`fs.readFileSync`, same try/catch-to-empty pattern as today) → if empty and `process.env.DATABASE_URL`, `require('../adapters/journey-store-pg').getArtefactsForJourney(journeyId)` filtered to `skill_name === stageName`, wrapped in try/catch → return content or `''`.
- TDD: write direct unit tests for the helper itself first (disk-wins, pg-fallback, pg-throws-degrades-to-empty, both-empty) before touching any call site.
- ACs covered: none directly (infrastructure for AC1-AC8).

### Task 2 — Wire site 1: `handleGetJourneyStageView`
- Call the new helper before the existing git-fallback (~line 806). Only fall through to the existing `das-s1` git-fetch logic if the helper returns empty.
- Do not touch `_dasFetchFailed`/`anvf-s1` message-selection logic beyond the insertion point.
- ACs covered: AC1, AC5 (site 1), AC6, AC7 (site 1), AC8 (site 1).

### Task 3 — Wire site 2: `handleGetStories`
- Replace the direct `fs.readFileSync` (~line 2451) with the new helper.
- ACs covered: AC2, AC5 (site 2), AC7 (site 2), AC8 (site 2).

### Task 4 — Wire site 3: `handlePostStories`
- Replace the direct `fs.readFileSync` inside the `priorArtefacts` construction (~line 2517-2522) with the new helper. Convert the surrounding `.map()` to an async-aware form (`for` loop or `Promise.all`) as needed.
- ACs covered: AC3, AC5 (site 3), AC7 (site 3), AC8 (site 3).

### Task 5 — Wire site 4: `handlePostSideTripClarify`
- Replace the direct `fs.readFileSync` (~line 3292-3293) with the new helper.
- ACs covered: AC4, AC5 (site 4), AC7 (site 4), AC8 (site 4).

### Task 6 — Full test suite + existing-coverage regression sweep
- Write `tests/check-jspf-s1-journey-postgres-fallback.js` covering all remaining AC sub-tests not already written inline with Tasks 1-5.
- Identify and re-run every existing test file already covering `handleGetJourneyStageView`/`handleGetStories`/`handlePostStories`/`handlePostSideTripClarify` individually.
- Run the full suite (`node scripts/run-all-tests.js`).

---

## Sequencing

Task 1 must complete before Tasks 2-5 (they all depend on the helper existing). Tasks 2-5 touch disjoint code regions in the same file and can be done in any order, but sequentially in one dispatch stream to keep review manageable given all land in `journey.js`. Task 6 last.
