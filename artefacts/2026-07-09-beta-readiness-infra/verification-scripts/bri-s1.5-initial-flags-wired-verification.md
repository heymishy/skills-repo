# AC Verification Script: Create and wire the 3 initial flags across both projects

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.5-initial-flags-wired-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Ask the developer to show you three named switches: "wizard-ui," "product-kanban-view," and "org-kanban-view."
2. Ask the developer to set up at least two made-up companies (for example "Acme" and "Globex") so you can check that a switch turned on for one company doesn't affect another.
3. For the two manual scenarios at the end (which check the real PostHog dashboard), you will need access to both the staging and production PostHog dashboards — ask the developer for a login or a screen-share if you don't have one.

**Reset between scenarios:** Ask the developer to turn all three switches back to their starting state between scenarios.

---

## Scenarios

---

### Scenario 1: Turning "wizard-ui" off hides the wizard canvas, turning it on shows it

**Covers:** AC1

**Steps:**
1. Ask the developer to turn the "wizard-ui" switch off, then load the wizard canvas page.
2. Ask the developer to turn the "wizard-ui" switch on, then load the wizard canvas page again.

**Expected outcome:**
> With the switch off, the wizard canvas does not appear on the page. With the switch on, it appears normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Turning "product-kanban-view" off hides the product board without a restart

**Covers:** AC2

**Steps:**
1. Ask the developer to turn the "product-kanban-view" switch off.
2. Try to open a product's Kanban board.
3. Ask the developer to turn the switch back on, without restarting or redeploying anything.
4. Try to open the same product's Kanban board again.

**Expected outcome:**
> With the switch off, you see a message saying the board isn't available (not found / disabled) instead of the board itself. After the developer turns the switch back on — with no restart — the board appears normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Turning "org-kanban-view" on for one company doesn't affect another

**Covers:** AC3

**Steps:**
1. Ask the developer to turn the "org-kanban-view" switch on for Acme only.
2. As someone from Acme, try to open the org Kanban board.
3. As someone from Globex (a different company), try to open the org Kanban board.

**Expected outcome:**
> The Acme person sees the org Kanban board normally. The Globex person sees a message saying the board isn't available — and does not see any of Acme's board information.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4 (manual — requires PostHog dashboard access): All 3 switches exist with the same name in both the staging and production PostHog projects

**Covers:** AC4

**Steps:**
1. Open the staging PostHog project's feature flags list.
2. Open the production PostHog project's feature flags list.
3. Compare the two lists.

**Expected outcome:**
> Both lists contain all three switches — "wizard-ui," "product-kanban-view," and "org-kanban-view" — spelled exactly the same way in both projects.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case (manual — requires PostHog dashboard access): The "wizard-ui" switch really works in both the real staging and real production projects

**Covers:** AC1 (live confirmation)

**Steps:**
1. In the real staging PostHog project, turn "wizard-ui" off, then load the wizard canvas page on staging.
2. In the real staging PostHog project, turn "wizard-ui" on, then load the wizard canvas page on staging.
3. Repeat both steps against the real production PostHog project and the production site.

**Expected outcome:**
> In both staging and production, turning the switch off hides the wizard canvas, and turning it on shows it again — confirming the mechanism works against the real dashboards, not just a test double.
> **Note:** this scenario can only be completed once a real staging environment exists. If staging does not exist yet, mark this scenario "Blocked — staging environment not yet available" rather than Pass or Fail.

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 (manual) | | |
| Edge case (manual) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
