# AC Verification Script: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
**Technical test plan:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s1-test-plan.md
**Script version:** 1
**Verified by:** ______ | **Date:** ______ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open any web-UI skill session (e.g. start a `/discovery` session from `/journey`) — any session that loads at least one context file (SKILL.md is always loaded) works.
2. No special account or data setup needed.

**Reset between scenarios:** None needed — each scenario is a fresh look at the same loaded session.

---

## Scenarios

---

### Scenario 1: The context panel shows as one line by default, not a full file list

**Covers:** AC1

**Steps:**
1. Open a skill session.
2. Look at the "Ref docs" area near the top of the page.

**Expected outcome:**
> You see one short line — something like "Context loaded (N files) ✓" — not a row of individual file names.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking the summary reveals the full file list

**Covers:** AC2

**Steps:**
1. Click the collapsed summary line from Scenario 1.

**Expected outcome:**
> The line expands to show each loaded file by name, exactly as the "Ref docs" panel used to show by default — each with a checkmark and the word "loaded".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Clicking again collapses it back

**Covers:** AC3

**Steps:**
1. With the panel expanded from Scenario 2, click the summary line again.

**Expected outcome:**
> The panel collapses back to the single summary line. You can repeat Scenarios 2 and 3 back and forth as many times as you like.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A failed-to-load file shows a warning without expanding

**Covers:** AC4

**Steps:**
1. Find or create a session where at least one context file failed to load (a "missing" file) — if none is readily available, ask an engineer to point you at one, or check the story's own test file for how this was simulated.
2. Look at the collapsed summary line, without clicking it.

**Expected outcome:**
> The summary line itself looks different from the all-loaded case — it shows a warning symbol and/or a count like "4 of 5 files", so you know something's wrong without having to expand it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Keyboard-only use works

**Covers:** AC6

**Steps:**
1. Click anywhere in the page body first (to make sure focus isn't already on the summary), then press Tab repeatedly until the collapsed summary line is visibly focused (a highlighted outline).
2. Press Enter or Space.

**Expected outcome:**
> The panel expands, exactly as if you'd clicked it with a mouse. Pressing Enter/Space again collapses it back.

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
| Scenario 5 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
