## Story: Tool execution loop — read-only file access for mid-session artefact reads

**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Benefit-metric reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md

## User Story

As a **platform operator using the web UI**,
I want the model to be able to read artefact files and directory listings mid-session,
So that skills like `/workflow`, `/trace`, `/improve`, and `/record-signal` produce output grounded in the actual state of the pipeline — not fabricated content that looks plausible but hasn't read any files.

## Benefit Linkage

**Metric moved:** M1 — `/workflow` pipeline health accuracy; M2 — `/trace` artefact-read parity; M3 — Outer loop completeness; MM2 — Unassisted replication
**How:** M1 and M2 are not measurable without this story — they both require server-side tool execution log evidence. This story creates that log and the loop that drives it. M3 is achievable for simple outer loop phases with wucp.1 + wucp.2, but skills that must read artefacts mid-session (any skill that calls `/workflow` or `/trace` internally) require the tool loop. This story completes the capability set that makes M3's full dogfood signal possible.

## Architecture Constraints

- **NFR-sec-pathtraversal (ADR-023):** Every file read path derived from model output must be validated: `path.resolve(inputPath)` + assert `resolvedPath.startsWith(repoRoot + path.sep)`. HTTP 400 if check fails. A dedicated test must cover the path traversal case and assert both the 400 response and that no file was written or read.
- **D37 (Injectable adapter rule):** The tool executor must be exposed as an injectable adapter (`let _execTool = defaultFn; function setToolExecutor(fn) { _execTool = fn; }`). Default stub must throw: `throw new Error('Adapter not wired: toolExecutor. Call setToolExecutor() before use.')`. Production wiring in `server.js` is a separate named task.
- **`req.session.accessToken`:** Any route that reads the GitHub token from session must use `req.session.accessToken` (not `req.session.token`)
- **Zero external npm dependencies:** tool loop implemented with Node.js `fs` and `path` built-ins only
- **No SKILL.md modifications:** WEB UI PROTOCOL update is an addition to `buildSystemPrompt()`, not a change to any skill file
- **ADR-011 (Artefact-first):** New `src/` modules require a story artefact — this story is the artefact

## DoR PROCEED-BLOCKED Condition

**This story must not be dispatched until:**
`artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md` exists AND documents MM1 emission rate ≥ 60%.

If the spike result (wucp.0) shows emission rate < 60%, this story is blocked pending approach revision. The specific tool marker format, WEB UI PROTOCOL instruction text, and server-side detection pattern in ACs below are contingent on the spike confirming the marker-based approach is viable. If wucp.0 Outcome C fires, ACs will be revised to reflect the chosen alternative approach before dispatch.

## Dependencies

- **Upstream:** wucp.0 (MM1 prompt validation spike) — DoR PROCEED-BLOCKED on `prompt-validation-results.md` ≥ 60%. wucp.1 is recommended before this story (system prompt foundation) but not a hard dependency.
- **Downstream:** M1 and M2 measurement begin after this story ships. Phase 5 WS0 (non-technical channel) and Phase 5 WS5 (improvement agent) both depend on this capability.

## Acceptance Criteria

**AC1:** Given the model emits `<TOOL:read_file path="some/relative/path"/>` in its response, When the server processes the model output stream, Then the server detects the marker (via regex or XML parse), reads the file at the resolved path (path-traversal guarded per AC8), injects a `tool_result` turn into the conversation history, and resumes model generation with the file contents available in context.

**AC2:** Given the model emits `<TOOL:list_dir path="some/relative/dir"/>` in its response, When the server processes it, Then the server returns the directory listing (filenames only, no file contents) as a `tool_result` turn, and model generation resumes.

**AC3:** Given the model emits a malformed tool marker (e.g. `<TOOL:read_file>`, `<TOOL: read_file path="...">`), When the server processes the response, Then the marker is treated as prose — no file operation is attempted, model generation continues, and a notification appears in the turn output: `"[No tool executed — marker format not recognised. Use: <TOOL:read_file path=\"...\"/>]"`.

