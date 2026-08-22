# AC Verification Script: Wire the viewer-write-block gate to Skill session routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md`
**Technical test plan:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s2-test-plan.md`
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Two logged-in sessions: one `viewer`-role teammate, one `engineer`-role teammate (or admin).
2. Start the app locally with the mock LLM gateway enabled (this repo's existing staging-safe default) — no real model cost should ever be incurred during this verification, by design.

**Reset between scenarios:** No shared state.

---

## Scenarios

---

### Scenario 1: A viewer-role teammate cannot start a new skill session

**Covers:** AC1

**Steps:**
1. As the viewer-role teammate, open a feature/journey and click into any skill stage (e.g. "Discovery").
2. Attempt to start a new session.

**Expected outcome:**
> The session does not start — you see an error/denied response, not a chat interface opening.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A viewer-role teammate cannot send a message in an existing session

**Covers:** AC2

**Steps:**
1. As the engineer-role teammate, start a skill session normally (to have one to test against).
2. Switch to the viewer-role teammate's account.
3. Open that same session and attempt to type and send a message.

**Expected outcome:**
> The message is rejected — you see an error/denied response, and no reply appears from the assistant. No model cost is incurred (ask a developer to confirm the mock gateway's call counter did not increase).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A viewer-role teammate cannot commit a session's artefact

**Covers:** AC3

**Steps:**
1. As the engineer-role teammate, progress a session to a point where "Commit" is available.
2. Switch to the viewer-role teammate's account (or simulate the same session state).
3. Attempt to click "Commit."

**Expected outcome:**
> The commit is rejected — no artefact is saved, no confirmation message appears.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: An engineer teammate can use skill sessions exactly as before

**Covers:** AC4

**Steps:**
1. As the engineer-role teammate, start a session, send a message, and commit it.

**Expected outcome:**
> Everything works exactly as it did before this change — no new errors, no new denials.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A viewer-role teammate cannot edit the canvas or confirm an assumption card

**Covers:** AC5

**Steps:**
1. As the engineer-role teammate, get a session to a point where the canvas panel and an assumption card are visible.
2. Switch to the viewer-role teammate's account.
3. Attempt to edit something on the canvas, then attempt to confirm the assumption card.

**Expected outcome:**
> Both actions are rejected — the canvas does not update, the assumption card's state does not change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A denied session attempt shows up in the audit log

**Covers:** AC6

**Steps:**
1. Repeat Scenario 2 (viewer attempts to send a message).
2. Ask a developer to check the application logs for the denial.

**Expected outcome:**
> The log contains an entry showing who attempted it, which organisation, when, and which action.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — session start denied | | |
| Scenario 2 — message send denied, no cost incurred | | |
| Scenario 3 — commit denied | | |
| Scenario 4 — engineer unaffected | | |
| Scenario 5 — canvas-edit/assumption-confirm denied | | |
| Edge case — denial logged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
