# DoR Contract: p4-dist-migration — Migration path for existing fork consumers

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-migration.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-migration-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `docs/migration-guide.md` (or path from Spike C) | Migration guide document |
| `scripts/pre-migration-checklist.md` or inline | Pre-migration checklist (may be section within migration guide) |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-migration.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| Automated migration tooling | Phase 4 MVP is documentation-first; automation deferred |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-dist-install | Complete — migration guide must reference install command |
| p4-dist-upstream | Complete — migration guide must reference upstream config step |
| p4-spike-c | Non-null verdict — provides sidecar layout referenced in guide |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Consumer follows guide → `verify` passes; no stray SKILL.md outside sidecar | T2, T3 |
| AC2 | Artefact history intact after migration | T4, T5 |
| AC3 | Pre-migration checklist with customisation guidance present | T6, T7 |
| AC4 | Post-migration `npm test` exits 0 | T8, T9 |

---

## Architecture Constraints (binding)

- **C1:** Post-migration repo must be non-fork state; `skills-repo verify` passes as final step
- **C4:** Guide must require explicit operator confirmation before removing consumer-modified skills content
- **MC-CORRECT-02:** `skills-repo verify` must be the final documented step in the migration guide
- **MC-SEC-02:** No instruction to commit credentials, tokens, or tenant IDs

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-dist-migration.js`
2. Migration guide reviewed by heymishy for completeness
3. PR opened as draft; heymishy review required
