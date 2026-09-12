# Implementation Plan: ral-s1

**Story:** artefacts/2026-09-12-res-s2-audit-log-fields/stories/ral-s1-audit-log-journey-id-and-timestamp.md
**Test plan:** artefacts/2026-09-12-res-s2-audit-log-fields/test-plans/ral-s1-test-plan.md

## Tasks

1. Add `journeyId: session.journeyId || null` and `timestamp: new Date().toISOString()` to the `artefact_auto_amended`/`artefact_auto_saved` log event in `src/web-ui/routes/skills.js` (~line 5413).
2. Add the same two fields to the `materiality_check_hook_failed` log event (~line 5586).
3. Create `tests/check-ral-s1-audit-log-journey-id-and-timestamp.js`, reusing the `_setHtmlSession`/`handlePostTurnStreamHtml`/console-capture harness pattern from `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js`.
4. T1 (AC1): amendment (overwrite) on a session with a journeyId — assert `artefact_auto_amended` carries the matching `journeyId` and a valid ISO-8601 `timestamp`.
5. T2 (AC2): first-time save on a session with a journeyId — assert `artefact_auto_saved` carries the same fields.
6. T3 (AC3): auto-save on a session with no journeyId — assert `journeyId: null`, no throw.
7. T4 (AC4): materiality-check hook throws — assert `materiality_check_hook_failed` carries `journeyId` and `timestamp`.
8. Re-run `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js` unmodified — confirm all 19 tests still pass.
9. Run the full `npm test` suite in background — confirm no new failures beyond the known pre-existing baseline.
10. Clean test-pollution junk, commit, push, open draft PR, gate-advance to `branch-complete`.

## Notes

No new events introduced; no change to `console.info`/`console.warn` method choice; `artefact_path_traversal_rejected` and `artefact_disk_save_failed` untouched, per Architecture Constraints.
