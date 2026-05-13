# DoR Contract: p4-spike-d — Teams C7 Prototype

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-d.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-d-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required

---

## Scope Contract

### Files the operator MAY touch

| Path | Purpose |
|------|---------|
| `artefacts/2026-04-19-skills-platform-phase4/reference/spike-d-output.md` | Primary spike output: Teams C7 prototype verdict artefact |
| `.github/pipeline-state.json` | Update `features[0].spikes[4].verdict` (id: "spike-d") |
| `artefacts/2026-04-19-skills-platform-phase4/decisions.md` | Add ADR entry with C11 finding and C7 count |
| `artefacts/2026-04-19-skills-platform-phase4/reference/` | Supporting prototype session logs |

### Files that are OUT OF SCOPE — must NOT be touched

| Path | Reason |
|------|--------|
| `src/` (any file) | No implementation in a spike |
| `package.json` | No dependency changes |
| `tests/` | Tests already written |
| `.github/skills/`, `.github/templates/`, `standards/` | No platform changes |
| E4 story files | Do not modify story files — E4 stories are gated on this verdict |

---

## Upstream Dependencies

None — Spike D runs independently. Spike A provides contextual input if available but is not a hard gate.

---

## Downstream Impact

All 5 E4 stories are BLOCKED on a PROCEED verdict from this spike:
- p4-nta-surface
- p4-nta-gate-translation
- p4-nta-artefact-parity
- p4-nta-standards-inject
- p4-nta-ci-artefact

If this spike returns DEFER (Azure / Microsoft account unavailable), E4 stories are deferred to Phase 5. Their DoR artefacts are written but execution is gated.

---

## Acceptance Criteria Traceability

| AC | Criterion | Test IDs |
|----|-----------|---------|
| AC1 | Turn-by-turn log of ≥3 turns produced and present in output | T1, T2, T3 |
| AC2 | C11 compliance statement with runtime requirement and cost implication | T4, T5, T6 |
| AC3 | C7 violation count recorded (structural vs conventional enforcement) | T7, T8 |
| AC4 | Minimum signal: PROCEED or DEFER verdict present | T9, T10 |
| AC5 | Verdict + ADR including C11 finding and C7 count in state and decisions.md | T11, T12, T13 |

---

## Architecture Constraints (binding)

- **C11:** No persistent hosted runtime — investigation must state whether the Teams bot approach requires one and whether that is compliant or mitigable
- **C7:** One-question-at-a-time — the prototype must structurally enforce single-turn (not rely on convention); if structural enforcement is not achievable, that is the key finding
- **ADR-004:** Config via `context.yml`
- **C4:** Human approval gate — verdict by heymishy only
- **MC-SEC-02:** No credentials, tokens, or account details in any artefact

---

## Quality Gate

Before this story is considered complete:
1. `reference/spike-d-output.md` exists with a non-null verdict (PROCEED or DEFER minimum)
2. `features[0].spikes[4].verdict` is non-null in pipeline-state.json
3. `decisions.md` contains ADR entry with C11 finding and C7 count
4. `npm test` passes (tests/check-p4-spike-d.js all green)
5. heymishy has reviewed and approved (High oversight)
6. If DEFER: a note is added to each E4 story's DoR artefact recording the deferral reason
