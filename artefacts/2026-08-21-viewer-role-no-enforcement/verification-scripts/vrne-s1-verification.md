# AC Verification Script: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md`
**Technical test plan:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s1-test-plan.md`
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need two logged-in browser sessions (or one browser plus one incognito window): one as a real `admin` (to assign the `viewer` role to a teammate), one as the teammate you assign `viewer` to.
2. Start the app locally: load environment variables from `.env`, then run `node src/web-ui/server.js` (see this repo's standard local-dev setup — no special config for this story).
3. Have a real product and at least one feature/journey already created in the test tenant, so there's something real to attempt to edit/delete.

**Reset between scenarios:** No shared state — each scenario is independent, though Scenario 5 (hard delete) should be run last since it removes the test journey.

---

## Scenarios

---

### Scenario 1: A viewer-role teammate is denied when trying to edit a product

**Covers:** AC1

**Steps:**
1. As the admin, open Team Management and confirm (or assign) the teammate's role as "Viewer."
2. As that teammate, open the product you created in Setup and click "Edit."
3. Change the product's name and click "Save."

**Expected outcome:**
> The save is rejected — you see an error/denied response, not a success confirmation. The product's name in the product list remains unchanged after refreshing the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A viewer-role teammate is denied when trying to create a new feature

**Covers:** AC2

**Steps:**
1. As the viewer-role teammate, open the test product.
2. Click "+ New feature."
3. Enter a name and attempt to create it.

**Expected outcome:**
> The creation is rejected — you see an error/denied response, not a new feature appearing. Refreshing the feature list does not show a new entry.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An engineer or admin teammate is completely unaffected

**Covers:** AC3

**Steps:**
1. As the admin, assign a second teammate the "Engineer" role (or use an existing engineer-role account).
2. As that engineer, edit the same product from Scenario 1 and save.
3. As the admin, create a new feature the same way as Scenario 2.

**Expected outcome:**
> Both actions succeed normally, exactly as they did before this change — the product edit saves, the new feature appears in the list. No behaviour change for non-viewer roles.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A session with no recognisable role is denied, not silently allowed

**Covers:** AC4

**Steps:**
1. This scenario requires a developer to simulate an edge case not reachable through the normal UI — ask a developer to run the automated test `missing-role-denied` from the test plan and report the result here, or manually clear the `role` field from a test session's stored data before attempting a write action.

**Expected outcome:**
> The write action is denied, not silently allowed — confirming the system defaults to "deny" when it cannot confirm who the person is, rather than defaulting to "allow."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A denied attempt shows up in the audit log

**Covers:** AC5

**Steps:**
1. As the viewer-role teammate, repeat Scenario 1 (attempt to edit the product).
2. Ask a developer to check the application logs for the denial event.

**Expected outcome:**
> The log contains an entry for the denied attempt, showing which person attempted it, which tenant/organisation they belong to, when it happened, and which action they tried.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — viewer denied editing a product | | |
| Scenario 2 — viewer denied creating a feature | | |
| Scenario 3 — engineer/admin unaffected | | |
| Scenario 4 — ambiguous role denied | | |
| Edge case — denial logged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
