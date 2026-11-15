# Contract Proposal - Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events

**What will be built:**
- A change to `scrubFrame` in `src/web-ui/modules/error-capture.js` (lines 52 to 66): after the existing `filename`/`abs_path` loop, if the frame has no string `filename` (it was absent, non-string, or not repository-relative), set `g.filename` to the fixed constant `'[redacted]'`. A non-object frame entry (currently scrubbed to `{}`) also gets `{ filename: '[redacted]' }`. `abs_path` handling, `function`, `platform`, `lineno`, `colno` and `in_app` rules are untouched. No part of the input is copied into the placeholder.
- Tests appended to the existing `tests/check-coha-s5-error-capture.js`: UT1 to UT6 and IT1 from `artefacts/2026-11-15-coha-scrubber-filename-fix/test-plans/sff-s1-test-plan.md`, plus the single deliberate edit of `scrubEvent_filename_keptOnlyWhenRepoRelative` (the two `undefined` assertions become `'[redacted]'`).
- A new fixture `tests/fixtures/sff-s1-posthog-frames.json` with a header comment stating the capture date (2026-11-15, PostHog project 10908) and that the capture was truncated, containing frames in the real shapes seen, including the Node internal frame with no `filename`.

**What will NOT be built:**
- No change to which events are captured, the allow-list keys, route labelling, the 200 ms bound, the flush handler, or any other scrubber rule.
- No `abs_path` placeholder, no new consumer-schema validation beyond "string `filename` on every frame" (only that is evidenced).
- No change to coha-s6, coha-s7, the PostHog destination, Fly configuration, or any deploy. No production deploy, no deletion of the 207 rejected events.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1, UT2, UT3: scrub frames (repo, no filename, outside-repo, `node:`, non-string, non-object) and assert string `filename` on every output frame | unit |
| AC2 | UT4 canary scan of the serialised output; UT5 the whole existing file; the one assertion edit | unit |
| AC3 | UT6: fixture shapes scrubbed then `everyFrameHasFilename` true; old-style output false (negative control) | unit |
| AC4 | IT1: real `createApp()` in a child process with the existing helpers; sink event passes `everyFrameHasFilename`; request still 500 | integration-real-code |
| AC5 | Verification script scenario 5: PostHog query on new staging events after the merge deploy | live |
| AC6 | Verification script scenario 6: INCOMPLETE and follow-up story if a different cymbal message appears | live |

**Assumptions:**
- The Node internal frame shape (no `filename`, `in_app: false`, `lineno` set) in the fixture matches what PostHog received; the truncated capture showed it. The live check (AC5) is the real proof.
- `tests/fixtures/` exists and `tests/helpers/error-capture-child.js` exists (confirmed). The fixture file is not git-ignored (confirmed with `git check-ignore`).
- PostHog requires only `filename` on frames; if it rejects for a second reason, AC6 applies. The CI staging deploy happens on merge; production is deployed by the operator.
- The `README`/`CHANGELOG` need no change.

`schemaDepends: []` - the story reads no `pipeline-state.json` field. H8-ext: no field declarations required.

**Estimated touch points:**
Files: `src/web-ui/modules/error-capture.js` (modified, a few lines), `tests/check-coha-s5-error-capture.js` (modified), `tests/fixtures/sff-s1-posthog-frames.json` (new)
Services: None (staging/PostHog only for the live check after merge)
APIs: None
