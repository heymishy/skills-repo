# Story: Extend the quiet-retry budget to network-level turn failures, not just the in-flight guard

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator whose browser loses its connection to a long-running skill turn, including the client's own single automatic reconnect attempt**,
I want **the client to keep quietly retrying for the same bounded budget `tpux-s1` already gives the in-flight-guard case, instead of giving up after exactly one retry**,
So that **a turn that is still completing successfully server-side is not reported to me as a dead-end error I have to manually act on**.

## Benefit Linkage

**Metric moved:** None formally tracked — short-track UX fix, continuing `tpux-s1`'s own scope. Direct benefit: closes a real gap found live on 2026-10-07 (`2026-10-07-feature-playback-demo-with-video-and-or-screens-`) — the operator saw a dead-end "Error — please try again." even though the underlying turn completed successfully server-side (confirmed via Fly logs: `llm_complete` with `stop_reason: end_turn`, followed by a successful `artefact_auto_saved` for the real discovery artefact) and `tpux-s1` was already live in production at the time (confirmed via `GET /version`).
**How:** Fly logs for the affected turn show exactly one `turnId` for the whole exchange — the client's own single automatic reconnect attempt (`srar-s1`) never reached the server at all, so the failure occurred in `sendTurn()`'s network-level `.catch()` handler, not the `evt.inFlight` SSE-message branch `tpux-s1` already fixed. That `.catch()` handler still gives up after exactly one retry (a pre-`tpux-s1`, unchanged behaviour) and shows a static error with no further recovery attempt.

## Architecture Constraints

**Confirmed root cause:** `sendTurn()`'s `.catch(function(err) {...})` block (`src/web-ui/routes/skills.js`, ~line 4121) fires when the `fetch()` call itself fails (cannot reach the server at all), as distinct from the `evt.inFlight` branch (`~line 4095`, added by `tpux-s1`) which fires when a real SSE response comes back carrying the in-flight guard's error. The `.catch()` handler's existing logic:
```
if(!expired && !_isRetry) {
  setTimeout(function(){ sendTurn(answer, _isContinuation, _attId, true); }, 2000);
  return;
}
// falls straight to the dead-end "Error — please try again." message
```
only ever attempts ONE retry (`_isRetry` is a plain boolean, not a counter), regardless of `tpux-s1`'s own 12-retry/60s budget for the sibling case. A sustained-but-still-transient connectivity gap (the same UniFi-gateway-adjacent disconnect pattern investigated under `sch-s1`) that outlasts that single 2-second-delayed retry falls straight through to the dead end, even when — as confirmed in the live incident this story is scoped from — the turn finishes successfully server-side well within what would be a reasonable retry window.

**Deliberately NOT the same "auto-reload on exhaustion" treatment as `tpux-s1`'s `evt.inFlight` branch:** the `evt.inFlight` case is reached only after the FIRST `fetch()` already succeeded in reaching the server (a real SSE response came back, just carrying the busy-guard's error) — so reconnectivity is already proven, and an exhausted quiet-retry loop can safely conclude with `window.location.reload()`. This story's `.catch()` case fires when the client cannot reach the server AT ALL — genuine network connectivity is unconfirmed. Forcing `window.location.reload()` after exhausting retries here could replace today's in-app error message (with its own retry affordance) with a browser-level connection-failure page if the network is still genuinely down. On exhaustion, this story's fix falls back to the existing dead-end message, unchanged — the improvement is entirely in trying harder and longer before reaching that point, not in what happens once every attempt has failed.

**Fix shape — reuse the existing retry-count parameter, keep the proven first-retry timing:** `sendTurn()` already threads an `_inFlightRetryCount` parameter (added by `tpux-s1`) through its recursive calls. This story reuses the same counter and the same 12-attempt cap for the network-catch path, while preserving the original first retry's 2000ms delay exactly as `srar-s1` tuned it (for the Fly auto-suspend wake scenario it was designed around) — only retries AFTER the first one adopt the 5000ms cadence already established by `tpux-s1`.

## Dependencies

- **Upstream:** `tpux-s1` (merged, PR #951) — introduced the `_inFlightRetryCount` parameter and the 12-retry/5000ms budget this story reuses.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `sendTurn()`'s `.catch()` handler receives a non-`session-expired` error with `_isRetry` falsy (the first failure) and the retry count below the cap, When processed, Then a retry is scheduled after 2000ms (unchanged from today), reusing the same `attemptId`, with `_isRetry` set true and the retry count incremented.

**AC2:** Given the handler receives a subsequent non-`session-expired` error with `_isRetry` already true and the retry count still below the cap (12), When processed, Then a retry is scheduled after 5000ms — not 2000ms — reusing the same `attemptId`, with the retry count incremented.

**AC3:** Given the handler receives a non-`session-expired` error and the retry count has reached the cap (12), When processed, Then no further retry is scheduled — the existing dead-end behaviour (red error bubble reading "Error — please try again.", submit button re-enabled) fires exactly as it does today. `window.location.reload()` is NOT called on this path.

**AC4:** Given the handler receives a `session-expired` error, When processed, Then behaviour is completely unchanged from today: no retry is attempted regardless of retry count, the "Session expired — sign in again" message is shown immediately.

**AC5:** Given the existing test suite touching this handler (`check-srar-s1-idempotent-turn-reconnect.js`'s AC6/AC7 source-text checks, and `check-tpux-s1-turn-progress-ux.js`'s structural checks), When this fix lands, Then every existing test continues to pass unmodified.

## Out of Scope

- Any change to the `evt.inFlight` branch itself (`tpux-s1`'s own scope) — this story only extends the sibling network-catch path to use a comparable retry budget, it does not touch the already-shipped behaviour.
- Auto-reloading on exhaustion for this path — explicitly rejected in Architecture Constraints above; the fallback message is unchanged.
- Any change to the underlying disconnect frequency — `sch-s1`'s own explicitly-scoped mitigation; this story assumes disconnects (and the client's resulting retry sequence) will keep happening sometimes.

## NFRs

- **Performance:** Negligible — the same bounded extra-retry cost already accepted for `tpux-s1`'s sibling path, only reached when a connection genuinely cannot be re-established quickly.
- **Security:** None identified — no new input surface.
- **Reliability:** The retry loop MUST remain bounded (AC3) — unbounded retries against a genuinely dead connection would otherwise poll forever. The existing dead-end fallback (unchanged) is the correct, honest behaviour once the budget is exhausted, since this path cannot safely assume reconnection, unlike the `evt.inFlight` case.
- **Accessibility:** No regression — no markup change.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
