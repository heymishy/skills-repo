# Test Plan: wsm.4 — Journey API GET response shape fix

**Story:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.4-get-response-shape-fix.md
**Test files:** tests/check-wsm2-collaborative-sessions.js (T2c, T2d, T4b, T5b, T5c, T7c) and tests/check-wsm3-non-happy-path.js (T1b, T1c, T1d, T1e, T6b, T6c, T6d, T6e)
**Note:** All test assertions already exist and are currently failing. No new test code is required for this story. The implementation must make all 14 assertions pass without breaking any of the 46 currently-passing assertions.

---

## Root cause summary

`src/web-ui/routes/journey.js` declares `handleGetJourneyState` twice. The correct async version at ~line 444 returns `{ turns, stage, stages, activeUsers, completedStages, complete }`. A simpler synchronous override at ~line 1103 returns only `{ journeyId, featureSlug, activeSkill, activeSessionId, completedStages, complete }` — omitting `turns`, `stage`, `stages`, and `activeUsers`. Because the second declaration shadows the first, all 14 failing assertions trace to this one defect.

**Fix:** Delete the duplicate synchronous declaration (~lines 1103–1127 of journey.js). Do not touch the async implementation.

---

## Currently-failing assertions (target: all pass after fix)

### From tests/check-wsm2-collaborative-sessions.js

**T2c — `GET /api/journey/:id` response has turns (array)**
- Setup: Journey with active session containing 3 turns. Authenticated user calls handleGetJourneyState.
- Assert: `data.turns` is an array.
- Currently: FAIL — turns not an array (turns field absent from response).

**T2d — `GET /api/journey/:id` response has stage (string)**
- Setup: Same as T2c.
- Assert: `data.stage` is a string.
- Currently: FAIL — stage not a string (stage field absent from response).

**T4b — Viewer sees owner's new turn**
- Setup: Owner adds a turn to the session. Viewer calls handleGetJourneyState.
- Assert: `data.turns` contains the owner's new turn.
- Currently: FAIL — viewer sees no turns (turns field absent).

**T5b — Viewer count is 2 after two users poll**
- Setup: Two users each call handleGetJourneyState for the same journey (same clock tick). Then GET /api/journey/:id/viewers.
- Assert: `data.count === 2`.
- Currently: FAIL — count is 0 (_registerViewer not called by the active simple handler).

**T5c — Viewer count drops to 1 after one user's inactivity window lapses**
- Setup: T5b setup, then advance clock 31s, user-A re-polls, check viewers.
- Assert: `data.count === 1`.
- Currently: FAIL — count is 0.

**T7c — handleGetJourneyState returns a Promise**
- Setup: Journey with idle status. Call handleGetJourneyState and chain .then().
- Assert: `.then()` does not throw; HTTP 200 returned.
- Currently: FAIL — `journey.then is not a function` (synchronous handler returns undefined, not a Promise).

### From tests/check-wsm3-non-happy-path.js

**T1b — Response has stages array**
- Setup: Journey with completedStages ["discovery", "benefit-metric"], activeSkill "definition".
- Assert: `data.stages` is an array.
- Currently: FAIL — stages array missing from response.

**T1c — discovery stage is navigable:true**
- Assert: `stages.find(s => s.stage === 'discovery').navigable === true`.
- Currently: FAIL — Cannot read properties of undefined (cascade from T1b).

**T1d — benefit-metric stage is navigable:true**
- Assert: `stages.find(s => s.stage === 'benefit-metric').navigable === true`.
- Currently: FAIL — cascade from T1b.

**T1e — definition stage is navigable:false**
- Assert: `stages.find(s => s.stage === 'definition').navigable === false`.
- Currently: FAIL — cascade from T1b.

**T6b — session-boundary marker present in turns**
- Setup: Session turns array pre-injected with `{ type: "session-boundary", label: "— Previous session —" }` at index 3. handleGetJourneyState called.
- Assert: `data.turns.some(t => t.type === "session-boundary")`.
- Currently: FAIL — Cannot read properties of undefined (turns field absent).

**T6c — boundary at correct position (index 3)**
- Assert: `data.turns[3].type === "session-boundary"`.
- Currently: FAIL — cascade from T6b.

**T6d — boundary label correct**
- Assert: `data.turns[3].label === "— Previous session —"`.
- Currently: FAIL — cascade from T6b.

**T6e — new turn present at index 4**
- Assert: `data.turns[4].content === "new turn after restart"`.
- Currently: FAIL — cascade from T6b.

---

## Regression guard (must remain passing)

Run both test files and confirm the currently-passing 46 assertions still pass:
- wsm.2: T1a/T1b/T1c, T2a/T2b, T3a/T3b/T3c, T4a, T5a, T6a/T6b, T7a/T7b, T8a/T8b
- wsm.3: T1a, T2a–T2e, T3a–T3f, T4a–T4c, T5a–T5d, T6a, T7a–T7e, T8a–T8e

**Verification commands:**
```
node tests/check-wsm2-collaborative-sessions.js
node tests/check-wsm3-non-happy-path.js
```
Both must exit with "0 failed".

---

## Plain-language AC verification script

| # | Check | How to verify |
|---|-------|---------------|
| 1 | `turns` is an array in GET response | Run check-wsm2. T2c passes. |
| 2 | `stage` is a string in GET response | Run check-wsm2. T2d passes. |
| 3 | Viewer sees owner's turns | Run check-wsm2. T4b passes. |
| 4 | Viewer count correctly tracks polling | Run check-wsm2. T5b + T5c pass. |
| 5 | Handler returns a Promise | Run check-wsm2. T7c passes. |
| 6 | `stages` array present with correct navigable flags | Run check-wsm3. T1b + T1c + T1d + T1e pass. |
| 7 | Session-boundary marker survives round-trip through GET | Run check-wsm3. T6b + T6c + T6d + T6e pass. |
| 8 | No previously-passing test broken | Both files: 0 failed. |
