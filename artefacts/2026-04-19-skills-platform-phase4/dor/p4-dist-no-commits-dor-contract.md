# DoR Contract: p4-dist-no-commits — Zero-commit CI assertion

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-no-commits.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-no-commits-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/assert-zero-commits.js` (or similar) | `getCommitCount()` and `assertZeroCommits()` implementation |
| `src/cli.js` or command wrappers | Wrap distribution commands with before/after assertion |
| `tests/fixtures/` | Fixture data if needed |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-no-commits.js` | Already written — do not modify |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| Any file outside `src/` | Narrow scope |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-dist-install | Complete — assertion wraps the install command |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | `init` in CI: before/after commit count check; failure message with count | T2, T3, T4 |
| AC2 | All 4 distribution commands wrapped; new command without assertion fails governance check | T5, T6, T7 |
| AC3 | `verify` is read-only: zero commits, zero staged, zero unstaged | T8, T9 |

---

## Architecture Constraints (binding)

- **C1:** Assertion failure must block CI run (non-zero exit)
- **MC-CORRECT-02:** Schema-validated command output comparison; no screen-scraping
- **ADR-004:** Assert the same context.yml-driven commands; no independent command list
- **MC-SEC-02:** No sidecar contents or lockfile hashes in CI log output

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-dist-no-commits.js`
2. All 4 distribution commands have registered before/after assertions
3. PR opened as draft; heymishy review required
