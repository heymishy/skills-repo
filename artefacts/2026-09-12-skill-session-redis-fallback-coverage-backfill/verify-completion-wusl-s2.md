# Verify Completion: Dedicated Redis-fallback tests for the remaining wusl-s1 call sites (wusl-s2)

**Story:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/stories/wusl-s2-dedicated-tests-for-remaining-handlers.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | `handleCommitArtefact` restores a complete session from Redis on a cold in-memory Map, does not respond `SESSION_NOT_FOUND` |
| AC2 | ✅ | `handlePostCanvasEditHtml` restores a session from Redis on a cold in-memory Map, does not respond a session-not-found error |
| AC3 | ✅ | `handlePostTurnStreamHtml` restores a session from Redis on a cold in-memory Map (stubbed stream executor), responds 200 not 404 |
| AC4 | ✅ | `htmlSubmitTurn` restores a session from Redis on a cold in-memory Map (stubbed executor), does not return `null` |

**New test file:** `tests/check-wusl-s2-remaining-handler-coverage.js` — 4/4 passing.

**Dropped from scope (pre-implementation finding):** the story's original 5th target, `htmlRecordAnswer`, was confirmed dead code — not exported from `skills.js`, zero callers anywhere in the codebase (verified via direct `require()` check and full-repo grep). Writing a dedicated test for unreachable code would have no real coverage value. Story/test-plan/DoR updated to drop it before implementation started.

## Regression check

- `tests/check-wusl-s1-session-redis-fallback.js` (the sibling story's own suite): 7/7 passing, unmodified.

## Full suite

`NODE_ENV=test npm test`: 644 files run, 3 failed — matches the established baseline exactly (`check-bjs-s1-billing-journey-staging-safe.js`, `check-p3.5-validate-trace.js`, `check-s6.1-cache-scope-session-threading.js`), 0 new failures.

## Outcome

**COMPLETE.** All 4 real ACs verified. Zero regressions. The `htmlRecordAnswer` scope reduction is a real, honestly-recorded finding, not a shortfall — see DoD Observations for a follow-up recommendation.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
