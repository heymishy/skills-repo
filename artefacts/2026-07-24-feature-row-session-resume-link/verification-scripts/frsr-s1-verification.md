# AC Verification Script: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts

**Story reference:** artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
**Technical test plan:** artefacts/2026-07-24-feature-row-session-resume-link/test-plans/frsr-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product with at least one feature that has completed at least one pipeline stage.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: You can click a feature to see its detail

**Covers:** AC1

**Steps:**
1. Open a product's page.
2. Click on a feature in the list.

**Expected outcome:** You're taken to a real page about that feature — not just staring at unclickable text.

**Pass / Fail:** ___

---

### Scenario 2: You can see the actual conversation that happened at a stage

**Covers:** AC2, AC3, AC4

**Steps:**
1. From the feature's detail page (Scenario 1), find a completed stage (e.g. discovery).
2. Look for a way to resume/view its conversation, alongside the existing "View" link.
3. Click it.

**Expected outcome:** You see the real back-and-forth conversation that happened at that stage — not just the final written artefact.

**Pass / Fail:** ___

---

### Scenario 3: An old, no-longer-available conversation says so clearly

**Covers:** AC5

**Steps:**
1. (With engineering help) find or arrange a very old completed stage whose conversation is no longer available.
2. Try to view its conversation.

**Expected outcome:** You get a clear "not available" message — not a blank page or a confusing error.

**Pass / Fail:** ___

---

## Summary

Total scenarios: 3 | Manual gap scenarios: 0
