# AC Verification Script: Drive Stripe test-mode plan selection on real staging

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a2-stripe-test-mode-plan-selection-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a signed-up (but not yet paid) staging account ready (from A1's scenarios).
2. Have Stripe's published test card numbers on hand: success `4242 4242 4242 4242`, decline `4000 0000 0000 0002` (any future expiry date, any 3-digit CVC, any postal code).

**Reset between scenarios:** Use a fresh signed-up account for each scenario, or ask an engineer to reset the tenant's plan state between scenarios.

---

## Scenarios

---

### Scenario 1: Selecting a plan with a valid test card activates it

**Covers:** AC1

**Steps:**
1. Sign in to a staging account with no active plan.
2. Click the plan you want to select.
3. On the Stripe checkout page, type card number `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, any postal code.
4. Click "Pay" (or the equivalent submit button).

**Expected outcome:**
> You're returned to `wuce-staging`, and your account now shows the selected plan as active (not "trial" or "no plan").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: After checkout, you land on the right page and stay signed in

**Covers:** AC2

**Steps:**
1. Complete Scenario 1's checkout.
2. Look at the page you land on after checkout completes.
3. Click any page in the app (e.g. the products list).

**Expected outcome:**
> You land on the expected post-checkout confirmation or dashboard page — not a Stripe error page or a "session expired" message. Clicking around the app still works without being asked to sign in again.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A declined card does not activate the plan

**Covers:** AC3

**Steps:**
1. Sign in to a fresh staging account with no active plan.
2. Click the plan you want to select.
3. On the Stripe checkout page, type card number `4000 0000 0000 0002`, any future expiry, any 3-digit CVC, any postal code.
4. Click "Pay."

**Expected outcome:**
> The page shows a clear decline message (not a silent failure or a success message). Your account's plan is still "no plan" or "trial" — not activated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
