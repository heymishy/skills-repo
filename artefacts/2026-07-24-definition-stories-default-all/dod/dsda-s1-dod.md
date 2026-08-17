# Definition of Done: Default to all stories from /definition when starting the per-story review sequence, instead of asking the operator to type them

**PR:** #580 (commit `8eb6e911` — "dsda-s1: default to all stories from /definition on the review-sequence page (#580)") | **Merged:** 2026-07-24
**Story:** artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 (auto-populated story list on render, not empty textarea) | Yes | `check-dsda-s1-default-all-stories.js` -- "handleGetStories: textarea pre-filled with every extracted story ID, not empty" | Automated test (route-level, mocked journey store) | None |
| AC2 (unedited auto-populated list proceeds through review → test-plan → DoR exactly as manual entry did) | Yes | `check-dsda-s1-default-all-stories.js` -- "handlePostStories: submitting the auto-populated value unmodified sets storyList and redirects to review, same as a manually-typed list" | Automated test | None |
| AC3 (manual edit affordance remains reachable; edited value overrides the default) | Yes | `check-dsda-s1-default-all-stories.js` -- "handlePostStories: an operator-edited list overrides the auto-populated default"; also asserted within the AC1 test that the pre-filled `<textarea>` carries no `readonly`/`disabled` attribute | Automated test | None |
| AC4 (unparseable/unrecognised artefact falls back to manual-entry textarea, no error) | Yes | `check-dsda-s1-default-all-stories.js` -- 4 tests: "extractor: unrecognised format returns empty array, does not throw", "extractor: empty string and undefined both return [], no throw", "handleGetStories: unparseable artefact -> 200 with an empty (not pre-filled) textarea, no error page", "handleGetStories: no completed definition stage -> empty textarea, no error" | Automated test | None |
| AC5 (server-side extractor matches client-side `parseDefinitionArtefact` output across both documented formats) | Yes | `check-dsda-s1-default-all-stories.js` -- "extractStoryIdsFromDefinitionArtefact: H1 epic/story header format", "extractStoryIdsFromDefinitionArtefact: flat-story fallback format" | Automated test against both fixture formats named in the story | None -- test asserts exact ID sets/order, not just non-empty output |

All 5 ACs have direct automated-test evidence. Source presence of the new functions (`extractStoryIdsFromDefinitionArtefact`, `handleGetStories`, `handlePostStories`) was also spot-checked directly in `src/web-ui/routes/journey.js` (lines ~2386, 2414, 2463) and confirmed exported from the module.

## Scope Deviations

None found. The three items the story explicitly named as Out of Scope (refactoring `parseDefinitionArtefact` into a shared client+server module, changes to `PER_STORY_SEQ` progression logic, drag-and-drop/reordering UI) were not touched, consistent with the story text -- accepted, not a defect.

## Test Plan Coverage

`check-dsda-s1-default-all-stories.js`: 9 passed, 0 failed (freshly re-run 2026-08-17). All 9 tests map to the 5 ACs as itemised above (AC1 x1, AC2 x1, AC3 x1, AC4 x4, AC5 x2).

## NFR Status

| NFR | Status |
|-----|--------|
| Performance | Story specifies "negligible" (one extra file read + regex parse per render); no dedicated perf test, consistent with the story's own framing that this is not test-worthy overhead |
| Security | Story states no new file-path input from the request (reads via the journey's existing `completedStages`/`artefactPath` mechanism); no new security test needed per story text |
| Accessibility | Story requires the edit affordance and pre-filled textarea remain keyboard-operable / not mouse-only. The AC1 test confirms the textarea is not `readonly`/`disabled`, which supports (but does not fully verify) keyboard operability -- no dedicated a11y/keyboard-interaction test exists |
| Audit | Not applicable, per story |

## Metric Signal

No benefit-metric artefact exists for this story -- it is explicitly a short-track, operator-workflow fix per CLAUDE.md's short-track convention, with benefit stated directly in the story rather than tied to a Tier 1 product metric. No metric signal to report.

## Outcome

**COMPLETE**
**Follow-up actions:** None required. Optional (not a gap): a dedicated keyboard-interaction/a11y test for the edit affordance would strengthen the Accessibility NFR beyond the current readonly/disabled attribute check, but the story does not require one and none was promised.

## DoD Observations

Implementation is present and exported in `src/web-ui/routes/journey.js` (`extractStoryIdsFromDefinitionArtefact`, `handleGetStories`, `handlePostStories`), matching the story's architecture constraint to mirror rather than reimplement the client-side parser's formats. No incidents or regressions surfaced against this story's code path since merge (2026-07-24).
