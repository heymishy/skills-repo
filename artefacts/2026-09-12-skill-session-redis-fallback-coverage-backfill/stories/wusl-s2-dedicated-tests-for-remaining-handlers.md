## Story: Dedicated Redis-fallback tests for the remaining wusl-s1 call sites

**Epic reference:** None — short-track test-coverage backfill (closes `wusl-s1`'s own follow-up action, found during 2026-09-12 pipeline-state audit)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track

## User Story

As **a developer maintaining `src/web-ui/routes/skills.js`**,
I want each of the reachable handlers `wusl-s1` fixed to have its own dedicated Redis-fallback regression test, not just 4 of them plus code review for the rest,
So that a future refactor of any one of the currently-code-review-only call sites (`handleCommitArtefact`, `handlePostCanvasEditHtml`, `handlePostTurnStreamHtml`, `htmlSubmitTurn`) is caught by CI immediately, not discovered later as a live bug report.

**Finding during this story's own preparation (2026-09-12):** `wusl-s1`'s own DoD listed `htmlRecordAnswer` as a 5th code-review-only call site. Direct verification (`require('./src/web-ui/routes/skills.js').htmlRecordAnswer` → `undefined`, plus a full-repo grep) confirms it is not exported from `skills.js` and is never called from any other function in that file or anywhere else in the codebase — genuinely dead code, unreachable from any live request path. `wusl-s1`'s own fix was still correctly applied to it (confirmed by reading the function body — it does call `_getSessionOrRestore` correctly), but writing a dedicated regression test for unreachable code would test nothing real. Dropped from this story's scope; see Out of Scope.

## Benefit Linkage

**Metric moved:** Restores `wusl-s1`'s own original test-plan ambition ("1 test per handler, 9 total") that was consolidated down to 4 direct tests + code review at merge time — an honestly-recorded, accepted-as-low-risk scope reduction, not a defect.
**How:** `wusl-s1`'s own DoD (2026-07-22) named this exact gap and its own Follow-up Action #1: "If a future bug report ever traces to one of the 5 code-reviewed-only call sites, add a dedicated automated test for that specific site at that time." This story does it proactively rather than reactively, closing the gap for all 5 at once while the shared-helper pattern is still fresh and well understood.

## Architecture Constraints

- Reuse the exact same shared helper (`_getSessionOrRestore`) and stub-adapter pattern (`makeStubRedisAdapter`, `setSkillSessionRedisAdapter`) already established in `tests/check-wusl-s1-session-redis-fallback.js` — do not invent a new test harness.
- For `handlePostTurnStreamHtml` and the plain-function call site (`htmlSubmitTurn`) that invoke the skill-turn executor downstream, stub the executor via the already-existing injectable adapters (`setSkillTurnExecutorAdapter`, `setSkillTurnExecutorStreamAdapter`) rather than letting a real (or crashing) executor call run — matches the pattern already established in `tests/check-mfc1-model-first-chat-session.js`.
- Do not export `htmlRecordAnswer` to make it testable — it is dead code with zero live callers; exporting it purely to test it would be scope creep with no real coverage benefit.
- Each test asserts the same specific, narrow claim `wusl-s1`'s own existing 4 tests assert: the handler does NOT return/respond with `SESSION_NOT_FOUND` (or an equivalent 404) when the in-memory Map is cold but Redis has the session — not full end-to-end success of whatever the handler does afterward.

## Dependencies

- **Upstream:** `wusl-s1` (merged, DoD-complete) — this story adds test coverage for code `wusl-s1` already shipped and unit-review-verified; no source change.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `handleCommitArtefact` with the in-memory Map cold and Redis containing a complete session (all questions answered) for that ID, When the handler runs, Then it does not respond with `SESSION_NOT_FOUND`.

**AC2:** Given `handlePostCanvasEditHtml` with the in-memory Map cold and Redis containing a session for that ID, When the handler runs, Then it does not respond with `SESSION_NOT_FOUND`.

**AC3:** Given `handlePostTurnStreamHtml` with the in-memory Map cold and Redis containing a session for that ID, and the skill-turn-executor-stream adapter stubbed, When the handler runs, Then it responds with a 200 SSE stream (not a 404), proving the session was found via Redis restore.

**AC4:** Given `htmlSubmitTurn` called directly (not via req/res) with the in-memory Map cold and Redis containing a session for that ID, and the skill-turn-executor adapter stubbed, When it runs, Then it does not return `null` (the function's own documented "session not found" signal).

## Out of Scope

- Any change to `src/web-ui/routes/skills.js` itself — this is a test-only story, the shared-helper fix is already shipped and correct.
- `htmlRecordAnswer` — confirmed dead code (not exported, zero callers anywhere in the codebase) during this story's own preparation; writing a dedicated test for unreachable code has no real coverage value. Flagged as a DoD Observation for the operator to decide whether to delete the function entirely in a future pass.
- The 5 synchronous accessor functions `wusl-s1` explicitly excluded (`_getHtmlSession`, `htmlGetNextQuestion`, `htmlGetCompletePage`, `htmlGetPreview`, `linkSessionToJourney`) — untouched, separate known gap per `wusl-s1`'s own story.
- Full end-to-end success-path testing of any of the 4 handlers beyond the specific Redis-fallback claim — each handler's own broader behaviour is already covered by its own pre-existing test suite elsewhere.

## NFRs

- **Performance:** N/A — test-only change.
- **Security:** N/A — test-only change, no new code path.
- **Accessibility:** N/A.
- **Audit:** N/A.

## Complexity Rating

**Rating:** 1 — mechanical repetition of an already-proven test pattern across 5 more call sites, using injectable adapters that already exist for exactly this purpose.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
