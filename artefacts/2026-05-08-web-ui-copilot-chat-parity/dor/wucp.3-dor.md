# Definition of Ready Checklist

## Definition of Ready: Tool execution loop — wucp.3

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.3.md
**Test plan reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.3-test-plan.md
**Verification script:** artefacts/2026-05-08-web-ui-copilot-chat-parity/verification-scripts/wucp.3-verification.md
**Review reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/review/wucp.3-review-1.md
**Assessed by:** Copilot (/definition-of-ready)
**Date:** 2026-05-13

---

## Contract Proposal

**What will be built:**

1. New module `src/web-ui/modules/tool-executor.js` exporting: `parseToolMarker`, `setToolExecutor`, `executeTool`, `processModelOutput`, `getToolLog`, `clearToolLog`. Contains: injectable adapter (_execTool defaulting to throw), path-traversal guard (`path.resolve` + `startsWith(repoRoot + sep)`), allowlisted verb check, audit log array, file-not-found handler.
2. Updated `src/web-ui/routes/journey.js` — `buildSystemPrompt()` extended with the WEB UI PROTOCOL section (exact instruction wording from `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md`). No other behaviour in `journey.js` is changed.
3. Production wiring in `src/web-ui/server.js` — `setToolExecutor` called with a real `fs`/`path` adapter before any session handles a message. This is a separate named task from writing the handler.

**What will NOT be built:**
- Write-tool or script execution (`write_file`, `run_script`) — read-only in this story
- Multi-turn tool chaining — single-hop only
- Tool loop for journey stage turns — slash command mode only
- Any changes to `.github/skills/` files
- Persistence of the audit log to disk — in-memory per session only

**How each AC will be verified:**

| AC | Test approach | Type |
|----|--------------|------|
| AC1: read_file marker detected, file read, tool_result injected | T3.1, T3.2, T3.3 | Unit |
| AC2: list_dir marker detected, dir listing returned | T3.4, T3.5 | Unit |
| AC3: malformed marker → notification, no file op | T3.6, T3.7 | Unit |
| AC4: unknown verb rejected with available-tool list | T3.8, T3.9 | Unit |
| AC5: execution logged with 6 required fields | T3.10, T3.11 | Unit |
| AC6: buildSystemPrompt includes WEB UI PROTOCOL | T3.12, T3.13, T3.14 | Unit |
| AC7: stub throws before wiring; setToolExecutor exported; mock called after wiring | T3.15, T3.16, T3.17 | Unit |
| AC8: path traversal → error tool_result, no file read | T3.18, T3.19, T3.20 | Unit |
| AC9: file not found → "[File not found: path]", no throw | T3.21 | Unit |

**Estimated touch points:**
Files: `src/web-ui/modules/tool-executor.js` (new), `src/web-ui/routes/journey.js` (buildSystemPrompt update), `src/web-ui/server.js` (production wiring)
Services: None
APIs: None (fs + path built-ins only, zero external npm dependencies)

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 9 ACs. AC8 interpretation (tool_result injection, not HTTP 400) is documented in review finding 1-M1, the test plan AC8 resolution note, and the updated story text. No contract mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So with named persona | ✅ PASS | "As a platform operator using the web UI, I want the model to be able to read artefact files… So that skills produce output grounded in actual pipeline state" |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS | 9 ACs, all in Given/When/Then format |
| H3 | Every AC has ≥1 test | ✅ PASS | 21 tests covering all 9 ACs |
| H4 | Out-of-scope section populated | ✅ PASS | 4 explicit OOS items: write-tool execution, script execution, journey-mode tool loop, multi-turn chaining |
| H5 | Benefit linkage references named metric | ✅ PASS | M1 (/workflow accuracy), M2 (/trace parity), M3 (outer loop completeness), MM2 (unassisted replication) |
| H6 | Complexity rated | ✅ PASS | Rating 3 |
| H7 | No unresolved HIGH findings | ✅ PASS | Review PASS, 0 HIGH. 1-M1 MEDIUM resolved (AC8 ambiguity); 1-L1 LOW resolved (scope stability updated) |
| H8 | No uncovered ACs | ✅ PASS | 2 manual-only NFR gaps (>50KB truncation, <200ms perf) explicitly declared in test plan with justification |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Story introduces no new pipeline-state.json fields. wucp.0 dependency is a spike with no schema output. schemaDepends declaration not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ PASS | NFR-sec-pathtraversal (ADR-023), D37 injectable adapter rule, zero-npm-deps, no SKILL.md modification, ADR-011 artefact-first all cited and complied with |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS | Server-side only; no layout or browser-rendering ACs |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-08-web-ui-copilot-chat-parity/nfr-profile.md contains wucp.3-specific performance and security NFRs |
| H-NFR2 | No compliance NFR with regulatory clause requiring human sign-off | ✅ PASS | regulated: false; no regulatory clause present |
| H-NFR3 | Data classification not blank | ✅ PASS | "Public / Internal — no personal data, no financial data, no regulated data" |
| H-NFR-profile | Story has NFRs → profile exists | ✅ PASS | NFR profile exists with matching wucp.3 entries |
| H-GOV | Discovery Approved By populated with non-engineering approver | ✅ PASS | "Hamish King — Platform Owner — 2026-05-09" (positive M1 signal: named non-engineering approver) |
| H-ADAPTER | Injectable adapter D37: wiring AC exists, stub throws, wiring as separate task | ✅ PASS | AC7 scopes production wiring in server.js; stub throws "Adapter not wired: toolExecutor"; contract names wiring as a separate task from handler |

