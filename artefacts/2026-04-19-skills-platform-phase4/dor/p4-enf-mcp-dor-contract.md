# DoR Contract: p4-enf-mcp — MCP enforcement adapter

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-enf-mcp-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/surface-adapter/mcp-adapter.js` (or equivalent) | MCP tool boundary implementation |
| `src/surface-adapter/mcp-tool-schema.json` | Input schema — single question context per call (C7) |
| `src/surface-adapter/mcp-server.js` | Per-session server lifecycle (C11) |
| `tests/fixtures/` | Fixture MCP tool call inputs/outputs for CI test |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-enf-mcp.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| `src/governance-package/` | Governance package is p4-enf-package; this story imports it |
| VS Code extension UI | MCP protocol tool boundary only; no extension UI |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-b1 | Non-null verdict (provides reference implementation design) |
| p4-enf-decision | ADR committed and heymishy-approved |
| p4-enf-package | Complete (exports `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, `writeTrace`) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | `verifyHash` before delivery; mismatch → structured error | T2, T3 |
| AC2 | Valid hash → P2 context injection (skill + standards + state) | T4, T5 |
| AC3 | `writeTrace` with required fields; passes `validate-trace.sh --ci` | T6, T7 |
| AC4 | CI confirms no persistent background process (C11) | T8, T9 |

---

## Architecture Constraints (binding)

- **C11:** No persistent background process; per-session lifecycle maximum
- **C5:** `verifyHash` non-negotiable; no bypass path in adapter code
- **C7:** Input schema validates single question context; multi-question payloads rejected
- **C4:** Approval gates route through approval-channel adapter (ADR-006); no auto-approve
- **ADR-004:** Config from `.github/context.yml`
- **MC-SEC-02:** No skill content, operator input, or credential values logged externally

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-enf-mcp.js`
2. `scripts/validate-trace.sh --ci` passes on MCP trace fixture
3. PR opened as draft; heymishy explicit approval required before merge
