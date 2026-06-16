# DoR Contract: Add pino structured logging with turn correlation IDs and timing to the web server

**Story reference:** artefacts/2026-06-15-web-observability/stories/obs-1.md
**Contract produced:** 2026-06-16
**Produced by:** Claude Sonnet 4.6 (copilot)

---

## What will be built

- pino added to `package.json` `dependencies` (pinned version)
- A logger instance in `src/web-ui/routes/skills.js` (or a shared logger module at `src/web-ui/logger.js`), configured with a writable stream destination that can be redirected in tests
- A `correlationId` generated via `crypto.randomUUID()` at request ingress in the POST `/skills/:name/sessions/:id/turns` SSE handler
- `sse_open` log event emitted at SSE stream start with `correlationId`, `sessionId`, `turnId`
- LLM adapter invocation wrapped in a timer; `llm_complete` log event emitted with `llm_duration_ms` (integer ms) and `correlationId` when the adapter resolves or rejects
- `sse_close` log event emitted with `chunk_count` and `correlationId` on normal stream end
- `sse_error` log event emitted with `error_message` and `correlationId` on error path
- Existing `console.log`/`console.error` calls in the SSE turn handler replaced with pino calls
- New test file at `tests/check-obs1-logging.js` covering AC1–AC5 unit and integration paths

## What will NOT be built

- Logging for routes other than POST `/skills/:name/sessions/:id/turns` (GET /skills, OAuth routes, session endpoints) — explicitly out of scope
- A log aggregation transport or file-based output — stdout only
- PII redaction for skill turn content — separate story
- Runtime log-level changing — not in MVP scope
- Any UI changes or changes to client-side code

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — correlationId generated at ingress; all turn events carry it | T1 (correlationId is non-empty string), T2 (unique per call), T9 (sse_open has correlationId), T12 (all events in a turn share same ID) | Unit + Integration |
| AC2 — LLM call duration logged | T3 (llm_duration_ms ≥ 1), T4 (correlationId on llm_complete event), T13 (duration ≥ adapter delay) | Unit + Integration |
| AC3a — sse_open logged with correlationId | T9 (SSE open event logged at handler entry) | Integration |
| AC3b — sse_close logged with chunk_count | T10 (sse_close event with chunk_count: 3 on 3-chunk stream) | Integration |
| AC3c — sse_error logged with error_message | T11 (sse_error event with error_message on adapter rejection) | Integration |
| AC4 — No raw secrets in log output | T7 (fake access token not in any log line), T8 (fake SESSION_SECRET not in any log line), NFR-SEC-1 (explicit NFR assertion) | Unit |
| AC5 — Valid JSON output with required fields | T5 (JSON.parse succeeds; level, time, msg present), T6 (correlationId field present when provided) | Unit |
| AC6 — npm test passes | Manual — run `npm test` after implementation; confirm 0 failures | Manual |

## Assumptions

- `crypto.randomUUID()` (Node.js built-in, available since v14.17.0) is acceptable as the correlationId generator — no external UUID library needed
- The SSE turn handler is the primary file needing instrumentation; other routes are explicitly out of scope
- pino will be configured with a writable stream destination in tests so it does not write to process.stdout during automated runs — implementer is responsible for test isolation
- No changes are needed to the authentication layer, session management, or any other middleware

## Estimated touch points

- **Files:** `src/web-ui/routes/skills.js` (main instrumentation), optionally `src/web-ui/logger.js` (shared logger), `package.json` (add pino dep), `package-lock.json` (lockfile update), `tests/check-obs1-logging.js` (new test file)
- **Services:** None — stdout logging only
- **APIs:** pino npm package (runtime dependency)

## Contract review result

✅ **Contract review passed** — proposed implementation aligns with all ACs. No contract-to-AC mismatches identified. Scope is bounded to `src/web-ui/routes/skills.js` and a new test file. No auth, session, or data handling changes.
