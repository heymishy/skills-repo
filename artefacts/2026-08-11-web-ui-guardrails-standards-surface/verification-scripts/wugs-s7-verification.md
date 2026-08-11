# AC Verification Script: Surface pending/merged PR state in the guardrails/standards view

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s7-surface-pr-state-in-view.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s7-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Submit a guardrail/standard edit (via `wugs-s5`/`wugs-s6`) so you have a real pending PR to observe.

**Reset between scenarios:** Merge or close the PR from Scenario 1 before running Scenario 2/3 with a fresh submission.

---

## Scenarios

---

### Scenario 1: A pending edit shows a "pending review" indicator with a working link

**Covers:** AC1

**Steps:**
1. Submit an edit.
2. Reload the guardrails/standards view.

**Expected outcome:**
> The edited entry shows a "pending review" label. Clicking it takes you to the real PR on GitHub.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Once the PR merges, the view shows the new content, not the pending label

**Covers:** AC2

**Steps:**
1. Merge the PR from Scenario 1 on GitHub.
2. Reload the guardrails/standards view.

**Expected outcome:**
> The "pending review" label is gone. The entry now shows the new, edited content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: If the PR is closed without merging, the entry reverts to its original content

**Covers:** AC3

**Steps:**
1. Submit another edit.
2. Close (don't merge) the resulting PR on GitHub.
3. Reload the guardrails/standards view.

**Expected outcome:**
> The "pending review" label is gone, and the entry shows its original content from before the edit — not stuck showing "pending" forever.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
