# AC Verification Script: Organisation exists as a first-class entity with an org_type

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
**Technical test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-1-organisation-entity-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to the app's database (or a test copy) and a way to run the migration.
2. Have one existing (pre-story) test account/tenant available, and be ready to sign up with a brand-new account for scenario 2.
3. No browser requirements beyond normal sign-in.

**Reset between scenarios:** No reset needed — scenarios use different accounts.

---

## Scenarios

---

### Scenario 1: An existing account keeps working with no interruption

**Covers:** AC2

**Steps:**
1. Sign in with an account that was created before this change shipped.
2. Look at the dashboard/products list as you normally would.

**Expected outcome:**
> You see your normal dashboard with no popup, prompt, or extra step asking you to "choose an organisation type" or anything similar. Everything looks and behaves exactly as it did before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A brand-new sign-up works exactly as before

**Covers:** AC3

**Steps:**
1. Sign up with a completely new account (one that has never logged in before).
2. Complete sign-in.

**Expected outcome:**
> You land on the same starting screen a new user has always landed on — no new "select your organisation type" step, no error, no delay.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Existing pages and actions still work

**Covers:** AC4

**Steps:**
1. As either account from Scenario 1 or 2, create a product (or perform whatever your normal first action is).
2. Refresh the page.

**Expected outcome:**
> The product appears exactly as it would have before this change — same layout, same behaviour, nothing different.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Running the setup step twice does not duplicate anything

**Covers:** AC1/AC2 (idempotency)

**Steps:**
1. Ask an engineer to run the migration/backfill step a second time (this is a technical step, not a UI action).
2. Check the account from Scenario 1 again.

**Expected outcome:**
> Nothing changes — no duplicate records, no error, the account behaves exactly the same as after the first run.

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
