# Theme F Evidence Chain Inputs

**Story:** p4-enf-second-line — Theme F second-line evidence chain inputs
**Epic:** E3 — Structural Enforcement
**Feature:** 2026-04-19-skills-platform-phase4
**Date:** 2026-04-20
**Status:** Phase 4 deliverable — complete

This document provides the evidence chain inputs for Theme F second-line review. It records the three enforcement contracts produced by E3 (CLI, workflow declaration, MCP), documents the executorIdentity field as optional per ADR-003, and explicitly distinguishes what is in Phase 4 scope from what remains in Theme F scope per Craig's Q4 clarification decision.

---

## 1. CLI Verification Contract

The CLI enforcement adapter (`src/enforcement/cli-adapter.js`) produces trace entries via `emitTrace`. Each entry contains the following required fields:

| Field | Type | Description |
|-------|------|-------------|
| `skillId` | string | Identifier of the skill invoked at this CLI step |
| `skillHash` | string (64-char hex) | SHA-256 digest of hash-verified skill content (C5) |
| `inputHash` | string (64-char hex) | SHA-256 digest of the operator input for this call |
| `outputRef` | string | Artefact path or reference identifier for the output |
| `transitionTaken` | string | State transition taken, e.g. `discovery->definition` |
| `surfaceType` | string | Surface class: `cli` for CLI adapter calls |
| `timestamp` | string (ISO 8601) | UTC timestamp of the trace entry |
| `executorIdentity` | string | **Optional** — identity of the executing agent or operator. Optional per ADR-003 (Craig's Q4 clarification). Second-line reviewers cannot require its presence. |

**Per-node hash verification:** `advance` verifies `skillHash` against the declared expected hash before building the state envelope. A mismatch returns `{ error: 'HASH_MISMATCH' }` and prevents the transition. This is the C5 enforcement point at the CLI surface.

**Transition enforcement:** `advance` validates the requested transition against `allowedTransitions` in the workflow declaration (ADR-002). Transitions not listed in `allowedTransitions` are rejected with `{ error: 'TRANSITION_NOT_PERMITTED' }` before hash verification runs.

---

## 2. Workflow Declaration Structure

Workflow declarations govern which state transitions are permitted. The E3 enforcement runtime reads declarations via the governance package (`src/enforcement/governance-package.js`).

### Declaration structure

```json
{
  "id": "workflow-slug",
  "nodes": [
    {
      "id": "discovery",
      "allowedTransitions": ["definition"],
      "expected-output-shape": null
    },
    {
      "id": "definition",
      "allowedTransitions": ["review", "discovery"],
      "expected-output-shape": {
        "type": "object",
        "properties": {
          "story_count": { "type": "integer", "minimum": 1 }
        },
        "required": ["story_count"]
      }
    }
  ]
}
```

### Key fields

| Field | Description |
|-------|-------------|
| `nodes[].id` | State identifier — must match the `current` value passed to `advance` |
| `nodes[].allowedTransitions` | Array of permitted next states — enforced by ADR-002 |
| `nodes[].expected-output-shape` | Optional JSON Schema for structured output validation (p4-enf-schema). Null means validation is skipped for this node (opt-in per node, AC3 of p4-enf-schema). |

**Config injection (ADR-004):** All workflow declarations are injected by the caller. No hardcoded paths or URLs are embedded in the enforcement runtime.

---

## 3. MCP Trace Contract

The MCP enforcement adapter (`src/enforcement/mcp-adapter.js`) handles tool calls at the VS Code / Claude Code surface class. Every successful `handleToolCall` call writes a trace entry via `govPackage.writeTrace`.

### Trace entry fields

| Field | Type | Description |
|-------|------|-------------|
| `skillId` | string | Skill requested in the tool call |
| `skillHash` | string (64-char hex) | SHA-256 digest of the resolved skill body (C5) |
| `inputHash` | string (64-char hex) | SHA-256 digest of the operator input string |
| `outputRef` | string | Output artefact reference (from tool call context) |
| `transitionTaken` | string | State transition recorded by this call |
| `surfaceType` | string | Always `mcp-interactive` for MCP adapter calls |
| `timestamp` | string (ISO 8601) | UTC timestamp of the call |

### MCP-specific enforcement gates

**C7 — Single question per tool call:** If `input.questions.length > 1`, the call is rejected immediately with `{ error: 'MULTI_QUESTION_REJECTED' }`. No trace is written for rejected calls.

**C5 — Hash verification before skill resolution:** `verifyHash` is called before `resolveSkill`. A hash mismatch returns the error and no skill body is returned to the surface.

**MC-SEC-02:** No skill body content, operator input, or credential values are logged externally. Trace entries contain hashes only — not the original content.

---

## 4. Phase 4 / Theme F Boundary

This section explicitly distinguishes Phase 4 enforcement deliverables from Theme F deliverables that are not in Phase 4 scope, per Craig's Q4 clarification decision (ADR-003).

### Phase 4 — In scope (delivered)

The following E3 stories are complete and constitute the full Phase 4 enforcement boundary:

| Story | Deliverable |
|-------|-------------|
| p4-enf-package | `src/enforcement/governance-package.js` — shared enforcement core |
| p4-enf-mcp | `src/enforcement/mcp-adapter.js` — MCP surface enforcement |
| p4-enf-cli | `src/enforcement/cli-adapter.js` — CLI surface enforcement |
| p4-enf-schema | `src/enforcement/schema-validator.js` — structured output validation |
| p4-enf-second-line | `theme-f-inputs.md` (this document) + `scripts/trace-schema.json` |

### Theme F — Out of Phase 4 scope

The following governance controls are Theme F deliverables. They are explicitly documented here as out of Phase 4 scope per Craig's Q4 clarification. They will be delivered in a subsequent phase (Q4 planning) under separate stories.

| Theme F deliverable | Reason out of scope |
|--------------------|---------------------|
| Dual-authority approval routing | Requires two-person-integrity controls not yet designed for this platform |
| RBNZ (Reserve Bank of New Zealand) regulatory compliance integration | Regulated-sector integration; requires separate regulatory story track |
| Second-line governance workflow (automated) | Theme F controls beyond the boundary — Phase 4 provides inputs only |
| Approval routing orchestration | Multi-approver orchestration deferred to Q4 |

**Craig's Q4 clarification (ADR-003):** The `executorIdentity` field in trace entries is optional. Second-line reviewers operating within Theme F controls cannot require its presence as a gate condition. Enforcement at the Phase 4 boundary is limited to the six required trace fields documented in sections 1 and 3 of this document.

**MC-SEC-02 boundary note:** This document describes the `executorIdentity` field by its type (`string`) and purpose only. No example identity values, operator names, session tokens, or API credentials appear in this document.
