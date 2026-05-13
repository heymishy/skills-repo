# Definition of Done — p4-nta-surface

**Story:** p4-nta-surface — Teams bot surface: stateless session state machine
**Epic:** E4 — Non-Technical Access
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20

## AC coverage

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `initSession` returns `{ status: 'AWAITING_RESPONSE', questionId: ... }` | PASS |
| AC2 | `sendQuestion` when status is AWAITING_RESPONSE returns error (C7 lock) | PASS |
| AC3 | `recordAnswer` transitions status to READY_FOR_NEXT_QUESTION | PASS |
| AC4 | Recorded answer present in returned state | PASS |
| AC5 | No module-scope mutable session state (C11) | PASS |
| AC6 | No persistent process patterns: setInterval, server.listen, process.stdin.resume, new Server (C11) | PASS |
| AC7 | No hardcoded GUID-format tenant/channel IDs (ADR-004) | PASS |
| AC8 | No credentials in source (MC-SEC-02) | PASS |
| AC9 | `initSession` and `recordAnswer` return plain objects (MC-CORRECT-02) | PASS |

## Test results

- **Test file:** `tests/check-p4-nta-surface.js`
- **Results:** 23/23 assertions passing
- **npm test:** exit 0, no regressions

## Implementation

**File:** `src/teams-bot/bot-handler.js`

Stateless session state machine. All session state is returned to the caller and passed back as arguments — no module-scope mutable variables. The AWAITING_RESPONSE lock (C7) is enforced in `sendQuestion`: if the session has status AWAITING_RESPONSE, it returns `{ error: 'AWAITING_RESPONSE', message: '...' }` immediately. `recordAnswer` returns a new state object with the answer keyed by questionId.

## Deviations

None.
