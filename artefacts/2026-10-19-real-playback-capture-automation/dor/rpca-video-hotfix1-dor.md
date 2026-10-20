# Definition of Ready: rpca-video-hotfix1 — captureVideoForClip must not delete a successfully-recorded video on a downstream caption-generation failure

**Date:** 2026-10-20
**Type:** Short-track fix (CLAUDE.md "Short-track" process — discovery through review skipped; test-plan → DoR → coding agent → DoD still apply)

---

## Contract

**What will be built:** `captureVideoForClip` splits its single try/catch into two sequential phases. Phase 1 (recording: `clip.run`, `context.close()`, reading the video's own path) keeps its existing catch-and-delete behaviour unchanged. Phase 2 (caption generation) runs after the video path is confirmed written, in its own scope — a failure there propagates without deleting the video, and the thrown error carries the video's own path as `err.videoPath`.
**What will NOT be built:** No change to `generateCaptionsForVideo`, `captionTranscriptPaths`, or the `generateCaptionsAndTranscript` adapter itself (remains intentionally unwired). No change to the recording-phase failure behaviour (AC3 of `rpca-s3`'s own original test plan).
**Touch points:** `scripts/playback-capture.js` (modify `captureVideoForClip`), `tests/check-rpca-video-hotfix1-caption-failure-preserves-video.js` (new)

## Hard blocks

| # | Check | Result |
|---|---|---|
| H3 | Every AC has ≥1 test | ✅ 4 ACs (2 new, 2 pre-existing regression re-runs) |
| H9 | Architecture constraints named | ✅ No new NFR surface; purely a cleanup-boundary correction inside one existing function, no signature change, no new adapter |
| H-ADAPTER | D37 adapter | ✅ The `generateCaptionsAndTranscript` adapter itself is unchanged and remains correctly un-wired (throws, per D37 rule 1) — this fix changes only how its *caller* reacts to that throw, it does not wire a real implementation |

**Oversight:** High (solo-operator posture).
**Signed off by:** Hamish King (Platform Owner) — 2026-10-20.

**Proceed: Yes.**
