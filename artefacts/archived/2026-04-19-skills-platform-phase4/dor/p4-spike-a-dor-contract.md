# DoR Contract: p4-spike-a — Governance Logic Extractability

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-a-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required

---

## Scope Contract

### Files the operator MAY touch

| Path | Purpose |
|------|---------|
| `artefacts/2026-04-19-skills-platform-phase4/reference/spike-a-output.md` | Primary spike output: verdict artefact with investigation findings |
| `.github/pipeline-state.json` | Update `features[0].spikes[0].verdict` with result |
| `artefacts/2026-04-19-skills-platform-phase4/decisions.md` | Add ADR entry for governance-logic extractability decision |
| `artefacts/2026-04-19-skills-platform-phase4/reference/` | Any supporting reference documents produced during investigation |

### Files that are OUT OF SCOPE — must NOT be touched

| Path | Reason |
|------|--------|
| `src/` (any file) | No implementation in a spike story |
| `package.json` | No dependency changes |
| `tests/` | No test additions from spike execution (tests already written at test-plan stage) |
| `.github/skills/` | No skill changes |
| `.github/templates/` | No template changes |
| `standards/` | No standards changes |
| Any other `artefacts/` story, test-plan, or review file | Spike output is isolated to reference/ and decisions.md |

---

## Upstream Dependencies

None. Spike A is the root spike and has no upstream story dependencies.

---

## Downstream Impact

The following stories must NOT enter DoR until Spike A has a PROCEED or REDESIGN verdict:
- p4-spike-b1 (upstream dependency: Spike A verdict)
- p4-spike-b2 (upstream dependency: Spike A verdict)
- p4-spike-c (soft dependency: Spike A should have a verdict, may run in parallel)
- All E3 stories: p4-enf-decision, p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-enf-schema, p4-enf-second-line must reference Spike A verdict in their upstream dependencies (AC5)

---

## Acceptance Criteria Traceability

| AC | Criterion | Test IDs |
|----|-----------|---------|
| AC1 | Spike output artefact exists with valid verdict field (PROCEED / REDESIGN / DEFER / REJECT) | T1, T2, T3 |
| AC2 | If PROCEED: package interface defined and referenced in output artefact | T4, T5 |
| AC3 | If REDESIGN: at least one architectural constraint identified in output | T6, T7 |
| AC4 | Verdict recorded in pipeline-state.json AND decisions.md ADR | T8, T9, T10 |
| AC5 | No E3 story enters DoR without Spike A reference in upstream deps | T11, T12 |

---

## Architecture Constraints (binding on this story)

- **ADR-004:** All config via `context.yml`; no hardcoded paths in investigation outputs or artefacts produced
- **MC-CORRECT-02 (schema-first discipline):** Any new pipeline-state.json fields proposed by this spike must be added to `.github/pipeline-state.schema.json` before being written
- **C5 (hash verification):** Any artefact claimed as hash-verifiable must include a verifiable hash
- **C4 (human approval gate):** Verdict must be written by heymishy; automated processes must not set the verdict
- **MC-SEC-02 (no credentials in artefacts):** No session tokens, API keys, or credentials in any produced document

---

## Quality Gate

Before this story is considered complete:
1. `artefacts/2026-04-19-skills-platform-phase4/reference/spike-a-output.md` exists with a non-null verdict
2. `.github/pipeline-state.json` `features[0].spikes[0].verdict` is non-null
3. `artefacts/2026-04-19-skills-platform-phase4/decisions.md` contains an ADR entry for this spike
4. `npm test` passes (tests/check-p4-spike-a.js all green)
5. heymishy has reviewed and approved the verdict artefact (High oversight)
