# DoR Contract: p4-enf-package — Governance package shared core

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-package.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-enf-package-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch (PROCEED path)

| Path | Purpose |
|------|---------|
| `src/governance-package/index.js` (or equivalent) | 5 entry points: `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, `writeTrace` |
| `src/governance-package/verify.js` | `verifyHash` implementation — SHA-256, no bypass |
| `src/governance-package/trace.js` | `writeTrace` implementation — must pass `validate-trace.sh --ci` |
| `tests/fixtures/` | Fixture skill files and trace schemas |

### Files the coding agent MAY touch (REDESIGN path)

| Path | Purpose |
|------|---------|
| `src/schemas/skill-format.schema.json` | Skill format JSON Schema |
| `src/schemas/trace.schema.json` | Trace JSON Schema |
| `src/schema-contracts.md` | Interface contract document for per-mechanism adapters |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-enf-package.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| `src/surface-adapter/` | CLI and MCP adapters are separate stories |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-a | Non-null verdict — determines PROCEED vs REDESIGN implementation path |
| p4-enf-decision | ADR committed and heymishy-approved |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | 5 entry points exported with unit tests (PROCEED) | T2–T6 |
| AC2 | `verifyHash` hash mismatch → structured error; no throw; no truthy | T7, T8 |
| AC3 | `writeTrace` output passes `validate-trace.sh --ci` | T9, T10 |
| AC4 | REDESIGN path: schema files + contracts doc (REDESIGN) | T2–T10 (alternate path) |

---

## Architecture Constraints (binding)

- **C5:** `verifyHash` must not have `force`/`skip` parameter; hash match is non-negotiable
- **ADR-004:** Paths read from `.github/context.yml`; no hardcoded paths
- **MC-CORRECT-02:** New pipeline-state.json fields defined in schema before first write
- **MC-SEC-02:** No skill content, operator input, or credential values logged externally

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-enf-package.js`
2. `scripts/validate-trace.sh --ci` passes on trace fixture outputs
3. PR opened as draft; heymishy explicit approval required before merge
