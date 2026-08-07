# AC Verification Script: Give admins a real control to lift a tenant's journey cap, separate from credits

**Story reference:** artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
**Technical test plan:** artefacts/2026-08-06-tenant-plan-admin-control/test-plans/tpac-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as an admin (`ADMIN_GITHUB_LOGINS`).
2. Have a test tenant at (or near) its journey cap, still on the `trial` plan.

**Reset between scenarios:** Use a fresh test tenant per scenario where possible.

---

## Scenarios

---

### Scenario 1: Seeing plan and credits as separate things

**Covers:** AC1

**Steps:**
1. Open `/admin/credits` for the test tenant.

**Expected outcome:**
> You see the tenant's plan (trial/paid) and status, shown clearly separate from their credits balance — not merged into one number or field.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Lifting the journey cap without a real Stripe checkout

**Covers:** AC2

**Steps:**
1. On the same admin page, set the tenant's plan to paid/active using the new control.
2. As that tenant, try to create a journey beyond their previous limit.

**Expected outcome:**
> The journey creates successfully — no "Journey limit reached" page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Confirming credits alone don't lift the cap

**Covers:** AC3

**Steps:**
1. With a fresh test tenant still on `trial` and at their cap, top up their credits only (existing flow, unchanged).
2. As that tenant, try to create a journey beyond the limit.

**Expected outcome:**
> You still see "Journey limit reached" — the credits top-up alone did not lift it. This confirms the two systems stayed separate.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The error message makes sense

**Covers:** AC4

**Steps:**
1. As a tenant at their cap (still trial), attempt to start a new journey.

**Expected outcome:**
> The "Journey limit reached" message clearly says the limit is tied to your plan — not your credits balance.

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
