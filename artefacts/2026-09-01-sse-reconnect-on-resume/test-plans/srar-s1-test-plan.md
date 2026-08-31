## Test Plan: Client-side reconnect-on-resume for a dropped SSE turn, with idempotent server-side replay

**Story reference:** artefacts/2026-09-01-sse-reconnect-on-resume/stories/srar-s1-idempotent-turn-reconnect.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-01

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New attemptId -> unchanged behaviour (regression baseline) | 1 test | — | — | — | — | 🟢 |
| AC2 | Same attemptId, already complete -> resumed short-circuit, no re-run | 1 test | — | — | — | — | 🟢 |
| AC3 | Same attemptId, still in-flight (<60s) -> wait error, no concurrent LLM call | 1 test | — | — | — | — | 🟢 |
| AC4 | Same attemptId, stale in-flight (>60s) -> treated as fresh | 1 test | — | — | — | — | 🟢 |
| AC5 | No attemptId -> unchanged behaviour | 1 test | — | — | — | — | 🟢 |
| AC6 | Client auto-retries once on stream failure, not on session-expired | — | — | — | 1 manual/inline-script check | UNCERTAIN | 🟡 |
| AC7 | Client reloads page on resumed:true | — | — | — | 1 manual/inline-script check | UNCERTAIN | 🟡 |
| AC8 | sstr-s1/ssdo-s1 suites unaffected | — | 2 full-file runs | — | — | — | 🟢 |

---

## Coverage gaps

AC6/AC7 are client-side browser JS embedded as a string literal inside `skills.js` (not a separate, independently-loadable module) — there is no existing harness in this codebase that executes that embedded script in a real DOM/fetch environment (the existing client-JS tests in this file, e.g. `check-wusl1-chat-streaming.js` and siblings, verify the *server's* SSE event shapes, not the embedded browser script's own control flow). Verified instead by direct source inspection of the generated script string (asserting the retry/reload logic is present with the correct guard conditions) plus the full server-side behavioural coverage in AC1-AC5, which is what actually determines correctness of the request/response contract the client code depends on. This mirrors the existing gap-handling precedent for other embedded-client-JS changes in this same file.

---

## Unit Tests

### newAttemptIdBehavesUnchanged

- **Verifies:** AC1
- **Precondition:** `_setHtmlSession` with a fresh session, `skillName: 'discovery'`.
- **Action:** Drive one turn through `handlePostTurnStreamHtml` with `body: { answer: 'hi', attemptId: 'attempt-1' }`.
- **Expected result:** `session.turns` has exactly 2 entries (user + assistant); `session._lastAttempt` is `{ attemptId: 'attempt-1', status: 'complete', startedAt: <number> }`; the SSE stream contains the normal `chunk`/`done` events (not `resumed:true`).
- **Edge case:** No — regression baseline.

### duplicateAttemptIdAfterCompletionShortCircuits

- **Verifies:** AC2
- **Precondition:** Same session as above, after the first turn has completed (`_lastAttempt.status === 'complete'`). A call counter on the mocked LLM executor.
- **Action:** Drive a second turn through `handlePostTurnStreamHtml` with the SAME `attemptId: 'attempt-1'`.
- **Expected result:** The mocked LLM executor's call count does not increase; `session.turns.length` is unchanged from before this second call; the SSE stream contains exactly `{done:true, resumed:true}` and nothing else.
- **Edge case:** Yes — this is the actual gap the story closes.

### duplicateAttemptIdWhileInFlightIsRejected

- **Verifies:** AC3
- **Precondition:** Manually set `session._lastAttempt = { attemptId: 'attempt-2', status: 'in-flight', startedAt: Date.now() }` before calling the handler (simulating a still-processing original attempt).
- **Action:** Drive a turn through `handlePostTurnStreamHtml` with the same `attemptId: 'attempt-2'`.
- **Expected result:** The mocked LLM executor is never called; the SSE stream contains an `error` event distinct from the generic "Model error" text (asserted by message content, e.g. contains "still processing").
- **Edge case:** Yes.

### staleInFlightAttemptIdTreatedAsFresh

- **Verifies:** AC4
- **Precondition:** Manually set `session._lastAttempt = { attemptId: 'attempt-3', status: 'in-flight', startedAt: Date.now() - 61000 }` (61 seconds old).
- **Action:** Drive a turn through `handlePostTurnStreamHtml` with the same `attemptId: 'attempt-3'`.
- **Expected result:** The mocked LLM executor IS called (proceeds as a fresh attempt); `session._lastAttempt.status` becomes `'complete'` with a new `startedAt`.
- **Edge case:** Yes.

### noAttemptIdFieldBehavesUnchanged

- **Verifies:** AC5
- **Precondition:** Fresh session, no prior `_lastAttempt`.
- **Action:** Drive a turn through `handlePostTurnStreamHtml` with `body: { answer: 'hi' }` (no `attemptId` key at all).
- **Expected result:** Turn completes normally; `session._lastAttempt` remains `undefined` after completion (guard never engaged).
- **Edge case:** No — regression/backward-compatibility guard.

### embeddedClientScriptContainsRetryAndReloadLogic

- **Verifies:** AC6, AC7 (source-inspection substitute for a DOM harness — see Coverage gaps)
- **Precondition:** None.
- **Action:** Call the function that builds the client HTML/script (the same one `sendTurn` is emitted from) and inspect the returned string.
- **Expected result:** The generated script contains an `attemptId` variable generated once per logical turn, a guarded single-retry branch in the stream-failure handler that excludes `"session-expired"`, and a `resumed` check that calls `window.location.reload()` (or equivalent) rather than rendering stream content.
- **Edge case:** No.

### sstrS1SuiteUnaffected

- **Verifies:** AC8 (part 1)
- **Precondition:** None.
- **Action:** `node tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js`.
- **Expected result:** All existing ACs still pass.
- **Edge case:** No — regression guard.

### ssdoS1SuiteUnaffected

- **Verifies:** AC8 (part 2)
- **Precondition:** None.
- **Action:** `node tests/check-ssdo-s1-sse-client-disconnect-logging.js`.
- **Expected result:** All existing ACs still pass.
- **Edge case:** No — regression guard.

### fullSuiteRegressionUnaffected

- **Verifies:** Implicit regression coverage.
- **Precondition:** None — full suite.
- **Action:** `node scripts/run-all-tests.js`.
- **Expected result:** Same pass count as pre-change baseline plus the new tests above; zero new failures.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — no route/HTTP-layer change beyond the handler itself, already covered directly.

---

## NFR Tests

None beyond the security note in the story (attemptId used only for equality comparison, never path/query construction) — no dedicated test needed since no new attacker-controlled path/file operation is introduced.

---

## Out of Scope for This Test Plan

- Live-staging reproduction of an actual Fly suspend event — not practically triggerable in CI; the unit tests directly simulate the two states (`in-flight`, `complete`) that a real suspend/resume would produce, which is what the server-side logic actually branches on.
- A real DOM/browser test harness for the embedded client script (see Coverage gaps).

---

## Test Gaps and Risks

AC6/AC7 rely on source-inspection rather than executed-in-a-browser verification (see Coverage gaps). Mitigated by the fact that the server-side contract those client behaviours depend on (AC1-AC5) has full behavioural coverage, and the client-side change reuses two already-existing, simple browser primitives (`setTimeout` + retry, `window.location.reload()`) rather than introducing new complex client logic.
