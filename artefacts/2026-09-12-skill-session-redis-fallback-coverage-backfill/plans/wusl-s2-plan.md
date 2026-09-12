# Implementation Plan: Dedicated Redis-fallback tests for the remaining wusl-s1 call sites (wusl-s2)

**Story:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/stories/wusl-s2-dedicated-tests-for-remaining-handlers.md
**Test plan:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/test-plans/wusl-s2-test-plan.md
**DoR:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/dor/wusl-s2-dor.md

---

## Task 1: Regression test file (AC1, AC2, AC3, AC4)

**Files:** `tests/check-wusl-s2-remaining-handler-coverage.js` (new)

- T1/AC1: `handleCommitArtefact` restores a complete session from Redis on a cold in-memory Map.
- T2/AC2: `handlePostCanvasEditHtml` restores a session from Redis on a cold in-memory Map.
- T3/AC3: `handlePostTurnStreamHtml` restores a session from Redis on a cold in-memory Map (stubbed stream executor), responds 200.
- T4/AC4: `htmlSubmitTurn` restores a session from Redis on a cold in-memory Map (stubbed executor), does not return `null`.
- No source change — `src/web-ui/routes/skills.js` untouched.
- Pre-implementation finding: `htmlRecordAnswer` (the story's original 5th target) confirmed dead code — not exported, zero callers anywhere. Dropped from scope; story/test-plan/DoR updated accordingly before this task started.

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
