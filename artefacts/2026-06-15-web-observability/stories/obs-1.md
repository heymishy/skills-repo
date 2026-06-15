## Story: Add pino structured logging with turn correlation IDs and timing to the web server

**Epic reference:** artefacts/2026-06-15-web-observability/epics/obs-core.md
**Discovery reference:** artefacts/2026-06-15-web-observability/discovery.md
**Benefit-metric reference:** artefacts/2026-06-15-web-observability/benefit-metric.md

## User Story

As an **engineer maintaining the web server**,
I want structured JSON log output with a correlation ID on every SSE turn and timing on every LLM call,
So that I can reconstruct the full lifecycle of any turn from a single log query and diagnose hung connections or slow model calls without adding debug code.

## Benefit Linkage

**Metrics moved:** M1 (hung connection diagnosability), M2 (LLM call duration), M3 (correlation trace completeness)
**How:** pino emits structured JSON; a correlationId generated at turn ingress is attached to SSE open, LLM call start/end, and SSE close/error events — giving M3. The llm_duration_ms field on LLM completion gives M2. SSE open + close events with elapsed time give M1 (whether the hang is LLM-side or network-side is visible from which event is present).

## Architecture Constraints

- Plain Node.js, CommonJS (`require`) — no TypeScript or transpilation (guardrail: `.github/architecture-guardrails.md`)
- pino must be added to `package.json` `dependencies` (not `devDependencies`) — it runs at server runtime, not build time
- No log line may contain raw API keys, session access tokens, or GitHub OAuth tokens — these must be omitted or masked at the log call site
- Log output must not collide with existing test suite stdout assertions — pino's destination must be configurable so tests can suppress or redirect it

## Dependencies

- **Upstream:** None
- **Downstream:** None — this story is purely additive and does not block or unblock other stories

## Acceptance Criteria

**AC1 — Correlation ID on every SSE turn**
Given an authenticated POST request to `/skills/:name/sessions/:id/turns`,
When the SSE stream handler processes the request,
Then a unique `correlationId` is generated at request ingress and all log events for that turn (SSE open, LLM call, SSE close/error) include the same `correlationId` field in their structured JSON output.

**AC2 — LLM call duration logged**
Given a SSE turn where the LLM adapter completes (success or error),
When the adapter resolves or rejects,
Then a log event is emitted at `info` level with fields: `event: "llm_complete"`, `correlationId`, `llm_duration_ms` (integer milliseconds from adapter invocation to final chunk/error).

**AC3 — SSE lifecycle events logged**
Given a SSE turn is in progress,
When the SSE stream opens, When the stream closes normally, and When the stream closes with an error,
Then log events are emitted for each transition: `event: "sse_open"` at open, `event: "sse_close"` with `chunk_count` at normal close, and `event: "sse_error"` with `error_message` at error close — all carrying `correlationId`.

**AC4 — No raw secrets in log output**
Given the SSE handler is processing a turn with a GitHub access token in the session,
When any log event is emitted,
Then the structured log output does not contain the literal access token value, GitHub client secret, or SESSION_SECRET value.

**AC5 — Structured JSON format**
Given the server is running in any `NODE_ENV`,
When a log event is emitted via pino,
Then the output is valid JSON with at minimum the fields: `level`, `time`, `msg`, and `correlationId` (where applicable) — not unstructured `console.log` strings.

**AC6 — Existing test suite passes**
Given pino is added and log instrumentation is in place,
When `npm test` is run,
Then all existing tests pass with no regressions — log output does not interfere with test stdout assertions.

## Out of Scope

- Log aggregation platform configuration — JSON to stdout only for now
- PII redaction for skill turn content — separate story once privacy review is complete
- Logging for routes other than the SSE turn handler (e.g. `/skills` GET, OAuth routes) — follow-on
- Log rotation, file output, or multi-destination transport — stdout only at MVP
- Changing log levels at runtime without restart — not in MVP

## NFRs

- **Performance:** pino must not add >5ms latency to SSE stream open time (pino is designed for this; use async transport if default transport causes measurable impact)
- **Security:** No API keys, OAuth tokens, or session secrets in any log line (AC4 covers this)
- **Accessibility:** Not applicable — no UI changes
- **Audit:** Not in scope for this story — existing pipeline governance covers audit trail

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
