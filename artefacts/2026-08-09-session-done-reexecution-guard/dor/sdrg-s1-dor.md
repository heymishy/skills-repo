## Definition of Ready: sdrg-s1 — Guard the initial-turn auto-fire so viewing an already-completed session can never re-execute or re-mutate it

**Story:** artefacts/2026-08-09-session-done-reexecution-guard/stories/sdrg-s1-session-done-reexecution-guard.md
**Review artefact:** artefacts/2026-08-09-session-done-reexecution-guard/review/sdrg-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-session-done-reexecution-guard/test-plans/sdrg-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/skills.js`:
  - `handlePostTurnStreamHtml` (~line 4261): add a `session.done` guard to the `_isInitialTurn` branch (~line 4314) so `__init__` against an already-done session short-circuits to a no-op that streams the existing `{done, artefactContent}` state instead of calling `_skillTurnExecutorStream`.
  - `handlePostTurnHtml` / `htmlSubmitTurn` (~line 2230, ~4165): add the equivalent guard — `__init__` against an already-done session returns the existing `{done: true, artefactContent}` state without calling `_skillTurnExecutor` or pushing any turn.
  - `_renderChatPage` (~line 2553): add a `SESSION_DONE` client-side flag (alongside the existing `IS_IDEATE`/`SUPPORTS_CANVAS`/`IS_DEFINITION` flags, ~line 2659) sourced from `session.done`; update the auto-fire condition (~line 2675) to also require `!SESSION_DONE`.
- `tests/check-sdrg-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/modules/skill-turn-executor.js` — the executor itself is untouched; this story only guards whether it gets *called*.
- Session-restore / Redis-merge logic (`_getSessionOrRestore`, `mergeRedisSessionData`) — not investigating or changing how an empty-turns-but-done session shape can arise, only guarding against the consequence.
- `routes/journey.js` — no changes to gate-confirm, advance, or artefact-count logic; those are downstream consumers of the (now-corrected) session state, not part of the defect.

### Architecture Constraints

No new architectural decision — this is a guard-clause addition to existing handler functions, following the story's own Architecture Constraints section (no D37/adapter concern). No ADR required.

**Correctness note for the coding agent:** the no-op path is NOT "just return early with nothing." It must still emit a valid terminal response/event carrying the session's real existing state (`done: true`, the unchanged `artefactContent`) — client-side code awaiting a response must resolve cleanly, not hang. Confirm this is covered by `streamTurn_initOnDoneSession_emitsValidTerminalDoneEvent` and `submitTurn_initOnDoneSession_returnsExistingCompletionState` in the test plan before considering AC1/AC2 done.

### Human oversight

**Low** — a guard-clause fix to a precisely identified, code-confirmed defect (three call sites, all named with line numbers in the story), following an existing test harness pattern already used for this exact file (`_setHtmlSession`/`setSkillTurnExecutorStreamAdapter`, see `tests/check-wusl1-chat-streaming.js`).

### Coding Agent Instructions

1. In `handlePostTurnStreamHtml` (~line 4298-4314): before (or as part of) the existing `_isInitialTurn` computation, add a check: if `rawAnswer === '__init__' && session.done`, immediately write a terminal SSE event carrying the session's existing state (`data: {done: true, artefactContent: session.artefactContent}\n\n`), clear the keepalive interval, `res.end()`, and `return` — without calling `_skillTurnExecutorStream`/`_skillTurnExecutor` and without pushing anything to `session.turns`. Do this before the `_step1Text`/`precomputedStep1` branch (~line 4298) and before `_isInitialTurn` is used, so a done session never reaches either.
2. In `htmlSubmitTurn` (~line 2230) or `handlePostTurnHtml` (~line 4165) — whichever function the coding agent judges the correct guard boundary (`htmlSubmitTurn` is the more precise unit boundary, matching the streaming handler's own guard placement) — add the equivalent check: if `rawAnswer === '__init__' && session.done`, return `{ done: true, response: '', artefactContent: session.artefactContent }` (or the closest existing return shape used elsewhere in this function for the done case) without calling the executor and without pushing a turn.
3. In `_renderChatPage` (~line 2659, alongside `IS_IDEATE`/`SUPPORTS_CANVAS`/`IS_DEFINITION`), add: `'  var SESSION_DONE = ' + (session.done ? 'true' : 'false') + ';',`
4. Update the auto-fire condition (~line 2675) from `if(thread.children.length === 0) { ... }` to `if(!SESSION_DONE && thread.children.length === 0) { ... }`.
5. Write the tests per the test plan, using the established `_setHtmlSession`/`setSkillTurnExecutorAdapter`/`setSkillTurnExecutorStreamAdapter`/`makeSseRes` test-double pattern from `tests/check-wusl1-chat-streaming.js` and `tests/check-mfc1-model-first-chat-session.js`.
6. Re-run `tests/check-wusl1-chat-streaming.js` and `tests/check-mfc1-model-first-chat-session.js` directly (both exercise the same handlers this story modifies) to confirm zero regression to the genuinely-fresh-session path.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — AC4/AC5 assert on emitted script text, not rendered layout)

**PROCEED: Yes**
