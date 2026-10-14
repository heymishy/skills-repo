# AC Verification Script: Extend the discovery-artefact-scan suggestion pattern to stage-level fields

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s3.md
**Technical test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a journey whose own product has at least one linked feature with a real `discovery.md` (a populated "Problem Statement" section) to use for Scenarios 1-2.
2. Have a second journey with no linked feature (or no `product_id` set at all) for Scenario 3.

**Reset between scenarios:** Close any open panel between scenarios.

---

## Scenarios

### Scenario 1: Suggestions appear for empty fields when a linked feature has real content

**Covers:** AC1

**Steps:**
1. Open the edit panel for a stage whose journey has the linked feature from Setup step 1, and whose "Customer actions"/"Pain points" fields are both currently empty.

**Expected outcome:**
> Underneath "Customer actions" and underneath "Pain points," you see a dashed-border suggestion box labeled "Suggested — from [feature name]" with real text pulled from that feature's own Problem Statement.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking a suggestion fills the field, but you still have to save it

**Covers:** AC2

**Steps:**
1. From Scenario 1, click the "Customer actions" suggestion box.
2. Without clicking elsewhere yet, check the field.
3. Now click elsewhere (or press Tab) to leave the field.

**Expected outcome:**
> After step 1, the "Customer actions" textarea shows the exact suggested text — but nothing is saved yet. After step 3, the field shows its usual "Saved" confirmation, same as typing anything else.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No suggestions when there's nothing to suggest from

**Covers:** AC3

**Steps:**
1. Open the edit panel for a stage from the Setup step 2 journey (no linked feature, or no product).

**Expected outcome:**
> No suggestion box appears under any field — just the plain empty textareas, same as any journey today.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A field that already has real content never shows a suggestion

**Covers:** AC4

**Steps:**
1. Open the edit panel for a stage (from Setup step 1's journey) whose "Customer actions" field already has real text typed in.

**Expected outcome:**
> No suggestion box appears under "Customer actions" — it's never offered as an option to overwrite something you already wrote.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
