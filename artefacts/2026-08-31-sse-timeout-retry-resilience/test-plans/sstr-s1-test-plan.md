## Test Plan: Retry an LLM stream call once when it fails before any content has streamed

**Story reference:** artefacts/2026-08-31-sse-timeout-retry-resilience/stories/sstr-s1-retry-on-pre-first-chunk-failure.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Pre-first-chunk failure retried once, succeeds silently | 1 test | — | — | — | — | 🟢 |
| AC2 | Retry also fails -> existing generic error, no 3rd attempt | 1 test | — | — | — | — | 🟢 |
| AC3 | Failure after content streamed -> no retry | 1 test | — | — | — | — | 🟢 |
| AC4 | Dangling user turn popped on ultimate failure | 1 test | — | — | — | — | 🟢 |
| AC5 | sse_retry_succeeded log event on successful retry | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — a fake `skill-turn-executor` stream adapter (`setSkillTurnExecutorStreamAdapter`, the same injection point used throughout this codebase's existing streaming tests, e.g. `check-csd-s2-canvas-diagram-rendering.js`) that can be scripted to fail before/after emitting content, and to count invocation attempts.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fake adapter: attempt 1 throws before `onFirstChunk`; attempt 2 succeeds normally | Synthetic | None | |
| AC2 | A fake adapter: every attempt throws before `onFirstChunk` | Synthetic | None | |
| AC3 | A fake adapter: calls `onFirstChunk` + `onChunk` with real text, then throws | Synthetic | None | |
| AC4 | Same as AC2/AC3 — inspect `session.turns` after the response ends | Synthetic | None | |
| AC5 | Same as AC1 — capture `process.stdout.write` during the call | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### preFirstChunkFailureIsRetriedOnceAndSucceedsSilently

- **Verifies:** AC1
- **Precondition:** Fake adapter: 1st invocation throws `new Error('Anthropic API stream timed out after 90000ms')` before calling `onFirstChunk`; 2nd invocation calls `onFirstChunk`, `onChunk('Hello')`, and resolves normally.
- **Action:** Drive a real turn through `handlePostTurnStreamHtml` (or the equivalent SSE turn handler) via the existing real-render harness pattern (`buildPage`-style, as used in `check-csd-s2-canvas-diagram-rendering.js`).
- **Expected result:** The adapter was called exactly twice. The client-visible SSE output contains the successful second attempt's content ("Hello") and no error message. `session.turns` ends with a real assistant turn (the retry's content), not an error state.
- **Edge case:** No.

### retryAlsoFailsSurfacesExistingErrorNoThirdAttempt

- **Verifies:** AC2
- **Precondition:** Fake adapter: every invocation throws before `onFirstChunk`.
- **Action:** Same harness as above.
- **Expected result:** The adapter was called exactly twice (not three or more times). The client-visible SSE output contains the existing `{"error":"Model error — please try again."}` message.
- **Edge case:** Yes — proves the retry bound is exactly one, not unbounded.

### failureAfterContentStreamedNeverRetries

- **Verifies:** AC3
- **Precondition:** Fake adapter: the single invocation calls `onFirstChunk`, then `onChunk('Partial content')`, then throws.
- **Action:** Same harness.
- **Expected result:** The adapter was called exactly once (no retry attempted). The client-visible SSE output contains both the partial content chunk that was already sent AND the existing error message — proving the safety boundary (never retry once content has streamed) holds.
- **Edge case:** Yes — this is the critical safety-boundary test protecting against duplicated/inconsistent client-visible content.

### danglingUserTurnPoppedOnUltimateFailure

- **Verifies:** AC4
- **Precondition:** Same fake adapter as `retryAlsoFailsSurfacesExistingErrorNoThirdAttempt` (always fails before first chunk).
- **Action:** Same harness; inspect `session.turns` after the SSE response ends.
- **Expected result:** `session.turns`'s last entry is NOT the dangling user turn pushed for this exchange — it was removed, matching the sibling empty-response path's existing behavior. (If no prior turns existed, `session.turns` is empty afterward.)
- **Edge case:** No.

### successfulRetryEmitsDistinguishableLogEvent

- **Verifies:** AC5
- **Precondition:** Same fake adapter as `preFirstChunkFailureIsRetriedOnceAndSucceedsSilently` (fails once, then succeeds).
- **Action:** Capture `process.stdout.write` during the call (pino writes structured JSON lines to stdout); same harness as AC1.
- **Expected result:** Captured output contains a JSON line with `"event":"sse_retry_succeeded"` (or equivalent event name), distinguishable from the normal `llm_complete`/`sse_close` events also present.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — the fake-adapter-driven real-render harness already exercises the full route/handler/session integration for each scenario; there is no separate integration seam to test.

---

## NFR Tests

### noRegressionToNormalSuccessfulTurnTiming

- **NFR addressed:** Performance
- **Measurement method:** A fake adapter that succeeds on the first attempt (no failure at all) completes in the same shape as today — exactly one adapter invocation, no added latency, no behavior change.
- **Pass threshold:** Adapter called exactly once for a normal successful turn.
- **Tool:** Node test runner, call-count spy (reuses the harness's existing adapter-call-counting mechanism).

---

## Out of Scope for This Test Plan

- A live test against the real Anthropic API inducing a genuine timeout — not practical or deterministic; the fake-adapter approach is the correct and complete test type here, matching this codebase's own established pattern for testing `skill-turn-executor` call sites.
- Measuring actual worst-case latency in production — the NFR's ~180s worst-case bound is a design property (2 × 90s timeout), not something this test plan re-derives.

---

## Test Gaps and Risks

None.
