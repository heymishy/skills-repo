# AC Verification Script: Make the "Continue to next stage" action persistently reachable regardless of scroll position

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
**Technical test plan:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s2-test-plan.md
**Script version:** 1
**Verified by:** ______ | **Date:** ______ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a long-running skill session available — one with several completed stages and enough chat history to require scrolling. If you don't have one handy, run through a few turns of any skill session first.
2. A session with an active "Continue to next stage" button showing.

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: The "Continue" button stays on screen while you scroll up

**Covers:** AC1

**Steps:**
1. Open the long-running session from Setup.
2. Scroll all the way up to the beginning of the chat.

**Expected outcome:**
> The "Continue to [next stage] →" button stays visible at the bottom of your screen the whole time — it doesn't disappear or get left behind as you scroll up through earlier messages.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking "Continue" still works exactly as before

**Covers:** AC2

**Steps:**
1. With the "Continue to [next stage] →" button visible, click it.

**Expected outcome:**
> You're taken to the next stage, exactly as this button has always worked. Nothing about clicking it feels different.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: In a short session, the button doesn't look out of place

**Covers:** AC3

**Steps:**
1. Start a brand-new, short session (just the first turn or two) that reaches a stage with a "Continue" button.
2. Look at where the button sits on the page.

**Expected outcome:**
> The button appears right after the content, in its normal position — not floating awkwardly with a big empty gap above it, and not stuck to the bottom of a mostly-empty screen in a way that looks broken.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The sticky button doesn't block anything else you need to click

**Covers:** AC5

**Steps:**
1. In a session that has a sub-step button (e.g. a "Clarify" or "Estimate" button, visible on some stages) near the bottom of the page, close to the "Continue" button.
2. Try clicking that sub-step button.

**Expected outcome:**
> The sub-step button is fully clickable — the sticky "Continue" button doesn't sit on top of it or make it impossible to click.

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
