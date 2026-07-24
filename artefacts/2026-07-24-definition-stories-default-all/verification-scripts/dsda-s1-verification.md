# AC Verification Script: Default to all stories from /definition when starting the per-story review sequence

**Story reference:** artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
**Technical test plan:** artefacts/2026-07-24-definition-stories-default-all/test-plans/dsda-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Drive a journey through discovery, benefit-metric, and definition, so definition has written at least 2 stories.

**Reset between scenarios:** Use a fresh journey each time.

---

## Scenarios

### Scenario 1: The story list is already filled in when you reach this step

**Covers:** AC1

**Steps:**
1. Complete `/definition` for a journey.
2. Confirm the gate to move to the next stage.

**Expected outcome:** The story-list page already shows every story `/definition` wrote — you don't see a blank box asking you to type them.

**Pass / Fail:** ___

---

### Scenario 2: Submitting the pre-filled list moves everything forward correctly

**Covers:** AC2

**Steps:**
1. From Scenario 1, submit the list as-is (don't edit it).
2. Complete the review stage for the first story.

**Expected outcome:** Each story proceeds through review, then test-plan, then definition-of-ready, one at a time — same as it always has, just without you having typed the list yourself.

**Pass / Fail:** ___

---

### Scenario 3: You can still edit the list if you want to

**Covers:** AC3

**Steps:**
1. From Scenario 1's page, try to remove one story from the pre-filled list before submitting.

**Expected outcome:** You can edit it, and only your edited list gets used — you're not locked into the auto-filled version.

**Pass / Fail:** ___

---

### Scenario 4: If the system can't read the story list, it doesn't get stuck

**Covers:** AC4

**Steps:**
1. (With engineering help) arrange for a definition artefact that the system can't automatically parse.
2. Reach the story-list page for that journey.

**Expected outcome:** You see the old, familiar blank text box to type story slugs yourself — not an error page.

**Pass / Fail:** ___

---

## Summary

Total scenarios: 4 | Manual gap scenarios: 0
