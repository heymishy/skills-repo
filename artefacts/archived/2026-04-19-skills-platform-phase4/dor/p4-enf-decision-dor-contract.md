# DoR Contract: p4-enf-decision — Mechanism selection ADR

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-decision.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-enf-decision-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `.github/architecture-guardrails.md` | Append new ADR entry `ADR-phase4-enforcement` to active ADRs section |
| `.github/pipeline-state.json` | Add `guardrails[]` entry for the new ADR |
| `.github/pipeline-state.schema.json` | Add `guardrails[]` field to schema if not yet present |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-enf-decision.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| `src/`, `scripts/` | This story writes documentation and state only; no implementation code |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-a | Non-null verdict (PROCEED or REDESIGN) |
| p4-spike-b1 | Non-null verdict |
| p4-spike-b2 | Non-null verdict |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | 4 surface classes each with mechanism + rationale | T2, T3 |
| AC2 | ADR follows existing format in `.github/architecture-guardrails.md` | T4, T5 |
| AC3 | `pipeline-state.json` `guardrails[]` entry added | T6, T7 |
| AC4 | Deferred surface classes explicitly named with reason + revisit trigger | T8 (if applicable) |

---

## Architecture Constraints (binding)

- **ADR-004:** ADR committed to `.github/architecture-guardrails.md`; this file is the canonical ADR registry for this repo
- **C4:** ADR committed and heymishy-approved BEFORE any of `p4-enf-package`, `p4-enf-mcp`, `p4-enf-cli`, `p4-enf-schema` may enter the inner loop
- **MC-CORRECT-02:** `guardrails[]` schema definition must precede the first write to that field in pipeline-state.json
- **MC-SEC-02:** No credentials, keys, or environment-specific configuration in ADR text

---

## Quality Gate

1. `.github/architecture-guardrails.md` has `ADR-phase4-enforcement` in the active ADRs section
2. `npm test` passes including `tests/check-p4-enf-decision.js`
3. PR opened as draft; heymishy explicit approval required before merge
