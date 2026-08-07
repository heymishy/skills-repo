# AC Verification Script: Curate a Modules taxonomy for a product

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a1-modules-taxonomy-crud.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as an admin and open any product with zero modules.
2. Have a second, different product open in another tab (or note its name) to check for cross-product leakage later.

**Reset between scenarios:** Delete any module you create during this script before moving to the next scenario, unless the scenario says otherwise.

---

## Scenarios

### Scenario 1 — Create a module (AC1)
1. Click "+ New module" and type "Governance & Gate Enforcement".
2. Click the create button.
3. Refresh the page.

**Expected:** The module "Governance & Gate Enforcement" appears in the module list, even after the refresh.

### Scenario 2 — Rename a module keeps its epics (AC2)
1. Assign at least one epic to the module you created in Scenario 1.
2. Click the rename (pencil) icon and change the name to "Governance & Compliance".
3. Look at the epic you assigned.

**Expected:** The module now shows as "Governance & Compliance", and the epic you assigned is still listed under it — it did not disappear or move to "Unassigned".

### Scenario 3 — Delete a module reassigns its epics (AC3)
1. With the module from Scenario 2 still containing at least one epic, click its delete (trash) icon.
2. Confirm the deletion prompt.

**Expected:** The module disappears from the list. The epic that was inside it now appears under an "Unassigned" section — it does not vanish from the page entirely.

### Scenario 4 — Duplicate name is rejected (AC4)
1. Create a module named "Billing".
2. Try to create a second module also named "Billing".

**Expected:** You see a clear message that a module with that name already exists. Only one "Billing" module exists in the list — no duplicate appears.

### Scenario 5 — Modules don't leak across products (AC5)
1. Create a module named "Cross-Product Test" on the product you've been using.
2. Open the second product you noted in Setup.

**Expected:** "Cross-Product Test" does NOT appear anywhere on the second product's module list.

### Scenario 6 — Two products genuinely resolve independently (AC6, D37 wiring)
1. On Product A, create modules "Governance" and "Billing".
2. On Product B (a genuinely different product), create module "Onboarding".
3. Refresh both product pages.

**Expected:** Product A shows exactly "Governance" and "Billing" — not "Onboarding". Product B shows exactly "Onboarding" — not "Governance" or "Billing". This confirms the real database wiring works correctly, not just that the feature "looks wired up".

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Create | | |
| 2 — Rename | | |
| 3 — Delete/reassign | | |
| 4 — Duplicate rejected | | |
| 5 — No cross-product leak | | |
| 6 — D37 wiring correctness | | |
