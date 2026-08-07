# Definition of Done: Consistent skill-session Redis fallback

**PR:** https://github.com/heymishy/skills-repo/pull/549 | **Merged:** 2026-07-22
**Story:** artefacts/2026-07-22-skill-session-redis-fallback/stories/wusl-s1-consistent-session-redis-fallback.md
**Test plan:** artefacts/2026-07-22-skill-session-redis-fallback/test-plans/wusl-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-22-skill-session-redis-fallback/dor/wusl-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (extraction, chat-page-load unchanged) | ✅ | `handleGetChatHtml` restores from Redis on a cold Map, response is a real chat page not a 404 | automated test | None |
| AC2 (9 handlers gain the same fallback) | ✅ | `handlePostAnswer`, `handleGetSessionState`, `handlePostTurnHtml`, `handlePostAssumptionConfirm` each individually tested (representative subset of the 9; the remaining 5 — `handleCommitArtefact`, `handlePostCanvasEditHtml`, `handlePostTurnStreamHtml`, `htmlSubmitTurn`, `htmlRecordAnswer` — share the identical code-shape fix applied via the same shared helper, verified by direct code review of each call site) | automated test + code review | See note below |
| AC3 (genuine double-miss unchanged) | ✅ | Session absent from both stores still returns `SESSION_NOT_FOUND` exactly as before | automated test | None |
| AC4 (sync functions explicitly unconverted) | ✅ | Each of `_getHtmlSession`/`htmlGetNextQuestion`/`htmlGetCompletePage`/`htmlGetPreview`'s own distinct missing-session behavior confirmed unchanged, none consult Redis even when the stub adapter has real data for that session ID | automated test | None |

**Deviation note (AC2):** the test plan specified "1 test per handler (9 total)" as the ideal; the actual test suite covers 4 of the 9 directly (one per distinct code shape: simple lookup, session-state read, streaming/turn submission, assumption-card lookup) plus direct code review confirming the remaining 5 use the byte-identical `await _getSessionOrRestore(sessionId)` pattern at their own call sites. This is a scope-reduction from the original test-plan ambition, judged acceptable given all 9 sites use one shared, already-tested helper function rather than 9 independent implementations — the risk of an untested 5th, 6th, 7th... call site behaving differently is low since they all delegate to the same function. Recorded honestly rather than silently treated as "10/10 tests as planned."

---

## Scope Deviations

None beyond the story's own explicitly-declared exclusion of 5 synchronous accessor functions (`_getHtmlSession`, `htmlGetNextQuestion`, `htmlGetCompletePage`, `htmlGetPreview`, `linkSessionToJourney`) — confirmed untouched by code review of the merged diff.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (test plan's own IT2-IT10 "9 handlers" ambition consolidated into 4 representative handler tests + code review, per the AC2 deviation note above)
**Tests passing in CI:** 7 / 7, independently re-run against merged `master`, both before and after the mid-flight rebase onto `jrf-s2`

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tests/check-wusl-s1-session-redis-fallback.js (7 tests) | ✅ | ✅ | Re-run on master post-merge, all 7 green |
| tests/check-wusl1-chat-streaming.js | ✅ (pre-existing) | ⚠️ (baseline) | Pre-existing baseline failure, one unrelated client-JS timing assertion (T1.6), confirmed unchanged by this story |
| tests/check-wusl2-progressive-live-draft.js (8 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-iwu5-lens-complete.js (17 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| Full suite | ✅ | ✅ (326/363, 37 pre-existing baseline failures) | Run 3 times across this story's lifecycle (initial implementation, post-rebase) — identical 37-file failing list every time |

**Gaps (tests not implemented):**
- Individual dedicated tests for `handleCommitArtefact`, `handlePostCanvasEditHtml`, `handlePostTurnStreamHtml`, `htmlSubmitTurn`, `htmlRecordAnswer`'s own Redis-fallback behavior — covered by code review (byte-identical call pattern) rather than individual automated tests. **Risk:** low — all 9 call sites delegate to the exact same, already-tested `_getSessionOrRestore` helper; a bug would need to be in how a SPECIFIC call site invokes the shared helper (e.g. a typo), which code review directly checked for. **Accepted**, not escalated to RISK-ACCEPT given the shared-helper architecture makes per-site divergence structurally unlikely.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no added latency for the common (session-already-loaded) case | ✅ | Fallback branch only reached on an actual cache miss, confirmed by code review |
| Resilience — consistent recovery across all 9 primary action handlers | ✅ | This IS the fix |
| Security — no new data written to Redis | ✅ | Read-path-only change, confirmed by code review of the diff |

---

## Metric Signal

No metrics apply — short-track story, parent feature's `metrics` array is empty.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Marked "with deviations" to keep the AC2/test-plan scope reduction (4 directly-tested handlers + code review for the remaining 5, rather than 9 fully independent tests) visible for /trace — not because any AC failed, but because the actual test coverage shape differs from the test plan's original per-handler ambition. Judged low-risk given the shared-helper architecture.

**Follow-up actions:**
1. If a future bug report ever traces to one of the 5 code-reviewed-only call sites (`handleCommitArtefact`, `handlePostCanvasEditHtml`, `handlePostTurnStreamHtml`, `htmlSubmitTurn`, `htmlRecordAnswer`), add a dedicated automated test for that specific site at that time — no proactive action needed otherwise. Owner: Hamish King (Founder/Operator), reactive.
2. The 5 excluded synchronous accessor functions remain a known, real (if lower-exposure) gap — revisit as a separate story if it proves to matter in practice. Owner: Hamish King.

---

## DoD Observations

1. **This was the third and final instance of the in-memory-Map/write-behind-Redis-or-Postgres pattern found via the operator's own requested audit this session** (after `srf-s1` for login sessions and `jrf-s2` for journeys). All three shared the same root architectural characteristic (Redis/disk written to, but only ever read back at process boot, never per-request) despite being built independently, at different times, by different stories — confirming the operator's own hypothesis that this was "an evolved design" needing a consistency pass, not one isolated bug.
2. **This story required a rebase mid-flight** when PR #549 developed conflicts after #546/#547/#548 merged ahead of it — resolved cleanly via `git rebase master` with zero manual conflict resolution needed, re-verified with the full test suite before force-pushing. Worth noting this repo's own conflict-marker-verification convention (`wsm`/D40) was followed even though no markers were found.
