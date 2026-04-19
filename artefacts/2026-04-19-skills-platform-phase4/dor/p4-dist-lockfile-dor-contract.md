# DoR Contract: p4-dist-lockfile — Lockfile structure, pinning, and transparency

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-lockfile.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-lockfile-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/lockfile.js` (or similar) | `validateSchema()`, `verifyLockfile()`, `computeHash()` |
| `schemas/skills-lock.schema.json` (or equivalent) | Lockfile JSON Schema definition (must be created before implementation) |
| `tests/fixtures/` | Lockfile fixture files for schema validation tests |
| `src/install/index.js` | Integrate lockfile write on init (if not already part of p4-dist-install) |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-dist-lockfile.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-c | Non-null verdict — provides lockfile field names and schema version |
| p4-dist-install | In progress or complete — lockfile is written by init |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Lockfile has minimum required fields | T2, T3 |
| AC2 | verify re-computes hash; mismatch → named error | T4, T5, T6 |
| AC3 | Hash computation is deterministic for identical content | T7, T8 |
| AC4 | Tampered skill file detected by verify | T9, T10 |

---

## Architecture Constraints (binding)

- **C5:** SHA-256 minimum hash algorithm; offline verification (no network)
- **MC-CORRECT-02:** JSON Schema defined before first init writes a lockfile; CI validates fixtures against schema
- **ADR-004:** `upstreamSource` in lockfile must match `context.yml.skills_upstream.repo` at pin time
- **MC-SEC-02:** No credentials, tokens, or personal data in lockfile

---

## Quality Gate

1. `schemas/skills-lock.schema.json` (or equivalent) committed before or alongside the implementation
2. `npm test` passes including `tests/check-p4-dist-lockfile.js`
3. PR opened as draft; heymishy review required
