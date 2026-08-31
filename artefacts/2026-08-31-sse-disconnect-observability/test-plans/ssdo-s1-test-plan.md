## Test Plan: Log a premature SSE client disconnect, distinguishable from a normal completion

**Story reference:** artefacts/2026-08-31-sse-disconnect-observability/stories/ssdo-s1-log-premature-sse-disconnect.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Normal completion emits no new log event (writableEnded true at close) | 1 test | — | — | — | — | 🟢 |
| AC2 | Premature disconnect (writableEnded false at close) emits `sse_client_disconnect` with correlation fields | 1 test | — | — | — | — | 🟢 |
| AC3 | Existing suite unaffected — full regression run | — | — | — | 1 full-suite run | — | 🟢 |

---

## Coverage gaps

None. The `res` object's `writableEnded` state and `'close'` emission are directly simulable in the existing `noopRes()`-style test harness by manually calling `res.emit('close')` (or the harness's mock) after setting/not-setting the completion flag.

---

## Unit Tests

### normalCompletionEmitsNoDisconnectEvent

- **Verifies:** AC1
- **Precondition:** Drive a real successful turn through `handlePostTurnStreamHtml` via the existing real-render harness, capturing pino output via the `_setPinoLogger` seam (from `sstr-s1`).
- **Action:** After the turn resolves (response ended normally), manually emit `'close'` on the mock response object (mirroring what Node does after `.end()` completes).
- **Expected result:** No `sse_client_disconnect` event appears in captured log output.
- **Edge case:** No.

### prematureDisconnectEmitsClientDisconnectEvent

- **Verifies:** AC2
- **Precondition:** A mock response object whose `writableEnded` remains `false` (simulating the handler having called `res.writeHead`/logged `sse_open` but not yet reached any `res.end()`).
- **Action:** Emit `'close'` on that mock response object before the turn's handler has completed.
- **Expected result:** Captured log output contains a `sse_client_disconnect` event carrying the same `correlationId`/`sessionId`/`turnId` fields already attached to that turn's other log lines.
- **Edge case:** Yes — this is the actual gap the story closes.

### fullSuiteRegressionUnaffected

- **Verifies:** AC3
- **Precondition:** None — full suite.
- **Action:** `node scripts/run-all-tests.js`.
- **Expected result:** Same pass count as the pre-change baseline; zero new failures anywhere, especially in every existing test file that already exercises `handlePostTurnStreamHtml` (success, error, retry, precompute paths).
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above.

---

## NFR Tests

None applicable — pure logging addition, no measurable performance/security surface.

---

## Out of Scope for This Test Plan

- Reproducing the actual production disconnect live (proxy/network-level condition, not deterministically triggerable in a test harness) — the harness instead directly simulates the `writableEnded`-false-at-`'close'` state the real disconnect would produce, which is the only externally observable signature this story cares about.

---

## Test Gaps and Risks

None.
