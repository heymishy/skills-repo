## Story: Client-side reconnect-on-resume for a dropped SSE turn, with idempotent server-side replay

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator whose web UI session's SSE turn is interrupted by Fly's mid-request machine auto-suspend**,
I want to **have the browser automatically recover the interrupted turn instead of leaving me staring at a dead connection or a generic "Error — please try again"**,
So that **a suspend-triggered mid-turn drop is a brief, self-healing hiccup rather than a session-ending failure I have to notice and manually retry, while auto-suspend itself stays enabled for cost savings.**

## Context

This session's investigation confirmed `fly.toml`'s `auto_stop_machines='suspend'`/`min_machines_running=0` causes the production machine to suspend mid-request during genuine idle periods, and that the existing per-connection SSE keepalive (`skills.js:4700`, 15s comment ping) does not reliably prevent it — evidenced live via `flyctl machine status` cycling started↔suspended while an SSE turn was open. The operator chose to keep auto-suspend (cost tradeoff) and build a suspend-aware mitigation rather than disabling it or accepting silent hangs.

A blind client-side retry is not safe on its own: Fly's suspend is a true pause/resume (Firecracker microVM), not a restart — the original in-flight request can genuinely continue running in the same process after the machine wakes, even though the client's own connection already died and moved on. Without a guard, a retry risks double-deducting turn credits, double-pushing turns into session history, and re-running the artefact-save/git-commit/metrics pipeline a second time.

## Architecture Constraints

- Edit `src/web-ui/routes/skills.js` only: `handlePostTurnStreamHtml` (server) and the embedded client-side `sendTurn` function (browser JS string literal in the same file).
- Client generates one `attemptId` per logical turn (stable across its own auto-retry), sent as `attemptId` in the existing POST body alongside `answer`.
- Server tracks per-session `session._lastAttempt = { attemptId, status: 'in-flight'|'complete', startedAt }`. The guard check happens once, immediately after session lookup and SSE header write, before any of the existing turn-processing logic runs.
- Do **not** attempt to replay the original streamed content (chunks, canvas blocks, assumption cards, reasoning) on a duplicate-attempt short-circuit — that would require faithfully reconstructing complex mid-stream state and risks silently dropping content. Instead, a duplicate request against an already-`complete` attempt receives a minimal `{done:true, resumed:true}` signal; the client reloads the page, which uses the existing, already-tested session-resume/restore path (`s0.4`, `wusl-s2`) to render the full, correct, up-to-date state from what the original (now-completed) attempt already persisted.
- A duplicate request against a still-`in-flight` attempt (within a 60-second staleness window) receives a distinct wait-and-retry error, not a silent second LLM call.
- An `in-flight` status older than 60 seconds is treated as stale (the original attempt almost certainly errored or crashed without reaching a success marker) and the retry proceeds as a genuinely fresh attempt — no permanent lockout.
- Only the two genuine success-completion points in the function are marked `complete`: the `ssp.1` precomputed-Step-1 early return, and the main end-of-function `res.write({done, artefactContent}); res.end();`. Every other exit path (errors, path-traversal rejection, disk-save failure) is left as-is — the 60-second staleness fallback covers those without needing to touch each one individually.
- A request with no `attemptId` in the body (older/incompatible caller) skips the guard entirely and behaves exactly as today — full backward compatibility.
- Client auto-retry is capped at exactly one attempt per logical turn, after a short fixed delay, and never retries a `"session-expired"` failure (retrying an expired auth session cannot help).
- Do not touch `htmlSubmitTurn` (the non-streaming handler) — the live browser UI only ever calls the streaming endpoint; out of scope.
- Do not touch `fly.toml` — auto-suspend stays enabled per the operator's explicit choice.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. Does not overlap `lpmf-s1` or `wsap-s1` (both merged/mergeable independently).

## Acceptance Criteria

**AC1:** Given a turn submitted with a new `attemptId`, When it completes normally, Then behaviour is unchanged from today — the LLM is called once, credits are deducted once, exactly one user/assistant turn pair is appended.

**AC2:** Given a turn already completed under `attemptId` X, When a second request arrives with the same `attemptId` X, Then the server does not re-invoke the LLM, does not re-deduct credits, does not re-save the artefact or re-push a turn, and instead responds with `{done:true, resumed:true}` before ending the stream.

**AC3:** Given a turn currently `in-flight` under `attemptId` X (started less than 60 seconds ago), When a second request arrives with the same `attemptId` X, Then the server responds with a distinct "still processing" error event rather than starting a second concurrent LLM call for that session.

**AC4:** Given an `in-flight` attempt under `attemptId` X older than 60 seconds, When a request arrives with that same `attemptId`, Then it is treated as a fresh attempt (proceeds normally, LLM called, no permanent lockout).

**AC5:** Given a request with no `attemptId` field in the body, When it is processed, Then behaviour is identical to the pre-existing code path — no `_lastAttempt` tracking is engaged, no new error responses are possible.

**AC6:** Given the client's `sendTurn`, When a stream fails (network error, non-`text/event-stream` response) and the failure is not `"session-expired"`, Then it automatically resubmits once, after a short delay, reusing the same `attemptId` — and if that retry also fails, falls back to the existing "Error — please try again" UI with no further automatic retry.

**AC7:** Given the client receives `{done:true, resumed:true}`, When handling that event, Then it reloads the page rather than attempting to render partial/replayed stream content.

**AC8:** Given the existing `tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js` and `tests/check-ssdo-s1-sse-client-disconnect-logging.js` suites, When run unmodified against the changed code, Then both still pass in full — this story adds a guard around the existing logic without altering the pre-first-chunk retry or disconnect-logging mechanisms.

## Out of Scope

- Replaying mid-stream content (chunks, canvas blocks, assumption cards, reasoning) for an already-completed duplicate attempt — the page-reload/resume path handles full state reconstruction instead.
- The non-streaming `htmlSubmitTurn` handler.
- Any change to `fly.toml` or Fly's suspend configuration.
- A true multi-machine/distributed guard (this session's `_lastAttempt` lives in the single in-memory session object, consistent with how every other piece of per-session turn state already works in this codebase).

## NFRs

- **Performance:** Negligible — one extra object comparison per turn request; no new I/O on the hot path.
- **Security:** `attemptId` is client-supplied but only ever compared for equality against a server-stored value scoped to that session — no path, file, or query construction from it.
- **Accessibility:** Not applicable.
- **Audit:** Existing turn/credit logging is unaffected on the normal path; a short-circuited duplicate request logs its own distinct event for traceability.

## Complexity Rating

**Rating:** 2 — the design converged on touching exactly one guard-check insertion point and two success-marking points in one already-well-understood function, after ruling out a much larger full-stream-replay approach as unnecessary (the existing session-resume path already solves state reconstruction).
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session, choosing the "client-side reconnect-on-resume" design over a lower-scope "recoverable-failure UX only" alternative
