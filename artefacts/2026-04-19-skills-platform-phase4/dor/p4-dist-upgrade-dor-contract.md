# DoR Contract: p4-dist-upgrade — Upgrade command with diff and confirm flow

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upgrade.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-upgrade-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/commands/upgrade.js` | Upgrade command: fetch, diff, confirm, re-pin, verify |
| `src/diff.js` (or similar) | `generateDiff()` with POLICY.md floor detection |
| `src/lockfile.js` | Extend with `previousPinnedRef` field write and rollback support |
| `tests/fixtures/` | Fixture lockfile pairs for diff tests |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-upgrade.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-dist-lockfile | Complete — upgrade reads and writes the lockfile schema |
| p4-dist-upstream | Complete — upgrade reads upstream from context.yml |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Diff presented; wait for y/N before file modification | T2, T3 |
| AC2 (success) | verify passes as final step after confirmed upgrade | T4, T5 |
| AC2 (failure) | verify fails → rollback to pre-upgrade state | T6, T7 |
| AC3 | Abort → byte-for-byte identical to pre-upgrade | T8, T9 |
| AC4 | POLICY.md floor change → "⚠ POLICY FLOOR CHANGE:" marker | T3 (also covers AC4 via diff test) |

---

## Architecture Constraints (binding)

- **C4:** Human confirmation required; `--confirm` flag for CI contexts; no silent auto-upgrade
- **C5:** Atomic update — full upgrade or full rollback; no partial state; `previousPinnedRef` recorded in updated lockfile
- **ADR-004:** Upstream source exclusively from `context.yml.skills_upstream.repo`
- **MC-SEC-02:** No credential values or internal URL tokens in diff output

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-dist-upgrade.js`
2. Rollback implementation verified by test (AC2 failure path)
3. PR opened as draft; heymishy review required
