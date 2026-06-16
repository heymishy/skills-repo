# AC Verification Script: Add pino structured logging to the web server

**Story reference:** artefacts/2026-06-15-web-observability/stories/obs-1.md
**Technical test plan:** artefacts/2026-06-15-web-observability/test-plans/obs-1-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**

1. The web server must be running locally. Start it with:

   ```powershell
   # PowerShell — load .env then start server
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```

   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```

2. You need a browser open to the local server (usually `http://localhost:3000`).
3. Keep the terminal where the server is running visible — you will be reading log output from it during verification.
4. You need to be signed in with a GitHub account that has access to the /ideate skill.

**Reset between scenarios:** None required — each scenario starts a fresh SSE turn.

---

## Scenarios

---

### Scenario 1: Every turn has a correlation ID in the server logs

**Covers:** AC1

**Steps:**
1. In the browser, open the /ideate session page.
2. Type any short question (e.g. "What are three ideas for a dog-walking app?") into the chat input and press Send.
3. While the response streams in, look at the terminal where the server is running.
4. Search the log output for a line containing `"event":"sse_open"`.

**Expected outcome:**
> The log line with `"event":"sse_open"` contains a `"correlationId"` field with a non-empty string value (e.g. `"correlationId":"abc123..."`). All other log lines emitted for the same turn (LLM call, stream close) also contain the same `correlationId` value — you can verify this by copying the ID and scanning the terminal output for it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: LLM call duration appears in the logs after a turn completes

**Covers:** AC2

**Steps:**
1. Send any question through the /ideate chat interface and wait for the response to finish streaming.
2. In the server terminal, look for a log line containing `"event":"llm_complete"`.

**Expected outcome:**
> The log line contains:
> - `"event":"llm_complete"`
> - `"llm_duration_ms"` with a positive integer value (e.g. `"llm_duration_ms":2341`)
> - `"correlationId"` matching the ID from Scenario 1's `sse_open` event for the same turn

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3a: Stream open is logged when a turn starts

**Covers:** AC3 (open path)

**Steps:**
1. Send any question and observe the server terminal immediately after pressing Send.
2. Find the first log line that appears for this turn.

**Expected outcome:**
> The first log line for the turn has `"event":"sse_open"` and a `"correlationId"` field. It should appear before any `llm_complete` or `sse_close` events.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3b: Stream close is logged when a turn ends normally

**Covers:** AC3 (normal close path)

**Steps:**
1. Send a question and wait for the full response to appear in the browser.
2. In the server terminal, look for a log line containing `"event":"sse_close"`.

**Expected outcome:**
> A log line with `"event":"sse_close"` appears after the `llm_complete` event. It contains a `"chunk_count"` field with a positive integer (the number of SSE chunks sent during this turn) and the same `"correlationId"` as the other events for this turn.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3c: Stream error is logged when a turn fails

**Covers:** AC3 (error close path)

*Note: This scenario is harder to trigger in a live session. If you can simulate a network drop or LLM API error (e.g. by temporarily providing an invalid API key in .env and restarting), use that. Otherwise, note this scenario as "deferred to automated test" and mark it as pending manual verification.*

**Steps:**
1. If possible: cause the LLM adapter to fail (e.g. disconnect network after sending a turn, or use an invalid API key).
2. Observe the server terminal.

**Expected outcome:**
> A log line with `"event":"sse_error"` appears containing an `"error_message"` field (non-empty string describing the error) and the same `"correlationId"` as the `sse_open` event for that turn. No raw stack trace should appear in the `"msg"` field at `info` level — stack traces should only appear at `error` level.

**Result:** [ ] Pass  [ ] Fail  [ ] Deferred — automated test covers this path
**Notes:**

---

### Scenario 4: No GitHub access token appears in the server logs

**Covers:** AC4

**Steps:**
1. Look at your `.env` file and find the `GITHUB_CLIENT_SECRET` or any `GITHUB_TOKEN` value. Note the first 8 characters only (do not write the full value anywhere).
2. Send a turn through the /ideate interface.
3. In the server terminal, scroll through all log lines emitted during the turn.

**Expected outcome:**
> None of the log lines contain the access token value you noted. The `"msg"` field and all other fields in every log line are free of any token string starting with `ghp_`, `ghs_`, or your specific credential prefix.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Log output is structured JSON, not plain text

**Covers:** AC5

**Steps:**
1. Send a turn through the /ideate interface.
2. Copy one of the log lines from the server terminal.
3. Open a browser console or Node.js REPL and run `JSON.parse('<paste the line here>')`.

**Expected outcome:**
> `JSON.parse` succeeds without throwing an error. The resulting object has at minimum these fields: `level` (a number or string like `"info"`), `time` (a large number — Unix timestamp in milliseconds), `msg` (a string), and `correlationId` (a non-empty string).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Existing test suite passes with no regressions

**Covers:** AC6

**Steps:**
1. Stop the local server if it is running.
2. In a terminal at the project root, run: `npm test`
3. Wait for the full test suite to complete.

**Expected outcome:**
> The test suite completes with 0 failures. No test that was passing before this story was implemented now fails. The final line of output should report all tests passing (or the same number of skips/warnings as before this change was made).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Two concurrent turns have different correlation IDs

**Covers:** AC1

*Difficult to verify manually in a single-user session — note this is covered by automated test T2. Skip if not able to trigger two simultaneous turns.*

**Steps:**
1. If your session supports it: open two browser tabs and send a turn from each simultaneously.
2. In the server terminal, identify the `sse_open` events for each turn.

**Expected outcome:**
> The two `sse_open` events have different `correlationId` values. No two concurrent turns share an ID.

**Result:** [ ] Pass  [ ] Fail  [ ] Deferred — automated test T2 covers this
**Notes:**

---

### NFR check: Log output does not visibly slow down the first response character

**Covers:** NFR-PERF-1

**Steps:**
1. Send a question through the /ideate interface.
2. Count (or estimate) the time from pressing Send to the first character appearing in the response area.
3. Compare to your recollection of response time before this story was implemented.

**Expected outcome:**
> The time to first character is not noticeably longer than before pino was added. There is no visible pause or delay before streaming begins. (Formal measurement: ≤5ms difference — confirmed by the implementer's timing notes in the test plan gap row.)

**Result:** [ ] Pass  [ ] Fail  [ ] No observable difference
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1: correlationId in every turn | | |
| Scenario 2: LLM duration logged | | |
| Scenario 3a: sse_open logged | | |
| Scenario 3b: sse_close logged with chunk_count | | |
| Scenario 3c: sse_error logged on failure | | |
| Scenario 4: No access token in logs | | |
| Scenario 5: Log output is valid JSON | | |
| Scenario 6: npm test passes | | |
| Edge case: Concurrent turns have different IDs | | |
| NFR check: No visible latency increase | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
