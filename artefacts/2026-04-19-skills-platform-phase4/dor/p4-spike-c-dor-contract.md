# DoR Contract: p4-spike-c — Distribution Model

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-c.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-c-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required

---

## Scope Contract

### Files the operator MAY touch

| Path | Purpose |
|------|---------|
| `artefacts/2026-04-19-skills-platform-phase4/reference/spike-c-output.md` | Primary spike output: distribution model decision artefact |
| `.github/pipeline-state.json` | Update `features[0].spikes[3].verdict` (id: "spike-c") |
| `artefacts/2026-04-19-skills-platform-phase4/decisions.md` | Add ADR for upstream authority decision |
| `artefacts/2026-04-19-skills-platform-phase4/reference/` | Supporting investigation documents |

### Files that are OUT OF SCOPE — must NOT be touched

| Path | Reason |
|------|--------|
| `src/` (any file) | No implementation in a spike |
| `package.json` | No dependency changes |
| `tests/` | Tests already written |
| `.github/skills/`, `.github/templates/`, `standards/` | No platform changes |
| E2 story files | Do not modify story files; E2 stories reference Spike C via upstream deps |

---

## Upstream Dependencies

| Dependency | Field | Required state |
|-----------|-------|---------------|
| p4-spike-a (soft) | `features[0].spikes[0].verdict` | Should be non-null before Spike C closes — may run in parallel, but should not close without Spike A verdict |

Schema field: `features[].spikes[].verdict` present in pipeline-state.schema.json ✅

---

## Downstream Impact

All 8 E2 stories must reference Spike C output in their upstream dependencies (AC5):
p4-dist-install, p4-dist-no-commits, p4-dist-commit-format, p4-dist-lockfile, p4-dist-upgrade, p4-dist-upstream, p4-dist-migration, p4-dist-registry

These E2 stories should not enter DoR until Spike C has a PROCEED or REDESIGN verdict.

---

## Acceptance Criteria Traceability

| AC | Criterion | Test IDs |
|----|-----------|---------|
| AC1 | Named decisions for 4 distribution sub-problems in output | T1, T2, T3, T4 |
| AC2 | Upstream authority decision recorded in output | T5, T6, T7 |
| AC3 | Lockfile structure defined and documented | T8, T9, T10 |
| AC4 | Verdicts + upstream authority ADR in pipeline-state.json and decisions.md | T11, T12 |
| AC5 | All E2 stories reference Spike C in upstream dependencies | T13, T14, T15 |

---

## Architecture Constraints (binding)

- **C1:** Non-fork — distribution model must not require consumer repos to fork the platform
- **ADR-004:** Config via `context.yml`; upstream authority decision must be expressed as a `context.yml` configuration
- **MC-CORRECT-02:** Schema-first — any new lockfile or fleet-state.json fields proposed must be added to schema before use
- **C5:** Hash verification — lockfile structure must support hash-based verification of installed skill versions
- **C4:** Human approval gate — verdict by heymishy only
- **MC-SEC-02:** No credentials in artefacts

---

## Quality Gate

Before this story is considered complete:
1. `reference/spike-c-output.md` exists with non-null verdict and named decisions for all 4 sub-problems
2. `features[0].spikes[3].verdict` is non-null in pipeline-state.json
3. `decisions.md` contains ADR entry for upstream authority decision
4. `npm test` passes (tests/check-p4-spike-c.js all green)
5. heymishy has reviewed and approved (High oversight)
