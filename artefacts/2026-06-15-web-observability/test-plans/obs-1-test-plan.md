# Test Plan: Add pino structured logging with turn correlation IDs and timing to the web server

**Story reference:** artefacts/2026-06-15-web-observability/stories/obs-1.md
**Epic reference:** artefacts/2026-06-15-web-observability/epics/obs-core.md
**Test plan author:** Claude Sonnet 4.6 (copilot)
**Date:** 2026-06-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | correlationId generated at request ingress; all turn events carry it | 2 tests | 2 tests | — | — | — | 🟢 |
| AC2 | LLM call duration logged: `event: "llm_complete"`, `llm_duration_ms`, `correlationId` | 2 tests | 1 test | — | — | — | 🟢 |
| AC3a | `sse_open` event logged with `correlationId` | — | 1 test | — | — | — | 🟢 |
| AC3b | `sse_close` event logged with `chunk_count` and `correlationId` on normal close | — | 1 test | — | — | — | 🟢 |
| AC3c | `sse_error` event logged with `error_message` and `correlationId` on error close | — | 1 test | — | — | — | 🟢 |
| AC4 | No raw access token, client secret, or SESSION_SECRET in log output | 2 tests | — | — | — | — | 🟢 |
| AC5 | Log output is valid JSON with `level`, `time`, `msg`, `correlationId` fields | 2 tests | — | — | — | — | 🟢 |
| AC6 | `npm test` passes with no regressions after implementation | — | — | — | 1 scenario | Regression | 🟡 |

**Note on AC3:** The story bundles three SSE lifecycle events into one AC. This plan splits them into AC3a/AC3b/AC3c so each path has distinct test coverage. All three are green-path automatable via integration test against the SSE handler.

**Note on AC6:** `npm test` is a regression check run after implementation — it is not a test written to fail before implementation. The verification script includes a manual step confirming the test suite passes post-merge.

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| `npm test` suite regression | AC6 | Regression | Not written as a pre-implementation failing test — it verifies no existing test breaks | Manual verification post-implementation — run `npm test` and confirm 0 failures |
| pino 5ms latency NFR | NFR-PERF | Performance | No automated latency measurement infrastructure in this test suite | Manual scenario: time SSE first-byte before and after implementation in a local session; record finding |

---

## Test Data Strategy

**Source:** Synthetic — all test data generated inline in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now — no external services or fixtures required
**Owner:** Self-contained — tests generate their own data in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock HTTP request object with session and turn IDs | Synthetic — inline `{}` object | None | |
| AC2 | Mock LLM adapter function that resolves after a measurable delay | Synthetic — `setTimeout` stub | None | Use ≥10ms delay so `llm_duration_ms` is non-zero |
| AC3a/b/c | Mock Express `res` with SSE write methods, mock LLM adapter | Synthetic | None | |
| AC4 | Fake OAuth access token (`ghp_FAKE_TOKEN_1234`), fake SESSION_SECRET, fake client secret | Synthetic — hardcoded fake values | None — deliberately fake, not real credentials |
| AC5 | Any logged event output from pino | Synthetic — captured from log stream | None | |
| AC6 | Full repo test suite | Current codebase state | None | |

### PCI / sensitivity constraints

None — no payment card data or sensitive personal data is involved.

### Gaps

None — all test data is available now as synthetic values.

---

## Unit Tests

### T1: correlationId is a non-empty string

- **Verifies:** AC1
- **Precondition:** A correlationId-generation utility or the SSE handler's ingress logic exists
- **Action:** Call the correlationId generator function (or simulate request ingress) with a mock request; capture the returned/emitted correlationId
- **Expected result:** The value is a non-empty string of at least 8 characters
- **Edge case:** No

---

### T2: correlationId is unique across concurrent requests

- **Verifies:** AC1
- **Precondition:** The correlationId generator is callable
- **Action:** Call the generator (or simulate two simultaneous request ingressions) twice without waiting; capture both IDs
- **Expected result:** The two correlationId values are not equal
- **Edge case:** Yes — concurrent request deduplication

---

### T3: LLM completion log event includes llm_duration_ms as a positive integer

- **Verifies:** AC2
- **Precondition:** A mock LLM adapter is configured to resolve after 15ms; pino log output is captured
- **Action:** Invoke the SSE turn handler (or the LLM timing wrapper) with the mock adapter; wait for resolution; inspect captured log lines for `event: "llm_complete"`
- **Expected result:** The log line with `event: "llm_complete"` has `llm_duration_ms` ≥ 1 (integer, not NaN, not undefined)
- **Edge case:** No

---

### T4: LLM completion log event includes correlationId

- **Verifies:** AC2
- **Precondition:** Mock LLM adapter resolves; correlationId assigned at ingress; pino log captured
- **Action:** Run the SSE handler with a known correlationId; inspect the `llm_complete` log event
- **Expected result:** `llm_complete` event's `correlationId` field matches the ID assigned at ingress
- **Edge case:** No

---

### T5: pino log output is valid JSON

- **Verifies:** AC5
- **Precondition:** pino logger instance created with a destination that writes to a captured buffer
- **Action:** Emit one log event via the logger; capture the output line
- **Expected result:** `JSON.parse(capturedLine)` does not throw; result has `level` (number or string), `time` (number), `msg` (string)
- **Edge case:** No

---

### T6: pino log output includes correlationId when provided

- **Verifies:** AC5
- **Precondition:** pino logger configured with child context or log call includes correlationId
- **Action:** Emit a log event that includes a correlationId value `"test-corr-001"`; capture the output line
- **Expected result:** `JSON.parse(capturedLine).correlationId === "test-corr-001"`
- **Edge case:** No

