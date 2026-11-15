# AC Verification Script: Keep a placeholder filename on every scrubbed stack frame

**Story:** artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md
**Test plan:** artefacts/2026-11-15-coha-scrubber-filename-fix/test-plans/sff-s1-test-plan.md

## Setup

1. Open a terminal in the project folder.
2. Scenarios 1 to 4 need nothing else: run `node tests/check-coha-s5-error-capture.js`. It prints one line per check and a total; the failure count must be 0.
3. Scenarios 5 and 6 need the change merged and deployed to staging (CI deploys staging on merge), and access to PostHog project 10908 (or ask the agent to run the queries).

## Scenarios

### Scenario 1: A frame with no file name still gets one

**Covers:** AC1
**Steps:** run the test file and find the line about a frame with no filename.
**Expected outcome:** passes. A Node internal frame (for example `process.processTicksAndRejections`) comes out with the file name `[redacted]`, and its function name and line number are kept.
**Broken behaviour looks like:** the frame has no file name at all (this is today's behaviour).
**Result:** [ ] Pass  [ ] Fail

### Scenario 2: Repository files keep their path, everything else is hidden

**Covers:** AC1
**Steps:** find the lines about repository paths and outside paths.
**Expected outcome:** `src/web-ui/server.js` stays `src/web-ui/server.js`; a tenant folder path, a `node:` path, a number or an empty value all become exactly `[redacted]`.
**Result:** [ ] Pass  [ ] Fail

### Scenario 3: No private text leaks through the placeholder

**Covers:** AC2
**Steps:** find the leak-check lines.
**Expected outcome:** all pass. The made-up secret words planted in file names, modules and code lines never appear in the output.
**Broken behaviour looks like:** any line saying a planted word was found.
**Result:** [ ] Pass  [ ] Fail

### Scenario 4: The check really can fail, and the real request path is covered

**Covers:** AC3, AC4
**Steps:** find the lines about the real captured shapes and the real app run.
**Expected outcome:** the check passes on the new output, fails on old-style output (that line is a deliberate failing check shown as passing), and a request that throws through the real app returns 500 and sends one event whose every frame has a file name.
**Result:** [ ] Pass  [ ] Fail

### Scenario 5: PostHog accepts the new staging events (after merge and staging deploy)

**Covers:** AC5
**Steps:**
1. Cause new staging errors (the staging end-to-end test run does this), or wait for the next one.
2. Within 30 minutes, ask the agent to query PostHog for `$exception` events from staging after the deploy time, showing how many have an issue id and how many carry a cymbal error message. Then open PostHog, Error tracking.
**Expected outcome:** the new events have an issue id and no cymbal error message, and the Error tracking list shows at least one issue (today it is empty and every event says `missing field filename`).
**Broken behaviour looks like:** no issue appears, or an error message is still shown.
**Result:** [ ] Pass  [ ] Fail
**Notes (query used, counts):**

### Scenario 6: A different rejection is not hidden

**Covers:** AC6
**Steps:** if scenario 5 fails because the message names a different problem, copy the exact message.
**Expected outcome:** the story is recorded INCOMPLETE in its definition of done with that exact message, and a new short-track story is created. The story is not marked complete on the strength of the `filename` fix alone.
**Result:** [ ] Not needed (scenario 5 passed)  [ ] Triggered, follow-up created
