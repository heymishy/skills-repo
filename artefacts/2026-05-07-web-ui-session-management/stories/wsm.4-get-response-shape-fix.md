## Story: wsm.4 — Journey API GET response shape fix (duplicate handler removal)

**Epic reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md
**Short-track:** follow-up to wsm.2 (6 deviations) and wsm.3 (8 deviations) — DoD-complete-with-deviations

## Root Cause

`src/web-ui/routes/journey.js` contains two declarations of `handleGetJourneyState`. The correct async implementation (line 444) includes `turns`, `stage`, `stages`, and `activeUsers` in the response. A second, simpler synchronous declaration at line 1103 only returns `journeyId`, `featureSlug`, `activeSkill`, `activeSessionId`, `completedStages`, and `complete`. In JavaScript module scope, the second (later) declaration shadows the first — so the exported function is the incomplete one. All 14 failing test assertions from wsm.2-T2c/T2d/T4b/T5b/T5c/T7c and wsm.3-T1b/T1c/T1d/T1e/T6b/T6c/T6d/T6e trace back to this single defect.

## User Story

As an **operator or viewer accessing a shared journey URL**,
I want the journey state API to return the full response shape — turns, stage, stages breadcrumb, and active user count —
So that the collaborative session feature (wsm.2) and breadcrumb navigation (wsm.3) work correctly after the fix.

## Benefit Linkage

**Metrics moved:** Collaborative use rate (wsm.2) and Journey completion rate (wsm.3) — both blocked by the GET response shape defect.
**How:** The feature infrastructure is already in place; this story removes the single code defect blocking 14 test assertions and making the collaborative viewer and breadcrumb features non-functional.

## Architecture Constraints

- The fix is a deletion: remove the duplicate `handleGetJourneyState` function declaration at line 1103 of `src/web-ui/routes/journey.js`.
- Do not modify the async implementation at line 444 — it is already correct.
- No new behaviour is added: the async function already handles all required response fields (`turns`, `stage`, `stages`, `activeUsers`, `completedStages`, `complete`).
- The async handler already calls `_registerViewer(journeyId, login)` on every GET — so viewer count tracking (wsm.2 T5b/T5c) and the promise-returning behaviour needed for T7c will both work once the correct handler is active.
- The turns array returned by the async handler is read from the active session; it will include any session-boundary markers that the session already contains — wsm.3 T6b-T6e will pass without additional code.
- Zero new npm dependencies.

## Dependencies

- **Upstream:** wsm.2 (PR #337, merged), wsm.3 (PR #338, merged) — fix targets code already on master.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** `GET /api/journey/:id` returns a response that includes a `turns` field whose value is an array (wsm.2-T2c passes).

**AC2:** The response from `GET /api/journey/:id` includes a `stage` field that is a non-empty string (wsm.2-T2d passes).

**AC3:** A viewer who calls `GET /api/journey/:id` after the owner has added turns sees those turns in the response (wsm.2-T4b passes).

**AC4:** After two authenticated users call `GET /api/journey/:id`, `GET /api/journey/:id/viewers` returns `{ count: 2 }` (wsm.2-T5b passes). After one user's activity window lapses (31 seconds without a poll), the viewer count drops to 1 (wsm.2-T5c passes).

**AC5:** `handleGetJourneyState` returns a Promise (is async) — calling `.then()` on its return value does not throw (wsm.2-T7c passes).

**AC6:** `GET /api/journey/:id` returns a `stages` array when the journey has completed stages (wsm.3-T1b passes). Each completed stage has `navigable: true`; the current/future stage has `navigable: false` (wsm.3-T1c/T1d/T1e pass).

**AC7:** When the active session turns array contains a `{ type: "session-boundary" }` entry, `GET /api/journey/:id` returns that marker at the correct index in the `turns` array (wsm.3-T6b/T6c/T6d/T6e pass).

## Out of Scope

- Any new behaviour beyond what the existing async handler already implements.
- New tests — the failing assertions in `tests/check-wsm2-collaborative-sessions.js` and `tests/check-wsm3-non-happy-path.js` are the test plan for this story; no new test file is required.

## NFRs

- **No regression:** All previously-passing wsm.2 and wsm.3 assertions must continue to pass after the fix.
- **No new dependencies.**

## Complexity Rating

**Rating:** 1 — single code deletion, root cause fully understood.
**Scope stability:** Stable.
