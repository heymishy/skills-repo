## Test Plan: Guard the initial-turn auto-fire so viewing an already-completed session can never re-execute or re-mutate it

**Story reference:** artefacts/2026-08-09-session-done-reexecution-guard/stories/sdrg-s1-session-done-reexecution-guard.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `__init__` on a done session (streaming endpoint) is a true no-op | 2 tests | — | — | — | — | 🟢 |
| AC2 | `__init__` on a done session (non-streaming endpoint) is a true no-op | 2 tests | — | — | — | — | 🟢 |
| AC3 | Fresh session `__init__` behaviour unchanged (regression guard) | 2 tests | — | — | — | — | 🟢 |
| AC4 | Client-side `SESSION_DONE` flag suppresses auto-fire on a done session | 1 test | — | — | — | — | 🟢 |
| AC5 | Client-side auto-fire still fires for a genuinely fresh, empty-thread session | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This story's mechanism (server-side turn handlers, and the exact string of client-side script emitted by `_renderChatPage`) is fully unit-testable — no external dependency, no CSS-layout rendering, no elapsed-time behaviour.

---

## Test Data Strategy

**Source:** Hand-seeded session objects via the existing `routes._setHtmlSession(sid, {...})` test helper (established pattern, see `tests/check-wusl1-chat-streaming.js`, `tests/check-mfc1-model-first-chat-session.js`) and `routes.setSkillTurnExecutorAdapter(...)` / `setSkillTurnExecutorStreamAdapter(...)` to install a spy in place of the real model call.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no fixtures beyond in-memory session objects.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1/AC2 | A session object with `done: true`, `turns: []`, a known `artefactContent` | Hand-authored via `_setHtmlSession` | None | The exact shape a canned/mock fixture or a turns-restore gap produces |
| AC3 | A session object with `done: false`, `turns: []` | Hand-authored via `_setHtmlSession` | None | Genuinely fresh session — must be unaffected |
| AC4/AC5 | `session.done` true/false passed into `_renderChatPage` (or the exported chat-HTML render path) | Direct function call / rendered HTML string inspection | None | Asserts on the emitted `<script>` text, not live browser execution |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### streamTurn_initOnDoneSession_isNoOp_executorNeverCalled

- **Verifies:** AC1
- **Precondition:** `_setHtmlSession` with `done: true`, `turns: []`, `artefactContent: 'EXISTING ARTEFACT'`. `setSkillTurnExecutorStreamAdapter` installs a spy that records whether it was called.
- **Action:** `routes.handlePostTurnStreamHtml(makeReq(sid, '__init__'), makeSseRes())`
- **Expected result:** The executor spy is never invoked. `session.turns` still has length 0 after the call (no turn pushed). `session.artefactContent` is still exactly `'EXISTING ARTEFACT'` (unchanged).
- **Edge case:** Yes — this is the exact defect being fixed.

### streamTurn_initOnDoneSession_emitsValidTerminalDoneEvent

- **Verifies:** AC1 (response-shape half of the Architecture Constraint — no silent/hung response)
- **Precondition:** Same as above.
- **Action:** Same call; inspect `res.events` from `makeSseRes()`.
- **Expected result:** Exactly one `{done: true, artefactContent: 'EXISTING ARTEFACT'}`-shaped terminal event is written (or equivalent fields per the existing done-event shape) — the client-side `sendTurn` promise resolves cleanly rather than hanging with zero events.
- **Edge case:** Yes.

### submitTurn_initOnDoneSession_isNoOp_executorNeverCalled

