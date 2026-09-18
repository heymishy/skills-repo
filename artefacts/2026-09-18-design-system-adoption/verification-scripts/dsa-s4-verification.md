# AC Verification Script: Restyle the Skill-Session Chat Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s4.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in and start (or resume) a skill session — any skill works for Scenarios 1 and 2; for Scenario 3 you'll need one generic session, one `/ideate` session, and one `/definition` session.
2. Know how to switch between dark and light mode.

**Reset between scenarios:** No reset needed between 1 and 2 (just toggle mode). Scenario 3 needs 3 different session types — start each fresh.

---

## Scenarios

---

### Scenario 1: Skill-session chat page looks right in dark mode

**Covers:** AC1

**Steps:**
1. Make sure dark mode is active.
2. Open any skill session's chat page.
3. Look at both panes — the chat/question side and the artefact/diagram side.

**Expected outcome:**
> Deep near-black background throughout both panes, bright readable text, subtle dark borders between panes, clear blue accent color on buttons and the active Focused/Chat toggle. Consistent styling across the whole screen, not just parts of it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Skill-session chat page looks right in light mode

**Covers:** AC2

**Steps:**
1. Switch to light mode.
2. Reload the skill session chat page.
3. Look at the same elements as Scenario 1.

**Expected outcome:**
> Off-white background, dark readable text, light grey pane borders, deeper blue accent color. Just as polished as dark mode.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Skill-session chat page layout matches the design, for every skill type

**Covers:** AC3

**Steps:**
1. Open a generic (non-ideate, non-definition) skill session. Look at the right pane.
2. Open an `/ideate` session. Look at the right pane.
3. Open a `/definition` session. Look at the right pane.
4. Try dragging the divider between the two panes.
5. Toggle between "Focused" and "Chat" view in the left pane.

**Expected outcome:**
> Step 1: right pane shows an artefact draft above a diagrams sub-panel. Step 2: right pane shows Conditions, then Assumptions, then a Canvas section — three separately resizable sections. Step 3: right pane shows a story map above a diagrams sub-panel. Step 4: the divider actually moves and resizes the panes. Step 5: the left pane switches between one-question-at-a-time view and the full chat thread. This should look like the "Skill Session" reference screenshot for each case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Nothing that worked before is now broken

**Covers:** AC4

**Steps:**
1. Answer a question in the chat.
2. If the session has a journey gate ("Continue to [next stage]" button), try it.
3. If the session has diagrams, confirm they still render.
4. Resume a previously-started session from where you left off.

**Expected outcome:**
> Answering a question works and the conversation continues normally. The journey gate button (if present) advances the stage correctly. Diagrams render the same as before. Resuming a session picks up exactly where you left off. Everything behaves exactly as it did before — only the visual styling changed. This is the highest-risk screen in this whole initiative (the largest, most complex real screen), so take extra care checking this scenario doesn't skip anything.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Dark mode) | | |
| Scenario 2 (Light mode) | | |
| Scenario 3 (Layout, all skill types) | | |
| Scenario 4 (No regression) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
