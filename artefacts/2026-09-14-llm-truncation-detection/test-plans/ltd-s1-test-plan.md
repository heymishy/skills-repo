# Test Plan: Detect max_tokens truncation explicitly and raise the output ceiling (ltd-s1)

**Story:** artefacts/2026-09-14-llm-truncation-detection/stories/ltd-s1-detect-and-surface-truncation.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-ltd-s1-truncation-detection.js`. Two layers, both against real behaviour (no source-string regex except T13, which follows the established `lasr-s1` precedent for asserting on a client-side JS string embedded in a much larger string-template block):

**Executor layer** — mocks `https.request` directly (the `check-s6.1-cache-scope-session-threading.js` precedent: `mockAnthropicNonStreaming`/`mockAnthropicStreaming`, extended to control the response's `stop_reason` and to capture the outgoing request body).

**Route layer** — mocks the executor adapter via `routes.setSkillTurnExecutorAdapter`/`setSkillTurnExecutorStreamAdapter` (the `check-pla-s2-posthog-wiring.js` precedent), with the PostHog module mocked the same way, and a real `pino` logger writing to a captured stream (the `check-ssdo-s1-sse-client-disconnect-logging.js` precedent) for the log assertion.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | `_callAnthropic` (non-streaming): mocked response has top-level `stop_reason: 'max_tokens'` — resolved `usage.stop_reason === 'max_tokens'` |
| T2 | AC1 | Regression | `_callAnthropic`: mocked response has `stop_reason: 'end_turn'` — resolved `usage.stop_reason === 'end_turn'` (not silently dropped) |
| T3 | AC2 | Behavioural | `_callAnthropicStream`: mocked SSE includes a `message_delta` event with `delta.stop_reason: 'max_tokens'` — resolved `usage.stop_reason === 'max_tokens'` |
| T4 | AC2 | Regression | `_callAnthropicStream`: `message_delta` event has `delta.stop_reason: 'end_turn'` — resolved `usage.stop_reason === 'end_turn'` |
| T5 | AC3 | Behavioural | Real `pino` logger captured via `_setPinoLogger`; stream executor mocked to resolve `usage.stop_reason: 'max_tokens'`; the captured `llm_complete` NDJSON line includes `"stop_reason":"max_tokens"` |
| T6 | AC4 | Behavioural | Streaming `$ai_generation` PostHog capture: `stop_reason: 'max_tokens'` in mocked usage — captured props include `stop_reason: 'max_tokens'`, `$ai_is_error: true`, `$ai_error: 'max_tokens - response truncated'` |
| T7 | AC4 | Regression | Streaming `$ai_generation` capture: `stop_reason: 'end_turn'` — captured props include `stop_reason: 'end_turn'`, no `$ai_is_error`/`$ai_error` keys present |
| T8 | AC4 | Behavioural | Non-streaming `$ai_generation` capture (`handlePostTurnHtml`): `stop_reason: 'max_tokens'` — same `$ai_is_error`/`$ai_error` behaviour as T6, on the non-streaming capture site |
| T9 | AC5 | Behavioural | Streaming SSE: mocked usage `stop_reason: 'max_tokens'`, response text with no closing artefact marker — the final `done` SSE event has `truncated: true` |
| T10 | AC5 | Regression | Streaming SSE: normal completion (`stop_reason: 'end_turn'`) — final `done` event has `truncated: false` |
| T11 | AC6 | Source assertion | The client-side chat-page JS string (the same template `skills.js` builds for the browser) has the auto-continue condition include `evt.truncated` as an additional trigger alongside the existing "no literal `?`" heuristic — asserted via a targeted region match against the built page source, following the `lasr-s1` precedent for asserting on generated string-template content |
| T12 | AC7 | Behavioural | `skillTurnExecutor` (non-streaming, anthropic provider, no env override, no `options.maxTokens`): captured outgoing request body has `max_tokens === 32768` |
| T13 | AC7 | Regression | `WUCE_TURN_MODEL_MAX_TOKENS` env override still takes precedence over the new default (captured request body `max_tokens` matches the override value, not 32768) |

## Regression coverage

- `check-s6.1-cache-scope-session-threading.js` re-run — confirms the `stop_reason` addition doesn't disturb the existing cache-scope request-body assertions (same mocked-response shape, additive field only).
- `check-pla-s2-posthog-wiring.js` re-run — confirms existing `$ai_generation` property assertions (token counts, latency, model, etc.) are unaffected by the new `stop_reason`/`$ai_is_error`/`$ai_error` additions.
- `check-ssdo-s1-sse-client-disconnect-logging.js` re-run — confirms the `llm_complete` log shape change doesn't disturb the existing `sse_client_disconnect` log-shape assertions (different event name, same logger).
- `check-lasr-s1-llm-agent-keepalive.js` re-run — confirms the `DEFAULT_MAX_TOKENS` change and `stop_reason` additions don't touch the `keepAlive`/agent construction this suite asserts on.
- `check-wuce26-per-answer-model-response.js` and `check-srmw-s1-streaming-mock-gateway-wiring.js` re-run — confirm the mock-LLM-gateway path (a separate code path from the real Anthropic calls touched here) is unaffected.

## Out of Scope (per story)

- The `copilot` provider path.
- The non-streaming path's client-side continuation behaviour (no equivalent heuristic exists there).
- Any change to `review`'s turn-taking design or auto-fire-on-load mechanism.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
