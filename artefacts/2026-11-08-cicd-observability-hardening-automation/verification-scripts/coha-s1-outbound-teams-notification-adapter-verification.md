# AC Verification Script: Outbound Teams chat-notification adapter

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s1-outbound-teams-notification-adapter.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s1-outbound-teams-notification-adapter-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story has no user interface — it is a background CI mechanism. Verification is done by watching a test Teams channel and by triggering a test send from a terminal.
2. Set up a test Microsoft Teams Incoming Webhook on a channel you own, and set `TEAMS_WEBHOOK_URL` to that webhook's URL in your local `.env` file (never commit this value).
3. Have the Teams channel open on screen so you can see messages arrive in real time.

**Reset between scenarios:** No reset needed — each scenario sends an independent message.

---

## Scenarios

---

### Scenario 1: Sending a message successfully reaches the Teams channel

**Covers:** AC1

**Steps:**
1. Run the send function from a terminal with a test message, for example `"Test: patch announce"`.
2. Watch the Teams channel.

**Expected outcome:**
> Within a few seconds, the message `"Test: patch announce"` appears as a new post in the Teams channel. The terminal reports a success result (not an error).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A failed send is reported, never silently ignored

**Covers:** AC2

**Steps:**
1. Temporarily set `TEAMS_WEBHOOK_URL` to an invalid URL (e.g. a URL that doesn't resolve).
2. Run the send function with a test message.

**Expected outcome:**
> The terminal reports a clear failure result — something like `"send failed: <reason>"` — not a success message, and not a crash with no explanation. No message appears in the Teams channel.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Calling the adapter before it is wired throws a clear error

**Covers:** AC3

**Steps:**
1. In a fresh test environment where the real implementation has not yet been wired (ask the implementer to point you at the unwired code path, or run the unit test suite's AC3 test and read its output).
2. Observe the error message produced.

**Expected outcome:**
> The error message reads exactly: `"Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use."` It is not a generic "undefined is not a function" error, and the call does not silently succeed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Two different messages produce two genuinely different notifications

**Covers:** AC4

**Steps:**
1. Run the send function once with the message `"Test: message A"`.
2. Run it again with the message `"Test: message B"`.
3. Compare the two posts that arrive in the Teams channel.

**Expected outcome:**
> The Teams channel shows two separate posts, and the text of each post matches its own input exactly — the first post says `"Test: message A"` and the second says `"Test: message B"`. They are not identical, and neither is blank or generic.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Webhook is slow or unreachable — the caller is not left hanging

**Covers:** NFR — Performance (bounded timeout)

**Steps:**
1. Point `TEAMS_WEBHOOK_URL` at an address that accepts connections but never responds (ask the implementer to help set this up, or use a known slow test endpoint).
2. Run the send function and time how long it takes to return a result.

**Expected outcome:**
> The send function returns a failure result within about 10 seconds. It does not hang indefinitely.

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
