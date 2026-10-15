# AC Verification Script: Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
**Technical test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have at least one feature that's both reached Definition of Done and already has a playback package produced (`fpd-s1`/`fpd-s2`).
2. Have at least one other feature that's reached Definition of Done but has no package yet, for Scenario 5.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: You can find a feature's playback package from the new viewer page

**Covers:** AC1

**Steps:**
1. Open the new playback viewer page in the app.

**Expected outcome:**
> You see a list of features that are both done and have a playback package ready — you can click through to review any of them.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A feature's review page starts with what it is and why it matters

**Covers:** AC2

**Steps:**
1. Click into a feature's own review page.

**Expected outcome:**
> The page opens with a short summary of what the feature does and the benefits it was built to achieve — matching what's already written in that feature's own discovery and benefit documents, word for word, not a rewritten version.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Each story shows its own acceptance criteria

**Covers:** AC3

**Steps:**
1. Scroll down the review page past the summary.

**Expected outcome:**
> You see a section for each story in the feature, and within each one, a list of that story's own acceptance criteria — matching what's already written in that story's own "Definition of Done" record.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Stories appear in a sensible, consistent order

**Covers:** AC4

**Steps:**
1. Compare the order stories appear on the review page against the order they're listed in the feature's own delivery record.

**Expected outcome:**
> The order matches — stories aren't shuffled or alphabetised differently from how they're actually organised in the feature's own epic/story structure.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A feature with no package yet doesn't show up

**Covers:** AC5

**Steps:**
1. Look for a feature that's done but has no playback package yet, in the viewer's own feature list.

**Expected outcome:**
> It doesn't appear in the list at all — only features with an actual package to review are shown.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
