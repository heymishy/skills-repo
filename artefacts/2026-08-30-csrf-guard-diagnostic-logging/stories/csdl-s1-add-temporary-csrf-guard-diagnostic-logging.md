## Story: Add temporary diagnostic logging to CSRF token generation and validation

**Epic reference:** None — short-track (diagnostic instrumentation for a still-unresolved production bug)
**Discovery reference:** None — short-track skips discovery; context stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator investigating a live, unresolved "Forbidden" bug on the in-chat gate-confirm button**,
I want **structured, correlatable log lines around every CSRF token generation and validation on staging**,
So that **I can see, from real server logs, exactly why a real user click still fails CSRF validation after `jgcc-s1`'s field fix shipped, without guessing**.

## Benefit Linkage

**Metric moved:** Direct diagnostic enabler (short-track, no formal benefit-metric artefact). `jgcc-s1` (merged, PR #790, deployed as commit `b4da1eb`) added the missing `_csrf` hidden field to the in-chat gate-confirm form — confirmed present and stable (idempotent token value across repeated fresh page loads) via live DOM inspection on `wuce-staging`. Despite this, a completely fresh discovery session, loaded once and submitted once with zero idle time, still produces `403 Forbidden` on `POST /api/journey/:id/gate-confirm`. This means `csrfGuard`'s stored `expected` token does not match the `submitted` token at validation time, for a reason not yet identified. Leading (unconfirmed) hypothesis: `sessionMiddleware`'s in-memory-first architecture (`src/web-ui/middleware/session.js`) means a machine that cached a session's data *before* a CSRF token was generated on a different machine will keep serving its own stale, token-less local copy indefinitely — it only reads Redis on a local cache **miss**, never to refresh an already-cached entry. `fly.staging.toml` sets `sticky_sessions = true`, which should prevent this, but that could not be confirmed directly: `flyctl` is not authenticated in this environment, so real machine IDs and logs were not directly inspectable, and directly forging a replay POST via injected browser JavaScript using the extracted token was correctly blocked by the browser automation tool's own safety guard (flagged as sending cookie/token-shaped data).

**How:** Add short-lived, non-secret-leaking diagnostic log lines to `src/web-ui/middleware/csrf.js`'s `generateCsrfToken` and `csrfGuard` functions, emitting session-id prefix, machine id (`process.env.FLY_MACHINE_ID`), and an 8-hex-char token prefix (never the full token) for every generate and every guard check. Deploy to staging, reproduce the live failure once more, then read `fly logs` to see whether the machine that generated the token differs from the machine that validated it, and whether `expected` was empty (no token at all on that machine) or merely different (a genuine mismatch).

## Architecture Constraints

- **Chosen approach:** Add `console.info(JSON.stringify({...}))` diagnostic lines — matches this codebase's existing structured-logging convention (e.g. `journey.js`'s `journey_deleted` event log). No new dependency, no new module.
- **Never log the full token** — only `.slice(0, 8)` of each token value, plus a boolean `match`. The session id itself is also truncated to its first 8 hex characters (`sessionIdPrefix`) — sufficient to correlate log lines across a single request pair without persisting a fully replayable identifier in log storage.
- **This logging is explicitly temporary.** It must be removed (or reduced to error-path-only) in a follow-up story once the real root cause is identified from the captured logs — this story's own Out of Scope section states this explicitly so it is not forgotten.
- **Do not change `csrfGuard`'s pass/fail behaviour.** This is observability-only; the 403 response shape and the token-comparison logic itself are unchanged byte-for-byte.
- **Do not attempt to fix the underlying mismatch in this story.** The root cause is not yet confirmed; a fix without log evidence would be exactly the kind of unverified, assumption-based change this session has already twice had to walk back (`cptr-s1`'s original SIGTERM design). This story adds *only* the instrumentation needed to gather that evidence.

## Dependencies

- **Upstream:** `jgcc-s1` (merged) — this story diagnoses why that fix, while itself correct and necessary, did not fully resolve the reported bug.
- **Downstream:** A follow-up fix story, scoped once the log evidence identifies the actual mismatch mechanism. Not yet created — deliberately, per the "verify before designing" precedent already established twice this session.

## Acceptance Criteria

**AC1:** Given `generateCsrfToken(req)` is called, When it runs (whether it generates a new token or reuses an existing one), Then it emits one `console.info` JSON line containing `event: 'csrf_token_generate'`, `sessionIdPrefix` (first 8 hex chars of `req.sessionId`), `machineId` (`process.env.FLY_MACHINE_ID` or `'unknown'`), `tokenPrefix` (first 8 hex chars of the token), and `wasNew` (boolean: true if a token was just minted, false if an existing one was reused).

**AC2:** Given `csrfGuard(req, res)` runs, When it compares `submitted` against `expected`, Then it emits one `console.info` JSON line containing `event: 'csrf_guard_check'`, `sessionIdPrefix`, `machineId`, `submittedPrefix`, `expectedPrefix` (each first 8 hex chars, or `'(empty)'` if the value is falsy), and `match` (boolean).

**AC3 (regression guard):** Given the existing `csrfGuard`/`generateCsrfToken` test suite (`tests/check-cpr-s1-csrf-persist-race.js` and any other file exercising `src/web-ui/middleware/csrf.js`), When re-run after this change, Then all pass unchanged — the added logging does not alter return values, thrown errors, or response bytes for any existing test.

**AC4:** Given the full test suite (`node scripts/run-all-tests.js`), When run after this change, Then it passes with no new failures.

## Out of Scope

- **Fixing the actual root cause.** This story is diagnostic-only. A separate follow-up story (not yet written) will implement the real fix once log evidence identifies the mechanism.
- **Removing this logging.** Tracked as a required follow-up once the investigation concludes — not deferred silently; noted here and in `decisions.md` so it is not forgotten.
- **Authenticating `flyctl` in this environment.** The operator was offered this as an alternative path and explicitly chose diagnostic logging instead; this story does not touch local tooling/credentials.

## NFRs

- **Performance:** Negligible — one extra `JSON.stringify` + `console.info` call per token generate/check, on an already low-frequency path (gate-confirm submissions, not a hot loop).
- **Security:** No full token or full session id is ever logged — only 8-hex-char prefixes, which is not sufficient to reconstruct or replay either value. `FLY_MACHINE_ID` is not sensitive (Fly exposes it to the app's own environment already).
- **Accessibility:** Not applicable.
- **Audit:** This IS a new log event pair, by design — the whole point of the story.

## Complexity Rating

**Rating:** 1 — two small, additive `console.info` calls; no control-flow change.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed — short-track, no epic; oversight is Medium: this touches a security-relevant middleware file in production, even though the change itself is observability-only.
