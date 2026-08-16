# AC Verification Script: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect

**Story reference:** artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md
**Technical test plan:** artefacts/2026-08-16-billing-portal-error-handling/test-plans/bpe-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as a tenant admin on staging (or a local dev server pointed at a test tenant).
2. Have two test accounts available if possible: one with a real Stripe customer already provisioned (completed checkout at least once), and one without (trial, never checked out) — this matches AC1 vs AC4. If only one account is available, Scenario 2 can be checked by temporarily clearing `stripeCustomerId` in the session store, or skipped with a note.

**Reset between scenarios:** None needed — each scenario is a fresh page load, no shared state.

---

## Scenarios

---

### Scenario 1: "Manage billing" reaches the real Stripe portal for an account with billing set up

**Covers:** AC1, AC2

**Steps:**
1. Sign in as a tenant admin whose account has completed Stripe checkout at least once (a real `stripeCustomerId` exists).
2. Go to Settings → Billing.
3. Click "Manage billing."

**Expected outcome:**
> The browser lands on Stripe's own hosted Billing Portal (a `billing.stripe.com` URL), not a raw error page. This is the same behaviour as before this fix — a regression check, not new behaviour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: "Manage billing" no longer produces a raw 500 for an account without a Stripe customer yet

**Covers:** AC4

**Steps:**
1. Sign in as a tenant admin whose account has never completed Stripe checkout (no `stripeCustomerId` set), or one where it has been cleared for this test.
2. Go to Settings → Billing.
3. Click "Manage billing."

**Expected outcome:**
> The browser lands back on the Settings page (URL ends `/settings?error=no_billing_account`) — NOT a raw `500 Internal Server Error` page. This is the exact defect reported in `artefacts/feedback/beta-001.md` (signals #1/#6) and the exact condition originally reproduced live against wuce-staging.fly.dev.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A genuine Stripe outage/API failure no longer produces a raw 500

**Covers:** AC5

**Steps:**
1. This scenario is difficult to trigger live against a real Stripe account without deliberately breaking Stripe configuration — treat as a code-review + automated-test confirmation rather than a live click-through: confirm `handleGetBillingPortal` in `src/web-ui/routes/billing.js` wraps the `stripeClient.createPortalSession(...)` call in a `try`/`catch`, and that the automated test `billingPortal_stripeThrows_caughtAndRedirectsToSettingsWithBillingUnavailableError` (see test plan) passes.
2. Optional live check, if a disposable test tenant is available: temporarily set an invalid/garbage `stripeCustomerId` in the session store for a test account (a string that does not correspond to any real Stripe customer, e.g. `cus_this_does_not_exist`), then click "Manage billing."

**Expected outcome:**
> The code review confirms the try/catch exists and the automated test passes. If the optional live check is performed: the browser lands back on the Settings page (`/settings?error=billing_unavailable`), not a raw 500.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Unauthenticated request still redirects home (no regression)

**Covers:** AC3

**Steps:**
1. Sign out (or use an incognito/private window with no session).
2. Directly navigate to `/settings/billing`.

**Expected outcome:**
> The browser redirects to `/` (the public marketing page) — unchanged from the existing, already-shipped behaviour.

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
