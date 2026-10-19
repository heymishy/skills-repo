# DoR Contract — Video capture wired for real, reusing the existing caption/transcript adapter

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
**Date:** 2026-10-19

---

**What will be built:**
- `captureVideoForClip({ browser, featureSlug, storySlug, clip })` in `scripts/playback-capture.js` — opens a real Playwright browser context with `recordVideo` pointed at the existing `artefacts/[featureSlug]/playback/[storySlug]/video/` path convention (`captureVideoRecording`'s own existing directory shape, unchanged), runs the clip, closes the context, and calls the existing `generateCaptionsForVideo` on the resulting real file — returning `{ path, captionPath, transcriptPath, reviewed: false }`.
- A failure-cleanup wrapper: if `clip.run(page)` throws, the function still closes the context (to flush whatever Playwright already wrote), resolves the video's own path, deletes that file if it exists, and re-throws the original error — so a failed run leaves no partial/corrupt file behind (AC3).
- Reuses `rpca-s1`'s own `authenticateStagingSession` for the session cookie — no second auth path.
- Reuses `fpd-s2`'s own `captureVideoRecording` and `generateCaptionsForVideo` functions completely unchanged — this story adds a new real-session call site, it does not modify either function's own existing signature or logic.

**What will NOT be built:**
- Any change to `generateCaptionsForVideo`'s own D37 adapter wiring — its stub default already throws correctly; this story is a new caller, not a rewiring.
- Any change to caption/transcript content quality — `fpd-s2`'s own unchanged scope.
- A visual regression check on the video's own recorded content — this story proves a real file is produced and cleaned up correctly on failure, not that its frames are visually correct.
- Choosing one-combined-walkthrough vs. several-per-AC clips — remains an engineer judgment call per feature, per `feature-playback-demo`'s own existing precedent.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real-world claim ("a real `.webm` file is produced") is RISK-ACCEPTed for automated execution (`decisions.md`, 2026-10-19, same entry covering `rpca-s1` AC1/AC2) — verified by a manual scenario using the same real secret and session already retrieved for `rpca-s1` | manual (🔴) |
| AC2 | Unit test — a fixture video path + mocked `generateCaptionsForVideo` call, asserts it's invoked with the fixture path and the result carries `reviewed: false` | unit |
| AC3 | Unit test — a mocked Playwright context whose `clip.run(page)` throws partway through; asserts the wrapper surfaces the error (doesn't swallow it) and `fs.existsSync(targetPath)` is `false` afterward | unit |

**Assumptions:**
- The operator (or a CI run with the secret configured) executes AC1's own manual scenario — same shared dependency already RISK-ACCEPTed for `rpca-s1`, not a new independent gap.
- This story does not wire `captureVideoForClip` into the CLI's own `runCli`/`runCaptureForFeature` entrypoint — same scoping precedent as `rpca-s2`'s own `buildCaptureList` (logic built and unit-proven, full CLI wiring deferred to `rpca-s4`/`rpca-s5` territory) unless the operator wants it wired now.

**Estimated touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify — add `captureVideoForClip` only; no change to `captureVideoRecording`, `generateCaptionsForVideo`, or `authenticateStagingSession`'s own signatures)
- `tests/check-rpca-s3-video-capture-wired-for-real.js` (new)

Services: None | APIs: None (reuses the existing `GET /test/session` route via `rpca-s1`'s own auth function, unchanged)
