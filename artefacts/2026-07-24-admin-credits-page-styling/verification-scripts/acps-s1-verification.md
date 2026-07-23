# AC Verification Script: Style the admin credits page with the shared design system shell

**Story reference:** artefacts/2026-07-24-admin-credits-page-styling/stories/acps-s1.md
**Technical test plan:** artefacts/2026-07-24-admin-credits-page-styling/test-plans/acps-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in as an admin user and navigate to `/admin/credits`.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The page looks like the rest of the platform

**Covers:** AC1

**Steps:**
1. Look at the page.

**Expected outcome:** It has the same navigation bar, colours, and fonts as every other page in the platform — not a plain white page with just a heading and a table.

**Pass / Fail:** ___

---

### Scenario 2: Tenant balances and top-up still work exactly as before

**Covers:** AC2, AC3

**Steps:**
1. Find a tenant in the table.
2. Enter a top-up amount and click "Adjust".

**Expected outcome:** The balance updates exactly as it did before this change — same fields, same behaviour, just better-looking.

**Pass / Fail:** ___

---

### Scenario 3: You can get back to the dashboard

**Covers:** AC4

**Steps:**
1. Look for a way back to the main dashboard.

**Expected outcome:** A navigation link is there — you don't have to use the browser's back button.

**Pass / Fail:** ___

---

## Summary

Total scenarios: 3 | Manual gap scenarios: 0
