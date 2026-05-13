# DoR Contract: p4-nta-ci-artefact — CI artefact integration for non-git-native surfaces

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-ci-artefact.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-nta-ci-artefact-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `schemas/trace.schema.json` | Add optional `standards_injected` warning field if required by AC3 — universal, not bot-specific |
| CI workflow definition (e.g. `.github/workflows/`) | Only if schema delta or warn-only check flag is needed |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-nta-ci-artefact.js` | Already written |
| All other `tests/check-*.js` | Existing check scripts must not be modified; this story validates they already work |
| New bot-specific CI check scripts | Out of scope: MC-CORRECT-02 prohibits CI checks that run only on bot artefacts |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-d | PROCEED verdict |
| p4-nta-artefact-parity | Complete (bot artefact lands on branch) |
| p4-nta-gate-translation | Complete (Teams approval channel active) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | `npm test` passes for bot-produced artefact; no check script modifications | T2, T3 |
| AC2 | `validate-trace.sh --ci` passes for bot conversation trace | T4, T5 |
| AC3 | `standards_injected: false` → CI warning (not failure); reviewer informed | T6, T7 |
| AC4 | CI summary shows no bot-surface annotation; uniform output | T8, T9 |

---

## Architecture Constraints (binding)

- **MC-CORRECT-02:** No new CI check that runs only on bot artefacts; all checks apply uniformly; any schema change applies to all artefacts
- **C1:** CI runs on origin repository branch; enforced by upstream p4-nta-artefact-parity
- **ADR-004:** If CI reads any bot-session configuration, it reads from `context.yml`; no hardcoded bot paths
- **MC-SEC-02:** No session tokens, installation tokens, or credentials logged in CI output

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-nta-ci-artefact.js`
2. `scripts/validate-trace.sh --ci` passes on bot conversation trace fixture
3. Existing check scripts pass unmodified against bot-produced artefact (demonstrated in PR)
4. PR opened as draft; heymishy explicit approval required before merge
