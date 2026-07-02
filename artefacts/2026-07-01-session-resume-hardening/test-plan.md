# Test Plan — Session Resume Hardening (wsm.2)

**Feature slug:** 2026-07-01-session-resume-hardening
**Story:** wsm-resume — Skill session persistence and resume correctness
**Author:** Claude Sonnet 4.6 — 2026-07-01
**Short-track:** test-plan → DoR → implementation

---

## Scope

Four defects diagnosed in the session resume flow and hardened in this story:

1. **Same-process resume always creates a new session** — `handleGetJourneyResume` calls `crypto.randomUUID()` unconditionally, discarding the existing in-progress session and its turns.
2. **Skill session turns are lost across Fly.io deploys** — turns live in process memory and on ephemeral disk only; neither survives a deploy. No Redis persistence existed.
3. **System prompt stored in Redis** — if naively serialised, the session object is 250KB+ (systemPrompt dominates). Upstash free tier is 256MB; ~500 sessions would exhaust it.
4. **`_sessionStore` in-process memory leak** — sessions accumulate in the in-memory Map indefinitely; no eviction on long-running servers.

---

## Test strategy

Node.js unit tests only. No browser, no live Fly.io or Upstash dependency. All external adapters (Redis, disk) are replaced with in-memory stubs. Tests run with `node tests/check-s0.N-*.js`.

---

## Test files and acceptance criteria

### `tests/check-s0.2-resume-existing-session.js` — same-process resume

| AC | Description | Assertion |
|----|-------------|-----------|
| AC1 | Live in-progress session (in memory, not done) | `handleGetJourneyResume` returns 303 with existing session ID in Location |
| AC2 | Done session — should not re-open | 303 to a NEW session ID; existing session ID absent from Location |
| AC3 | No activeSessionId set on journey | 303 to a new session ID |
| AC4 | Stale activeSessionId (not in memory, Redis returns null) | 303 to a new session ID; stale ID absent from Location |

### `tests/check-s0.4-resume-redis-session.js` — Redis persistence

| AC | Description | Assertion |
|----|-------------|-----------|
| AC1 | Redis write strips large fields | `COMPACT_STRIP` contains `systemPrompt`, `contextFiles`, `precomputedStep1` |
| AC2 | `readSessionFromRedis` returns data for live sessions; null for done or missing | Correct null/data returns per state |
| AC3 | `mergeRedisSessionData` merges turns onto registered session without overwriting systemPrompt | turns restored; systemPrompt intact |
| AC4 | Redis `del` called when session completes | `del` stub receives session ID on done |
| AC5 | Post-deploy resume: `registerHtmlSession` + `mergeRedisSessionData` called with existing session ID | Both stubs called; 303 Location contains existing ID |
| AC6 | No Redis adapter wired: `readSessionFromRedis` returns null without error | Returns null |
| AC7 | `session.lastUpdated` field stamped for eviction | Field is valid ISO 8601 string |

### `tests/check-s0.1-resume-guard.js` — access control (regression)

All existing ACs pass without regression. `setReadSessionFromRedis` and `setMergeRedisSessionData` stubs explicitly set to null-returning functions.

---

## NFRs

- Redis write is fire-and-forget — write failure does not block the SSE turn response
- Redis `del` on done is fire-and-forget — del failure is warn-logged, not fatal
- `startSessionEviction()` is called once at server startup; no-ops if `_sessionStore` is empty
- `readSessionFromRedis` catches all Redis errors and returns null (never throws to caller)
- Eviction only removes sessions where `lastUpdated` is older than `SESSION_MAX_AGE_DAYS` (default 7 days)

---

## Files touched

| File | Change |
|------|--------|
| `src/web-ui/adapters/skill-session-redis.js` | New adapter: `write` (compact), `read`, `del`; `COMPACT_STRIP` constant |
| `src/web-ui/routes/skills.js` | `setSkillSessionRedisAdapter`, `readSessionFromRedis`, `mergeRedisSessionData`, `startSessionEviction`; `lastUpdated` stamp; Redis del on done |
| `src/web-ui/routes/journey.js` | `handleGetJourneyResume` three-tier restore; `setReadSessionFromRedis`, `setMergeRedisSessionData` injectables |
| `src/web-ui/server.js` | Wire `setSkillSessionRedisAdapter`, `setReadSessionFromRedis`, `setMergeRedisSessionData`, `startSessionEviction` |
| `tests/check-s0.1-resume-guard.js` | Add explicit Redis stubs |
| `tests/check-s0.2-resume-existing-session.js` | Add explicit Redis stubs |
| `tests/check-s0.4-resume-redis-session.js` | New: 7 ACs covering Redis persistence and restore |
