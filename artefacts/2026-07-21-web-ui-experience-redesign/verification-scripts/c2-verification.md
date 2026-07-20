# AC Verification Script: Billing tab — plan status and Stripe portal access

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c2-billing-tab.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c2-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** You'll want access to at least a trial account; a paid test account (if available) helps verify the other states.

---

## Scenarios

### Scenario 1 — Trial status (AC1)
1. Sign in with a trial account. Click Settings → Billing.

**Expected:** You see "Trial" clearly shown, with how many days are left.

### Scenario 2 — Active paid plan (AC2)
1. Sign in with a paid, active account. Click Settings → Billing.

**Expected:** No mention of "Trial" anywhere — you see your plan as active.

### Scenario 3 — Manage billing (AC4)
1. Click "Manage billing".

**Expected:** You're taken to Stripe's own billing portal page in your browser.

### Scenario 4 — Upgrade to Pro (AC5)
1. On a trial account, click "Upgrade to Pro".

**Expected:** You're taken to a Stripe Checkout page to enter payment details — not an error or a dead link.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Trial status | | |
| 2 — Active status | | |
| 3 — Manage billing | | |
| 4 — Upgrade to Pro | | |
