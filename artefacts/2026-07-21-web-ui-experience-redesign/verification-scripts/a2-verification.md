# AC Verification Script: Reassign an epic to a different module

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a2-reassign-epics-between-modules.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a2-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Have a product open with at least two modules, each with at least one epic assigned, plus one epic in "Unassigned".

**Reset between scenarios:** Move any epic you reassign back to its original module before the next scenario.

---

## Scenarios

### Scenario 1 — Move an epic between modules (AC1)
1. Pick an epic under Module X. Use its "Move to ▾" control to select Module Y.

**Expected:** The epic disappears from Module X's list and appears under Module Y's list.

### Scenario 2 — Assign an unassigned epic (AC2)
1. Pick the epic under "Unassigned". Move it to Module X.

**Expected:** It disappears from "Unassigned" and appears under Module X.

### Scenario 3 — Reassigning to the same module does nothing unexpected (AC3)
1. Pick an epic currently under Module X. Use "Move to ▾" and select Module X again (its current module).

**Expected:** Nothing changes — no error, no duplicate entry, the epic stays exactly where it was.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Move between modules | | |
| 2 — Assign from Unassigned | | |
| 3 — No-op same-module move | | |
