# AC Verification Script: PostHog instrumentation for both benefit metrics

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
**Technical test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s5-metrics-instrumentation-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to your PostHog project (or ask whoever manages analytics for this repo to check on your behalf).

**Reset between scenarios:** Not needed — each scenario just checks for a new event.

---

## Scenarios

---

### Scenario 1: Creating an invite shows up as an event

**Covers:** AC1

**Steps:**
1. Send an invite as an admin.
2. Check PostHog for a `team_invite_created` event.

**Expected outcome:**
> A `team_invite_created` event appears, with the correct tenant, role, and invite ID attached.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Accepting an invite shows up as an event, with timing

**Covers:** AC2

**Steps:**
1. Accept the invite from Scenario 1.
2. Check PostHog for a `team_invite_accepted` event.

**Expected outcome:**
> A `team_invite_accepted` event appears, including how much time passed since the invite was created.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Manually adding a teammate also shows up as an event

**Covers:** AC3

**Steps:**
1. As an admin, use the existing "add teammate by identity" action (not the invite flow) to add someone who's already logged in before.
2. Check PostHog for a `teammate_added_by_admin` event.

**Expected outcome:**
> A `teammate_added_by_admin` event appears — this is a NEW event, so if you're checking against an older version of the product, it won't be there yet.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1) | | |
| Scenario 2 (AC2) | | |
| Scenario 3 (AC3) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
