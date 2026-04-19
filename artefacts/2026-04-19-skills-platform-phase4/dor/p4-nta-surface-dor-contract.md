# DoR Contract: p4-nta-surface — Teams bot runtime (C11 compliant)

Story: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-surface.md
DoR reference: artefacts/2026-04-19-skills-platform-phase4/dor/p4-nta-surface-dor.md
Signed: 2026-04-19
Oversight: High — heymishy explicit approval required before merge

---

## Scope Contract

### Files the coding agent MAY touch

| Path | Purpose |
|------|---------|
| `src/teams-bot/handler.js` (or equivalent) | Stateless webhook/Azure Function handler |
| `src/teams-bot/state-machine.js` | C7 state machine (AWAITING_RESPONSE lock) |
| `src/teams-bot/session-store.js` | External session state persistence |
| `src/teams-bot/config.js` | Config reader from `.github/context.yml` |
| `tests/fixtures/` | Fixture Teams conversation events |

### Files that are OUT OF SCOPE

| Path | Reason |
|------|--------|
| `tests/check-p4-nta-surface.js` | Already written |
| `artefacts/`, `.github/skills/`, `standards/` | No changes |
| Artefact assembly/commit logic | p4-nta-artefact-parity |
| Standards injection | p4-nta-standards-inject |
| Approval routing | p4-nta-gate-translation |

---

## Upstream Dependencies

| Dependency | Required state |
|-----------|---------------|
| p4-spike-d | PROCEED verdict with output artefact specifying compliant runtime architecture |

---

## Acceptance Criteria Traceability

| AC | Criterion | Key test IDs |
|----|-----------|-------------|
| AC1 | C7 state machine: AWAITING_RESPONSE lock enforced in code | T2, T3 |
| AC2 | Response received → record → PROCESSING → output → READY_FOR_NEXT | T4, T5 |
| AC3 | CI: handler stateless; session state in external store | T6, T7 |
| AC4 | CI: no hardcoded credentials; all config from context.yml | T8, T9 |

---

## Architecture Constraints (binding)

- **C11:** Stateless event-driven handler; no persistent server process; per-session lifecycle maximum
- **C7:** AWAITING_RESPONSE lock implemented as state machine constraint in code; not prompt instruction
- **ADR-004:** Teams bot configuration from `.github/context.yml`; no hardcoded tenant IDs or channel references
- **MC-SEC-02:** No credentials in runtime code; user input stored only to designated session state store

---

## Quality Gate

1. `npm test` passes including `tests/check-p4-nta-surface.js`
2. C7 state machine has unit tests: initial state, AWAITING_RESPONSE lock, answer-received unlock, invalid multi-question rejection
3. PR opened as draft; heymishy explicit approval required before merge
