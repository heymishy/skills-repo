# Contract Proposal — def-s1 — Skills session resume: Redis restore on cache miss

**Date:** 2026-07-03
**Status:** Approved

---

## What will be built

In `handleGetChatHtml` (`src/web-ui/routes/skills.js`, ~line 3569): add a Redis restore branch between the `_sessionStore.get(sessionId)` check and the 404 return. Sequence: (1) `readSessionFromRedis(sessionId)` → if data: (2) `registerHtmlSession(sessionId, data.sessionPath, data.skillName, { featureSlug: data.featureSlug })`, (3) `mergeRedisSessionData(sessionId, data)`, (4) explicitly restore `journeyId` from `data` (`if (_restored && data.journeyId) _restored.journeyId = data.journeyId`). Re-read session from `_sessionStore` and continue normally.

New test file `tests/check-def-s1-session-resume.js` with 9 tests. One line added to `npm test` chain in `package.json`.

## What will NOT be built

- `handleResumeSession` API (`GET /api/skills/:name/sessions/:id/resume`) turns fix — different code path, separate story if needed
- Any UI changes — server-rendered HTML is unchanged by design
- Any change to `mergeRedisSessionData` function signature or `stateFields` — `journeyId` is restored explicitly in the handler

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Cache miss + Redis hit → 200 | T1.1: mock Redis returns data, assert `res._code === 200` | Unit |
| AC2 — Cache miss + Redis miss → 404 | T2.1: mock Redis returns null, assert `res._code === 404` | Unit |
| AC3 — Prior turns + current Q in HTML, no auto-fire | T3.1/T3.2: 5-turn Redis data, assert prior Q&A + current Q in HTML, `sw-chat-msg` in `#chat-messages` | Unit |
| AC4 — artefactContent → `__SW_INITIAL_ARTEFACT__` in HTML | T4.1: Redis data with artefactContent, assert init script in HTML | Unit |
| AC5 — journeyId restored on session | T5.1: Redis data with journeyId, assert `_getHtmlSession(id).journeyId` set | Unit |
| AC6 — Hot path: no Redis call when session in memory | T6.1: session in `_sessionStore`, assert Redis read count = 0 | Unit |

## Assumptions

- Redis data always includes `skillName` and `sessionPath` (confirmed: not in `COMPACT_STRIP`)
- `buildSystemPrompt('discovery', ...)` reads existing `skills/discovery/SKILL.md` from disk — acceptable in test
- `done: true` sessions are already deleted from Redis — `readSessionFromRedis` returns null for them (existing guard)
- `_redisData.sessionPath` is server-originated (not user-controlled) — no additional path traversal guard needed

## Estimated touch points

Files: `src/web-ui/routes/skills.js` (~5 lines changed in `handleGetChatHtml`), `tests/check-def-s1-session-resume.js` (new, ~150 lines), `package.json` (1 line)
Services: None
APIs: None
