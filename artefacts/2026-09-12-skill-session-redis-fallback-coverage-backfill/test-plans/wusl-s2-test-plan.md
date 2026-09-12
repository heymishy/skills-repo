# Test Plan: Dedicated Redis-fallback tests for the remaining wusl-s1 call sites (wusl-s2)

**Story:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/stories/wusl-s2-dedicated-tests-for-remaining-handlers.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Integration | `handleCommitArtefact` restores a complete session from Redis on a cold in-memory Map, does not respond `SESSION_NOT_FOUND` |
| T2 | AC2 | Integration | `handlePostCanvasEditHtml` restores a session from Redis on a cold in-memory Map, does not respond `SESSION_NOT_FOUND` |
| T3 | AC3 | Integration | `handlePostTurnStreamHtml` restores a session from Redis on a cold in-memory Map (stubbed stream executor), responds 200 not 404 |
| T4 | AC4 | Unit | `htmlSubmitTurn` restores a session from Redis on a cold in-memory Map (stubbed executor), does not return `null` |

**Note:** the story's original 5th target, `htmlRecordAnswer`, was confirmed dead code (not exported, zero callers) during preparation — dropped from scope, see the story's own Out of Scope section.

## Regression coverage

- `tests/check-wusl-s1-session-redis-fallback.js` (the sibling story's own suite) re-run unmodified — all 7 tests must still pass.

## Out of Scope (per story)

- Any change to `src/web-ui/routes/skills.js`.
- `htmlRecordAnswer` — dead code, not reachable from any live request path.
- The 5 excluded synchronous accessor functions.
- Full end-to-end success-path behaviour of any of the 4 handlers beyond the Redis-fallback claim.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
