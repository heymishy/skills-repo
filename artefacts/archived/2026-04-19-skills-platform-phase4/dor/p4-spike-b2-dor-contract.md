# DoR Contract: p4-spike-b2 — Craig's CLI MVP

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-b2-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required

---

## Scope Contract

### Files the operator MAY touch

| Path | Purpose |
|------|---------|
| `artefacts/2026-04-19-skills-platform-phase4/reference/spike-b2-output.md` | Primary spike output: CLI MVP verdict artefact |
| `.github/pipeline-state.json` | Update `features[0].spikes[2].verdict` (id: "spike-b2") |
| `artefacts/2026-04-19-skills-platform-phase4/decisions.md` | Add mechanism-selection ADR (referencing Craig's PR #155 request) |
| `artefacts/2026-04-19-skills-platform-phase4/reference/` | Supporting investigation documents |

### Files that are OUT OF SCOPE — must NOT be touched

| Path | Reason |
|------|--------|
| `src/` (any file) | No implementation in a spike |
| `package.json` | No dependency changes |
| `tests/` | Tests already written |
| `.github/skills/`, `.github/templates/`, `standards/` | No platform changes |
| Craig's PR #155 directly | Read only — do not modify external artefacts |

---

## Upstream Dependencies

| Dependency | Field | Required state |
|-----------|-------|---------------|
| p4-spike-a | `features[0].spikes[0].verdict` | Non-null (PROCEED or REDESIGN) — do not start until Spike A has a verdict |

Schema field: `features[].spikes[].verdict` present in pipeline-state.schema.json ✅

---

## Downstream Impact

- p4.enf-cli must reference Spike A, Spike B2, and Craig's artefacts in its upstream dependencies (AC5)
- The mechanism-selection ADR produced here fulfils Craig's PR #155 request for an ADR
- If Spike B2 returns REDESIGN or REJECT, p4.enf-cli story may need re-scoping before DoR

---

## Acceptance Criteria Traceability

| AC | Criterion | Test IDs |
|----|-----------|---------|
| AC1 | Output references Craig's artefacts as inputs | T1, T2, T3 |
| AC2 | P1–P4 fidelity properties assessed for CLI surface | T4, T5, T6 |
| AC3 | Assumption A2 (assurance gate) addressed in output | T7, T8 |
| AC4 | Verdict + mechanism-selection ADR recorded in state and decisions.md | T9, T10 |
| AC5 | p4.enf-cli references Spike A, Spike B2, and Craig's artefacts | T11, T12, T13 |

---

## Architecture Constraints (binding)

- **C5:** Hash verification on any claimed hash-verifiable artefact
- **C1:** Non-fork — no consumer forks of the platform repo; CLI approach must not require forking
- **C4:** Human approval gate — verdict by heymishy only
- **ADR-004:** Config via `context.yml`
- **MC-CORRECT-02:** Schema-first — any new pipeline-state.json fields proposed must be added to schema first
- **MC-SEC-02:** No credentials in artefacts

---

## Quality Gate

Before this story is considered complete:
1. Spike A verdict is non-null
2. `reference/spike-b2-output.md` exists with non-null verdict
3. `features[0].spikes[2].verdict` is non-null in pipeline-state.json
4. `decisions.md` contains ADR entry for CLI mechanism selection
5. `npm test` passes (tests/check-p4-spike-b2.js all green)
6. heymishy has reviewed and approved (High oversight)
