## Story: Log a premature SSE client disconnect, distinguishable from a normal completion

**As an** engineer diagnosing a production "Error — please try again" report,
**I want** the server to log an event when an SSE turn's response closes before the handler itself ever called `res.end()`,
**So that** a client/network-level disconnect leaves a diagnosable trace instead of a single `sse_open` line followed by total silence.

## Bug found (live, via production dogfooding)

Retesting `rssp-s1`/`sstr-s1` on production, an operator hit a generic client-side `"Error — please try again."` bubble. Investigating via `flyctl logs`, the failed turn's *entire* log footprint was one line — `sse_open` — with no `sse_close`, `sse_error`, `llm_complete`, or any `sse_retry_*` event ever following it. The production process did not crash or restart in that window (confirmed: no boot-sequence log lines between the failure and the next successful turn). This rules out both a genuine LLM timeout (`sstr-s1`'s target) and a process crash, and points to the client/connection dropping before the server's own error-handling code ever ran — but there is currently no instrumentation anywhere in `handlePostTurnStreamHtml` to confirm or refute that theory. Grepped the whole file: zero `res.on('close', ...)` or `res.on('error', ...)` listeners exist on the SSE response object, anywhere.

## Architecture Constraints

- Attach the listener once, immediately after `res.writeHead(200, {...})` in `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`) — the single entry point for every turn's SSE response, including the `__init__`/precomputed-Step-1 fast paths and the main streaming path.
- Use `res.writableEnded` (a native Node.js `http.ServerResponse` property, true once `.end()` has actually been called) to distinguish a normal completion from a premature one — do NOT add a new custom flag or touch any of the function's several existing `res.end()` call sites, since `writableEnded` already captures exactly the distinction needed with zero risk of drifting out of sync with those call sites.
- Purely additive observability — no change to any existing response-writing, retry, or error-handling behavior. Must not alter what the client receives in any scenario.
- Must not throw or add any risk of an unhandled exception on the `close` event itself (a stream `'close'` handler that throws can crash the process) — no `_turnLog` call inside it can be allowed to throw, so guard defensively.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. Directly informs the next investigation if this failure mode recurs (not itself a fix for the disconnect's root cause, which remains unconfirmed).

## Acceptance Criteria

**AC1:** Given an SSE turn completes normally (any of the existing `res.end()` call sites in `handlePostTurnStreamHtml` is reached), When the response's `'close'` event fires afterward, Then no new log event is emitted — `writableEnded` is `true` at that point, so the listener is a no-op for every existing, already-tested success and error path.

**AC2:** Given an SSE turn's connection closes (e.g., client disconnect, network drop, proxy reset) before the handler has called `res.end()` for that turn, When the response's `'close'` event fires, Then a `sse_client_disconnect` event is logged via `_turnLog`, including the `correlationId`/`sessionId`/`turnId` already attached to that turn's logger — giving a diagnosable trace where today there is none.

**AC3:** Given the `'close'` listener itself is attached, When any existing test in the suite exercises `handlePostTurnStreamHtml` (success, error, retry, precompute, `__init__`-done-early-return paths), Then no test's behavior, assertions, or log-event expectations change — this story adds one new observable event for one previously-silent scenario and touches nothing else.

## Out of Scope

- Diagnosing or fixing the actual root cause of the disconnect itself (proxy timeout, browser behavior, connection-reuse race, etc.) — this story only makes the *next* occurrence diagnosable; a root-cause fix is a separate, future story once real evidence exists.
- Any retry or reconnection behavior for a disconnected client — a closed connection cannot be retried into; this is a distinct scenario from `sstr-s1`'s pre-first-chunk LLM retry (which operates on the LLM call, not the client connection).
- Extending this pattern to any other SSE/streaming endpoint in the codebase beyond `handlePostTurnStreamHtml` — scoped to the one function directly implicated in the production report.

## NFRs

- **Performance:** Negligible — one additional event listener per request, no polling, no additional I/O beyond the one conditional log call.
- **Security:** Not applicable — no new data exposure; logs the same correlationId/sessionId/turnId already logged for every other event on this turn.
- **Reliability:** The listener itself must be exception-safe (see Architecture Constraints) — a logging addition must never become a new crash vector.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, direct production-incident traceability instead of a formal metric
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session after independently investigating the underlying production log gap together
