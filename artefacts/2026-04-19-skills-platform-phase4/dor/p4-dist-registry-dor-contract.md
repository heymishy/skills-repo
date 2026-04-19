# DoR Contract: p4-dist-registry — Consumer fleet registry

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-registry.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-registry-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `fleet-state.json` | Registry file — add/update consumer entries |
| `schemas/fleet-state.schema.json` (or equivalent) | Fleet state JSON Schema definition (must exist before implementation) |
| `src/registry.js` (or similar) | `updateConsumerEntry()`, staleness check implementation |
| `scripts/update-fleet.js` or similar | CLI entry point for registry update |
| `tests/fixtures/` | Fixture fleet-state files for schema validation tests |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-registry.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-dist-lockfile | Complete — registry entries reference lockfile's `currentPinnedRef` field name |
| p4-dist-upstream | Complete — upstream version comparison needed for `versionsBehind` |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | New consumer entry has 5 required fields | T2, T3 |
| AC2 | `versionsBehind > threshold` → `syncStatus: "stale"` | T4, T5 |
| AC3 | Governance check validates all entries against schema | T6, T7 |
| AC4 | Absent threshold → default 2 releases | T8, T9 |

---

## Architecture Constraints (binding)

- **MC-CORRECT-02:** `fleet-state.json` JSON Schema defined before first registry write; CI validates
- **ADR-004:** `stale_threshold` from `context.yml.distribution.stale_threshold`; default 2 if absent
- **MC-SEC-02:** `consumerId` must be non-personal identifier; no email, LDAP, or display name

---

## Quality Gate

1. `schemas/fleet-state.schema.json` committed before or alongside the implementation
2. `npm test` passes including `tests/check-p4-dist-registry.js`
3. PR opened as draft; heymishy review required
