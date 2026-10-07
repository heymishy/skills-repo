# Story: Show visible progress during hidden continuation turns, and auto-recover from the in-flight "still processing" guard instead of dead-ending

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator running a content-heavy skill turn (`/review`, `/test-plan`, `/definition-of-ready`) that triggers a hidden auto-continuation**,
I want **a visible indicator for the full duration of that continuation, and automatic recovery if a retry lands on the server-side "still processing" guard**,
So that **I am never looking at a blank screen or a dead-end red message with no option but to manually refresh the page and wait**.

## Benefit Linkage

**Metric moved:** None formally tracked — short-track UX fix, not a metric-bearing feature. Direct benefit: eliminates a confusing, repeatedly-observed operator experience across 3 of this pipeline's own content-heavy skills.
**How:** Reported live (2026-10-08) on `/review`, `/test-plan`, and `/dor` in this exact codebase's own web UI: after the precomputed Step-1 text renders, the screen goes blank with no visible activity, and after ~30s a red "This turn is still processing — please wait a moment and try again." message appears with no way to recover except a manual refresh several minutes later. Root-caused by direct code read (see Architecture Constraints) to two independent, compounding client-side bugs. Fixing both removes the need for the operator to ever manually refresh to see the outcome of a turn that is, in fact, still succeeding server-side.

## Architecture Constraints

**Root cause #1 — thinking indicator removed too early for continuation turns:** `sendTurn()` in `src/web-ui/routes/skills.js` (client script, ~line 3923) always shows a thinking-dots bubble (`thinkingDiv`) on every call, including hidden auto-continuation turns (`_isContinuation === true`, where the turn's own stream bubble is deliberately `display:none` at line ~3948, since continuation output is not meant to be shown directly). But the `reasoningChunk` (line ~3969), `chunk` (line ~3991), and `draftChunk` (line ~4003) handlers all unconditionally remove `thinkingDiv` the instant the first byte of model output arrives — regardless of `_isContinuation`. For a continuation turn this means the one visible signal of activity disappears the moment generation actually starts, and nothing else is shown in its place until the turn's `done` event arrives, which can be 30–170s later on these skills. This is the "no visible action happening" symptom.

**Root cause #2 — the in-flight guard's error is a dead end:** `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`, ~line 4975, added by `tsdg-s1`) returns `{ error: 'This turn is still processing — please wait a moment and try again.' }` over SSE whenever a request lands while `session._lastAttempt.status === 'in-flight'` and not yet stale (<60s). This fires legitimately whenever the client's own existing single auto-retry (triggered by a dropped SSE connection, line ~4099) lands while the original attempt is still genuinely running — which `sch-s1`'s own DoD Observation already predicted would keep recurring, since that story only reduces disconnect *frequency*, not eliminates it. The client's `evt.error` handler (line ~4075) treats this identically to any other error: it clears the thinking indicator, prints red text, and re-enables the submit button — even though the original attempt is, in most cases, still running and will complete successfully. The operator has no way to distinguish "something is broken" from "it's still working, wait" and the only recovery path today is a manual page refresh, which happens to work only because `_getSessionOrRestore` correctly rebuilds state from whatever has landed by then.

**Fix shape — reuse already-proven mechanisms, do not invent new ones:**
1. Guard the three `thinkingDiv` removals on `!_isContinuation`, so the dots persist as the only-and-sufficient visible indicator through a hidden continuation turn. Terminal cleanup (success or error) is unaffected — both existing unconditional cleanup points (`result.done` stream-end handler, line ~3956; the `evt.error` handler itself) already remove `thinkingDiv` regardless of `_isContinuation`, so no new cleanup path is needed.
2. Tag the in-flight guard's SSE payload with a new `inFlight: true` field (purely additive — old clients ignore an unknown field; this is the "signal contract" decision recorded in `decisions.md`).
3. On the client, when `evt.error` carries `evt.inFlight === true`, do not print the red message or re-enable the submit button. Instead, clear the current thinking/stream bubbles (same cleanup already used for the network-retry path, line ~4093-4094) and schedule another `sendTurn` call 5000ms later, reusing the *same* `attemptId` — exactly the pattern the existing single network-retry already uses (line ~4100), just repeated with a bounded counter instead of firing once. Reusing the same `attemptId` means that once the real in-flight attempt completes, the very next retry will typically land on the **already-existing** `resumed: true` branch (line ~4025, unchanged) and reload immediately — this story does not need to invent a new "turn completed" signal.
4. Cap the quiet-retry loop at 12 attempts (12 × 5000ms = 60000ms), matching the server's own 60s staleness window exactly: once past that point the server would let a fresh attempt through anyway, so there is no reason to keep waiting. On exhaustion, call `window.location.reload()` — automating the exact manual workaround the operator described, rather than inventing a different recovery mechanism.
5. A genuine (non-`inFlight`) `evt.error` is untouched — same red message, same re-enabled submit button, same behaviour as today.

