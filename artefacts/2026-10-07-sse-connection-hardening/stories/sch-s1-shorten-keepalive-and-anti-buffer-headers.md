# Story: Harden all 3 SSE endpoints against idle-connection drops — shorter keepalive + anti-buffering header, and a missing keepalive added where none existed

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found mid-session below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator whose SSE connection to a long-running skill turn (or a long-idle presence/merge stream) is vulnerable to being dropped by something upstream of our own server (a home router/gateway, a corporate proxy, or any other intermediary)**,
I want **the server to send real traffic more frequently, and to explicitly tell any buffering-capable intermediary not to hold the stream**,
So that **the connection is less likely to be classified as idle/unacknowledged and reset mid-turn, independent of whatever specific device or proxy is actually doing the resetting**.

## Benefit Linkage

**Metric moved:** None formally tracked — this is a short-track defensive-hardening fix, not a metric-bearing feature. Direct benefit: reduces the frequency of a real, repeatedly-observed production symptom. Investigated live across 6 separate incidents this session (2026-10-06/07): SSE connections on long (60-170s) turns disconnected mid-stream at highly variable times (5.1s, 7.2s, 8.8s, 21.1s, 37.9s, 51.8s after open) — too variable to match any single fixed platform timeout, and occurring on effectively every long-running turn this session. The operator confirmed a UniFi gateway setup at home; Ubiquiti's own community forum documents an active, open bug ("Established TCP connections using 'unacknowledged' timeout") where UniFi hardware can misclassify a long-held, mostly-quiet connection and reset it well before any documented idle-timeout value — a strong, evidence-matched candidate explanation, though not something this codebase can fix directly (it is the operator's own gateway's firmware behaviour).
**How:** Since `tsdg-s1` (merged 2026-10-07) already eliminated the costly consequence of a disconnect-triggered retry (duplicate billing, duplicate credit deduction, artefact corruption), this story addresses the remaining friction — the disconnect itself still happens and still produces a "please wait" experience. Sending real bytes more often, and explicitly disabling any buffering-capable intermediary, reduces the *frequency* of the underlying disconnect regardless of its exact cause (our own server, a reverse proxy, or the operator's own gateway) — a defensive move with no downside, not a guaranteed fix for a cause outside this codebase's control.

## Architecture Constraints

**Root cause status — confirmed partially, not fully, and explicitly out of our control either way:** The connection-drop's own root cause was investigated at length this session (see `artefacts/2026-10-07-turn-stream-duplicate-generation-fix/` and this session's own conversation record). No single fixed timeout in this codebase, Node's own defaults, or Fly's documented proxy behaviour cleanly explains the full 5.1s-51.8s spread observed. The operator's own UniFi gateway is the strongest evidence-matched candidate, but this is the operator's own hardware/firmware, not something `src/web-ui` can fix. This story is explicitly a **mitigation**, not a root-cause fix — framed honestly as "reduces risk," not "resolves the issue."

**Three real SSE endpoints exist in this codebase** (confirmed via `grep -rl "text/event-stream" src/web-ui` during `tsdg-s1`'s own audit, re-confirmed here):
1. `handlePostTurnStreamHtml` (`src/web-ui/routes/skills.js`) — already has a 15s keepalive comment (`res.write(':\n\n')` via `setInterval`, line ~4930). No `X-Accel-Buffering` header.
2. `handleGetJourneyPresenceStream` (`src/web-ui/routes/journey.js`) — already broadcasts real presence data every 5s (`setInterval(broadcast, 5000)`, line ~3833), which incidentally already serves as a keepalive. No `X-Accel-Buffering` header.
3. `handleGetArtefactMergeStream` (`src/web-ui/routes/journey.js`) — **deliberately event-driven, not interval-based** (per its own existing code comment: "unlike handleGetJourneyPresenceStream's own periodic-interval-poll pattern"), meaning it can sit completely silent for however long nobody else edits the same shared artefact — potentially far longer than any turn-stream disconnect window observed this session, with **zero** keepalive mechanism today. No `X-Accel-Buffering` header. This is a real, previously-unconsidered gap, more exposed than the handler this session's investigation started from.

**Scope decision — defensive hardening on all 3, not a deeper redesign:** `X-Accel-Buffering: no` is added to all 3 response header sets regardless of whether Fly's own proxy specifically honours it (it is a widely-recognised convention many intermediaries respect; adding it costs nothing and protects against any buffering layer in the chain, known or unknown). The turn-stream keepalive interval is shortened from 15s to 5s. A new 5s keepalive is added to the merge-broadcast handler, matching the same cadence as the other two for consistency. The presence-stream's existing 5s broadcast is left as-is (it already serves the same purpose at the same cadence) — only its header is added.

**New interval safety (merge-broadcast handler specifically):** Unlike the turn-stream handler's existing keepalive (cleared explicitly at every one of its several `res.end()` call sites, backstopped by its own test file's `process.exit()`), the merge-broadcast handler's test file (`tests/check-ep2-s4-integration.js`) does **not** call `process.exit()` and relies on natural event-loop drain. A new, un-`unref()`'d `setInterval` here would keep that test process alive indefinitely in any test that invokes this handler without explicitly firing its stored close-handler. The new interval is therefore created via `.unref()` — the standard Node.js pattern for an auxiliary timer that must never by itself keep a process (test or production) alive — and is still explicitly `clearInterval`'d in the handler's own existing `res.on('close', ...)` callback (alongside the pre-existing `unsubscribe` call) for the normal production lifecycle.

