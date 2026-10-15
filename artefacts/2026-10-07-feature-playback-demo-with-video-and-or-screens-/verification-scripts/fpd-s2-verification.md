# AC Verification Script: Add a Playwright-recorded video walkthrough with machine-generated captions and transcript

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
**Technical test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a feature-playback package already producing a walkthrough doc + screenshots (`fpd-s1`) for a DoD-validated feature.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: A video recording is captured automatically

**Covers:** AC1

**Steps:**
1. Run the video-capture step of the Feature Playback Package skill.

**Expected outcome:**
> A video file appears in the package's own folder, showing the feature being walked through — you didn't have to manually record your own screen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can choose one video or several, depending on the feature

**Covers:** AC2

**Steps:**
1. For a small, simple feature, produce the package as one combined video.
2. For a larger, multi-story feature, produce it as several shorter clips instead.

**Expected outcome:**
> Both options work the same way mechanically — you're not blocked from choosing either shape, and the skill doesn't force one or the other.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Every video comes with captions and a written transcript

**Covers:** AC3

**Steps:**
1. Look at the package's own video folder after capture.

**Expected outcome:**
> Alongside every video file, you see a captions file and a separate written transcript — not just the raw video on its own.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A silent recording (no narration) still gets a transcript

**Covers:** AC4

**Steps:**
1. Produce a package without recording any narration (silent walkthrough).
2. Check for a transcript file.

**Expected outcome:**
> A transcript still exists, describing what happens in the video step by step — it isn't skipped just because there's no spoken audio to transcribe.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: The package waits for you to review the captions/transcript

**Covers:** AC5

**Steps:**
1. Right after video capture finishes, check the package's own status.
2. Review the captions and transcript, then confirm you've reviewed them.
3. Check the status again.

**Expected outcome:**
> Before your review, the package isn't marked complete. After you confirm the captions/transcript look right, it becomes complete.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Two different videos get genuinely different captions/transcripts, not identical boilerplate

**Covers:** AC6

**Steps:**
1. Produce two packages for two different features with clearly different content.
2. Compare their captions/transcripts.

**Expected outcome:**
> The two sets of captions/transcripts are genuinely different from each other and each one accurately reflects its own video's own content — not the same generic text copied for both.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
