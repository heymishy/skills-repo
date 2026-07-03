# Discovery — Skills session resume defect

**Type:** Defect (short-track)
**Feature slug:** 2026-07-03-skills-session-resume
**Discovered:** 2026-07-03
**Track:** Short-track — /test-plan → /definition-of-ready → coding agent (no full outer loop)

---

## Problem statement

When a user navigates to a `/skills/:skillName/sessions/:id/chat` URL after a server restart or Fly.io deploy, they receive a "Session not found" (404) page. Their in-progress skill session (conversation history, partial artefact) appears lost. The session IS durably persisted in Redis via `skill-session-redis.js` — the data is recoverable — but `handleGetChatHtml` in `src/web-ui/routes/skills.js` checks only the in-memory `_sessionStore` and never attempts a Redis restore.

On Fly.io, this happens on every deploy. Users lose access to mid-session skill work after any server restart.

## Root cause

`handleGetChatHtml` (`skills.js:3569`) does `_sessionStore.get(sessionId)` → if not found → 404. No Redis restore attempted. The journey resume handler (`journey.js`) already has the correct Redis restore pattern. The fix is to apply the same pattern to the standalone skills chat handler.

## Secondary gap

`handleResumeSession` API response omits `turns`. Deferred — out of scope for this story (see `def-s1-session-resume.md` Out of scope).

## Scope

**In:** Fix `handleGetChatHtml` to restore from Redis on cache miss. Restore `turns`, `artefactContent`, `journeyId`.
**Out:** `handleResumeSession` turns gap; journey resume path (already works); UI changes; data backfill.

---

## Approved By

Hamish King — Operator — 2026-07-03
