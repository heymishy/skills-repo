# AC Verification Script: Video capture wired for real, reusing the existing caption/transcript adapter

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

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

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A failed capture leaves no broken file behind

**Covers:** AC3

**Steps:**
1. Deliberately interrupt a capture run partway (e.g. kill the process mid-recording, or point it at a URL that will fail to load)
2. Check the video output directory

**Expected outcome:**
> No partial or corrupt `.webm` file exists for the failed run — either nothing is there, or only successfully-completed prior captures remain.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — real video) | | |
| Scenario 2 (AC2 — captions unreviewed) | | |
| Scenario 3 (AC3 — clean failure) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
