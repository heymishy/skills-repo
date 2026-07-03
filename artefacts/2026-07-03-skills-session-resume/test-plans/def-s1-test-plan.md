# Test Plan — def-s1 — Skills session resume: Redis restore on cache miss

**Story:** def-s1
**Feature:** 2026-07-03-skills-session-resume
**Review status:** Short-track defect — /review skipped per CLAUDE.md
**Test runner:** `node tests/check-def-s1-session-resume.js`
**Date written:** 2026-07-03

---

## Test data strategy

**Strategy:** Synthetic. All data is generated in test setup with no real Redis, no real disk writes, and no real skill model calls. Injectable adapters used:

- `setSkillSessionRedisAdapter(mockAdapter)` — injects a mock Redis adapter whose `read(sessionId)` returns pre-set session data (or null). Exposed via `module.exports.setSkillSessionRedisAdapter` in `skills.js`.
- `_setHtmlSession(sessionId, data)` — directly populates `_sessionStore` to simulate a session already in memory. Exposed via `module.exports._setHtmlSession`.
- `_getHtmlSession(sessionId)` — reads from `_sessionStore` after handler runs to assert restored state. Exposed via `module.exports._getHtmlSession`.
- `setSkillTurnExecutorAdapter` — set to a no-op to prevent real model calls when `buildSystemPrompt` is triggered.

Mock Redis adapter shape required:
```js
{ read: async (sessionId) => redisData | null, del: async () => {}, write: async () => {} }
```

Redis data shape returned by mock (mirrors what `skill-session-redis.js` writes — all session fields except `systemPrompt`, `contextFiles`, `precomputedStep1`):
```js
{
  skillName: 'discovery',
  sessionPath: '/tmp/test-session',
  featureSlug: null,
  journeyId: null,        // or 'test-journey-id' for AC5 test
  turns: [],              // or populated array for AC3 test
  artefactContent: null,  // or string for AC4 test
  artefactPath: null,
  done: false
}
```

**PCI/sensitivity:** None.

**Test data gaps:** None. All test data is synthetic.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | Cache miss + Redis hit → 200 | Unit | T1.1 | None |
| AC2 | Cache miss + Redis miss → 404 | Unit | T2.1 | None |
| AC3 | Turns restored: prior Q&A in HTML, current Q shown, thread non-empty | Unit | T3.1, T3.2 | None |
| AC4 | artefactContent restored: `__SW_INITIAL_ARTEFACT__` in HTML | Unit | T4.1 | None |
| AC5 | journeyId restored on session after Redis restore | Unit | T5.1 | Implementation note: `journeyId` is not in `mergeRedisSessionData`'s `stateFields` — handler must explicitly restore it (see §Implementation constraints) |
| AC6 | Hot path: session in memory → 200, Redis adapter NOT called | Unit | T6.1 | None |

---

## Gap table

No untestable gaps. All ACs are server-side handler behaviour, verifiable with injectable mocks and response inspection.

---

## E2E / browser-layout detection

No ACs are browser-layout-dependent. All behaviour is server-rendered HTML content. No E2E tooling required.

---

## Implementation constraints (surfaced during test planning)

**journeyId not in mergeRedisSessionData stateFields:** `mergeRedisSessionData` (`skills.js:90`) restores `turns`, `artefactContent`, `artefactPath`, `done`, `usage`, `_artefactBuffer`, `_artefactInProgress`, `_slugBuffer`, `assumptionCards` — but NOT `journeyId`. `registerHtmlSession` always initialises `journeyId: null`. To satisfy AC5, the fix in `handleGetChatHtml` must explicitly restore `journeyId` from `_redisData` after calling `mergeRedisSessionData`. Recommended pattern:
```js
var restored = _sessionStore.get(sessionId);
if (restored && _redisData.journeyId) restored.journeyId = _redisData.journeyId;
```
This does NOT require changing `mergeRedisSessionData` — it keeps that function's contract narrow and avoids affecting the journey resume path which already handles journeyId separately.

---

## Unit tests

### T1 — Redis restore on cache miss → 200 (AC1)

**T1.1** — `chat-page-200-when-session-in-redis-not-in-memory`
Covers: AC1
Precondition: `_sessionStore` does NOT contain `sessionId` (never set); mock Redis adapter's `read(sessionId)` returns valid session data (`{ skillName: 'discovery', sessionPath: '/tmp/test', featureSlug: null, journeyId: null, turns: [], artefactContent: null, done: false }`)
Action: Call `handleGetChatHtml(req, res)` with `req.params.id = sessionId`, `req.session.accessToken = 'tok'`
Expected: `res._code === 200` (not 404); `res._body` is non-empty HTML
Edge case: none (Redis hit path)

### T2 — Cache miss + Redis miss → 404 (AC2)

**T2.1** — `chat-page-404-when-session-absent-everywhere`
Covers: AC2
Precondition: `_sessionStore` does NOT contain `sessionId`; mock Redis adapter's `read(sessionId)` returns `null`
Action: Call `handleGetChatHtml(req, res)` with `req.params.id = sessionId`, `req.session.accessToken = 'tok'`
Expected: `res._code === 404`; `res._body` contains "Session not found" (existing 404 behaviour preserved)
Edge case: Redis returning null correctly falls through to 404

### T3 — Prior turns restored: prior Q&A in HTML, current Q shown (AC3)

