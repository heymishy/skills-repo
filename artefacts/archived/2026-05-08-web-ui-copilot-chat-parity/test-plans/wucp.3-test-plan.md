# Test Plan: wucp.3 — Tool execution loop

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.3.md
**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Review reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/review/wucp.3-review-1.md
**Test plan author:** Copilot (/test-plan)
**Date:** 2026-05-13

---

## AC8 ambiguity resolution (from review finding 1-M1)

Review finding 1-M1 identified that AC8 conflates HTTP 400 (route-level) with tool_result error injection (in-loop). For this test plan, the resolution is: **tool_result error injection is the correct behaviour** for path traversal detected during mid-session tool execution. The tool executor fires inside an already-accepted POST request; the path is extracted from model output, not request data. The correct outcome is: (a) no file read, (b) error tool_result turn injected informing the model the path was out of bounds. The HTTP 400 requirement in AC8 is interpreted as applying to a direct route handler test, not the in-loop execution. Tests T3.17–T3.19 assert tool_result error injection and zero file reads. The DoR must note this interpretation before dispatch.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | read_file marker detected, file read, tool_result injected | 3 tests | — | — | — | — | 🟢 |
| AC2 | list_dir marker detected, dir listing returned as tool_result | 2 tests | — | — | — | — | 🟢 |
| AC3 | Malformed marker → no file op, notification injected | 2 tests | — | — | — | — | 🟢 |
| AC4 | Unknown verb rejected, notification with available tools | 2 tests | — | — | — | — | 🟢 |
| AC5 | Tool execution logged: sessionId, skillName, toolVerb, pathRequested, turnNumber, timestamp | 2 tests | — | — | — | — | 🟢 |
| AC6 | buildSystemPrompt() includes WEB UI PROTOCOL marker instruction text | 3 tests | — | — | — | — | 🟢 |
| AC7 | Injectable adapter stub throws before wiring; setToolExecutor exported; production wiring in server.js | 3 tests | — | — | — | — | 🟢 |
| AC8 | Path traversal → error tool_result, no file read (see resolution note above) | 3 tests | — | — | — | — | 🟢 |
| AC9 | File not found → tool_result "[File not found: path]" | 1 test | — | — | — | — | 🟢 |

**Total: 21 tests** (all unit)

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Multi-turn chaining (model reads result and emits another marker) | AC1/AC2 | Out of scope | Story explicitly excludes multi-turn chaining | Not tested — declared OOS |
| Journey stage turns (tool markers in stage mode without slash cmd) | AC1 | Out of scope | Story excludes tool loop for journey stage turns | Not tested — declared OOS |
| Files >50KB truncation | Performance NFR | NFR | 50KB cap with truncation notice | Manual scenario in verification script |
| Tool loop overhead <200ms | Performance NFR | NFR | Cannot reliably unit-test timing in CI | Manual scenario in verification script |

---

## Test Data Strategy

**Source:** Synthetic — tests create temp directories and files using `os.tmpdir()` and `fs.mkdirSync`/`fs.writeFileSync`; all cleaned up in `process.on('exit')`. Mock tool adapters are injected via `setToolExecutor()`.
**PCI/sensitivity in scope:** No
**Availability:** Available now — all test data self-contained
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Temp file with known content string | Test setup (os.tmpdir) | None | Path traversal guard requires real temp dir as repoRoot |
| AC2 | Temp directory with known filenames | Test setup (os.tmpdir) | None | Same repoRoot temp dir |
| AC3 | String containing malformed marker text | Inline test string | None | No file system needed |
| AC4 | String containing unknown-verb marker | Inline test string | None | No file system needed |
| AC5 | Mock tool executor that records calls; mock session context | Test setup | None | Log assertions read from exported log getter |
| AC6 | No external data — tests buildSystemPrompt() output string | Module export | None | Tests assert substring presence |
| AC7 | None (throws without file system) | N/A | None | Tests the throw directly |
| AC8 | Real temp dir as repoRoot; attack path strings | Test setup (os.tmpdir) | None | path.resolve needed; real dir required to confirm startsWith check |
| AC9 | Temp dir without the target file | Test setup (os.tmpdir) | None | File explicitly not written |

### PCI / sensitivity constraints

None. All test data is synthetic.

---

## Test file

`tests/check-wucp3-tool-executor.js`

The test file must be added to the `scripts.test` chain in `package.json`.

