# AC Verification Script: Client org self-service conversion to an independent paying account

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
**Technical test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-6-conversion-to-independent-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a Client-org account ready that is that org's first (privileged) user, with at least one product and one Agency relationship already set up.
2. Have Stripe's test mode available.

**Reset between scenarios:** Conversion is one-directional — use a fresh Client org for each full run-through if you need to repeat this script.

---

## Scenarios

---

### Scenario 1: Converting keeps all your existing data

**Covers:** AC1

**Steps:**
1. Sign in as the Client org's admin user.
2. Find and click "Convert to independent account" (or equivalent).
3. Confirm the conversion.
4. Look at your products/journeys list.

**Expected outcome:**
> Everything you had before — products, journeys, artefacts — is still there, unchanged. Nothing was lost or duplicated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Conversion takes you to set up your own billing

**Covers:** AC2

**Steps:**
1. Continuing from Scenario 1, right after confirming conversion.

**Expected outcome:**
> You're taken to Stripe's checkout page to set up payment — the same checkout screen every new independent account goes through.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Your agency relationship keeps working after converting

**Covers:** AC3

**Steps:**
1. After converting (Scenario 1), check the product that was shared with you by your agency.

**Expected outcome:**
> You can still see and use it exactly as before — converting to an independent account didn't cut off your agency relationship or remove access to shared work.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Only the right person can convert the account

**Covers:** Security NFR

**Steps:**
1. Sign in as a different (non-admin) member of the same Client org, if one exists.
2. Try to find and use the "Convert to independent account" action.

**Expected outcome:**
> This action is not available to you, or is blocked if attempted directly — only the org's own admin-level user can trigger it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
