# Definition of Done: Dedicated Redis-fallback tests for the remaining wusl-s1 call sites (wusl-s2)

**PR:** https://github.com/heymishy/skills-repo/pull/867 | **Merged:** 2026-09-12 (merge commit `3c3292ebb75518b4cde6bafe39ed44aff73f6396`)
**Story:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/stories/wusl-s2-dedicated-tests-for-remaining-handlers.md
**Test plan:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/test-plans/wusl-s2-test-plan.md
**DoR:** artefacts/2026-09-12-skill-session-redis-fallback-coverage-backfill/dor/wusl-s2-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handleCommitArtefact` restores a complete session from Redis on a cold in-memory Map, does not respond `SESSION_NOT_FOUND`. Re-run fresh on merged master. | Integration test, re-run post-merge | None |
| AC2 | ✅ | `handlePostCanvasEditHtml` restores a session from Redis on a cold in-memory Map, does not respond a session-not-found error. Re-run fresh on merged master. | Integration test, re-run post-merge | None |
| AC3 | ✅ | `handlePostTurnStreamHtml` restores a session from Redis on a cold in-memory Map (stubbed stream executor), responds 200 not 404. Re-run fresh on merged master. | Integration test, re-run post-merge | None |
| AC4 | ✅ | `htmlSubmitTurn` restores a session from Redis on a cold in-memory Map (stubbed executor), does not return `null`. Re-run fresh on merged master. | Unit test, re-run post-merge | None |

**Full re-run on merged master:** `tests/check-wusl-s2-remaining-handler-coverage.js` — 4/4 passing.

---

## Scope Deviations

**AC5 dropped before implementation, not a post-merge deviation.** The story's originally-planned 5th target, `htmlRecordAnswer`, was confirmed dead code during this story's own preparation (2026-09-12, before any test was written): not exported from `src/web-ui/routes/skills.js`, zero callers anywhere in the codebase (verified via direct `require()` check returning `undefined` and a full-repo grep). The story, test-plan, and DoR were all updated to drop it and record the finding before implementation started — this is not a deviation discovered after the fact, it's why the story shipped with 4 ACs instead of the originally-drafted 5. Confirmed via `gh pr view 867 --json files`: the merged diff touches exactly the new test file and artefacts/pipeline-state.json bookkeeping — no source change, matching the story's own Out of Scope declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4
**Tests passing on merged master:** 4/4 (own suite)

**Regression suite re-run fresh on merged master:**
- `tests/check-wusl-s1-session-redis-fallback.js` (the sibling story's own suite): 7/7 passing, unmodified.

**Gaps:** None against the story's own (revised) scope.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Test-only change, no production code path touched |
| Security | ✅ N/A | Test-only change, no new code path |
| Accessibility | ✅ N/A | Backend-only |
| Audit | ✅ N/A | No new audit surface |

---

## Metric Signal

No formal benefit-metric artefact exists for this story — short-track test-coverage backfill, per the story's own Benefit Linkage section. The stated benefit (closing `wusl-s1`'s own named test-plan scope reduction) is directly confirmed by AC1-AC4's evidence: 4 previously code-review-only call sites now have real, automated, CI-enforced regression coverage.

---

## Outcome

**COMPLETE**

No deviations against the story's final (revised) scope, no test gaps. Proactively closes `wusl-s1`'s own Follow-up Action #1 for 4 of its originally-named 5 call sites; the 5th (`htmlRecordAnswer`) was found to be dead code and correctly excluded rather than tested for appearance's sake.

**Live-verified against real `wuce-staging`, 2026-09-13 (post-merge, operator-requested):** the automated unit/integration tests above exercise `_getSessionOrRestore`'s Redis-fallback logic against a stubbed adapter; this pass additionally confirmed the real, end-to-end behaviour in production. Method: with `MOCK_LLM_GATEWAY` temporarily switched off (real model calls, auto-reverts after 30 minutes or on restart per the admin toggle's own safety net), started a real `/discovery` session, submitted a real answer containing a distinctive marker (`WUSLREDIS998877`), confirmed the model's real follow-up response referencing it, then ran `flyctl machine restart` on the single `wuce-staging` machine — clearing its in-memory `_sessionStore` Map entirely. After the restart, re-authenticated and reloaded the exact same session URL (`GET /skills/discovery/sessions/:id/chat`, the real route a browser uses): the full conversation, including the marker turn and the model's response, was rendered intact — proving `_getSessionOrRestore`'s Redis restore path works for a real, active (not-yet-done) session, not just in the test harness. (A first attempt using a mock-gateway session found `SESSION_NOT_FOUND` after restart — traced to the session having already reached `done:true` from the single-shot canned fixture, which correctly and intentionally deletes the session from Redis per `handlePostTurnStreamHtml`'s own comment ("artefact is in Postgres/disk instead") — not a wusl-s2 gap, just the wrong test scenario, corrected by using a real multi-turn conversation instead.)

**Separate, unrelated finding surfaced during this verification, not a wusl-s2 defect:** `GET /api/skills/:name/sessions/:id/state` (`handleGetSessionState`) has its own ownership check, `session.userId !== reqUserId` — but `session.userId` is never assigned anywhere in `skills.js` (confirmed by a full-file grep), so this check fails for every session, always, regardless of restart or Redis. The real browser-facing route (`handleGetChatHtml`) uses a separate, correct ownership check via `journeyStore.getJourney(session.journeyId).ownerId` and was unaffected. Recommend a follow-up story to fix or remove the dead `userId` check on the JSON API route — flagged here, not fixed, as out of this story's own scope.

**Follow-up actions:**
1. **New finding, not part of this story's own scope:** `htmlRecordAnswer` (`src/web-ui/routes/skills.js:5757`) is confirmed dead code — defined, never exported, never called from anywhere in the codebase. Recommend a future short-track story to delete it entirely (reducing maintenance surface) once confirmed there's no near-term plan to reintroduce a call site for it. Low priority, no functional risk either way — it currently does nothing, good or bad.
2. **New finding, surfaced during live-verification, not part of this story's own scope:** `handleGetSessionState`'s ownership check (`session.userId !== reqUserId`) is dead/broken — `session.userId` is never assigned anywhere, so the check always fails, returning `SESSION_FORBIDDEN` for every session unconditionally. Unclear whether any real client uses this JSON API route today (the real browser chat UI uses `handleGetChatHtml`'s separate, correct ownership check instead). Recommend a follow-up story to either fix the check (likely should compare against `session.journeyId`'s owner, matching `handleGetChatHtml`'s pattern) or remove the route if unused. Owner: not yet assigned.

---

## DoD Observations

1. **This story's own preparation step caught a real inaccuracy in `wusl-s1`'s original DoD** — the claim that `htmlRecordAnswer` was one of "9 named async handlers" using the shared helper turned out to describe unreachable code, not a live gap. This wasn't discoverable without directly attempting to write the test: code review alone (which is exactly how `wusl-s1`'s own DoD verified this 5th site) can confirm a function's internal logic is correct without noticing the function is never called at all. Worth a general lesson: "verified via code review that call site X uses the correct pattern" should also ideally confirm call site X is itself reachable — a review checklist item, not just a testing one.
2. Session-wide pattern continues to hold: this is the 3rd short-track story this session (after `ntpg-s1`'s root-cause fix and `tgid-s1`'s wiring fix) where following up on a self-disclosed DoD gap surfaced something slightly different from what the original gap described, rather than confirming it verbatim.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Dedicated Redis-fallback tests for the remaining wusl-s1 call sites" (wusl-s2).
Check:
1. Is the AC5-dropped-before-implementation framing accurate, or should this have been recorded as a deviation instead?
2. Is the dead-code finding (htmlRecordAnswer) credible given the evidence cited (require() check + grep)?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```
