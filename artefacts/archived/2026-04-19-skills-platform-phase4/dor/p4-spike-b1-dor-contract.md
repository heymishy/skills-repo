# DoR Contract: p4-spike-b1 — MCP Tool-Boundary Enforcement

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b1.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-b1-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required

---

## Scope Contract

### Files the operator MAY touch

| Path | Purpose |
|------|---------|
| `artefacts/2026-04-19-skills-platform-phase4/reference/spike-b1-output.md` | Primary spike output: MCP tool-boundary enforcement verdict artefact |
| `.github/pipeline-state.json` | Update `features[0].spikes[1].verdict` (id: "spike-b1") |
| `artefacts/2026-04-19-skills-platform-phase4/decisions.md` | Add ADR for MCP tool-boundary enforcement mechanism |
| `artefacts/2026-04-19-skills-platform-phase4/reference/` | Supporting investigation documents |

### Files that are OUT OF SCOPE — must NOT be touched

| Path | Reason |
|------|--------|
| `src/` (any file) | No implementation in a spike |
| `package.json` | No dependency changes |
| `tests/` | Tests already written |
| `.github/skills/`, `.github/templates/`, `standards/` | No platform changes |
| Any other `artefacts/` story, test-plan, or review file | Isolated to reference/ and decisions.md |

---

## Upstream Dependencies

| Dependency | Field | Required state |
|-----------|-------|---------------|
| p4-spike-a | `features[0].spikes[0].verdict` | Non-null (PROCEED or REDESIGN) — **do not start until Spike A has a verdict** |

Schema field for dependency: `features[].spikes[].verdict` — present in `.github/pipeline-state.schema.json` ✅

---

## Downstream Impact

- p4.enf-mcp must reference both Spike A and Spike B1 outputs in its upstream dependencies (AC5)
- If Spike B1 returns REDESIGN or REJECT, p4.enf-mcp story may need to be re-scoped before entering DoR

---

## Acceptance Criteria Traceability

| AC | Criterion | Test IDs |
|----|-----------|---------|
| AC1 | Spike output artefact exists with verdict and hash-verifiable trace | T1, T2, T3 |
| AC2 | C11 compliance stated with mitigation if runtime required | T4, T5 |
| AC3 | P1–P4 fidelity properties assessed in output | T6, T7, T8 |
| AC4 | Verdict in pipeline-state.json AND decisions.md ADR | T9, T10 |
| AC5 | p4.enf-mcp story references both Spike A and Spike B1 | T11, T12, T13 |

---

## Architecture Constraints (binding)

- **C11:** No persistent hosted runtime — investigation must explicitly address C11 compliance or propose a compliant mitigation
- **ADR-004:** Config via `context.yml`
- **C5:** Hash verification — any claimed hash-verifiable artefact must include verifiable hash
- **C7:** Single-turn enforcement — MCP must structurally enforce one-question-at-a-time
- **C4:** Human approval gate — verdict by heymishy only
- **MC-SEC-02:** No credentials in any artefact

---

## Quality Gate

Before this story is considered complete:
1. Spike A verdict is non-null
2. `artefacts/2026-04-19-skills-platform-phase4/reference/spike-b1-output.md` exists with non-null verdict
3. `.github/pipeline-state.json` `features[0].spikes[1].verdict` is non-null
4. `decisions.md` contains ADR entry for MCP tool-boundary enforcement
5. `npm test` passes (tests/check-p4-spike-b1.js all green)
6. heymishy has reviewed and approved (High oversight)
