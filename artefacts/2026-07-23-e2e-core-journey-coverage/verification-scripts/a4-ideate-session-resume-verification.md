# AC Verification Script: Assert full session close/resume mid-SSE-stream for the ideate canvas

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a4-ideate-session-resume.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a4-ideate-session-resume-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an active `/ideate` session with at least one canvas card, ready to continue chatting (from A3's scenarios).
2. Have access to the session-state store or an engineer who can query it, for scenarios that check server-side state directly.

**Reset between scenarios:** Scenarios 1-3 build on the same session in sequence — do them in order without resetting.

---

## Scenarios

---

### Scenario 1: Closing the browser mid-response doesn't lose your in-progress turn

**Covers:** AC1

**Steps:**
1. Type a new message in the `/ideate` session and send it.
2. While the response is still streaming in (before it finishes), close the browser tab.
3. Ask an engineer to check the session's server-side state for this session ID.

**Expected outcome:**
> The server still has a record that a turn was in progress when you closed the tab — it isn't as if nothing happened.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Reopening the session shows everything exactly as you left it

**Covers:** AC2

**Steps:**
1. Copy the session's URL (from before you closed it in Scenario 1).
2. Open it in a new browser tab.

**Expected outcome:**
> The canvas shows the same cards/blocks as before you closed the tab. The chat history above shows the same messages, in the same order.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The conversation picks up where it left off, not from scratch

**Covers:** AC3

**Steps:**
1. In the reopened session from Scenario 2, send a message that refers back to something specific you said earlier (e.g. "what did you think of the idea about [specific detail from an earlier message]?").

**Expected outcome:**
> The response makes sense in light of the earlier detail — it doesn't act like it has no memory of the conversation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The canvas data specifically is restored, not just the chat text

**Covers:** AC4

**Steps:**
1. Ask an engineer to look up the resumed session's saved canvas data (`canvasBlocks`) directly in the session store.

**Expected outcome:**
> The canvas data is present and matches what was shown on screen — it wasn't dropped during the close/reopen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A different account can't open your session

**Covers:** NFR — Security

**Steps:**
1. Sign out, or open a private/incognito browser window.
2. Paste the session URL from Scenario 2 without signing in (or signed in as a different account).

**Expected outcome:**
> You're blocked from viewing the session (a sign-in prompt or an access-denied message) — you do not see the conversation or canvas content.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