**Hard block result: 17/17 PASS — No blocks**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review finding 1-M1 acknowledged in /decisions | ⚠️ Acknowledged | AC8 ambiguity resolution is documented inline (test plan + story). /decisions entry for formal record recommended | Hamish King — 2026-05-13 — RISK-ACCEPT: resolution documented inline; decisions.md entry to be added at /decisions pass |
| W4 | Verification script reviewed by domain expert | ⚠️ Acknowledged | Script mirrors test plan 1:1; S3.10 (manual performance) may miss edge cases | Hamish King — 2026-05-13 — RISK-ACCEPT: script not independently reviewed; risk is low given 1:1 test plan alignment |
| W5 | No UNCERTAIN gaps in test plan | ✅ | — | — |

---

## Oversight Level

**Medium** — parent epic (wucp-runtime-capabilities.md) sets Medium oversight for wucp.3. Rationale: server-side file execution loop with path-traversal implications; human review of security implementation warranted before merge.

**Action required before coding agent assignment:** Share this DoR artefact with the tech lead for awareness. No formal sign-off required (Medium), but tech lead must be notified before the PR is opened for review.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Tool execution loop — wucp.3
Story artefact: artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.3.md
Test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.3-test-plan.md
Test file: tests/check-wucp3-tool-executor.js (21 tests — all currently FAILING)
Verification script: artefacts/2026-05-08-web-ui-copilot-chat-parity/verification-scripts/wucp.3-verification.md
Contract: artefacts/2026-05-08-web-ui-copilot-chat-parity/dor/wucp.3-dor-contract.md

Goal:
Make all 21 tests in tests/check-wucp3-tool-executor.js pass.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints — files in scope:
- src/web-ui/modules/tool-executor.js (NEW — create this file)
- src/web-ui/routes/journey.js (UPDATE — add WEB UI PROTOCOL to buildSystemPrompt())
- src/web-ui/server.js (UPDATE — wire setToolExecutor() production adapter)
- tests/check-wucp3-tool-executor.js (READ ONLY — do not modify the test file)

Constraints — files out of scope:
- .github/skills/ — no skill file modifications
- artefacts/ — no artefact modifications
- Any other src/ file not listed above
- No new npm dependencies — fs and path built-ins only

Architecture standards:
- Read .github/architecture-guardrails.md before implementing
- ADR-023: path traversal guard is mandatory — path.resolve(inputPath) + assert startsWith(repoRoot + path.sep). Return error tool_result turn if check fails; do NOT call the adapter
- D37 injectable adapter rule: the _execTool stub default MUST throw, not return null/empty. Use: throw new Error('Adapter not wired: toolExecutor. Call setToolExecutor() before use.')
- Production wiring (setToolExecutor) in server.js is a SEPARATE task from writing the handler in tool-executor.js — implement both, but commit them as separable logical units
- req.session.accessToken is the canonical session token field — do not use req.session.token

Implementation task order (from DoR contract):
Task 1: Create src/web-ui/modules/tool-executor.js with parseToolMarker, setToolExecutor, executeTool, processModelOutput, getToolLog, clearToolLog
Task 2: Update buildSystemPrompt() in src/web-ui/routes/journey.js with WEB UI PROTOCOL section
Task 3: Wire setToolExecutor production adapter in src/web-ui/server.js

WEB UI PROTOCOL text for buildSystemPrompt() (exact wording from prompt-validation-results.md):

You are running inside a web UI for a software delivery pipeline. The repository is checked out on the server.

When you need to read a file to answer this request, emit exactly this marker on its own line BEFORE writing your response:

<TOOL:read_file path="relative/path/to/file"/>

When you need to list a directory, emit exactly this marker on its own line:

<TOOL:list_dir path="relative/path/to/dir"/>

Rules:
- Always use paths relative to the repo root (e.g. workspace/state.json, not /absolute/path)
- Emit the marker first — do not describe what you are about to read, just emit the marker
- After the marker, continue your response as if you have access to the file contents
- Use only these two tool verbs: read_file, list_dir — no others
- Markers are self-closing: end with />  not with a separate </TOOL:read_file>

AC8 path traversal guard — exact implementation required:
- Call path.resolve(path.join(repoRoot, inputPath)) to get resolvedPath
- Assert resolvedPath.startsWith(repoRoot + path.sep)
- If check fails: do NOT call the tool adapter; return error string containing "out of bounds" or "path not allowed"
- T3.20 tests that path '.' resolves to repoRoot itself (not a child) — this must be rejected

Open a draft PR when all 21 tests pass. Do not mark ready for review.
If you encounter ambiguity not covered by the ACs or tests, add a PR comment and stop — do not improvise.

Oversight level: Medium — tech lead awareness required before merge.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (Medium = tech lead awareness only)
**Signed off by:** Not required (Medium oversight)
**Tech lead notified:** Pending — share this artefact with tech lead before assigning to coding agent
