# AC Verification Script: Journey list page: index of all journeys for the tenant

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s1.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in to the app. Make sure your tenant has at least two journeys already created (one with a product associated, one without), and at least one journey with a couple of stages added.
2. Have at least two products already created for your tenant, so the "New journey" form's product picker has something to show.

**Reset between scenarios:** No reset needed between scenarios — each one is a read-only check or a single new-journey creation.

---

## Scenarios

### Scenario 1: The journey list shows every journey for your tenant, with the right details

**Covers:** AC1

**Steps:**
1. Go to `/customer-journeys`.

**Expected outcome:**
> You see every journey that belongs to your tenant listed. Each one shows: the journey's name, its description (if it's long, it's cut short with "..." at the end rather than running on), the name of the product it's linked to (or the words "No product" if it isn't linked to one), and how many stages it has.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: No journeys yet shows a clear empty state

**Covers:** AC2

**Steps:**
1. Go to `/customer-journeys` for a tenant that has no journeys at all (or a fresh test account).

**Expected outcome:**
> You see the message "No journeys yet. Create your first journey." and a clearly visible "New journey" button.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Creating a new journey from the list page

**Covers:** AC3, AC4

**Steps:**
1. Click "New journey".
2. In the form that opens, type a name, e.g. "Checkout Journey".
3. Optionally type a description.
4. Optionally pick a product from the dropdown.
5. Submit the form.

**Expected outcome:**
> The form lets you type a name (you can't submit without one), an optional description, and pick a product from a dropdown listing your tenant's real products. After submitting, you're taken straight to the new journey's own canvas page, and its name matches what you typed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Another tenant's journeys never show up in your list

**Covers:** AC5

**Steps:**
1. Go to `/customer-journeys` while logged in as your own tenant.
2. Look through the full list shown.

**Expected outcome:**
> Every journey listed belongs to your own tenant. Nothing from any other tenant appears, even if other tenants have journeys of their own.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (list shows correct details) | | |
| Scenario 2 (empty state) | | |
| Scenario 3 (create a new journey) | | |
| Scenario 4 (tenant isolation) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
