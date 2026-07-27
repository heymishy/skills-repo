# AC Verification Script: Fix "Resume conversation" to always resolve to a real conversation view

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
**Technical test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a feature with at least one completed stage.
2. For Scenario 2 specifically, you'll need to test on staging after a real deploy has happened (or wait ~15-30 minutes after your last activity, since Fly may suspend an idle staging app in the meantime, which has the same practical effect).

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: The "Resume conversation" link points at the right destination

**Covers:** AC1

**Steps:**
1. Open a feature's artefact page and hover over (or right-click → inspect) the "Resume conversation" link for a completed stage.

**Expected outcome:**
> The link points at a `/journey/.../stage/...` address (the same style of page reached via the breadcrumb), not the old `/skills/.../sessions/.../chat` address.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking "Resume conversation" after time has passed shows the real conversation, not an error

**Covers:** AC2 — this is the exact bug originally reported

**Steps:**
1. Complete a stage on a feature.
2. Wait until the staging app has had a chance to restart or go idle (ask an engineer, or simply wait 20-30 minutes since your last activity on staging).
3. Return to that feature and click "Resume conversation" for the stage you completed.

**Expected outcome:**
> The page shows the actual conversation you had, laid out with the conversation on the left and the finished document on the right. You do NOT see "Session not found."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Clicking "Resume conversation" right after finishing a stage still works

**Covers:** AC3

**Steps:**
1. Complete a stage.
2. Immediately click "Resume conversation" for that same stage, without waiting.

**Expected outcome:**
> The page shows the conversation correctly, exactly as it already did before this change — this case was never broken and should not change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A very old stage (from before this update) degrades gracefully, not with an error

**Covers:** AC4

**Steps:**
1. Ask an engineer to point you to a feature stage that was completed before this update shipped.
2. Click "Resume conversation" for that stage.

**Expected outcome:**
> You see the finished document, without the conversation panel (since that older conversation was never saved and can't be recovered) — but importantly, you do NOT see "Session not found" or a broken page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case (AC4) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
