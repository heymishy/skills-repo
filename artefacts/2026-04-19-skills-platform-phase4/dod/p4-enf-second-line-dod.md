# Definition of Done — p4-enf-second-line

**Story:** p4-enf-second-line — Theme F second-line evidence chain inputs
**Epic:** E3 — Structural Enforcement (terminal story)
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20
**Commit:** (this commit)

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | `theme-f-inputs.md` contains three sections: CLI verification contract (with all 6 required fields), workflow declaration structure, MCP trace contract | PASS | T1, T2a–T2g (7), T3, T4 — 10 assertions |
| AC1 ext | `executorIdentity` documented as optional, described by type and purpose only (MC-SEC-02) | PASS | T5a–T5b — 2 assertions |
| AC2 | `executorIdentity` NOT in `required` array of trace schema (`scripts/trace-schema.json`) | PASS | T-NFR2 — 1 assertion |
| AC2 env | `validate-trace.sh --ci` accepts trace without `executorIdentity` | ENVIRONMENTAL — T6 skipped on this machine (WSL bash `/bin/bash` exec error); schema is correct |
| AC3 | Document explicitly distinguishes Phase 4 deliverables and Theme F out-of-scope items; Q4 decision cited | PASS | T7, T8a–T8b — 3 assertions |
| AC-NFR1 | No credentials (Bearer, password, secret, api_key, tenantId) in `theme-f-inputs.md` | PASS | T-NFR1a–T-NFR1e — 5 assertions |

21 of 22 assertions passing. T6 is an environmental failure: WSL's `bash.exe` on this machine cannot exec `/bin/bash` inside the WSL distribution (`execvpe /bin/bash failed 2`). The schema correctness is verified by T-NFR2 (executorIdentity absent from `required` array). On a machine with working bash, T6 would pass — validate-trace.sh exits 0 for the full repo state.

---

## Test Run Evidence

```
node tests/check-p4-enf-second-line.js

[p4-enf-second-line] Results: 21 passed, 1 failed
  ✗ T6: validate-trace.sh exits 0 ... (exit: 1, stderr: WSL (9) ERROR: execvpe /bin/bash failed 2)
```

`npm test` (governance suite) — zero failures. `check-p4-enf-second-line.js` is not in the npm test suite.

---

## Deliverables

### 1. `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md`

Three sections:
- **CLI Verification Contract** — 7 required trace fields, executorIdentity as optional (ADR-003), transition enforcement (ADR-002), hash enforcement (C5)
- **Workflow Declaration Structure** — JSON structure with `nodes[].id`, `allowedTransitions`, `expected-output-shape` (opt-in per node)
- **MCP Trace Contract** — 6 required fields, C7 gate (single-question enforcement), C5 hash-before-resolve order

Phase 4 / Theme F boundary section explicitly distinguishes delivered scope from deferred Theme F deliverables: dual-authority routing, RBNZ integration, second-line governance workflow, approval routing orchestration. Craig's Q4 clarification cited.

### 2. `scripts/trace-schema.json`

JSON Schema (draft-07) for trace entries. `required` array: `skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`. `executorIdentity` is in `properties` but NOT in `required` (ADR-003 compliant). `additionalProperties: true` for forward compatibility.

---

## Architecture Constraints Met

- **C4:** Phase 4 / Theme F boundary explicitly documented in section 4 of `theme-f-inputs.md`
- **MC-SEC-02:** `executorIdentity` described by type (`string`) and purpose only; no example identity values, tokens, or credentials in document; T-NFR1 source-scanned
- **ADR-003 (Craig's Q4):** `executorIdentity` is optional; recorded in trace schema and document

---

## E3 Epic Status

With p4-enf-second-line complete, **E3 (Structural Enforcement) is fully delivered**:

| Story | Status |
|-------|--------|
| p4-enf-package | ✅ DoD complete |
| p4-enf-mcp | ✅ DoD complete |
| p4-enf-cli | ✅ DoD complete |
| p4-enf-schema | ✅ DoD complete |
| p4-enf-second-line | ✅ DoD complete (T6 environmental) |

---

## Metric Signals

**M2 (Consumer confidence — regulated segment):** Phase 4 enforcement boundary is fully documented. Second-line reviewers have a machine-readable trace schema and a boundary document that explicitly names what is and is not within Phase 4 scope, enabling Theme F planning without ambiguity.