- **Verifies:** AC2
- **Precondition:** `_setHtmlSession` with `done: true`, `turns: []`, `artefactContent: 'EXISTING ARTEFACT'`. `setSkillTurnExecutorAdapter` installs a spy.
- **Action:** `routes.handlePostTurnHtml(makeReq(sid, '__init__'), makeJsonRes())` (or direct `htmlSubmitTurn(...)` call if that is the more precise unit boundary — implementer's choice, whichever function actually contains the guard).
- **Expected result:** The executor spy is never invoked. `session.turns.length` is unchanged (0). `session.artefactContent` unchanged.
- **Edge case:** Yes.

### submitTurn_initOnDoneSession_returnsExistingCompletionState

- **Verifies:** AC2 (response-shape half)
- **Precondition:** Same as above.
- **Action:** Same call; inspect the returned/response JSON.
- **Expected result:** Response is `{ done: true, artefactContent: 'EXISTING ARTEFACT' }` (or equivalent existing-state shape) — not a 500, not an empty body, not a fabricated new response.
- **Edge case:** Yes.

### streamTurn_initOnFreshSession_behaviourUnchanged

- **Verifies:** AC3 (streaming side)
- **Precondition:** `_setHtmlSession` with `done: false`, `turns: []`. `setSkillTurnExecutorStreamAdapter` returns a normal opening-question response.
- **Action:** `routes.handlePostTurnStreamHtml(makeReq(sid, '__init__'), makeSseRes())`
- **Expected result:** The executor spy IS called exactly once. A new assistant turn is pushed. This is unchanged from pre-existing behaviour — a straight regression check.
- **Edge case:** No — this is the control case proving the guard is scoped correctly.

### submitTurn_initOnFreshSession_behaviourUnchanged

- **Verifies:** AC3 (non-streaming side)
- **Precondition:** `_setHtmlSession` with `done: false`, `turns: []`. `setSkillTurnExecutorAdapter` returns a normal response.
- **Action:** `routes.handlePostTurnHtml(makeReq(sid, '__init__'), makeJsonRes())`
- **Expected result:** The executor spy IS called exactly once, matching current behaviour.
- **Edge case:** No — control case.

### renderChatPage_doneSession_emitsSessionDoneTrueAndSuppressesAutoFire

- **Verifies:** AC4
- **Precondition:** A session object with `done: true` and `turns: []` (the exact shape that renders zero chat messages) passed to the render path that produces the chat page HTML (`_renderChatPage` or the exported `handleGetChatHtml` response body).
- **Action:** Render the page; inspect the emitted `<script>` text.
- **Expected result:** The script contains a `SESSION_DONE` (or equivalently named) flag set to `true`, and the auto-fire condition in the emitted script text is structured so that `sendTurn("__init__")` is not reachable when that flag is true — asserted via a static string/regex check on the emitted script (e.g. confirming the auto-fire `if(...)` condition includes the done-flag term), since this test runs in Node without a real DOM/browser.
- **Edge case:** Yes — this is the client-side half of the exact defect being fixed.

### renderChatPage_freshEmptySession_autoFireStillPresent

- **Verifies:** AC5
- **Precondition:** A session object with `done: false` and `turns: []`.
- **Action:** Render the page; inspect the emitted script.
- **Expected result:** `SESSION_DONE` is `false` (or absent/falsy) and the auto-fire `sendTurn("__init__")` call site is still present and reachable in the emitted script — proving the AC4 change didn't remove auto-fire for the genuinely-fresh case it must still serve.
- **Edge case:** No — control case for the client-side change.

---

## Integration Tests

None required — the two server-side handlers and the render function are each tested directly against real session-store state (`_setHtmlSession`/`_getHtmlSession`), which is this codebase's established integration boundary for this file (see `check-wusl1-chat-streaming.js`). No additional cross-module integration surface is introduced by this fix.

---

## NFR Tests

### noExecutorCallOrStateChange_onDoneSessionInitCall

- **NFR addressed:** Security / integrity (the core NFR this story exists to satisfy)
- **Measurement method:** Combines AC1/AC2's executor-spy-never-called and session-state-unchanged assertions — already covered by the unit tests above; not a separate test, called out here to make the traceability from NFR to test explicit.
- **Pass threshold:** Zero executor invocations, zero session mutations, on every `__init__`-against-done-session call in the suite.
- **Tool:** Same unit test harness (spy adapters + direct session-object inspection).

---

## Out of Scope for This Test Plan

- Any live-browser/Playwright confirmation of AC4/AC5 (the client-side script actually suppressing/firing `sendTurn` in a real DOM) — covered instead by direct inspection of the emitted script string, consistent with this file's existing test style for its inline client script (no existing test in this codebase drives the chat page's client JS in a real browser). If desired post-merge, a manual live-browser smoke check against the previously-affected fixture card is a reasonable one-off verification step (see verification script), not a new automated E2E test.
- Re-testing the entirely unrelated `answer`-endpoint (`/api/skills/:name/sessions/:id/answer`, used by the visible form's regular submit, not by `__init__`) — untouched by this story.

---

## Test Gaps and Risks

None identified as blocking. The AC4/AC5 static-script-inspection approach is a known lower-fidelity substitute for real browser execution (same limitation already logged for other instruction-only/script-emission stories in this codebase), acceptable here because the actual security-relevant guarantee (AC1/AC2) is enforced server-side regardless of what the client does.
