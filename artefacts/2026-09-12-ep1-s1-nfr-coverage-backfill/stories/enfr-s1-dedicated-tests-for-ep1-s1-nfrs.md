## Story: Dedicated tests for ep1-s1's two code-review-only NFRs

**Epic reference:** None — short-track test-coverage backfill (closes `ep1-s1`'s own follow-up actions, found during 2026-09-12 pipeline-state audit)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track

## User Story

As **a developer maintaining `_mergeStateFeaturesIntoJourneyList` in `src/web-ui/routes/journey.js`**,
I want its "stalled features included" and "feature list fetch ≤2 seconds" NFRs to have dedicated automated tests, not just code-review evidence,
So that a future change to `TERMINAL_STAGES` or the merge function's own performance characteristics is caught by CI immediately.

## Benefit Linkage

**Metric moved:** Closes `ep1-s1`'s own DoD-recorded NFR evidence gaps: "Stalled features included" (⚠️, code-review only) and "Feature list fetch ≤2 seconds" (⚠️, code-review only, "not independently benchmarked").
**How:** `ep1-s1`'s own DoD named both gaps explicitly and recommended exactly this fix: "Consider a dedicated timing test..." and "Consider a dedicated stalled-feature-inclusion test..." — both Follow-up Actions, both low-priority-but-real. This story does them.

## Architecture Constraints

- Reuse the exact same test harness already established in `tests/check-ep1-s1-journey-feature-merge.js` (`_scratchRoot`, `writeState()` helper, `journeyRoutes._mergeStateFeaturesIntoJourneyList` direct call) — do not invent a new pattern.
- For the timing test, use this repo's own real `.github/pipeline-state.json` (272 features, ~1.5MB at time of writing) copied into the test's scratch root as the fixture — the most honest, real-world test of "does the real page's real feature list fetch stay fast as the file grows," rather than a synthetic fixture that might not reflect real scale.
- No change to `src/web-ui/routes/journey.js` itself — `ep1-s1`'s own DoD already judged the underlying behaviour correct by code review; this story only adds the missing automated proof.

## Dependencies

- **Upstream:** `ep1-s1` (merged, DoD-complete) — this story adds test coverage for code `ep1-s1` already shipped; no source change.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a pipeline-state.json feature with `stage: 'stalled'` and no journey-store record, When `_mergeStateFeaturesIntoJourneyList` runs, Then that feature IS included in the merged output (not filtered as a terminal stage).

**AC2:** Given this repo's own real, current-scale `.github/pipeline-state.json` (272 features) copied into a test's scratch root, When `_mergeStateFeaturesIntoJourneyList` runs against it, Then it completes well within the documented 2-second budget.

## Out of Scope

- Any change to `src/web-ui/routes/journey.js` — test-only story, the underlying behaviour is already correct.
- Any other NFR or AC of `ep1-s1` not named above — both were already fully covered by existing tests.

## NFRs

- **Performance:** N/A — test-only change.
- **Security:** N/A.
- **Accessibility:** N/A.
- **Audit:** N/A.

## Complexity Rating

**Rating:** 1 — two small, well-scoped tests reusing an already-established test harness.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
