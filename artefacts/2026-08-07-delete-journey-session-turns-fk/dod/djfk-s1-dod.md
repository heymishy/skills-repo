# Definition of Done: Delete a journey's session_turns rows before the journey row, alongside artefacts

**PR:** #681 (commit `ad417184`) | **Merged:** 2026-08-08 (post-merge bookkeeping commit `909b055b`, same day)
**Story:** artefacts/2026-08-07-delete-journey-session-turns-fk/stories/djfk-s1-delete-session-turns-before-journey.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- all 3 deletes succeed in order (session_turns, then artefacts, then journeys), returns `{ deleted: true }` | Yes | `deleteJourney_deletesSessionTurnsArtefactsAndJourney_inCorrectOrder` (asserts exactly 3 query() calls, session_turns index < journeys index, artefacts index < journeys index, correct params) and `deleteJourney_returnsDeletedTrue_whenJourneyRowRemoved` | Unit test against `journey-store-pg.js` with a mock pool recording call order | None |
| AC2 -- zero `session_turns` rows is a no-op, not an error | Yes | `deleteJourney_succeedsWithZeroSessionTurns_asANoOp` (mock pool returns `sessionTurns: 0`, asserts `{ deleted: true }`) | Unit test | None |
| AC3 -- nonexistent journeyId still returns `{ deleted: false }`, unchanged behaviour | Yes | `deleteJourney_returnsDeletedFalse_forNonexistentJourney` (mock pool returns zero rowCount on all three tables) | Unit test | None |

All 4 tests in `tests/check-djfk-s1-delete-journey-session-turns.js` were independently re-run this session (2026-08-20) since the figures supplied for this pass read "null passed, null failed" -- a suspicious non-numeric readout, not a real result. Direct re-run produced **4 passed, 0 failed**, matching all three ACs. Source inspection of `src/web-ui/adapters/journey-store-pg.js:148-158` confirms the shipped `deleteJourney` deletes `session_turns`, then `artefacts`, then `journeys`, exactly matching the AC1 ordering requirement and the story's stated architecture constraint.

## Scope Deviations

None. The story's three Out of Scope items (`session_turns_archive`, broader FK-table review, the unrelated `git: not found` warning) are all explicitly deferred in the story text itself, not defects -- accepted as-is.

## Test Plan Coverage

`check-djfk-s1-delete-journey-session-turns.js`: **4 passed, 0 failed** (re-run 2026-08-20, replacing an earlier "null passed, null failed" readout supplied for this pass that could not be trusted as a real result). All 4 tests map directly to the 3 ACs (AC1 has two tests: ordering + return value).

## NFR Status

| NFR | Status |
|-----|--------|
| Performance | Met -- one additional `DELETE` statement per journey deletion, as scoped; deletion is not a hot path, no test asserts a performance budget and none was required. |
| Security | Met -- parameterized query (`$1`), matching existing convention; no new user input handling. |
| Accessibility | Not applicable (story states this explicitly). |
| Audit | Not applicable (story states this explicitly). |

## Metric Signal

No formal benefit-metric artefact exists for this story -- it is explicitly short-track (bug fix), and the story itself states benefit-metric is skipped. The benefit is stated directly in the story as a correctness fix: eliminating an unhandled 500 error (`session_turns_journey_id_fkey` foreign key violation) that occurred whenever an operator deleted a journey with recorded conversation turns. No live/staging re-confirmation of the fix was performed as part of this retroactive pass; the evidence is the unit-level SQL-ordering tests plus direct source inspection of the shipped code.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Shipped code exactly matches the story's required fix (session_turns deleted before artefacts before journeys), and all four unit tests pass on independent re-run, closing the gap that `alrf-s10`'s original tests never caught (that story's tests mocked `deleteJourney` entirely rather than exercising the real SQL). No production incident data was available to confirm the original 500 error stopped recurring after merge, but the fix is a direct, narrowly-scoped SQL-ordering correction with clean review (0 findings) and full test coverage of all three ACs.