**T3.1** — `restored-session-renders-prior-qa-in-html`
Covers: AC3 (a) and (b)
Precondition: Mock Redis returns `{ skillName: 'discovery', turns: [{ role: 'assistant', content: 'QUESTION_ONE' }, { role: 'user', content: 'ANSWER_ONE' }, { role: 'assistant', content: 'QUESTION_TWO' }], ... }`
Action: Call `handleGetChatHtml`; inspect `res._body`
Expected:
- `res._body` contains `'QUESTION_ONE'` (prior assistant turn rendered as history)
- `res._body` contains `'ANSWER_ONE'` (prior user turn rendered as history)
- `res._body` contains `'QUESTION_TWO'` (last unanswered assistant turn rendered as current question)
Edge case: The QUESTION_TWO turn has no matching user turn — it renders as `currentQuestion` (not as a `priorQA` pair)

**T3.2** — `restored-session-has-non-empty-chat-thread`
Covers: AC3 (c) — auto-fire guard
Precondition: Same as T3.1
Action: Call `handleGetChatHtml`; inspect `res._body`
Expected: `res._body` contains `id="chat-messages"` div with at least one `sw-chat-msg` child element — i.e., the rendered `#chat-messages` div is non-empty, so the client-side `thread.children.length === 0` guard would evaluate to `false` and NOT fire `sendTurn("__init__")` on page load
Edge case: Verifying HTML structure from server — if `sw-chat-msg` is present in the `#chat-messages` div, auto-fire is suppressed

### T4 — artefactContent restored → artefact panel init script (AC4)

**T4.1** — `restored-session-with-artefact-includes-init-script`
Covers: AC4
Precondition: Mock Redis returns `{ skillName: 'discovery', artefactContent: 'PRIOR_ARTEFACT_CONTENT', turns: [], done: false, ... }`
Action: Call `handleGetChatHtml`; inspect `res._body`
Expected: `res._body` contains `__SW_INITIAL_ARTEFACT__` (the artefact init script block is injected when `session.artefactContent` is non-null, per `_renderChatPage` line ~2241)
Edge case: none

### T5 — journeyId restored on session after Redis restore (AC5)

**T5.1** — `restored-session-has-journey-id-from-redis`
Covers: AC5
Precondition: Mock Redis returns `{ skillName: 'discovery', journeyId: 'test-journey-id', turns: [], ... }`
Action: Call `handleGetChatHtml`; then call `_getHtmlSession(sessionId)`
Expected: The restored session in `_sessionStore` has `journeyId === 'test-journey-id'` (not null, which would be the value after `registerHtmlSession` alone without explicit restoration)
Edge case: Fails if only `registerHtmlSession` + `mergeRedisSessionData` are called without the explicit journeyId restoration step (see §Implementation constraints)

### T6 — Hot path: session in memory → 200, Redis NOT called (AC6)

**T6.1** — `hot-path-skips-redis-when-session-in-memory`
Covers: AC6
Precondition: Session IS in `_sessionStore` (via `_setHtmlSession`); mock Redis adapter wired with a `read` spy that tracks call count (starts at 0)
Action: Call `handleGetChatHtml`
Expected: `res._code === 200`; mock Redis adapter `read` call count === 0 (Redis never called for the hot path)
Edge case: This prevents a performance regression where every chat page load triggers a Redis read

---

## Integration tests

**IT1** — `graceful-fallback-when-redis-adapter-not-wired`
Covers: NFR — graceful Redis unavailability
Precondition: `setSkillSessionRedisAdapter(null)` (no Redis adapter); `_sessionStore` does NOT contain `sessionId`
Action: Call `handleGetChatHtml`
Expected: `res._code === 404` (falls through to not-found, no unhandled exception thrown); the handler does not crash when `_skillSessionRedis` is null
Edge case: `readSessionFromRedis` already guards `if (!_skillSessionRedis) return null` — this test confirms that guard is preserved after the fix

---

## NFR tests

**NFR1** — `redis-read-count-zero-for-hot-path`
Covers: NFR — no additional Redis reads for the cold path, confirmed by hot-path read count = 0
Precondition: Same as T6.1 but focus is the Redis call count metric
Action: Wire Redis mock with call counter; call `handleGetChatHtml` with session in `_sessionStore`
Expected: `redisReadCount === 0`
Note: T6.1 already covers this; NFR1 is the explicit statement of the performance constraint. May share implementation with T6.1.

---

## State update fields

- `totalTests`: 9 (T1.1, T2.1, T3.1, T3.2, T4.1, T5.1, T6.1, IT1, NFR1)
- `acTotal`: 6
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false

---

## Notes for coding agent

- Test file name: `tests/check-def-s1-session-resume.js`
- Add to `npm test` chain in `package.json` as: `node tests/check-def-s1-session-resume.js`
- Use `freshRequire(SKILLS_PATH)` to clear require cache between tests — critical so `setSkillSessionRedisAdapter(null)` in one test doesn't leak into the next
- Mock Redis adapter must be reset to null between tests to avoid cross-test contamination
- `buildSystemPrompt` is called by `registerHtmlSession` during the restore path; `skillName: 'discovery'` will read the real `skills/discovery/SKILL.md` from disk — this is acceptable and expected in integration
- `setSkillTurnExecutorAdapter` should be set to an async no-op for tests that reach `handlePostTurnHtml` (not needed here since `handleGetChatHtml` doesn't call the executor)