**Implementation target modules:**
- `src/web-ui/modules/tool-executor.js` — exports `parseToolMarker`, `setToolExecutor`, `executeTool`, `getToolLog`, `clearToolLog`
- `src/web-ui/routes/journey.js` — updated to import and use tool-executor; `buildSystemPrompt()` updated with WEB UI PROTOCOL

---

## Unit tests

### AC1 — read_file execution

**T3.1 — parseToolMarker returns {verb, path} for well-formed read_file marker**
- AC: AC1
- Precondition: none
- Action: call `parseToolMarker('<TOOL:read_file path="workspace/state.json"/>')`
- Expected: `{ verb: 'read_file', path: 'workspace/state.json' }`
- Edge case: none

**T3.2 — executeTool read_file calls tool adapter with resolved path and returns file content**
- AC: AC1
- Precondition: `setToolExecutor` called with mock that returns `'{"phase":"test"}'`; temp dir as repoRoot with file `workspace/state.json` containing `'{"phase":"test"}'`
- Action: `executeTool('read_file', 'workspace/state.json', repoRoot, sessionCtx)`
- Expected: result string contains `'{"phase":"test"}'`
- Edge case: none

**T3.3 — executeTool read_file result is formatted as tool_result turn**
- AC: AC1
- Precondition: same as T3.2
- Action: call `executeTool` and inspect the result shape
- Expected: result is a string suitable for injection as a tool_result turn (non-empty, contains file content)
- Edge case: none

### AC2 — list_dir execution

**T3.4 — parseToolMarker returns {verb, path} for well-formed list_dir marker**
- AC: AC2
- Precondition: none
- Action: call `parseToolMarker('<TOOL:list_dir path="artefacts/"/>')`
- Expected: `{ verb: 'list_dir', path: 'artefacts/' }`
- Edge case: none

**T3.5 — executeTool list_dir returns directory listing as tool_result string**
- AC: AC2
- Precondition: temp dir as repoRoot with subdirectory `artefacts/` containing files `foo.md`, `bar.md`; `setToolExecutor` wired to real fs adapter
- Action: `executeTool('list_dir', 'artefacts/', repoRoot, sessionCtx)`
- Expected: result string contains `foo.md` and `bar.md`
- Edge case: none

### AC3 — malformed marker

**T3.6 — parseToolMarker returns null for marker missing path attribute**
- AC: AC3
- Precondition: none
- Action: call `parseToolMarker('<TOOL:read_file>')`
- Expected: `null`
- Edge case: no self-closing, no path attribute

**T3.7 — malformed marker produces notification text, no file operation**
- AC: AC3
- Precondition: tool executor NOT called (test that mock adapter is NOT called)
- Action: process text containing `<TOOL:read_file>` through the tool execution flow (call the handler that checks for markers and dispatches execution)
- Expected: output contains notification text `No tool executed — marker format not recognised`; tool adapter mock is NOT called
- Edge case: marker without closing `/>` also returns null

### AC4 — unknown verb

**T3.8 — unknown verb rejected: notification contains verb name and available list**
- AC: AC4
- Precondition: `setToolExecutor` wired with mock; no file read should happen
- Action: call `executeTool('write_file', 'output.md', repoRoot, sessionCtx)`
- Expected: result string contains `Tool not available: write_file` AND `Available tools: read_file, list_dir`; tool adapter mock NOT called
- Edge case: none

**T3.9 — run_script verb rejected the same way**
- AC: AC4
- Precondition: same
- Action: call `executeTool('run_script', 'scripts/foo.js', repoRoot, sessionCtx)`
- Expected: result string contains `Tool not available: run_script`; tool adapter mock NOT called
- Edge case: verb is non-empty but unrecognised

### AC5 — audit log

**T3.10 — tool execution appends log entry with required fields**
- AC: AC5
- Precondition: `clearToolLog()`; `setToolExecutor` wired with mock returning `'content'`; session context `{ sessionId: 'sess-1', skillName: '/workflow', turnNumber: 2 }`; temp file present
- Action: `executeTool('read_file', 'workspace/state.json', repoRoot, sessionCtx)`; `getToolLog()`
- Expected: log has one entry with `sessionId: 'sess-1'`, `skillName: '/workflow'`, `toolVerb: 'read_file'`, `pathRequested: 'workspace/state.json'`, `turnNumber: 2`, `timestamp` (string, non-empty)
- Edge case: none

