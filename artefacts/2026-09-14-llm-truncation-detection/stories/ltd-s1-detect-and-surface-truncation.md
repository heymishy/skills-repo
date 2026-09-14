## Story: Detect max_tokens truncation explicitly instead of relying on a heuristic, and raise the output ceiling

**Epic reference:** None — short-track (bounded reliability fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator running real skill turns against production (`skills-framework.fly.dev`)**,
I want **a truncated LLM response (one that was cut off by the provider's `max_tokens` ceiling) to be detected and acted on explicitly, instead of silently treated as a normal complete turn**,
So that **a long artefact-generation turn (e.g. test-plan) reliably continues to completion, and any truncation is visible in production logs and PostHog rather than invisible**.

## Benefit Linkage

**Metric moved:** None formal — reliability/observability fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly follows from a PostHog AI-observability review conducted on 2026-09-14 of the same incident already resolved by `pao-s1` (production always-on). That review found the incident's final abandoned LLM call (176.857s, `$ai_generation` id `01a09f35-8937-7764-903a-70af9e0bf445`) hit exactly `$ai_output_tokens: 16384` — the app's `DEFAULT_MAX_TOKENS` ceiling (`skill-turn-executor.js:42`) — meaning the response was truncated by the provider, not just slow. A code review following that finding established two things: (1) the client already has a self-healing continuation mechanism (`skills.js` ~line 3991: auto-fires a hidden "continue" turn whenever a turn's text doesn't end in a literal "?"), which happens to catch most truncations by coincidence, but (2) nothing in the codebase reads the API's own `stop_reason`/`finish_reason` field — so truncation detection today is a heuristic side-effect, not a deliberate signal, and a truncation that happens to land right after a literal "?" inside generated content (e.g. inside a quoted acceptance criterion) would be silently misclassified as a complete, question-ending turn with no continuation and no visible sign anything went wrong. Separately, PostHog's own AI-observability Errors tab showed zero captured events for this incident (7-day and 30-day checks) — confirming the app never sends a real error/failure signal to PostHog even when a response is truncated.

**Decision basis:** a 30-day scan of every `$ai_generation` event on this account (`$ai_output_tokens >= 16000`) found exactly one occurrence — this incident's own call. Truncation is rare, but the fact that it happened at all, with no detection and only a lucky heuristic catching it, is a real observability and correctness gap worth closing at low cost.

## Architecture Constraints

- **Provider scope: `anthropic` only.** `SKILL_EXECUTOR_PROVIDER` is unset in production (confirmed via `fly secrets list --app skills-framework`), which defaults to `anthropic` — the only provider path this story touches. The `copilot` provider path (`_callCopilot`/`_callCopilotStream` in `skill-turn-executor.js`) already has a pre-existing, unrelated return-shape inconsistency (resolves a bare string, not `{text, usage}`) — out of scope for this story; not to be fixed incidentally as part of this change.
- **`stop_reason` capture:** Anthropic's Messages API returns `stop_reason` at the top level of a non-streaming response, and via the `message_delta` SSE event's `delta.stop_reason` field for streaming — both already parsed in `skill-turn-executor.js` for other fields (`usage`), just not this one. Thread it through the same `usage` object both call sites already return.
- **Max-tokens ceiling:** `DEFAULT_MAX_TOKENS` (`skill-turn-executor.js:42`) rises from `16384` to `32768`. `WUCE_TURN_MODEL_MAX_TOKENS` is not set as a Fly secret in production (confirmed), so this constant is the effective production ceiling today — the change takes effect on deploy with no separate secret update needed. This value is not independently verified against a live upper bound for the `claude-haiku-4-5`/`claude-sonnet-4-6` model IDs configured in this app; if it exceeds the real API ceiling, the existing HTTP-error handling in `_callAnthropic`/`_callAnthropicStream` (reject on non-200) already surfaces this as a loud `sse_error` log line — this story's own observability additions (below) make such a failure immediately visible rather than a silent regression.
- **Client-side auto-continue:** the existing "no literal `?`" heuristic (`skills.js` ~line 3991) stays in place as a secondary safety net — it catches other incomplete-turn cases this story doesn't target (e.g. a non-`max_tokens` stop with genuinely incomplete-feeling text). This story adds an authoritative `truncated` flag (from real `stop_reason` data) as an additional trigger condition, not a replacement for the heuristic.
- **Non-streaming path (`htmlSubmitTurn`) out of scope for the client heuristic fix** — per the existing `srar-s1` comment in the codebase, the streaming SSE endpoint is confirmed to be the only one the real browser chat UI calls. The non-streaming path gets the same `stop_reason` capture and PostHog property additions for observability parity, but no continuation-heuristic change (there is no equivalent client-side auto-continue loop consuming that path today).

## Dependencies

- **Upstream:** None. Builds on the same incident `pao-s1` already fixed (production always-on) but is independent — this story would still be correct and worth shipping even without `pao-s1`.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a non-streaming Anthropic API response, When `_callAnthropic` in `skill-turn-executor.js` resolves, Then the returned `usage` object includes `stop_reason` taken from the API response's top-level `stop_reason` field (`null` if absent).

**AC2:** Given a streaming Anthropic API response, When `_callAnthropicStream` processes the SSE `message_delta` event, Then the returned `usage` object includes `stop_reason` taken from that event's `delta.stop_reason` field (`null` if the event never arrives).

**AC3:** Given a completed skill turn (streaming path, `skills.js`), When the `llm_complete` log entry is written, Then it includes a `stop_reason` field reflecting the turn's actual API stop reason.

**AC4:** Given a completed skill turn (both streaming and non-streaming `$ai_generation` PostHog captures), When the capture fires, Then its properties include a plain `stop_reason` field, and when `stop_reason === 'max_tokens'`, additionally include `$ai_is_error: true` and `$ai_error: 'max_tokens - response truncated'`.

**AC5:** Given a streaming turn whose `stop_reason` is `'max_tokens'`, When the final SSE `done` event is written, Then its payload includes `truncated: true` (and `truncated: false` otherwise).

**AC6:** Given the client-side chat page's streaming response handler, When a turn's `done` event carries `truncated: true`, Then the client auto-fires a hidden "continue" turn (the same mechanism already used for the "no literal `?`" heuristic), regardless of whether the response text happens to end in a literal `?`.

**AC7:** Given `skill-turn-executor.js`, When `DEFAULT_MAX_TOKENS` is inspected, Then its value is `32768` (raised from `16384`).

## Out of Scope

- The `copilot` provider path (`_callCopilot`/`_callCopilotStream`) — pre-existing, unrelated return-shape issue; not touched here.
- The non-streaming path's client-side continuation behaviour — no equivalent auto-continue loop exists there today; only observability additions (AC1, AC4) apply to it.
- Any change to `review`'s "one story at a time" turn-taking design, or to the client's auto-fire-on-load mechanism for a fresh session — both confirmed working-as-intended in this session's PostHog review; recorded in `decisions.md` as explicit no-action findings, not implemented as code changes here.
- Retroactively reprocessing the 2026-09-14 incident's truncated test-plan turn.

## NFRs

- **Performance:** negligible — `stop_reason` is already present in API responses this app already parses; capturing it adds no additional network calls. Raising `DEFAULT_MAX_TOKENS` does not increase cost or latency for a turn that doesn't need the extra budget (Anthropic bills actual output tokens generated, not the ceiling) — it only removes an artificial early cutoff for turns that do need it.
- **Cost:** bounded — see above; only a turn that previously would have been truncated (and silently retried via a whole extra continue-turn round trip) can now legitimately use more of a single turn's budget instead.
- **Observability:** directly improves — this is the primary purpose of the story.

## Complexity Rating

**Rating:** 2 — touches two files across streaming and non-streaming paths, but each change is small, additive, and localized; no new architecture.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
