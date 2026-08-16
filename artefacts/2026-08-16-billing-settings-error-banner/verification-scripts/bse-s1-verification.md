# AC Verification Script: Show a visible error banner on Settings when a billing-portal redirect carries an error

**Story reference:** artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md
**Technical test plan:** artefacts/2026-08-16-billing-settings-error-banner/test-plans/bse-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as a user whose tenant has no `stripeCustomerId` set (or one where a genuine Stripe call will fail) — the exact live condition `beta-006.md` validated on `wuce-staging.fly.dev`.
2. Navigate to Settings → Billing tab.

**Reset between scenarios:** None needed — each scenario is a fresh page view via URL navigation, no shared state.

---

## Scenarios

---

### Scenario 1: "Manage billing" click surfaces a clear no-account message

**Covers:** AC1

**Steps:**
1. On the Billing tab, click "Manage billing" for a tenant with no billing account set up.
2. Observe the redirect back to `/settings?error=no_billing_account`.
3. Read the Billing tab content on the page that loads.

**Expected outcome:**
> A clearly visible banner reads "You don't have a billing account set up yet." — not a silent, unchanged Billing tab.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Directly loading the `billing_unavailable` URL surfaces a clear unavailability message

**Covers:** AC2

**Steps:**
1. Navigate directly to `/settings?error=billing_unavailable` (simulating the redirect target of a genuine Stripe API failure, which is harder to trigger live on demand).
2. Read the Billing tab content.

**Expected outcome:**
> A clearly visible banner reads "Billing is temporarily unavailable — please try again shortly."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A normal Settings visit (no error) and an unrecognized error value show no banner

**Covers:** AC3

**Steps:**
1. Navigate to `/settings` with no query string at all — confirm the Billing tab looks exactly as it did before this story (status pill, plan label, "Manage billing" link, conditional "Upgrade to Pro" form).
2. Navigate to `/settings?error=something_unexpected` — confirm no banner appears and the value `something_unexpected` is not visible anywhere on the page (view source if in doubt).

**Expected outcome:**
> No banner in either case; the Billing tab's existing content is unaffected; no raw query value is echoed onto the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Billing and Credits banners are independent (admin user)

**Covers:** AC4

**Steps:**
1. Sign in as an admin user.
2. Navigate to `/settings?error=no_billing_account`.
3. Confirm the Billing-tab banner appears when the Billing tab is active.
4. Switch to the Credits tab — confirm the Billing banner does NOT appear there, and the Credits tab's own (separate) error-banner area is empty/hidden as usual (no cross-contamination).

**Expected outcome:**
> The two banners never appear together or in the wrong tab; switching tabs behaves exactly as it did before this story.

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
