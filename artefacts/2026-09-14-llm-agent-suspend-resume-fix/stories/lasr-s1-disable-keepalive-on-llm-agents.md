## Story: Eliminate stale-socket LLM call failures caused by Fly machine suspend/resume during a discovery session

**Epic reference:** None — short-track (bounded backend fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator working through a `/discovery` (or any skill) chat session in the live web app**,
I want **an LLM call that happens to be the first one after the app's Fly machine has been idle-suspended and resumed to succeed on its first attempt, instead of silently hanging for up to 90 seconds and surfacing as a visible error**,
So that **a pause in my own typing/thinking between turns never turns into a broken conversation turn that looks like a model failure**.

## Benefit Linkage

**Metric moved:** None formal — reliability bug fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap the operator found first-hand (2026-09-14) mid-`/discovery` session: multiple apparent "model errors." Root-caused via real production logs (`fly logs --app skills-framework`), correlated against `fly status` showing the app's single machine cycling through `suspend`/`resume` (per `fly.toml`'s `auto_stop_machines = 'suspend'`, `min_machines_running = 0`) roughly every 3-4 minutes of idle time. The exact incident: an SSE stream opened at `00:00:29`; an `uncaughtException: read ETIMEDOUT` fired at `00:00:47` on a `TLSWrap` socket; the browser's own SSE connection disconnected at `00:01:35` ("SSE connection closed before the response completed"); the server's own 90-second watchdog (`skill-turn-executor.js`'s `DEFAULT_TIMEOUT_MS`) fired at `00:01:59` ("Anthropic API stream timed out after 90000ms"), triggering an automatic retry that succeeded in 3 seconds at `00:02:02` — but the operator's browser had already given up 24 seconds earlier and shown a failure, unaware the retry later succeeded server-side.

## Architecture Constraints

- **Root cause: stale pooled keep-alive sockets across a Fly suspend/resume cycle.** `src/modules/skill-turn-executor.js` (lines 26-27) constructs two module-level singleton `https.Agent` instances — `_anthropicAgent` and `_copilotAgent` — both with `keepAlive: true, maxSockets: 4`, explicitly to "reuse TLS connections across turns instead of re-handshaking each time" (existing comment, line 24-25). When the Fly machine (Firecracker VM) suspends, any TCP sockets held open in these agents' pools become invalid; on resume, Node has no way to detect this and will reuse a pooled socket believing it is still live, producing the `read ETIMEDOUT` / 90-second-hang failure mode observed in production.
- **Fix: disable `keepAlive` on both agents (`keepAlive: false`).** This is the safe, deterministic fix under this app's real production concurrency model — the agents are shared, process-wide singletons used across concurrent discovery sessions from potentially different tenants at once (confirmed: no per-request or per-tenant agent instance exists). A fix that tries to selectively invalidate/destroy pooled sockets on detected staleness was considered and rejected: `agent.destroy()` tears down every socket currently in the shared pool, including ones actively in use by a *different*, unrelated concurrent request from another tenant — an unacceptable cross-tenant blast radius in an app that has its own dedicated `bri-s3.4` "Cross-Tenant Isolation Repeat Gate" CI check. Disabling `keepAlive` entirely removes the shared-pool risk altogether: every request gets its own dedicated, freshly-handshaken connection with no cross-request state to go stale.
- **Accepted cost:** each LLM call now pays a fresh TCP+TLS handshake (typically 50-150ms) instead of reusing a warm connection. Given observed `llm_duration_ms` values in production logs ranging from ~1.8s to ~24s per call, this is a roughly 0.5-8% latency increase — a reasonable trade against the current failure mode (up to 90 seconds of hang plus a user-visible error).
- **Do not change `fly.toml`'s `auto_stop_machines`/`min_machines_running` settings.** Moving to `min_machines_running: 1` would eliminate suspend/resume entirely but is a standing-cost, billing-affecting infrastructure decision reserved for the operator to make explicitly — not bundled into this bug fix.
- **Do not change `DEFAULT_TIMEOUT_MS` (90000) or the existing `sse_retry_attempt`/`pre-first-chunk failure` retry mechanism** (`skills.js` line ~5309) — that retry logic already works correctly (it succeeded within 3 seconds once triggered); this story removes the trigger condition rather than tuning the safety net around it.

## Dependencies

- **Upstream:** None — `skill-turn-executor.js` and its two agents already exist.
- **Downstream:** None known. No test in the codebase asserts `keepAlive: true` specifically (confirmed via repo-wide search) — nothing depends on the current keep-alive behaviour being observable from outside this module.

## Acceptance Criteria

**AC1:** Given `_anthropicAgent` is constructed, When inspecting its configuration, Then `keepAlive` is `false` (not `true`).

**AC2:** Given `_copilotAgent` is constructed, When inspecting its configuration, Then `keepAlive` is `false` (not `true`).

**AC3:** Given both agents, When inspecting their configuration, Then `maxSockets: 4` is preserved unchanged — this story only changes `keepAlive`, not the concurrency cap.

**AC4:** Given the module-level comment above the two agent declarations, When read, Then it explains the actual reason for `keepAlive: false` (stale sockets surviving a Fly suspend/resume cycle), not the old "reuse TLS connections" rationale which no longer applies.

**AC5:** Given the existing `_callAnthropic`/`_callAnthropicStream`/`_callCopilot`/`_callCopilotStream` functions, When their `https.request(...)` call sites are inspected, Then all four still pass the (now `keepAlive: false`) agent exactly as before — no call site needs its own change beyond the agent's own construction options.

## Out of Scope

- Changing `fly.toml`'s suspend/resume or `min_machines_running` configuration — a separate, billing-affecting infrastructure decision for the operator.
- Changing the 90-second LLM call timeout or the existing pre-first-chunk retry mechanism.
- Any client-side (browser) change to how long the SSE connection waits before giving up — out of scope for this backend fix; if the operator wants the client to tolerate a longer stall while a server-side retry is in flight, that is a separate story.
- Proactively invalidating/destroying pooled sockets on detected staleness (considered and rejected above due to cross-tenant blast radius).

## NFRs

- **Performance:** each LLM call now performs its own TCP+TLS handshake rather than reusing a pooled connection — a small (~50-150ms), acceptable per-call cost against multi-second call durations, in exchange for eliminating a 90-second failure mode.
- **Security:** no change — `keepAlive: false` does not affect TLS certificate validation, API key handling, or any other security-relevant behaviour of the existing `https.request` calls.
- **Availability:** directly improves availability — eliminates the specific stale-socket failure mode observed in production logs, with no new failure mode introduced (a fresh connection either succeeds or fails cleanly and visibly, same as any first-ever request).

## Complexity Rating

**Rating:** 1 — a two-line configuration change with a well-evidenced root cause (real production logs) and a clear, low-risk fix.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
