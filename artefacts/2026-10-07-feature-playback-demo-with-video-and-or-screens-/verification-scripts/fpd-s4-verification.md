# AC Verification Script: Viewer renders the actual screenshot gallery and plays video per AC

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
**Technical test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s4-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a feature's review page open (`fpd-s3`), for a feature whose package includes at least one screenshot and one video.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: You can see the actual screenshot, not just a mention of it

**Covers:** AC1

**Steps:**
1. Find an AC section that has a screenshot.

**Expected outcome:**
> The screenshot itself displays right there in the page, large enough to read without having to zoom in.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can play the video right there in the page

**Covers:** AC2

**Steps:**
1. Find an AC section that has a video.

**Expected outcome:**
> A video player appears in that section, with normal play/pause/volume controls — you don't need to download anything or leave the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: You can turn on captions while watching

**Covers:** AC3

**Steps:**
1. Play a video and turn on captions using the player's own controls.

**Expected outcome:**
> Captions appear on screen, timed to match what's being shown/said in the video.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: You can read the transcript without watching the video

**Covers:** AC4

**Steps:**
1. Without pressing play, look for a way to read the video's content as text.

**Expected outcome:**
> A written transcript is available right there in the same section — you can read what happens without ever pressing play.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: An AC with no evidence yet shows a clear message, not a broken page

**Covers:** AC5

**Steps:**
1. Find an AC section for a package that's still being put together, where no screenshot or video has been captured for that specific AC yet.

**Expected outcome:**
> You see a plain message like "No evidence captured for this AC yet" — not a broken image icon, and not an empty-looking gap that looks like something went wrong.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