## Dependencies

- **Upstream:** `tsdg-s1` (merged) — introduced the in-flight guard this story makes recoverable. `sch-s1` (merged) — reduces disconnect frequency but, per its own DoD Observation, does not eliminate the underlying trigger this story handles gracefully instead.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a continuation turn (`sendTurn` called with `_isContinuation === true`), When the first `reasoningChunk`, `chunk`, or `draftChunk` event is processed, Then `thinkingDiv` is NOT removed (remains visible) — unchanged from today only for non-continuation turns (`_isContinuation` falsy), where it is still removed as before.

**AC2:** Given `handlePostTurnStreamHtml`'s in-flight guard (the branch that currently writes `{ error: 'This turn is still processing...' }`), When it fires, Then the written SSE payload also includes `inFlight: true`.

**AC3:** Given the client receives an `evt.error` event with `evt.inFlight === true` and fewer than 12 prior quiet-retry attempts for this logical turn, When processed, Then no red error bubble is appended, the submit button is NOT re-enabled, the current thinking/stream bubbles are cleared, and a new `sendTurn` call is scheduled 5000ms later reusing the same `attemptId` with the retry counter incremented.

**AC4:** Given the client has already made 12 quiet retries for `evt.inFlight === true` (i.e. ~60s elapsed) and receives another, When processed, Then `window.location.reload()` is called instead of scheduling a 13th retry or printing the red message.

**AC5:** Given the client receives an `evt.error` event WITHOUT `evt.inFlight` (any other error, e.g. the existing `"Error — please try again."` or session-expired messages), When processed, Then behaviour is byte-for-byte unchanged from today: thinking/stream bubbles cleared, red error bubble appended, submit button re-enabled.

**AC6:** Given the existing test suite touching `handlePostTurnStreamHtml` (`tests/check-srar-s1-idempotent-turn-reconnect.js` and the wider regression set from `tsdg-s1`/`sch-s1`), When this fix lands, Then every existing test continues to pass unmodified.

## Out of Scope

- Any change to the 60s staleness window itself, or to the broadened in-flight guard's own blocking logic (`tsdg-s1`) — this story only makes the *client's* response to that guard graceful, it does not change when the guard fires.
- Any change to the underlying SSE disconnect frequency — that is `sch-s1`'s own explicitly-scoped mitigation; this story assumes disconnects (and the resulting guard trips) will keep happening sometimes and makes that survivable instead of trying to prevent it further.
- Any visible UI difference for a genuine (non-continuation, non-in-flight) error — AC5 explicitly preserves existing behaviour there.
- A progress percentage, elapsed-time counter, or any other richer-than-dots indicator — out of scope; the existing thinking-dots bubble is sufficient once it is not prematurely removed.

## NFRs

- **Performance:** Negligible — an extra `setTimeout`-scheduled fetch every 5s only in the narrow window where the in-flight guard is actively tripping, capped at 60s total.
- **Security:** None identified — no new input surface; `inFlight` is a server-asserted boolean, not client-supplied.
- **Reliability:** The quiet-retry loop MUST be bounded (AC4) — an unbounded retry loop reusing the same attemptId would otherwise poll forever if a session's in-flight state were ever stuck pathologically. The 60s cap matches the server's own staleness window exactly, so after it elapses a reload will see either a completed turn or a fresh attempt starting, never a silent hang.
- **Accessibility:** No regression — the thinking-dots bubble already carries whatever accessibility treatment it has today; this story only changes when it is removed, not its markup.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
