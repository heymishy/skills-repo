# Contract Proposal: Retry an LLM stream call once when it fails before any content has streamed

**Story reference:** artefacts/2026-08-31-sse-timeout-retry-resilience/stories/sstr-s1-retry-on-pre-first-chunk-failure.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-31

---

## What will be built

- In `src/web-ui/routes/skills.js`, wrap the existing try/catch block (the streaming-call section, ~line 4778 through the `sse_error` catch at ~line 5086) in a `for (;;)` loop:
  - On success (no exception), `break` out of the loop and fall through to the existing post-success code, unchanged.
  - On exception: if this is the first attempt AND `_ttfbMs === null` (no content has streamed for this attempt), log a `sse_retry_attempt` event and `continue` the loop (re-executes the try body fresh — all its local `var`s re-initialize).
  - Otherwise (second attempt, or `_ttfbMs !== null`): fall through to the existing error-handling code, with one addition — `session.turns.pop()` immediately before `res.write(...)`/`res.end()`, removing the dangling user turn.
- On the attempt that eventually succeeds after at least one prior retry, emit a `sse_retry_succeeded` log event (in addition to, not instead of, the normal `llm_complete`/`sse_close` events).

## What will NOT be built

- No retry after any content has streamed (`_ttfbMs !== null`) — existing behavior unchanged for that case.
- No more than one retry, ever.
- No change to `DEFAULT_TIMEOUT_MS` or any other timeout/backoff configuration.
- No error-type classification — the retry gate is purely "has content streamed yet," not "is this error retriable in principle."

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fake adapter fails once (pre-first-chunk) then succeeds; assert 2 invocations, successful client output | Unit (real-render harness) |
| AC2 | Fake adapter always fails pre-first-chunk; assert exactly 2 invocations, existing error output | Unit |
| AC3 | Fake adapter streams content then fails; assert exactly 1 invocation, existing error output | Unit |
| AC4 | Same as AC2/AC3; assert `session.turns` no longer contains the dangling user turn | Unit |
| AC5 | Same as AC1; capture stdout, assert `sse_retry_succeeded` event present | Unit |

## Assumptions

- `_ttfbMs === null` is a fully sufficient and safe proxy for "no content has streamed and no session mutation has occurred yet" — confirmed by reading `skill-turn-executor.js`'s own stream-parsing loop: `onFirstChunk` is called on the very first `text_delta` or before the very first `onChunk` invocation, and `onChunk`/`onThinkingChunk` are the only sources of `res.write()` calls and `session.canvasBlocks`/`session._artefactInProgress` mutation within this code path. If `onFirstChunk` never fired, neither did any chunk-processing side effect.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` only. Services: none (reuses the existing LLM call path). APIs: none.
