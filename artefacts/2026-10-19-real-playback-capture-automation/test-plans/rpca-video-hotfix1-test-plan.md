## Test Plan: rpca-video-hotfix1 — captureVideoForClip must not delete a successfully-recorded video on a downstream caption-generation failure

**Story reference:** Short-track fix (CLAUDE.md "Short-track" process) — found running the real `captureVideoForClip` mechanism (built by `rpca-s3`) end-to-end for the first time, against real `wuce-staging`, for the `journey-cx-redesign` video demo. The real recording succeeded (a real journey was created, emotions set, the emotion curve rendered and was held on screen for the recording), but the overall call still failed with "Adapter not wired: generateCaptionsAndTranscript" — and the video file that had just been successfully recorded was gone from disk afterward.

**Date:** 2026-10-20
**Test runner:** `node scripts/run-all-tests.js`

---

## Root cause and fix

`captureVideoForClip`'s single `try` block wraps both the recording phase (`clip.run`, `context.close()`, reading the video's own path) and the caption-generation phase (`generateCaptionsForVideo`) together. Its `catch` block treats any error from either phase identically: close the context (again), read the video's path, and delete it if it exists — correct for a failure *during* recording (the file really is partial/corrupt), but wrong for a failure *after* recording that happens in a wholly separate downstream step. The caption-generation adapter (`generateCaptionsAndTranscript`) correctly throws when unwired (D37's stub-must-throw rule) — and this correct, expected throw was enough to make `captureVideoForClip` destroy a complete, valid recording.

The fix: split the function into two sequential phases with separate error handling. The recording phase (`clip.run` through reading the video's own path) keeps its existing try/catch-and-delete behaviour, unchanged — AC3 of `rpca-s3`'s own original test plan ("a failed run leaves no partial/corrupt file behind") is preserved exactly. Once the video path is confirmed written, caption generation runs in its own scope, outside that cleanup logic — if it throws, the video file is left on disk, and the thrown error carries the video's own path as `err.videoPath` so a caller can still report/recover the successful recording even though captions failed.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A failure during recording itself (`clip.run` throws) still deletes the partial file — unchanged regression of `rpca-s3`'s own existing AC3 | 1 test (pre-existing, re-run) | — | — | — | — | 🟢 |
| AC2 | A successful recording followed by a caption-generation failure does NOT delete the video file | 1 test | — | — | — | — | 🟢 |
| AC3 | The error thrown when caption generation fails after a successful recording carries the video's own path as `err.videoPath` | 1 test | — | — | — | — | 🟢 |
| AC4 | A successful recording AND successful caption generation still returns the same shape as before (no regression to the happy path) | 1 test (pre-existing, re-run) | — | — | — | — | 🟢 |

## Test Data Strategy

**Source:** Synthetic fixtures with mocked `browser`/`context`/`page` objects, matching `rpca-s3`'s own existing test file's mocking pattern exactly (`tests/check-rpca-s3-video-capture-wired-for-real.js`) | **PCI/sensitivity:** No | **Availability:** Now | **Owner:** Self-contained

## Unit Tests

### AC1: a failure during recording itself still deletes the partial file (regression)

- **Verifies:** AC1
- **Action:** Re-run `tests/check-rpca-s3-video-capture-wired-for-real.js` AC3 unchanged
- **Expected result:** Same pass result as before — `clip.run` throwing still deletes the partial file and re-throws the original error

### AC2: a successful recording followed by a caption-generation failure does not delete the video

- **Verifies:** AC2
- **Precondition:** Mocked browser/context/page (matching the existing pattern); `clip.run` succeeds; `generateCaptionsAndTranscript` is set (via `setGenerateCaptionsAndTranscript`) to a function that throws
- **Action:** Call `captureVideoForClip({ browser, featureSlug, storySlug, clip })`
- **Expected result:** The call rejects (caption failure is still surfaced, not swallowed), but the video file written during the recording phase still exists on disk afterward

### AC3: the thrown error carries the video's own path

- **Verifies:** AC3
- **Action:** Same setup as AC2; catch the rejection
- **Expected result:** `err.videoPath` equals the real recorded video's own path

### AC4: the happy path (recording + captions both succeed) is unchanged (regression)

- **Verifies:** AC4
- **Action:** Re-run `tests/check-rpca-s3-video-capture-wired-for-real.js` AC2 unchanged
- **Expected result:** Same pass result as before — same return shape (`path`, `captionPath`, `transcriptPath`, `reviewed: false`)

## Out of Scope

- Wiring a real `generateCaptionsAndTranscript` implementation (remains intentionally unwired per `rpca-s3`'s own original scoping — out of scope for this fix, which only changes error-handling/cleanup boundaries).
- Any change to `generateCaptionsForVideo` or `captionTranscriptPaths` themselves.

## Test Gaps and Risks

None.
