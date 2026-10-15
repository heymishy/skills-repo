# AC Verification Script: Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s1-walkthrough-document-and-screenshots.md
**Technical test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Pick a feature that's already reached "Definition of Done" (complete) in this pipeline.
2. Have that feature's DoD document open in another tab for comparison.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: The walkthrough document covers every AC, in the DoD's own words

**Covers:** AC1

**Steps:**
1. Run the Feature Playback Package skill against your chosen feature.
2. Open the generated walkthrough document.

**Expected outcome:**
> You see one section per acceptance criterion from the feature's DoD document. The text in each section matches what the DoD document already says about that AC — it isn't rewritten from scratch, and it isn't copied from raw test code.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The metrics section shows real targets and real signal

**Covers:** AC2

**Steps:**
1. In the same walkthrough document, find the metrics section.

**Expected outcome:**
> You see each benefit metric's name, its target, and its current signal/evidence — matching exactly what the DoD document already records for that metric.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A screenshot appears for each AC, at a meaningful moment

**Covers:** AC3

**Steps:**
1. Look through each AC section in the walkthrough document.

**Expected outcome:**
> Each section has its own screenshot embedded, showing the feature actually doing the thing that AC describes — not a loading spinner, a blank page, or a random mid-click frame.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The package waits for your review before it's "done"

**Covers:** AC4

**Steps:**
1. Right after the skill finishes capturing screenshots, check the package's own status.
2. Review each screenshot yourself, then confirm the review is complete.
3. Check the package's status again.

**Expected outcome:**
> Before you review, the package shows as "pending review" — not complete. After you confirm you've reviewed the screenshots, it shows as complete.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: The skill refuses to run on a feature that isn't actually done

**Covers:** AC5

**Steps:**
1. Try running the skill against a feature that is still in progress (not yet marked Definition of Done complete).

**Expected outcome:**
> The skill refuses to run and tells you exactly why — naming that the feature hasn't reached Definition of Done yet. It does not produce a partial or broken package.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