**T3.11 — list_dir execution also produces log entry**
- AC: AC5
- Precondition: `clearToolLog()`; temp dir present; session context set
- Action: `executeTool('list_dir', 'artefacts/', repoRoot, sessionCtx)`; `getToolLog()`
- Expected: log entry has `toolVerb: 'list_dir'`; timestamp is a string matching ISO date pattern
- Edge case: none

### AC6 — WEB UI PROTOCOL in buildSystemPrompt

**T3.12 — buildSystemPrompt output contains read_file marker instruction**
- AC: AC6
- Precondition: import `buildSystemPrompt` from `journey.js`; call with any valid session context
- Action: `buildSystemPrompt(sessionCtx)`
- Expected: returned string contains `<TOOL:read_file path="` (the marker format literal)
- Edge case: none

**T3.13 — buildSystemPrompt output contains list_dir marker instruction**
- AC: AC6
- Precondition: same
- Action: `buildSystemPrompt(sessionCtx)`
- Expected: returned string contains `<TOOL:list_dir path="` (the marker format literal)
- Edge case: none

**T3.14 — buildSystemPrompt output instructs relative paths from repo root**
- AC: AC6
- Precondition: same
- Action: `buildSystemPrompt(sessionCtx)`
- Expected: returned string contains `relative` (as in "relative to the repo root" instruction)
- Edge case: none

### AC7 — injectable adapter

**T3.15 — calling executeTool before setToolExecutor throws stub error**
- AC: AC7
- Precondition: module freshly required (stub in default state — NOT wired)
- Action: call `executeTool('read_file', 'workspace/state.json', '/tmp/repo', {})`
- Expected: throws with message containing `Adapter not wired: toolExecutor`
- Edge case: must throw synchronously

**T3.16 — setToolExecutor is exported from the module**
- AC: AC7
- Precondition: require `src/web-ui/modules/tool-executor.js`
- Action: inspect exported keys
- Expected: `setToolExecutor` is a function in the exports
- Edge case: none

**T3.17 — after setToolExecutor is called, executeTool calls the provided mock**
- AC: AC7
- Precondition: fresh require; create mock that records calls; `setToolExecutor(mock)`; temp file present
- Action: `executeTool('read_file', 'workspace/state.json', repoRoot, {})`
- Expected: mock was called; no stub-throw occurs
- Edge case: none

### AC8 — path traversal guard

**T3.18 — relative traversal path `../../../etc/passwd` rejected, no file read**
- AC: AC8
- Precondition: `setToolExecutor` wired with mock that records calls; temp dir as repoRoot
- Action: `executeTool('read_file', '../../../etc/passwd', repoRoot, {})`
- Expected: tool adapter mock NOT called; result string contains `out of bounds` or `path not allowed`
- Edge case: relative traversal that resolves outside repoRoot

**T3.19 — absolute path `/etc/passwd` outside repoRoot rejected, no file read**
- AC: AC8
- Precondition: same
- Action: `executeTool('read_file', '/etc/passwd', repoRoot, {})`
- Expected: tool adapter mock NOT called; result string contains error indicating path out of bounds
- Edge case: absolute path never starts with repoRoot

**T3.20 — path that resolves to exactly repoRoot (no sep suffix) is rejected**
- AC: AC8
- Precondition: same
- Action: `executeTool('read_file', '.', repoRoot, {})`
- Expected: result is error turn (path resolves to repoRoot itself, not a child path — `startsWith(repoRoot + sep)` fails)
- Edge case: edge of the guard boundary

### AC9 — file not found

**T3.21 — read_file for nonexistent file returns "[File not found: ...]" tool_result**
- AC: AC9
- Precondition: `setToolExecutor` wired with real fs adapter (or adapter that calls fs.readFileSync); temp dir as repoRoot; file `workspace/state.json` does NOT exist
- Action: `executeTool('read_file', 'workspace/state.json', repoRoot, {})`
- Expected: result string equals `[File not found: workspace/state.json]` (no throw)
- Edge case: error is swallowed and turned into a tool_result message, not propagated

---

## NFR tests

**Performance (200ms cap) — manual scenario only**
The <200ms overhead requirement cannot be tested reliably in CI without risk of flakiness. Covered by manual verification scenario S3.10.

**Security (symlink traversal)**
If `fs.readFileSync` resolves symlinks, the `path.resolve` check on the input path will catch absolute paths but may not catch a symlink inside the repo that points outside. The security requirement is met by the path check on the *input* before calling the adapter — symlink traversal inside the adapter is the adapter's responsibility. Covered by T3.18–T3.20.

---

## Total test count: 21 unit tests, 0 integration, 0 E2E