## Dependencies

- **Upstream:** `tsdg-s1` (merged) — that story removed the costly consequence of a disconnect; this story reduces the disconnect's own frequency. Independent fixes, not a chain.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `handlePostTurnStreamHtml`'s keepalive interval, When the source is inspected, Then it is configured to fire every 5000ms (reduced from the prior 15000ms).

**AC2:** Given a turn-stream SSE response, When `handlePostTurnStreamHtml` writes its response headers, Then the headers include `'X-Accel-Buffering': 'no'` alongside the existing `Content-Type`/`Cache-Control`/`Connection` headers.

**AC3:** Given a presence-stream SSE response, When `handleGetJourneyPresenceStream` writes its response headers, Then the headers include `'X-Accel-Buffering': 'no'` — its existing 5s broadcast interval is unchanged.

**AC4:** Given an artefact-merge-stream SSE response, When `handleGetArtefactMergeStream` writes its response headers, Then the headers include `'X-Accel-Buffering': 'no'`, **and** a new keepalive write (the same `:\n\n` comment convention as the other two endpoints) is now scheduled every 5000ms where none existed before — the interval must be `.unref()`'d and cleared on the handler's existing `res.on('close', ...)` callback.

**AC5:** Given the existing test suites touching all 3 handlers (`tests/check-srar-s1-idempotent-turn-reconnect.js` and the 39 other files from `tsdg-s1`'s own regression sweep for the turn-stream handler; `tests/check-ep2-s1-presence-sidebar.js`; `tests/check-ep2-s4-integration.js`), When this fix is applied, Then every existing test continues to pass unmodified, and no test process hangs due to the new interval.

## Out of Scope

- Any change to `fly.toml`'s `auto_stop_machines`/`http_service` configuration — not confirmed to be the cause, and changing production infrastructure config on a speculative basis is a larger, separate decision.
- Diagnosing or attempting to work around the operator's own UniFi gateway firmware behaviour — outside this codebase's control entirely; the operator's own UniFi IDS/IPS settings are a separate, operator-side investigation if they choose to pursue it.
- Any redesign of the merge-broadcast handler's event-driven architecture — it remains event-driven for real merge pushes; this story only adds a keepalive *alongside* that, not a replacement for it.
- A guarantee that this fix resolves the disconnect — explicitly framed as a mitigation (see Architecture Constraints), not a confirmed fix, since the root cause is not fully within this codebase's control.

## NFRs

- **Performance:** Negligible — a few extra bytes every 5s per open stream instead of every 15s (turn-stream), or every 5s where previously nothing was sent at all (merge-broadcast, only while a subscriber is actually connected). No new I/O pattern, same `res.write(':\n\n')` convention already in production use.
- **Security:** None identified — `X-Accel-Buffering` is a standard, widely-used response header with no new data exposure.
- **Reliability:** The new merge-broadcast interval must never keep a process alive by itself (`.unref()`) and must be cleared on disconnect — covered explicitly by AC4/AC5.
- **Accessibility:** N/A — no UI change.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
