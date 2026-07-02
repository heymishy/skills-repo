# Definition of Ready — wsm-resume

**Feature:** 2026-07-01-session-resume-hardening
**Story ID:** wsm-resume
**Story title:** Skill session persistence and resume correctness
**Sign-off date:** 2026-07-01
**Signed off by:** Hamish King

---

## Story

**As a** platform operator running a multi-turn skill session,
**I want** my session turns to be preserved when I navigate away and return, or when the server restarts or redeploys,
**So that** I do not lose conversation history and have to restart a session from scratch.

---

## Acceptance criteria

**AC1 — Same-process resume:** When `handleGetJourneyResume` is called and the journey's `activeSessionId` maps to a live in-memory session that is not done, the handler returns a 303 redirect to that existing session URL without creating a new session.

**AC2 — Turns written to Redis after every turn:** After each completed turn in `handlePostTurnStreamHtml`, a compact session snapshot (turns + runtime state, no systemPrompt) is written to Redis via `_skillSessionRedis.write()`. The write is fire-and-forget; failures are warn-logged and do not block the SSE response.

**AC3 — Post-deploy restore via Redis:** When `handleGetJourneyResume` finds `activeSessionId` is not in memory (post-deploy), it reads compact data from Redis, calls `registerHtmlSession` with the existing session ID to rebuild the system prompt, merges turns via `mergeRedisSessionData`, and redirects to the existing session URL.

**AC4 — systemPrompt not stored in Redis:** `skill-session-redis.js` strips `systemPrompt`, `contextFiles`, and `precomputedStep1` before every write. Per-session Redis values are <10KB (turns only); the 250KB system prompt is always rebuilt on restore.

**AC5 — Redis key deleted on session complete:** When `session.done` is set in `handlePostTurnStreamHtml`, `_skillSessionRedis.del(sessionId)` is called instead of `write`. This reclaims Upstash free-tier space immediately.

**AC6 — In-process session eviction:** `startSessionEviction()` is called once at server startup and sets an hourly interval that deletes `_sessionStore` entries where `session.lastUpdated` is older than `SESSION_MAX_AGE_DAYS` (default 7 days). `lastUpdated` is stamped on the in-memory session object after every turn.

**AC7 — Explicit Redis stubs in all resume tests:** `check-s0.1` and `check-s0.2` explicitly set `setReadSessionFromRedis` and `setMergeRedisSessionData` to null-returning stubs so tests are not silently affected by Redis adapter state from other test files.

---

## Contract

### In scope
- `src/web-ui/adapters/skill-session-redis.js` (new)
- `src/web-ui/routes/skills.js` — injectable + turn handler changes
- `src/web-ui/routes/journey.js` — `handleGetJourneyResume` restore logic
- `src/web-ui/server.js` — startup wiring
- `tests/check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js`, `check-s0.4-resume-redis-session.js`

### Out of scope
- Cross-session artefact content persistence (handled by Postgres artefacts table)
- Redis TTL configuration UI
- Compression of turn data in Redis
- Touch-device support changes

### Must NOT touch
- `src/web-ui/adapters/session-redis.js` (HTTP session Redis — separate concern)
- `src/web-ui/middleware/session.js`
- Any file under `src/enforcement/`

---

## DoR checklist

- [x] Story has a clear user value statement
- [x] All ACs are testable and have corresponding tests in check-s0.2 / check-s0.4
- [x] Test plan written and linked (`artefacts/2026-07-01-session-resume-hardening/test-plan.md`)
- [x] All tests pass: 41/41 across check-s0.1, check-s0.2, check-s0.4
- [x] Injectable adapter rule (D37) satisfied: `setSkillSessionRedisAdapter` stub throws if not wired (default null = safe no-op branch)
- [x] No accessToken written to Redis (COMPACT_STRIP does not include it; skill sessions never hold it)
- [x] NFR: Redis writes are non-blocking (fire-and-forget `.catch`)
- [x] NFR: Redis reads are error-safe (`readSessionFromRedis` catches and returns null)
- [x] Coding agent instructions: implement in order — adapter → skills.js → journey.js → server.js → tests

---

## Coding agent instructions

Implementation is complete. All 41 tests pass. No further coding required for this story.

If resuming: run `node tests/check-s0.1-resume-guard.js && node tests/check-s0.2-resume-existing-session.js && node tests/check-s0.4-resume-redis-session.js` to verify state.