**AC4:** Given the model emits a tool marker for an unrecognised verb (e.g. `<TOOL:write_file .../>`, `<TOOL:run_script .../>`), When the server processes it, Then the marker is rejected — no operation is attempted, and a notification informs the model: `"[Tool not available: write_file. Available tools: read_file, list_dir]"`.

**AC5:** Given a `read_file` or `list_dir` execution occurs, When the tool loop runs, Then the event is logged server-side with: session ID, skill name in use, tool verb, path requested, turn number, timestamp. This log is the measurement input for M1 and M2.

**AC6:** Given the WEB UI PROTOCOL section of `buildSystemPrompt()` is updated, When a session starts, Then the system prompt includes explicit instructions for the model: the exact marker formats (`<TOOL:read_file path="..."/>` and `<TOOL:list_dir path="..."/>`), the instruction to emit a marker when a file read is needed rather than assuming the content, and the instruction to use relative paths from the repo root. The specific instruction wording comes from the recommendation in `prompt-validation-results.md` (wucp.0 AC3).

**AC7:** Given the tool executor is wired as an injectable adapter, When `server.js` starts, Then the production tool executor is wired before any session handles a message. A test verifies that calling the tool executor before wiring throws the stub error.

**AC8 (Path traversal guard — mandatory):** Given a path-traversal attempt is emitted (e.g. `<TOOL:read_file path="../../../etc/passwd"/>`, `<TOOL:read_file path="/etc/passwd"/>`), When the server processes it, Then `path.resolve(inputPath)` is called, the resolved path is asserted to start with `repoRoot + path.sep`, no file read is attempted, and a `tool_result` error turn is injected informing the model the path was out of bounds. A dedicated test asserts the error turn content and that no file was read. Note: HTTP 400 does not apply here — this guard fires during in-loop model output processing, not at a route boundary. The turn is already accepted; only the file operation is blocked. Resolution documented in review finding 1-M1 (wucp.3-review-1.md, 2026-05-13).

**AC9:** Given a `read_file` path points to a file that does not exist, When the server processes it, Then a `tool_result` turn is injected with the message: `"[File not found: some/relative/path]"`. No error is thrown; model generation continues.

## Out of Scope

- Write-tool execution (creating or modifying files) — tool loop is read-only in this story
- Script execution (`validate-trace.sh`, `npm test`) — requires `child_process` and is a separate post-MVP story
- Tool loop for journey stage turns — tool markers are only detected and executed in slash command mode sessions or sessions where the WEB UI PROTOCOL instruction has explicitly enabled them; journey stage mode without slash command router is not affected
- Multi-turn tool chaining (model reads file A, whose contents reference file B, which triggers another read) — single-hop tool execution only; chaining is a future enhancement

## NFRs

- **Security (path traversal):** AC8 is mandatory — not a recommendation. Covered by existing ADR-023 pattern. A path traversal test case is required and must assert zero file reads on attack inputs.
- **Security (scope):** Readable paths are scoped to the repo root. Absolute paths outside the repo root are rejected. Symlink traversal: if `fs.readFileSync` follows a symlink to a path outside the repo root, the resolved path check catches it.
- **Performance:** Tool loop overhead per turn (marker detection + file read + turn injection) must be under 200ms for files up to 50KB. Pipeline state files are typically 100–300KB — cap read at 50KB per tool call (truncate with notice if exceeded).
- **Audit:** Tool execution log (AC5) is retained in-memory for the session duration. Persisting the log to disk between sessions is post-MVP.
- **Accessibility:** None — server-side only; no UI changes beyond tool result appearing in turn output

## Complexity Rating

**Rating:** 3 (path-traversal security constraint, injectable adapter wiring, multi-turn loop coordination, prompt engineering dependency from wucp.0)
**Scope stability:** Stable — wucp.0 spike confirmed GO (Outcome A, 100% emission rate, 2026-05-13)

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
- [ ] DoR PROCEED-BLOCKED condition satisfied: `prompt-validation-results.md` exists with MM1 ≥ 60%
