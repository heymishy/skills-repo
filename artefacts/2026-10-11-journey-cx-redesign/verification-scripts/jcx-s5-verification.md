# AC Verification Script: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
**Technical test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s5-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need two accounts belonging to different organizations, and a viewer-role account, to exercise these scenarios.

**Reset between scenarios:** None needed — each scenario is independent.

---

## Scenarios

---

### Scenario 1: You can't touch another organization's journey stage

**Covers:** AC1, AC2, AC4

**Steps:**
1. Using a browser dev tool (or a second logged-in account), attempt to add a placeholder feature, trigger one, or approve a conversion on a journey stage that belongs to a different organization.

**Expected outcome:**
> Every attempt fails with a "not found" response (not "forbidden") — and nothing changes: no placeholder is created, no discovery folder appears, no mapping converts.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A viewer-role account can't add or trigger a placeholder

**Covers:** AC3

**Steps:**
1. Log in with a viewer-role account.
2. Attempt to add a placeholder feature to a stage, or trigger an existing one.

**Expected outcome:**
> The action is blocked with a "forbidden" response — viewers can look, not change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — cross-tenant denied | | |
| Scenario 2 — viewer-role denied | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
