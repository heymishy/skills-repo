## Story: Retry an LLM stream call once when it fails before any content has streamed

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator running a skill session (CLI or web UI)**,
I want to **have a transient LLM stream failure (timeout, network blip) that occurs before any content has streamed retried automatically once**,
So that **I don't see a dead-end "Model error — please try again" for a failure the system could plausibly have recovered from itself, matching what real log evidence showed: two other turns in the exact same session, moments apart, completed normally.**

## Bug found (live, via production log investigation)

While investigating a "model error" reported during web UI dogfooding (`Cross-Channel Feature Continuity`, `af17f555` journey), Fly logs confirmed one real occurrence: `sse_error — "Anthropic API stream failed: Anthropic API stream timed out after 90000ms"`, at `2026-08-30T17:44:35Z`, in the `/definition` session. The same session had two other turns complete successfully at 66.2s and 43.1s moments before and after — consistent with a transient upstream stall, not a systemic failure. `skills.js`'s turn-handling catch-all (~line 5086) surfaces every LLM-call failure identically as "Model error — please try again," with no retry of any kind.

## Architecture Constraints

- **Safety condition for retry — critical, not optional:** the streaming call's `onChunk`/`onThinkingChunk` callbacks perform live, irreversible side effects as content arrives — `res.write()`-ing chunks directly to the client's already-open SSE connection, and mutating `session.canvasBlocks`/`session._artefactInProgress`/`session._canvasFailureState`. A retry is only safe when **zero** content has streamed yet for this attempt, verified via the existing `_ttfbMs` local (`null` until `onFirstChunk` fires, which always fires before the first `onChunk` call — confirmed in `skill-turn-executor.js`). Retrying after any chunk has streamed would show the client inconsistent/duplicated content and is explicitly out of scope — that case keeps today's existing error-and-stop behavior, unchanged.
- **Bounded to exactly one retry.** Do not retry more than once. A `DEFAULT_TIMEOUT_MS` of 90000ms means a worst case of two consecutive full-timeout attempts (~180s) before the operator sees anything — this is a real, accepted latency trade-off for the (expected to be common) case where a retry recovers quickly, not a free improvement. Documented here, not hidden.
- **Implementation approach:** wrap the existing try/catch (the large block starting at `skills.js` ~line 4778) in a `for (;;)` loop with a `continue` on the retry path, rather than extracting the body into a separate function. The block's local `var` declarations (`_ttfbMs`, `_llmStart`, `_turnOptions`, etc.) are function-scoped and safe to re-execute on a loop iteration — this keeps the diff minimal and avoids restructuring 300+ lines of deeply-coupled streaming/parsing logic that is otherwise unchanged.
- **Consistency fix, same story:** the existing `sse_error` catch block does not remove the already-pushed user turn from `session.turns` on ultimate failure, unlike the sibling "empty LLM response" catch path immediately below it, which does exactly this with the stated rationale "Don't push an empty assistant turn — it corrupts history and makes future turns worse." Apply the same `session.turns.pop()` cleanup to the `sse_error` path for the same reason, when retry is exhausted or not applicable.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the LLM stream call fails (any error) before any content chunk has streamed (`_ttfbMs` is still `null`) on the first attempt, When this is the first such failure for this turn, Then the call is retried exactly once automatically, with no error shown to the operator if the retry succeeds — the turn completes normally as if the first attempt never happened.

**AC2:** Given the retry (per AC1) also fails, When the second attempt's failure is reached, Then the existing generic error behavior fires exactly as it does today ("Model error — please try again", SSE stream ended) — no second retry attempt.

**AC3:** Given the LLM stream call fails **after** at least one content chunk has already streamed (`_ttfbMs` is not `null`), When this failure occurs, Then no retry is attempted — the existing error behavior fires immediately, unchanged from today (this is the safety boundary: never retry once partial content is already visible to the client).

**AC4:** Given any path reaches the ultimate error response (AC2 or AC3), When the SSE error is sent to the client, Then the dangling user turn already pushed to `session.turns` for this exchange is removed before the response ends — matching the sibling empty-response path's existing pattern, so the next turn's context doesn't carry an unanswered user message.

**AC5:** Given a successful retry occurred (per AC1), When the turn completes, Then a distinguishable audit log event (e.g. `sse_retry_succeeded`) is emitted, separate from the normal `llm_complete`/`sse_close` events — so production log investigation can tell "recovered via retry" apart from "succeeded on the first attempt" going forward.

## Out of Scope

- Retrying more than once, or retrying after any content has already streamed — both explicitly ruled out above as unsafe or as an unbounded-latency risk.
- Any change to the 90-second `DEFAULT_TIMEOUT_MS` constant itself.
- Any change to how errors are surfaced for genuinely non-retriable failures (e.g. auth/billing errors) — this story does not attempt to classify error types; the *only* gate is whether content has streamed yet.

## NFRs

- **Performance:** Worst-case added latency of up to one additional timeout window (~90s) when a failure is not recoverable by retry — explicitly accepted, see Architecture Constraints.
- **Security:** None identified — no new external call surface, reuses the existing LLM call path exactly.
- **Accessibility:** Not applicable.
- **Audit:** New `sse_retry_succeeded` log event, per AC5.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session after reviewing the proposed design and its latency trade-off
