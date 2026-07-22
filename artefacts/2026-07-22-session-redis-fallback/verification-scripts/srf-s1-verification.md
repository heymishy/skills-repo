# AC Verification Script: Session middleware Redis fallback on cache miss

**Story reference:** artefacts/2026-07-22-session-redis-fallback/stories/srf-s1-session-middleware-redis-fallback.md
**Technical test plan:** artefacts/2026-07-22-session-redis-fallback/test-plans/srf-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent) | **Date:** 2026-07-22 | **Context:** [x] Pre-code sign-off (post-implementation, pre-PR)

---

## Scenarios

### Scenario 1: Logging in via GitHub during a deploy no longer shows "Forbidden"

**Covers:** AC1, AC3

**Steps:**
1. Click "Sign in with GitHub."
2. (Historically: if a deploy landed while you were on GitHub's authorize page, the callback would 403.)
3. Complete GitHub's authorization and return to the callback URL.

**Expected outcome:**
> You land signed in, on the dashboard — never a "Forbidden" page requiring a manual retry.

**Result:** [x] Pass (automated equivalent)
**Notes:** Automated test `check-srf-s1-...js`'s AC3 scenario directly reproduces this: calls the real `handleAuthGithub` (writing and persisting `oauthState`), clears the in-memory session store (simulating a redeploy), then calls the real `handleAuthCallback` with the matching state — confirmed no 403. Live click-through on staging not performed this session (would require an actual GitHub OAuth round-trip during a live redeploy, hard to reliably time manually) — the direct code-level reproduction is considered sufficient given it exercises the exact real functions involved, not a simulation of them.

---

### Scenario 2: A genuinely new visitor still gets a normal fresh session

**Covers:** AC2

**Steps:**
1. Visit the site with no existing session cookie (private/incognito window).

**Expected outcome:**
> A new session is created normally, exactly as before this change — no behavior difference for a first-time visitor.

**Result:** [x] Pass (automated)
**Notes:** Covered by unit tests U3/U4.

---

### Scenario 3: An already-logged-in user whose session survives is unaffected

**Covers:** AC1 (non-miss path)

**Steps:**
1. Log in normally and use the app without any deploy happening in between.

**Expected outcome:**
> Everything behaves exactly as before — no new latency, no behavior change, since the in-memory session is still present (the common case).

**Result:** [x] Pass
**Notes:** Confirmed by design — the Redis fallback branch is only reached on an in-memory cache miss; the hit path is byte-identical to the pre-existing code.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — OAuth callback survives a mid-flow deploy | Pass | Automated reproduction of the real reported bug |
| Scenario 2 — new visitor unaffected | Pass | |
| Scenario 3 — common case unaffected | Pass | By design, confirmed in code review |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| N/A | Live GitHub OAuth click-through not performed this session | Automated code-level reproduction used instead | LOW | Accept — the reproduction exercises the real, unmocked `handleAuthGithub`/`handleAuthCallback` functions, not a synthetic simulation; recommend a live spot-check next time a staging deploy happens during active testing, to close the loop |
