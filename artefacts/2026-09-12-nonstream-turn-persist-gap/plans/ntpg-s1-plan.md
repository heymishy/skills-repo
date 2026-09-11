# Implementation Plan: Add the missing session_turns durable write to the non-streaming turn handler (ntpg-s1)

**Story:** artefacts/2026-09-12-nonstream-turn-persist-gap/stories/ntpg-s1-add-session-turns-write-to-nonstream-handler.md
**Test plan:** artefacts/2026-09-12-nonstream-turn-persist-gap/test-plans/ntpg-s1-test-plan.md
**DoR:** artefacts/2026-09-12-nonstream-turn-persist-gap/dor/ntpg-s1-dor.md

---

## Task 1: Add the writeSessionTurns call to htmlSubmitTurn (AC1, AC2, AC3)

**Files:** `src/web-ui/routes/skills.js`

- Inside `htmlSubmitTurn`'s `if (artefactMatch)` completion block, after `session.done = true`, add the same `writeSessionTurns` call `handlePostTurnStreamHtml` already has, guarded by `session.journeyId && process.env.DATABASE_URL`, non-fatal `.catch()`.

**Status:** committed

---

## Task 2: Regression test file (AC1, AC2, AC3, AC4)

**Files:** `tests/check-ntpg-s1-nonstream-turn-persist.js` (new)

- AC1/AC1-regression: real `handlePostTurnHtml` call, confirms `writeSessionTurns` fires with correct data including the completing assistant turn.
- AC2: a second completion calls `writeSessionTurns` again.
- AC3: a failed write doesn't block the 200 response.
- AC4: end-to-end — after simulating the real gate-confirm's `completeStage()` call, `handleGetJourneyStageView` renders the chat-split view, not the plain fallback.

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
