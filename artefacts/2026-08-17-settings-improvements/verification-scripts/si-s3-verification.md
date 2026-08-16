# AC Verification Script: Confirm the Stripe billing portal satisfies the "manage my plan" ask

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s3-confirm-billing-portal-sufficient.md
**Technical test plan:** artefacts/2026-08-17-settings-improvements/test-plans/si-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a staging account with no Stripe customer ID configured (Scenario 1).
2. Have access to a staging account WITH a valid Stripe test-mode customer ID configured (Scenario 2) — **if this account does not exist yet, stop and provision it before running Scenario 2; do not skip silently.**

**Reset between scenarios:** None needed — each scenario uses a different account.

---

## Scenarios

---

### Scenario 1: "Manage billing" shows a clear message when no billing account exists

**Covers:** AC2

**Steps:**
1. Sign in to staging as the account with no Stripe customer ID configured.
2. Go to Settings, Billing tab.
3. Click "Manage billing".

**Expected outcome:**
> You are taken back to the Settings page (Billing tab), and a banner appears with a clear message explaining you don't have a billing account set up yet — not a raw error page or a blank screen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: "Manage billing" reaches the real Stripe portal for a set-up account

**Covers:** AC3

**Steps:**
1. Sign in to staging as the account WITH a Stripe test-mode customer ID configured.
2. Go to Settings, Billing tab.
3. Click "Manage billing".

**Expected outcome:**
> You land on Stripe's own hosted billing portal page (URL starts with a Stripe domain), showing your plan/subscription details — not an error, not a blank page, not a redirect back to Settings.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Automated regression suite still passes

**Covers:** AC1

**Steps:**
1. Ask a developer to run: `node tests/check-bpe-s1-billing-portal-error-handling.js` and `node tests/check-bse-s1-billing-settings-error-banner.js`

**Expected outcome:**
> Both commands report all tests passing, with no failures introduced by the theme-toggle relocation (si-s1) or locale-preference (si-s2) changes.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case (regression) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

**If Scenario 2 fails or cannot be run (no fixture available):** this is the specific gap AC4 requires logging — record it as a new entry in `artefacts/feedback/`, not a silent "deferred," per the story's own AC4.

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
