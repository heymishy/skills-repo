# Definition of Done — p4-enf-mcp

**Story:** p4-enf-mcp — MCP Enforcement Adapter
**Epic:** E3 — Enforcement Runtime
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20
**Commit:** 65c49ef

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | `verifyHash` called before skill body delivery; hash mismatch → structured error returned, no skill body delivered | PASS | T2a–T2b, T3a–T3b — 4 assertions passing |
| AC2 | Valid hash → P2 context injection: `skillBody` + `standards` + `stateContext` all present in tool response | PASS | T4a–T4c — 3 assertions passing |
| AC3 | `writeTrace` called with required fields (`skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`); `surfaceType === "mcp-interactive"` | PASS | T5 ×6, T6a–T6b — 8 assertions passing |
| AC4 | No persistent background process: source contains no `setInterval`, `process.stdin.resume()`, or `server.listen()` | PASS | T7a–T7c — 3 assertions passing |
| AC-C7 | Multi-question payload rejected (C7 single-question enforcement) | PASS | T8 — 1 assertion passing |
| AC-NFR1 | No skill body or content values in console output (MC-SEC-02) | PASS | T-NFR1a–T-NFR1b — 2 assertions passing |
| AC-NFR2 | No hash bypass path in source (`skipVerify`, `bypassHash`, `--no-verify` absent) | PASS | T-NFR2a–T-NFR2c — 3 assertions passing |

All 7 ACs satisfied. All 27 test assertions passing (11 test IDs, 27 check points).

---

## Test Run Evidence

```
node tests/check-p4-enf-mcp.js

[p4-enf-mcp] Results: 27 passed, 0 failed
```

Full suite (`npm test`) — zero failures across all governance check scripts.

---

## Implementation Notes

**File created:** `src/enforcement/mcp-adapter.js` (101 lines)

**Single export:** `handleToolCall(input, ctx)` — the MCP tool boundary function.

**Protocol implemented:**
1. C7 gate — if `input.questions` is an array with more than one item, return `{ error: 'MULTI_QUESTION_REJECTED' }` immediately.
2. C5 gate — call `ctx.govPackage.verifyHash({ skillId, expected, actual })` before `resolveSkill`. Non-null return → return the hash error object; no skill body assembled.
3. Resolve — call `ctx.govPackage.resolveSkill({ skillId, sidecarRoot })` to get `{ content, contentHash }`.
4. Trace — call `ctx.govPackage.writeTrace(...)` with `surfaceType: 'mcp-interactive'` and `inputHash` computed from `crypto.createHash('sha256').update(operatorInput)`.
5. Return — `{ skillBody: skill.content, standards, stateContext }` assembled from injected context parameters.

**Architecture constraints met:**
- C11: no `setInterval`, `server.listen()`, `process.stdin.resume()` — pure per-call function
- C5: `verifyHash` called before `resolveSkill`; no override parameters in adapter
- C7: multi-question payload rejected at entry point
- C4: no auto-approve logic in adapter; approval routing delegated to approval-channel (ADR-006)
- ADR-004: all paths injected via `ctx.sidecarRoot`; no hardcoded filesystem paths
- MC-SEC-02: no `console.log/error/warn` calls with skill body or content values

**Upstream dependency:** `src/enforcement/governance-package.js` (p4-enf-package, commit `b6a4f03`) — imported by callers via `ctx.govPackage`; adapter does not require it directly, enabling stub injection in tests.

**Deviations:** None. Implementation path `src/enforcement/mcp-adapter.js` matches the test file hardcoded path. No files outside the DoR contract scope were modified.

---

## W2 (C11) Scope Instability — Resolution

DoR warning W2 flagged that C11 compliance (no persistent process) may require REDESIGN if VS Code MCP integration cannot support per-call lifecycle. Resolution: the adapter is a pure synchronous function — no server, no daemon, no `process.stdin.resume()`. Per-session lifecycle is at the discretion of the surface host (VS Code or Claude Code), not the adapter itself. C11 satisfied without REDESIGN.

---

## Metric Signal

p4-enf-mcp delivers the first MCP surface enforcement adapter, completing the E3 story pair with p4-enf-package. Any MCP surface adapter in the platform can now invoke `handleToolCall` to enforce hash verification (C5), single-question gating (C7), and trace writing (AC3) with a single function call.

Benefit metric M2 (Consumer confidence): MCP enforcement boundary now structurally prevents skill delivery without hash verification — the Phase 3 vulnerability (state advanced without gate passing) is addressed at the tool call boundary.
