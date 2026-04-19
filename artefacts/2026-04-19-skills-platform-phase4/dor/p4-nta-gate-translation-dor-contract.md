# DoR Contract: p4-nta-gate-translation — Non-technical approval channel routing

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-gate-translation.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-nta-gate-translation-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/approval-channel/teams-adapter.js` | Teams approval channel adapter (implements ADR-006 interface) |
| `src/teams-bot/action-handler.js` | Adaptive card button action handler — routes to `process-dor-approval.js` |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-nta-gate-translation.js` | Already written |
| `scripts/process-dor-approval.js` | Must not be modified — adapter must work with existing script |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| Dual-authority approval routing | Theme F deliverable; not Phase 4 |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-d | PROCEED verdict |
| p4-nta-surface | Complete (bot runtime and action handler infrastructure available) |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | "Approve" button → `process-dor-approval.js` called with same args as GitHub-issue channel | T2, T3 |
| AC2 | Script completes → `dorStatus: "signed-off"` in pipeline-state.json | T4, T5 |
| AC3 | No action taken → DoR status unchanged; no auto-approval | T6, T7 |
| AC4 | Incomplete config → user-visible error; no silent failure | T8, T9 |

---

## Architecture Constraints (binding)

- **ADR-006:** Teams channel implements approval-channel adapter interface; `process-dor-approval.js` unmodified
- **C4:** Explicit approver action required; no implicit, inferred, or timeout-based approval
- **MC-CORRECT-02:** Approval event schema matches existing pipeline-state.json schema; no new fields without schema update
- **ADR-004:** Teams config from `context.yml.approval_channels.teams`; no hardcoded tenant IDs or channel references
- **MC-SEC-02:** No credentials in approval event payloads; approver identity validated against context.yml approvers list

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-nta-gate-translation.js`
2. `process-dor-approval.js` passes without modification (adapter interface compliance)
3. PR opened as draft; heymishy explicit approval required before merge
