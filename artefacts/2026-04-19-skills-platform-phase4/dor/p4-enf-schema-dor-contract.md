# DoR Contract: p4-enf-schema — Structured output schema validation

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-schema.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-enf-schema-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/schema-validator.js` (or equivalent) | `validateOutputShape(output, schema)` implementation |
| `src/governance-package/gate.js` | Integrate schema validation into `evaluateGate` |
| `tests/fixtures/` | Fixture output objects and expected-output-shape schemas |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-enf-schema.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| Skill-level `expected-output-shape` authoring guidelines | Standards concern; this story implements the validator only |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-a | Non-null verdict — provides `expected-output-shape` field syntax |
| p4-enf-decision | ADR committed and heymishy-approved |
| p4-enf-package | Complete (provides `evaluateGate`, `advanceState`) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Schema violation → structured error; blocks `advanceState` | T2, T3 |
| AC2 | Error identifies failing field by JSON path, expected, actual | T4, T5 |
| AC3 | Node without `expected-output-shape` → validation skipped | T6, T7 |
| AC4 | Deterministic results for identical input/schema | T8, T9 |

---

## Architecture Constraints (binding)

- **C5:** `expected-output-shape` must come from hash-verified skill declaration only
- **MC-CORRECT-02:** Structured JSON error object `{error, field, expected, actual}`; plain text errors not acceptable
- **ADR-004:** Opt-in/opt-out config uses `context.yml enforcement.*` namespace; no CLI flag bypass
- **MC-SEC-02:** No operator output content logged externally during validation

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-enf-schema.js`
2. Error object structure asserted in at least one unit test (MC-CORRECT-02)
3. PR opened as draft; heymishy explicit approval required before merge
