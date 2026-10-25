# AC Verification Script: Self-service video capture, combined across ACs where possible

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Technical test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in to the product as a tenant Product Owner who already has a DoD-complete feature with at least one capture target set (reuse a feature from `ppc-s1`/`ppc-s2`'s own verification).
2. Open that feature's capture-evidence page.
3. A modern browser (Chrome/Edge/Firefox) — no special setup required.

**Reset between scenarios:** No reset needed between scenarios 1–4 (they build on the same captured feature). For Scenario 5 (failure cleanup), you'll need a way to force the capture to fail partway — ask the engineer running this session to simulate that for you if you're doing this scenario yourself.

---

## Scenarios

---

### Scenario 1: Capturing an AC also records a short video clip

**Covers:** AC1

**Steps:**
1. Click "Capture evidence" for an AC that doesn't have a video yet.
2. Wait for the capture to finish.
3. Reload the page.

**Expected outcome:**
> The AC now shows both its screenshot (as before) AND a video player beneath or beside it, with visible play controls.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The video plays inline, served securely

**Covers:** AC2

**Steps:**
1. Click the play button on the video from Scenario 1.
2. Watch it play for a few seconds.

**Expected outcome:**
> The video plays directly in the page (no download prompt, no redirect to another site). It shows the same interaction the screenshot captured — not a blank or broken video.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Video only shows what you yourself could already see

**Covers:** AC3

**Steps:**
1. Watch the video from Scenario 1 again.
2. Compare what it shows against what you see when you use the product yourself, logged in as the same user.

**Expected outcome:**
> The video shows exactly the same screen/data you can already see in the product today — nothing you wouldn't normally have access to.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4a: Capturing a whole feature produces ONE shared video covering every AC, not a separate video each

**Covers:** AC1-combined, AC2 (also-covers note)

**Steps:**
1. Click "Capture all" on a feature with 3 or more ACs that don't have targets set yet.
2. Wait for it to finish.
3. Open any two of the captured ACs and compare their video players.
4. Look just below each AC's video for a note about other ACs.

**Expected outcome:**
> Every captured AC has a video, and it is the SAME video for all of them (the same clip plays the same sequence of actions for each AC you check). Each AC's section shows a short note naming which other ACs the video also covers, e.g. "This video also covers: AC2, AC3."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4b: A combined video failure doesn't stop the screenshot run, and is all-or-nothing for the group

**Covers:** AC4

**Steps:**
1. (Ask the engineer running this session to force the combined video recording to fail after the screenshots for a 3-AC capture-all run have already succeeded.)
2. Reload the page and check all 3 ACs.

**Expected outcome:**
> All 3 ACs still show their own screenshot, captured successfully. None of them has a video, and each shows the same "video capture failed" note — it is not the case that some of the 3 got a video while others didn't. The capture-all run itself still completed; it didn't stop partway through the screenshots.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A failed video capture doesn't leave a broken video or delete the screenshot

**Covers:** AC5

**Steps:**
1. (Ask the engineer running this session to force a video capture to fail partway through for one AC that already has a screenshot.)
2. Reload the page and check that AC.

**Expected outcome:**
> That AC still shows its existing screenshot, unaffected. There is no broken, half-loaded, or zero-length video player shown for it — it looks the same as an AC that was never asked to capture video at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: An AC with no video yet looks fine, not broken

**Covers:** AC6

**Steps:**
1. Find an AC on the page that has a screenshot but has never had video capture triggered.
2. Look at how it's displayed. Open your browser's developer console (F12 → Console tab) and check for red error messages.

**Expected outcome:**
> The AC shows its screenshot and no video player at all — not a broken video icon, not an empty black box. The browser console shows no red error messages related to this page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A page with several videos doesn't download them all at once or jump around while loading

**Covers:** AC7

**Steps:**
1. Open a feature's capture-evidence page that has 3 or more ACs with captured video.
2. Open your browser's developer tools → Network tab, and reload the page. Watch what loads.
3. While the page is loading, watch whether the screenshots/videos/text jump around or shift position.

**Expected outcome:**
> The Network tab shows the page load the thumbnails/poster images for each video, but NOT the full video file data for every clip immediately — videos only fully load when you click play on one. Nothing on the page visibly jumps or shifts position while it loads.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1) | | |
| Scenario 2 (AC2) | | |
| Scenario 3 (AC3) | | |
| Scenario 4a (AC1-combined, AC2) | | |
| Scenario 4b (AC4) | | |
| Scenario 5 (AC5) | | |
| Scenario 6 (AC6) | | |
| Edge case (AC7) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
