# Definition of Done: Session middleware Redis fallback on cache miss

**PR:** https://github.com/heymishy/skills-repo/pull/547 | **Merged:** 2026-07-22
**Story:** artefacts/2026-07-22-session-redis-fallback/stories/srf-s1-session-middleware-redis-fallback.md
**Test plan:** artefacts/2026-07-22-session-redis-fallback/test-plans/srf-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-22-session-redis-fallback/dor/srf-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Redis fallback rehydrates, no new Set-Cookie) | ✅ | Two dedicated unit tests: rehydration matches stored data, no `Set-Cookie` sent, rehydrated data written back into the in-memory Map | automated test (`check-srf-s1-...js`) | None |
| AC2 (genuine cache miss still creates a new session) | ✅ | Double-miss creates a fresh session with `Set-Cookie`; no-cookie request never attempts a Redis read (asserted via read-count) | automated test | None |
| AC3 (OAuth callback survives simulated process replacement) | ✅ | Direct reproduction: real `handleAuthGithub` → simulated in-memory clear → real `handleAuthCallback` with matching state, confirmed no 403 | automated test, using the real unmocked functions | None |
| AC4 (accessToken honestly absent, not fabricated) | ✅ | Rehydrated session has `login`/`userId` restored but `accessToken` is `undefined` | automated test | None |
| AC5 (no Redis configured, unchanged behavior) | ✅ | Cache miss with no Redis adapter configured falls straight through to a new session, no error/hang | automated test | None |

**A deviation is any difference between implemented behaviour and the AC** — even if minor. None recorded — the merged code matches the story text exactly, including the explicit accessToken exclusion.

---

## Scope Deviations

None. The story's own Out of Scope section (no accessToken caching, no fix for the mid-product-creation-flow bug, no change to `rotateSessionId`/`SESSION_COOKIE_CONFIG`/startup `loadSessionsFromRedis`) was respected exactly — verified by reviewing the merged diff, which touches only `session-redis.js` (new `readSession` method), `session.js` (`sessionMiddleware` async + fallback branch), and one `await` in `server.js`.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7, independently re-run against merged `master`

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tests/check-srf-s1-session-redis-fallback.js (7 tests) | ✅ | ✅ | Re-run on master post-merge, all 7 green |
| tests/check-p3.2-redis-session-adapter.js (17 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-p1.2-tenant-session-journey.js (12 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-wsm1-session-persistence.js (23 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-wuce1-oauth-flow.js (48 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-s0.2-resume-existing-session.js (12 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| Full 361-file suite | ✅ | ✅ (324/361, 37 pre-existing baseline failures) | Confirmed identical failing-file list to the documented baseline both before and after this change — zero regressions |

**Gaps (tests not implemented):**
- No live GitHub OAuth click-through was performed in a real browser during an actual in-flight deploy (the exact reported scenario) — the automated test reproduces the real, unmocked `handleAuthGithub`/`handleAuthCallback` functions directly rather than a browser walkthrough. **Risk:** low — the reproduction exercises the genuine code path, not a synthetic stand-in for it. **Accepted**, recorded as a LOW finding in the story's own review, not escalated to RISK-ACCEPT.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no added latency on the common (in-memory-hit) path | ✅ | By design — the Redis fallback branch is only reached on a cache miss; the hit path is unchanged from the pre-existing code, confirmed by code review |
| Security — no new data sent to Redis; `accessToken` still excluded | ✅ | AC4's own test asserts this directly; `_sanitise`/`_sanitiseForRedis` are unmodified |
| Security — `SESSION_COOKIE_CONFIG` unchanged | ✅ | Confirmed by code review — no changes to that constant or its usage |
| Resilience — reduces blast radius of a mid-flow process replacement on login | ✅ | Directly verified via AC3's reproduction and the live staging deploy |

---

## Metric Signal

No metrics apply — this is a short-track story (per CLAUDE.md, short-track skips `/benefit-metric`); the parent feature's `metrics` array is empty. Benefit linkage was stated directly in the story (login flow reliability).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No formal metric tracked for this short-track story |

---

## Outcome

**COMPLETE**

All 5 ACs satisfied with automated evidence; the one accepted gap (no live browser click-through during an actual in-flight deploy) is a LOW-risk, already-flagged, non-blocking item — the automated reproduction exercises the real production code paths, not a simulation.

**Follow-up actions:**
1. If the mid-product-creation-flow session loss (the separate, NOT-fixed symptom) recurs outside the context of this session's own repeated redeploys during live testing, revisit the `accessToken`-caching tradeoff as its own explicitly-scoped decision. Owner: Hamish King (Founder/Operator).
2. Consider a live click-through spot-check next time a staging deploy happens during active login-flow testing, to close the loop on the one accepted gap above. Owner: Hamish King.

---

## DoD Observations

1. **This story was discovered and delivered entirely through direct operator bug reports during live testing, not through a planned discovery pass.** Two symptoms were reported close together (OAuth callback forbidden; mid-product-creation session loss) that shared a common architectural root cause but had different fixability — separating them cleanly (fix one, explicitly decline the other's security tradeoff) prevented silently overreaching into a bigger security decision the operator hadn't actually signed off on. `/improve` candidate: when investigating a reported bug that touches shared infrastructure, explicitly enumerate which *other* symptoms share the same root cause but might need a *different* scope decision, before proposing a single combined fix.
2. **The fix directly resulted from this same session's own actions** (three staging redeploys during active operator testing) triggering the exact race condition being fixed. Worth a standing note: testing multi-step flows on staging immediately during/after a deploy is inherently fragile given this architecture, even after this fix (the accessToken-loss scenario remains).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Session middleware Redis fallback on cache miss" (srf-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the explicit accessToken-exclusion scope boundary still respected in the merged code (not silently expanded)?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
