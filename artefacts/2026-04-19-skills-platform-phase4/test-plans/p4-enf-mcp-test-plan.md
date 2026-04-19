# Test Plan: p4-enf-mcp

**Story:** MCP enforcement adapter for VS Code and Claude Code surfaces
**Epic:** E3 — Structural enforcement
**Complexity:** 3 | **Scope stability:** Unstable (C11 — persistent process constraint)
**Implementation path:** `src/enforcement/mcp-adapter.js`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|-----|-------------|------|
| T1 | AC1 | MCP adapter module exists and exports handleToolCall | Unit |
| T2 | AC1 | handleToolCall calls verifyHash before delivering skill body | Unit |
| T3 | AC1 | HASH_MISMATCH → structured error returned, no skill body delivered | Unit |
| T4 | AC2 | Valid hash → P2 context injection assembles skill + standards + state | Unit |
| T5 | AC3 | writeTrace called; trace has all required fields | Unit |
| T6 | AC3 | surfaceType is "mcp-interactive" in trace entry | Unit |
| T7 | AC4 | Adapter process exits after tool call (no persistent process) | Unit |
| T8 | AC3 | C7 single-question enforcement — multi-question payload → rejected | Unit |
| T-NFR1 | NFR | No skill content in external logs (source scan) | Security |
| T-NFR2 | NFR | No bypass path for hash verification in source | Security |

---

## Test Specifications

### T1 — MCP adapter module exists and exports handleToolCall

**Preconditions:** `src/enforcement/mcp-adapter.js` does not yet exist.
**Input:** `require('../src/enforcement/mcp-adapter.js')`.
**Expected:** Module exports `handleToolCall` as a function.
**Failure state (before implementation):** Module does not exist → test fails.

---

### T2 — handleToolCall calls verifyHash before skill body delivery

**Preconditions:** T1 passes; stub governance package with spy on verifyHash.
**Input:** Call `handleToolCall({ skillId: 'discovery', operatorInput: 'what is scope?' }, { govPackage: stub })`.
**Expected:** The verifyHash spy is called before any skill content is assembled in the response.
**Failure state (before implementation):** Module missing.

---

### T3 — HASH_MISMATCH → structured error, no skill body

**Preconditions:** T1 passes; verifyHash stub returns `{ error: "HASH_MISMATCH", skillId: "discovery", expected: "aaa...", actual: "bbb..." }`.
**Input:** `handleToolCall(...)`.
**Expected:** Response contains error object with `error: "HASH_MISMATCH"` and `skillBody` field is absent or null.
**Failure state (before implementation):** Module missing.

---

### T4 — Valid hash → P2 context injection

**Preconditions:** T1 passes; verifyHash stub returns null; resolveSkill returns fixture skill.
**Input:** `handleToolCall({ skillId: 'discovery', operatorInput: 'start session' }, { govPackage: stub, sidecarRoot: fixtureDir })`.
**Expected:** Response includes `skillBody` (skill file text), `standards` (array or string from sidecar), and `stateContext` (current workflow state) — all three present in return object.
**Failure state (before implementation):** Module missing.

---

### T5 — writeTrace called with all required fields

**Preconditions:** T1 passes; spy on writeTrace; valid hash stub.
**Input:** Complete tool call flow.
**Expected:** writeTrace called once with object containing `skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`.
**Failure state (before implementation):** Module missing.

---

### T6 — surfaceType is "mcp-interactive"

**Preconditions:** T5 passes.
**Input:** Captured writeTrace argument.
**Expected:** `surfaceType === "mcp-interactive"`.
**Failure state (before implementation):** Module missing.

---

### T7 — No persistent process after tool call

**Preconditions:** `src/enforcement/mcp-adapter.js` exists.
**Input:** Source scan for persistent process spawning patterns.
**Expected:** Source does not contain `setInterval`, `server.listen` called outside a request handler, or `process.stdin.resume()` at module scope.
**Failure state (before implementation):** Module missing → scan fails.

---

### T8 — C7 single-question enforcement

**Preconditions:** T1 passes; multi-question payload fixture.
**Input:** `handleToolCall({ questions: ['q1', 'q2'], skillId: 'discovery' }, ...)`.
**Expected:** Returns error object indicating multi-question payload rejected; no skill body returned.
**Failure state (before implementation):** Module missing.

---

### T-NFR1 — No skill content in external logs

**Preconditions:** Module source exists.
**Input:** Read `src/enforcement/mcp-adapter.js`.
**Expected:** No `console.log`, `console.error`, or `process.stdout.write` call that has `skillBody` or `content` as argument.
**Failure state (before implementation):** Module missing.

---

### T-NFR2 — No hash bypass path in source

**Preconditions:** Module source exists.
**Input:** Read module source.
**Expected:** No `skipVerify`, `force`, `bypassHash`, or `--no-verify` string in source.
**Failure state (before implementation):** Module missing.

---

## Module under test

- `src/enforcement/mcp-adapter.js` — exports `handleToolCall`; imports governance package

---

## NFR Summary

- Security: no skill content or operator input logged externally (MC-SEC-02); no hash bypass path
- Correctness: P1–P4 fidelity covered; trace validated
- Performance: tool call overhead ≤500ms (manual verification; not unit tested)
