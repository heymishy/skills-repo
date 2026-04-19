# DoR Contract: p4-dist-commit-format — Commit-format validation

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-commit-format.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-commit-format-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/validate-commit-format.js` (or similar) | `validateCommitFormat()` implementation |
| `src/commands/advance.js` | Integrate validation into `advance` command |
| `.github/context.yml` schema | Add `distribution.commit_format_regex` field definition if not present |
| `tests/fixtures/` | Fixture context.yml files with regex examples |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-commit-format.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-dist-install | Complete (advance requires a sidecar) |
| p4-spike-c | Non-null verdict (provides context.yml schema for `distribution.commit_format_regex`) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Regex set + HEAD mismatch → non-zero exit with SHA, excerpt, regex | T2, T3, T4 |
| AC2 | Regex absent → no validation, proceeds | T5, T6 |
| AC3 | Regex set + HEAD matches → passes | T7 |
| AC4 | Invalid regex in context.yml → clear named error | T8, T9 |

---

## Architecture Constraints (binding)

- **ADR-004:** `context.yml.distribution.commit_format_regex` is the sole config source — no CLI flag, no env var, no hardcoded fallback
- **C1:** Validate only; do not generate commits on the consumer's behalf
- **MC-CORRECT-02:** Schema-validated config read; absent field uses default (no validation)
- **MC-SEC-02:** Commit messages not logged to external services; in-process validation

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-dist-commit-format.js`
2. No hardcoded regex values in production code
3. PR opened as draft; heymishy review required
