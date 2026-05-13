# Test Plan: p4-nta-surface — Teams bot runtime C11-compliant implementation

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-surface.md
**Epic:** E4 — Non-technical access
**Dependency:** Spike D PROCEED verdict required; story deferred if DEFER

## Scope

Tests verify the Teams bot state machine enforces C7 (one-question-at-a-time) at the code level, the handler is stateless per-invocation (C11), and no credentials or hardcoded config exist (MC-SEC-02, ADR-004).

**Implementation module:** `src/teams-bot/bot-handler.js`

---

## Test Cases

### T1 — Module exists and exports state machine functions

**Type:** Unit
**Check:** `src/teams-bot/bot-handler.js` exists and exports `initSession`, `sendQuestion`, `recordAnswer`.

### T2 — initSession returns AWAITING_RESPONSE after first question

**Type:** Unit
**Given:** A fresh session context (no prior state).
**When:** `initSession({ step: 'problem-statement', question: 'What problem are you solving?' })` is called.
**Then:** Returns `{ status: 'AWAITING_RESPONSE', questionId: string, step: string }` — state is AWAITING_RESPONSE.

### T3 — sendQuestion when AWAITING_RESPONSE returns error

**Type:** Unit — C7 enforcement
**Given:** Session is in state `AWAITING_RESPONSE`.
**When:** `sendQuestion(session, { question: 'follow-up?' })` is called again.
**Then:** Returns `{ error: 'AWAITING_RESPONSE' }` or equivalent — second question rejected until answer received.

### T4 — recordAnswer transitions to READY_FOR_NEXT_QUESTION

**Type:** Unit
**Given:** Session is in AWAITING_RESPONSE state.
**When:** `recordAnswer(session, { answer: 'test answer' })` is called.
**Then:** Returns object with `status: 'READY_FOR_NEXT_QUESTION'` and `recordedAnswer` or `answers` array.

### T5 — recordAnswer stores the answer in session state

**Type:** Unit
**Given:** Session in AWAITING_RESPONSE for questionId `q-001`.
**When:** `recordAnswer(session, { answer: 'my answer' })` is called.
**Then:** Returned or updated state contains the answer text associated with `q-001`.

### T6 — Handler module has no top-level mutable state (C11 stateless)

**Type:** Static / source scan
**Check:** Source of `bot-handler.js` does not contain module-scope mutable variables that persist session state (no `let session =`, `let sessions =`, `const state = {}` at top level that holds runtime session data).
**Rationale:** C11 requires stateless per-invocation compute — session state must be passed in and returned, not stored in module scope.

### T7 — No persistent process patterns at module scope (C11)

**Type:** Static / source scan
**Check:** Source does not contain `setInterval`, `server.listen`, `new Server(`, `process.stdin.resume` at module scope.
**Rationale:** C11 — no always-on bot server process.

### T8 — All config references use context.yml keys (ADR-004)

**Type:** Static / source scan
**Check:** Source does not contain hardcoded tenant IDs, channel IDs, or Microsoft Graph endpoints — config lookups reference `context.yml` keys.

### T-NFR1 — No credentials in runtime source (MC-SEC-02)

**Type:** Static / source scan
**Check:** Source does not contain: `Bearer `, `password:`, `secret:`, `tenantId:` as literal strings, or any pattern consistent with embedded credentials.

### T-NFR2 — State machine returns structured objects

**Type:** Unit
**Check:** `initSession`, `sendQuestion`, `recordAnswer` all return plain objects (not strings, not Error instances) — structured responses only.

---

## Verification script

`artefacts/2026-04-19-skills-platform-phase4/verification-scripts/p4-nta-surface-verification.md`

## Test file

`tests/check-p4-nta-surface.js`

## Pass criteria

All 12 test assertions pass with 0 failures. TDD red baseline: all fail before `src/teams-bot/bot-handler.js` is implemented.
