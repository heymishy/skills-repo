# AC Verification Script: Billing journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.5-billing-journey.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.5-billing-journey-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Confirm Stripe is configured in test mode (test-mode keys only — never real/live keys).
2. Make sure the mock LLM gateway is active (`NODE_ENV=test`).
3. Have a trial-plan tenant ready to upgrade, and a second tenant already at (or near) its usage limit.

**Reset between scenarios:** Use a fresh trial-plan tenant for Scenario 1, and reset the usage-limit tenant back to its trial state before Scenario 4 if it was upgraded in Scenario 1.

---

## Scenarios

---

### Scenario 1: Upgrading to paid actually takes effect

**Covers:** AC1

**Steps:**
1. As a trial-plan tenant, go through the Stripe test-mode checkout flow to upgrade to paid.
2. Once checkout completes, check the account's plan status.

**Expected outcome:**
> The account now shows as being on the paid plan, right after checkout completes — no delay, no lingering "trial" label.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Hitting your usage limit gives a clear explanation, not a cryptic error

**Covers:** AC2

**Steps:**
1. As a tenant already at their usage limit (for example, the maximum number of journeys), try to create one more.

**Expected outcome:**
> The action is blocked, and you see a clear, plain-English message explaining why (for example, "You've reached your plan's journey limit — upgrade to create more") — not a raw error code or a blank failure.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A failed payment is reflected, not silently ignored

**Covers:** AC3

**Steps:**
1. Trigger a simulated failed-payment event for a tenant's account (using Stripe's test-mode failure scenario).
2. Check the account's plan status afterward.

**Expected outcome:**
> The account's status changes to reflect the failure — for example, reverted to trial or marked "past due" — it is not left showing "paid" as if nothing happened.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Cancelling or downgrading actually restricts access

**Covers:** AC4

**Steps:**
1. As a paid tenant, cancel or downgrade the plan.
2. Try an action that the old (paid) plan allowed but the new plan should not.

**Expected outcome:**
> The action is now blocked, consistent with the new (lower) plan's limits — access is not left at the old plan's level.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: No real money moves and no real Stripe calls happen during this walkthrough

**Covers:** AC5

**Steps:**
1. While repeating Scenarios 1–4, confirm Stripe's test-mode dashboard is being used (not the live dashboard).
2. Confirm no real charge appears anywhere.

**Expected outcome:**
> Everything happened in Stripe test mode. No real charge was made at any point, and all responses came from mocked/test-mode data.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
