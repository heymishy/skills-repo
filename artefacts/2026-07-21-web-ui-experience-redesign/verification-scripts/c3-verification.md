# AC Verification Script: Credits tab — restyle admin credit management into the shared design system

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c3-credits-tab-restyle.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c3-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** You'll need an admin account and, ideally, a non-admin account to compare.

---

## Scenarios

### Scenario 1 — Admin sees a real, styled Credits tab (AC1)
1. Sign in as admin. Click Settings → Credits.

**Expected:** You see a table of tenants and their credit balances, styled to match the rest of the app — not the old bare HTML table.

### Scenario 2 — Non-admin sees no Credits tab (AC2)
1. Sign in as a non-admin. Click Settings.

**Expected:** There is no "Credits" tab at all.

### Scenario 3 — Top-up still works (AC3)
1. As admin, on the Credits tab, enter an amount for a tenant and click "Add".

**Expected:** The tenant's balance updates to reflect the addition.

### Scenario 4 — Invalid amount is rejected clearly (AC4)
1. Try entering "0" or a negative number and click "Add".

**Expected:** You see a clear message explaining the amount is invalid — not a blank failure or raw error text.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Restyled Credits tab | | |
| 2 — Hidden for non-admin | | |
| 3 — Top-up works | | |
| 4 — Invalid amount rejected | | |
