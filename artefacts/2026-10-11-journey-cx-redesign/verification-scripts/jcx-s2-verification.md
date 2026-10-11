# AC Verification Script: Placeholder mapping auto-converts to linked once its triggered discovery is approved

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
**Technical test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a journey stage with a triggered-but-not-yet-approved placeholder feature (from `jcx-s1`'s own flow) ready.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Approving the triggered discovery converts the placeholder

**Covers:** AC1

**Steps:**
1. Approve the discovery that was triggered from the placeholder (set its Status to Approved).
2. Go back to the journey stage.

**Expected outcome:**
> The placeholder now shows as a real, linked feature — not labelled "Placeholder" anymore, and showing the real feature's own name.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An unapproved discovery doesn't convert anything

**Covers:** AC2

**Steps:**
1. Leave the triggered discovery in Draft status (don't approve it).
2. Go back to the journey stage.

**Expected outcome:**
> The placeholder still shows as "Placeholder" — nothing changed just because time passed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Two placeholders on different stages convert independently

**Covers:** AC3

**Steps:**
1. Trigger placeholders on two different stages.
2. Approve only one of the two triggered discoveries.

**Expected outcome:**
> Only the approved one's stage shows a linked feature now. The other stage still shows "Placeholder."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: An abandoned trigger stays a placeholder forever

**Covers:** AC4

**Steps:**
1. Trigger a placeholder, then simply never return to that discovery session.

**Expected outcome:**
> The stage keeps showing "Placeholder" indefinitely — nothing auto-expires or auto-cleans-up.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — approval converts | | |
| Scenario 2 — unapproved stays placeholder | | |
| Scenario 3 — independent conversion | | |
| Scenario 4 — abandoned trigger persists | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
