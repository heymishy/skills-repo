# AC Verification Script — wucp.3: Tool execution loop

**Story:** Tool execution loop — read-only file access for mid-session artefact reads
**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Test plan reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.3-test-plan.md
**Date:** 2026-05-13
**Audiences:** BA / QA / PM pre-code sign-off; post-merge smoke test; delivery review

---

## Setup

Before running any scenario, start the web UI server and confirm it is running:

```powershell
# PowerShell — load .env then start server
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

Open the web UI at `http://localhost:3000`. Log in if prompted.

To run the automated test suite:
```
node tests/check-wucp3-tool-executor.js
```

All 21 tests must pass before this script is used for post-merge smoke testing.

---

## Scenario S3.1 — Successful file read (AC1)

**What to check:** When you ask a skill to read a specific pipeline artefact, the response is grounded in the actual file contents, not a generic answer.

1. Start a new session and type: `/workflow`
2. Observe the response. If the tool loop is working, the response will reference actual artefact content — for example, naming real story slugs or a phase that matches the current pipeline state.
3. Check the server console output. You should see a log line like: `[tool] read_file workspace/state.json sess=<id> turn=1`

**Pass:** Response references real pipeline data; server log shows a tool execution line.
**Fail:** Response is generic ("I can help you understand your pipeline") with no specific artefact data; no server log entry.

---

## Scenario S3.2 — Successful directory listing (AC2)

**What to check:** When a skill needs to list which artefacts are present, it returns actual filenames.

1. Start a new session and type: `/trace`
2. If the tool loop is working, the response will mention actual artefact directory contents — for example, specific story slugs that exist in `artefacts/`.
3. Check the server console for a log line containing `list_dir`.

**Pass:** Response names real directory entries; server log shows `list_dir` entry.
**Fail:** Response lists generic placeholders or invents filenames; no list_dir log.

---

## Scenario S3.3 — Malformed marker handled safely (AC3)

**What to check:** If the model produces a malformed marker (missing path or wrong syntax), the session does not break — a notification is shown and the turn continues.

1. This is an edge case that requires a test fixture or direct inspection of the tool loop code. Run the automated test: `node tests/check-wucp3-tool-executor.js` and confirm T3.6 and T3.7 pass.
2. In the test output, T3.7 must confirm: "no file operation attempted" and "notification text present".

**Pass:** T3.6 and T3.7 pass.
**Fail:** Either test fails, or the malformed marker causes an unhandled exception in the test.

---

## Scenario S3.4 — Unknown tool verb rejected (AC4)

**What to check:** If the model were to emit a write or execute marker, the server rejects it and informs the model which tools are available.

1. Run automated tests T3.8 and T3.9: `node tests/check-wucp3-tool-executor.js`
2. Confirm both pass with the message "Tool not available: [verb]. Available tools: read_file, list_dir"

**Pass:** T3.8 and T3.9 pass; no file operation executed.
**Fail:** Either test fails; a write or execute operation is attempted.

---

## Scenario S3.5 — Audit log records tool executions (AC5)

**What to check:** Every tool execution is logged for measurement purposes (M1, M2 metrics rely on this log).

1. Run automated tests T3.10 and T3.11.
2. Confirm T3.10 log entry has: sessionId, skillName, toolVerb, pathRequested, turnNumber, timestamp.
3. Confirm T3.11 records list_dir entries too.

**Pass:** Both tests pass; all required log fields present.
**Fail:** Either test fails, or a required field is missing from the log.

---

## Scenario S3.6 — WEB UI PROTOCOL in system prompt (AC6)

**What to check:** When a session starts, the system prompt includes the WEB UI PROTOCOL instruction so the model knows how to emit tool markers.

1. Run automated tests T3.12, T3.13, T3.14.
2. Confirm the system prompt string contains the read_file marker format, the list_dir marker format, and "relative" (as in relative path instructions).

**Pass:** All three tests pass.
**Fail:** Any test fails; the model will not know the correct marker format and will not emit tools.

---

## Scenario S3.7 — Unwired adapter throws before server.js wires it (AC7)

**What to check:** If someone calls the tool executor before it is properly wired, a clear error is thrown rather than a silent failure.

1. Run automated test T3.15.
2. Confirm the error message contains "Adapter not wired: toolExecutor".

**Pass:** T3.15 passes; error thrown synchronously.
**Fail:** T3.15 fails; stub returns null/empty silently, masking misconfiguration.

---

## Scenario S3.8 — Path traversal attack blocked (AC8)

**What to check:** If the model (or an attacker who can influence model output) emits a path like `../../../etc/passwd`, the server does not read it.

1. Run automated tests T3.18, T3.19, T3.20.
2. Confirm: tool adapter NOT called; result contains error text indicating path was out of bounds.

**Pass:** All three tests pass; no file read attempted for any attack path.
**Fail:** Any test fails; the file read would be attempted on a path outside the repo.

---

## Scenario S3.9 — File not found returns safe message (AC9)

**What to check:** If the model asks to read a file that does not exist, the session continues and the model receives a clear "file not found" message rather than an unhandled exception.

1. Run automated test T3.21.
2. Confirm result string is `[File not found: workspace/state.json]`; no exception thrown.

**Pass:** T3.21 passes.
**Fail:** T3.21 fails; an exception is thrown and the session crashes.

---

## Scenario S3.10 — Performance: tool loop overhead (NFR) 🔴

**Manual only — cannot be tested in unit CI**

1. Start the server and open a `/workflow` session.
2. Using the server console timestamps, note the time from when the POST /api/session request arrives to when the turn response is written (including any tool executions that occurred).
3. If tool executions occurred, the added overhead (above a turn without tool executions) should be under 200ms for files up to 50KB.

**Pass:** Tool loop overhead is imperceptible in normal use; files under 50KB return in under 200ms.
**Fail:** Tool reads block the response for a noticeable duration (>500ms); investigate file size or synchronous I/O blocking.

---

## Reset instructions

Each scenario is independent. If you run them in order:
- Scenarios S3.1–S3.2 start a fresh web UI session each time (use "New session" button or reload).
- Scenarios S3.3–S3.9 use the automated test runner only — no state between runs.
- S3.10 requires a manual server restart if the server is in an error state.
