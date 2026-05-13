# DoR Contract: p4-enf-second-line — Theme F second-line evidence chain inputs

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-second-line.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-enf-second-line-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md` | Theme F evidence chain inputs document |
| `schemas/trace.schema.json` (or equivalent) | Mark `executorIdentity` as optional field |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-enf-second-line.js` | Already written |
| `.github/skills/`, `standards/` | No changes |
| `src/` | This story produces a document; no implementation code |
| Theme F governance controls | Out of Phase 4 scope — document boundary only |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-enf-package | Complete (trace contract fields are known) |
| p4-enf-mcp | Complete (MCP trace fields are known) |
| p4-enf-cli | Complete (CLI verification contract is known) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | `theme-f-inputs.md` has 3 sections (CLI contract, workflow declaration structure, MCP trace contract) | T2, T3 |
| AC2 | `executorIdentity` optional in trace schema; gate accepts with/without; `validate-trace.sh --ci` passes | T4, T5 |
| AC3 | Document explicitly distinguishes Phase 4 deliverables vs Theme F scope | T6, T7 |

---

## Architecture Constraints (binding)

- **C4:** Phase 4 / Theme F boundary explicitly documented; Theme F controls not implemented here
- **MC-SEC-02:** No credentials, API keys, or operator-identifiable values in `theme-f-inputs.md`; `executorIdentity` described by type and purpose only
- **Craig's ADR-003 (Q6):** `executorIdentity` is optional; second-line reviewers cannot require its presence

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-enf-second-line.js`
2. `scripts/validate-trace.sh --ci` passes with `executorIdentity` as optional field
3. PR opened as draft; heymishy explicit approval required before merge
