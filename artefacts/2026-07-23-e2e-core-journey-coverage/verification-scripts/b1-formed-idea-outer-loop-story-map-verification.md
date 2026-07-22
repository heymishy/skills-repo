# AC Verification Script: Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b1-formed-idea-outer-loop-story-map-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an authenticated staging account ready (from A1's scenarios).
2. Have a formed feature idea written down in a sentence or two (e.g. "Add a CSV export button to the reports page").

**Reset between scenarios:** Scenarios build on the same session in sequence — do them in order.

---

## Scenarios

---

### Scenario 1: A formed idea reaches an approved discovery

**Covers:** AC1

**Steps:**
1. Click "New feature."
2. Choose "formed idea" (as opposed to "rough idea").
3. Type your feature idea and go through the `/discovery` conversation.
4. Approve the discovery when prompted.

**Expected outcome:**
> The discovery document shows "Approved" status, and you can open it to read the content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Definition creates a visible story map

**Covers:** AC2

**Steps:**
1. Continue from Scenario 1 through the benefit-metric conversation.
2. Continue into the `/definition` conversation until epics and stories are created.
3. Look at the story-map view (usually a visual canvas showing epics/stories as cards or a diagram).

**Expected outcome:**
> The story map shows cards or boxes representing the epics/stories you just created — it isn't empty or a placeholder.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The scenario reaches sign-off

**Covers:** AC3

**Steps:**
1. Continue through `/review`, `/test-plan`, and `/definition-of-ready`.
2. Look for a status field showing the sign-off state.

**Expected outcome:**
> A clear status indicator shows the Definition of Ready sign-off state (e.g. "Signed off" or "Ready").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Closing and reopening keeps the story map intact

**Covers:** AC4

**Steps:**
1. While viewing the `/definition` story map from Scenario 2, close the browser tab.
2. Reopen the same session URL in a new tab.

**Expected outcome:**
> The story map shows the same epics/stories as before — nothing is missing or reset.

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
