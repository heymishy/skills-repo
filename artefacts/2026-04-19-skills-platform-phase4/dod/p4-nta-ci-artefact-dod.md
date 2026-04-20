# Definition of Done — p4-nta-ci-artefact

**Story:** p4-nta-ci-artefact — CI artefact quality reporter for Teams bot sessions
**Epic:** E4 — Non-Technical Access
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20

## AC coverage

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `checkBotArtefact` with `standardsInjected: false` → `{ level: 'warning', message: '...' }` | PASS |
| AC2 | `checkBotArtefact` with `standardsInjected: true` → null | PASS |
| AC3 | Warning message contains artefact path and `standards_injected` | PASS |
| AC4 | `standardsInjected: false` never produces `level: 'error'` or `level: 'failure'` (MC-CORRECT-02) | PASS |
| AC5 | No bot-specific bypass patterns in governance check scripts (`skipIfBot`, `isBotProduced`, etc.) | PASS |
| AC6 | Clean artefact returns null — no surface annotation (no `level: 'info'` annotation either) | PASS |
| AC7 | No credentials in CI reporter output (MC-SEC-02) | PASS |
| AC8 | No hardcoded dated artefact paths in source (ADR-004) | PASS |
| AC9 | `checkBotArtefact` only returns null or `level: 'warning'` for all inputs (MC-CORRECT-02) | PASS |

## Test results

- **Test file:** `tests/check-p4-nta-ci-artefact.js`
- **Results:** 16/16 assertions passing
- **npm test:** exit 0, no regressions

## Implementation

**File:** `src/teams-bot/ci-reporter.js`

`checkBotArtefact({ artefactPath, standardsInjected })` — minimal and correct. Returns null for clean artefacts (standardsInjected true). Returns a warning-level object for missing standards injection, with a message referencing the artefact path, the `standards_injected` flag, and a guidance note to run `skills-repo init`. Never returns error or failure level — bot-produced artefacts are not blocked, only flagged.

## Deviations

None.
