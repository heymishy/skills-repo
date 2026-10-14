# AC Verification Script: Seed a new journey with a default starting-skeleton template

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md
**Technical test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app and open the journeys list.

**Reset between scenarios:** Each scenario creates its own new journey — no shared state to reset.

---

## Scenarios

### Scenario 1: New journey modal shows the default-checked skeleton checkbox

**Covers:** AC1

**Steps:**
1. Click "+ New journey."

**Expected outcome:**
> A checkbox labeled "Start with a default stage outline" is visible in the modal, and it is already checked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Creating a journey with the box checked seeds 5 named stages

**Covers:** AC2

**Steps:**
1. Type a journey name, leave the checkbox checked, click "Create journey."
2. Look at the stage list / swimlane grid.

**Expected outcome:**
> Exactly 5 stages appear, named "Evaluate," "Discover," "Purchase," "Onboard," "Retain," in that order. Every other field on each stage (description, emotion, etc.) shows the empty "—" treatment, same as any blank field.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Unchecking the box creates a genuinely empty journey

**Covers:** AC3

**Steps:**
1. Click "+ New journey," type a name, UNCHECK the checkbox, click "Create journey."

**Expected outcome:**
> The journey has zero stages — the same "No stages yet" empty state you'd see today.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Seeded stages belong to the correct tenant

**Covers:** AC4

**Steps:**
1. (Requires 2 tenant accounts.) Create a journey with the box checked as Tenant A.
2. Sign in as Tenant B and attempt to view Tenant A's journey by its own URL.

**Expected outcome:**
> Tenant B cannot see Tenant A's journey or its seeded stages at all (not found / access denied) — exactly as any other cross-tenant journey access is already blocked today.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
