# DoR Contract: p4-dist-install — Sidecar install via init command

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-install.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-install-dor.md
Signed: 2026-04-19
Oversight: Medium — PR review by heymishy required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/` (new install module, e.g. `src/install/index.js`) | `skills-repo init` command implementation |
| `src/cli.js` or equivalent entry point | Register the `init` command |
| `package.json` | Add dependencies only if required; do not change test scripts |
| Test fixtures under `tests/fixtures/` | Fixture context.yml and mock upstream content |
| `.github/context.yml` schema extension | If `skills_upstream` fields need schema update for MC-CORRECT-02 |

### Files that are OUT OF SCOPE — must NOT be touched

| Path | Reason |
|------|--------|
| `artefacts/` | No artefact changes from implementation |
| `.github/skills/`, `.github/templates/`, `standards/` | No platform changes |
| `tests/check-p4-dist-install.js` | Test file already written — do not modify; implementation must satisfy existing tests |
| Any file outside `src/` and `package.json` | Narrow scope |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-c | Spike C PROCEED or REDESIGN verdict non-null — provides sidecar directory convention and lockfile schema |

Schema field: `features[].spikes[].verdict` present in pipeline-state.schema.json ✅

---

## Downstream Impact

- p4-dist-no-commits depends on this story being complete (wraps install command)
- p4-dist-lockfile builds on the lockfile written by init
- p4-dist-migration targets the sidecar model this story implements
- p4-dist-commit-format's `advance` command requires a sidecar to exist

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | Fresh repo: sidecar + lockfile + zero commits + gitignore | T2, T3, T4 |
| AC2 | No skills content outside sidecar | T5, T6 |
| AC3 | Missing config → non-zero exit + named error | T7, T8 |
| AC4 | Existing sidecar → error "Sidecar already installed — run upgrade" (normative path) | T9, T10 |

---

## Architecture Constraints (binding)

- **C1:** No fork required; `init` must not create a fork or open a PR
- **C5:** Compute and write SHA-256 hash for each skill file in the lockfile
- **ADR-004:** All upstream config from `context.yml.skills_upstream.repo` — no hardcoded fallback URL
- **MC-SEC-02:** No credentials written to sidecar, lockfile, or console
- **Spike C output:** Sidecar directory path and lockfile field names from Spike C verdict — do not choose independently

---

## Quality Gate

Before PR is opened:
1. `npm test` passes including `tests/check-p4-dist-install.js` (all green)
2. Sidecar directory convention matches Spike C verdict
3. Lockfile fields match AC1 minimum: `upstreamSource`, `pinnedRef`, `pinnedAt`, `platformVersion`, `skills[]`
4. PR opened as draft; heymishy review required before merge