---

### T7: access token value does not appear in any log output for a turn

- **Verifies:** AC4
- **Precondition:** Session contains fake access token `"ghp_FAKE_TOKEN_1234"`; all log output for the turn is captured
- **Action:** Run the SSE handler with a session containing the fake token; collect all log lines emitted during the turn
- **Expected result:** No captured log line contains the string `"ghp_FAKE_TOKEN_1234"` — `capturedLines.join('').indexOf('ghp_FAKE_TOKEN_1234') === -1`
- **Edge case:** No

---

### T8: SESSION_SECRET value does not appear in any log output

- **Verifies:** AC4
- **Precondition:** `SESSION_SECRET` env var set to fake value `"FAKE_SESSION_SECRET_XYZ"` for the test; all log output captured
- **Action:** Run the SSE handler; collect all log lines
- **Expected result:** No captured log line contains `"FAKE_SESSION_SECRET_XYZ"`
- **Edge case:** No

---

## Integration Tests

### T9: SSE open event logged with correlationId at request ingress

- **Verifies:** AC1, AC3a
- **Components involved:** POST `/skills/:name/sessions/:id/turns` handler in `src/web-ui/routes/skills.js`; pino logger
- **Precondition:** Mock Express request and response objects; mock LLM adapter; pino output captured to buffer
- **Action:** Call the SSE turn handler with a mock authenticated session request; capture the first log event emitted
- **Expected result:** First log event has `event: "sse_open"` and `correlationId` is a non-empty string

---

### T10: SSE close event logged with chunk_count on normal stream end

- **Verifies:** AC3b
- **Components involved:** SSE turn handler; pino logger
- **Precondition:** Mock LLM adapter streams 3 chunks then resolves; pino output captured
- **Action:** Run the SSE handler to completion; inspect log events for `event: "sse_close"`
- **Expected result:** Log event with `event: "sse_close"` has `chunk_count: 3` and matching `correlationId`

---

### T11: SSE error event logged with error_message on adapter rejection

- **Verifies:** AC3c
- **Components involved:** SSE turn handler; pino logger
- **Precondition:** Mock LLM adapter rejects with `new Error("adapter timeout")`; pino output captured
- **Action:** Run the SSE handler; wait for error path; inspect log events for `event: "sse_error"`
- **Expected result:** Log event with `event: "sse_error"` has `error_message: "adapter timeout"` and matching `correlationId`; no unhandled exception thrown

---

### T12: All events for a single SSE turn share the same correlationId

- **Verifies:** AC1, AC3a, AC3b, AC2
- **Components involved:** SSE turn handler; pino logger
- **Precondition:** Mock request + session; mock LLM adapter resolves after 10ms; pino output captured
- **Action:** Run a complete SSE turn (open → LLM call → close); collect all log lines; parse each; extract correlationId values
- **Expected result:** Every log line emitted during the turn has the same non-empty `correlationId` value; at minimum `sse_open`, `llm_complete`, and `sse_close` events are present

---

### T13: LLM call duration measured from adapter invocation to final chunk

- **Verifies:** AC2
- **Components involved:** SSE turn handler; mock LLM adapter with 20ms artificial delay; pino logger
- **Precondition:** Adapter wrapped in timing instrumentation; pino captured
- **Action:** Run the SSE handler; inspect `llm_complete` log event
- **Expected result:** `llm_duration_ms` ≥ 15 (accounts for 20ms stub minus scheduling variance); value is an integer (not a float or undefined)

---

## NFR Tests

### NFR-SEC-1: No raw secrets in log output (AC4 overlap — explicit NFR assertion)

- **NFR addressed:** Security
- **Measurement method:** Run a full simulated turn with a session containing fake tokens; assert only that log output does not contain any of the fake token strings
- **Pass threshold:** `capturedLogs.join('').indexOf(fakeToken) === -1` — zero occurrences of any secret value
- **Tool:** Node.js test (`node tests/check-obs1-logging.js`)

**Note (EXP-007 compliance):** This test asserts only the security NFR outcome. It does not also assert that the LLM call completed or that a gateway was invoked — those belong in T4/T13.

---

### NFR-PERF-1: pino does not measurably delay SSE stream open

- **NFR addressed:** Performance (>5ms constraint)
- **Measurement method:** Manual timing — measure SSE time-to-first-byte (first `data:` line received by client) in a local session before and after pino integration. Record both readings.
- **Pass threshold:** Difference ≤ 5ms across 3 consecutive runs. If a measurement shows >5ms, switch to pino's async transport and re-test.
- **Tool:** Manual (`curl -N` with timing, or browser Network tab first-byte column) — automated timing infrastructure not yet present in this test suite

---

## Out of Scope for This Test Plan

- Log aggregation platform output format (stdout-only at MVP)
- pino configuration for production log levels (not part of obs-1 scope)
- PII redaction of skill turn content (separate story)
- Logging for routes other than the SSE turn handler (follow-on)
- Browser-side logging (server-side only)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| NFR-PERF-1 latency measurement | No automated p50/p99 measurement infrastructure in this Node.js test suite | Manual timing check in local session; pino's default synchronous transport is well under 5ms for single log events; async transport available as fallback if observed |
| AC6 regression check | Cannot write a "failing" test for "all existing tests pass" — it's inherently post-implementation | Run `npm test` after implementation; confirm 0 failures; block story sign-off if any test regresses |
| pino stream destination in test context | pino writes to stdout by default; test assertions must capture or redirect output to avoid interfering with test stdout | Use pino's `destination` option in tests to write to a writable stream buffer; or use `pino.destination()` with a custom stream — see AC6 constraint in story |
