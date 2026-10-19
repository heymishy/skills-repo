# AC Verification Script: Video capture wired for real, reusing the existing caption/transcript adapter

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s3-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session), AC1 pending operator manual run | **Date:** 2026-10-19 | **Context:** [x] Pre-code (verified post-implementation, pre-merge)

**Discrepancy note (found at /verify-completion):** Scenarios 2 and 3, as originally written, say "after Scenario 1's own capture completes" — assuming `captureVideoForClip` is wired into the CLI's own end-to-end run. Per the DoR contract's own explicit assumption, that CLI wiring was not built in this story. AC2 and AC3 are instead verified directly via the automated test suite, which exercises `captureVideoForClip` itself (not a CLI run) with a mocked browser/context/page and the real `generateCaptionsForVideo`/D37 adapter seam. AC1 remains the one genuine manual scenario — it needs the real secret and real network access `rpca-s1`'s own AC1/AC2 already established, RISK-ACCEPTed under the same `decisions.md` entry.

---

## Setup

**Before you start:**
1. Same secret setup as `rpca-s1`'s own verification script — `E2E_STAGING_AUTH_STUB_SECRET` set as an environment variable
2. Pick a real feature with an AC suited to a short video clip

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: A real video file is produced

**Covers:** AC1

**Steps:**
1. Run the CLI with a video-capture target against a real feature
2. Check `artefacts/[feature-slug]/playback/[story-slug]/video/` for a new `.webm` file

**Expected outcome:**
> A real `.webm` file exists, and playing it shows the real recorded interaction — not an empty or corrupt file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Captions and transcript are generated, marked unreviewed

**Covers:** AC2

**Steps:**
1. After Scenario 1's own capture completes, check for caption/transcript files alongside the video
2. Check the package status record for the `reviewed` field on this video

**Expected outcome:**
> Caption and transcript files exist, and the video's own record shows `reviewed: false` until someone explicitly confirms it.

**Result:** [x] Pass (via automated-test cross-reference)
**Notes:** Not run as a live CLI scenario — see discrepancy note above. Verified instead by `tests/check-rpca-s3-video-capture-wired-for-real.js`'s own AC2 test: `captureVideoForClip` correctly calls `generateCaptionsForVideo` with the real captured video path and the clip's own interaction sequence text, writes real caption/transcript files, and returns `reviewed: false`.

---

### Scenario 3: A failed capture leaves no broken file behind

**Covers:** AC3

**Steps:**
1. Deliberately interrupt a capture run partway (e.g. kill the process mid-recording, or point it at a URL that will fail to load)
2. Check the video output directory

**Expected outcome:**
> No partial or corrupt `.webm` file exists for the failed run — either nothing is there, or only successfully-completed prior captures remain.

**Result:** [x] Pass (via automated-test cross-reference)
**Notes:** Not run as a live CLI scenario — see discrepancy note above. Verified instead by `tests/check-rpca-s3-video-capture-wired-for-real.js`'s own AC3 test: a mocked Playwright context whose `clip.run(page)` throws mid-recording; `captureVideoForClip` surfaces the original error unmasked and deletes the partial file Playwright had already written.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — real video) | Pending — operator manual run | RISK-ACCEPTed in `decisions.md`, same shared secret dependency as `rpca-s1` AC1/AC2 |
| Scenario 2 (AC2 — captions unreviewed) | Pass (automated-test cross-reference) | |
| Scenario 3 (AC3 — clean failure) | Pass (automated-test cross-reference) | |

**Overall verdict:** [x] AC2/AC3 pass now; AC1 pending operator manual run (RISK-ACCEPTed, not blocking merge, consistent with `rpca-s1`'s own precedent)
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| N/A | Scenarios 2-3 described a live-CLI check assuming `captureVideoForClip` is wired into the CLI's own entrypoint | Not wired in this story, per the DoR's own explicit assumption | LOW | Accept — same batched verification-script template gap already logged for `rpca-s2`, not re-logged separately here |
