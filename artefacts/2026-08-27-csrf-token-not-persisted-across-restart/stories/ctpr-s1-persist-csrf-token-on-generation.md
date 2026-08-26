## Story: Persist a newly-generated CSRF token to Redis immediately, not never

**Epic reference:** None — short-track (bug fix, live gap found via direct operator usage on production)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator working through a long-running conversation on the deployed web UI**,
I want **a page's "Continue to next stage" / gate-confirm submission to keep working even if the app process restarts in the background while I'm mid-conversation**,
So that **I never get bounced to a dead-end "Forbidden" page for a reason completely invisible to me, losing trust in a control that otherwise looks identical to every other successful click**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-27) that `POST /api/journey/:id/gate-confirm` returned 403 "Forbidden" while moving from discovery to benefit-metric, after time spent on the page running `/clarify` and `/estimate` side-trips.

**How:** Direct source inspection confirms a deterministic root cause, not a rare race. `middleware/csrf.js`'s `generateCsrfToken(req)` mints a token into `req.session.csrfToken` on first use and never again (by design — CSRF tokens are meant to be stable for a session's lifetime). But nothing calls `middleware/session.js`'s `persistSession(id)` (the function that syncs a session to Redis) at the point the token is minted. Across the whole codebase, `persistSession` is called from only 4 files, and only in login-adjacent flows (`auth.js`'s OAuth token-exchange callback, `auth-stub.js`, `agency-provisioning.js`, and one resume-redirect case in `journey.js`) — none of which run *after* a CSRF token has actually been generated for a given page, since `generateCsrfToken` is called lazily, per-route, the first time a form needs one (30 call sites across the codebase, none of which call `persistSession` themselves).

Production's `fly.toml` sets `min_machines_running = 0` with `auto_stop_machines = 'suspend'` — confirmed via `fly logs` that the `skills-framework` app machine genuinely restarted twice within the observed session window. `middleware/session.js`'s own `sessionMiddleware` already has a documented recovery path for exactly this case (`srf-s1`: on an in-memory cache miss after a restart, read the session back from Redis) — but since the CSRF token was never written to Redis in the first place, the rehydrated session's `csrfToken` field is simply absent. The already-open browser tab still has the *old* token embedded in its rendered gate-confirm form (from before the restart); submitting it against a session whose `csrfToken` is now `undefined` fails `csrfGuard`'s `submitted !== expected` check every time — a guaranteed, deterministic failure on any restart mid-session, not a timing-dependent one.

## Architecture Constraints

- **Fix at the single source, not at the 30 call sites.** `generateCsrfToken` is the one place a new token is minted; add the `persistSession` call there, inside the `if (!req.session.csrfToken)` branch (i.e., only when a *new* token is actually generated — never on the idempotent reuse path, to avoid a wasted Redis write on every single form render).
- **No new dependency, no circular-require risk.** `middleware/csrf.js` does not currently require `middleware/session.js` (checked directly); requiring it there to call `persistSession` introduces no cycle, since `session.js` does not require `csrf.js`.
- **Best-effort by existing design — do not add new error handling.** `persistSession` already no-ops safely when no Redis adapter is configured (the default in local/CLI/test environments) and already catches its own write errors internally (`.catch(...)` inside `persistSession`). No new try/catch is needed at the call site in `generateCsrfToken`.
- **`req.sessionId` is always set alongside `req.session` by `sessionMiddleware`** — no new plumbing needed to make it available inside `generateCsrfToken`, since every caller already has `req` in scope and `sessionMiddleware` always sets both fields together before any route handler runs.
- **Do not touch `csrfGuard`, `csrfField`, or the 403 "Forbidden" response shape.** This story fixes the token's durability at generation time, not the guard's validation or error-response logic (which intentionally matches `auth.js`'s existing `oauthState` mismatch response shape, per `csrf.js`'s own docblock — changing that shape is a separate, larger decision this story does not make).

## Dependencies

- **Upstream:** None.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a session with no `csrfToken` yet, When `generateCsrfToken(req)` is called for the first time, Then a token is minted into `req.session.csrfToken` (unchanged existing behaviour) AND `persistSession(req.sessionId)` is called so the token is durably written wherever a Redis adapter is configured.

**AC2:** Given a session that already has a `csrfToken` (the common, idempotent-reuse case), When `generateCsrfToken(req)` is called again, Then the existing token is returned unchanged AND `persistSession` is NOT called again — no wasted Redis write on every page render.

**AC3:** Given no Redis adapter is configured (the default for local/CLI/test usage), When `generateCsrfToken(req)` mints a new token, Then the call completes exactly as before this fix — `persistSession`'s own existing no-op-without-adapter behaviour means no new failure mode is introduced.

**AC4:** Given a session is later rehydrated from Redis after a simulated process restart (in-memory cache miss, `sessionMiddleware`'s existing `srf-s1` recovery path), When the rehydrated session's `csrfToken` is inspected, Then it matches the token that was originally minted and embedded in the page before the simulated restart — proving the end-to-end fix, not just that `persistSession` was called.

**AC5 (regression guard):** Given the existing CSRF unit test suite (`tests/check-sec-perf-s3-csrf-middleware.js` and all 4 `rcfc-s1`/`sec-perf-s3` CSRF-focused test files), When re-run after this fix, Then all pass unchanged — this fix adds a side effect (a Redis write attempt) to an existing function, it does not change any return value, validation logic, or response shape those tests assert on.

## Out of Scope

- **A friendlier client-side recovery experience for a genuine CSRF mismatch** (e.g., detecting a 403 on gate-confirm and offering an inline "your session refreshed, click to retry" rather than a raw "Forbidden" page). This story closes the *common, deterministic* cause of that mismatch; a residual, much rarer mismatch could still theoretically occur (e.g., two tabs, a genuinely expired/evicted Redis entry) and would still hit today's existing 403 page — improving that page's own UX is a separate, smaller follow-up if it's ever judged worth doing.
- **Increasing `min_machines_running` above 0** or otherwise changing Fly.io's auto-suspend configuration to reduce how often restarts happen at all. That's an infrastructure/cost trade-off decision for the operator, not a code-correctness fix — this story makes a restart, whenever it happens, no longer break an in-flight session's CSRF-protected forms.
- **Any other Redis-persistence gap for other session fields.** This story is scoped specifically to `csrfToken`, the field directly implicated in the reported bug. A broader audit of what else might be silently dropped across a restart is a separate investigation.

## NFRs

- **Performance:** Negligible — one additional Redis write, only on the already-rare "first time this session needs a CSRF token" path, never on the common idempotent-reuse path (AC2 explicitly guards this).
- **Security:** No new surface — `persistSession`'s existing `_sanitiseForRedis` already strips `accessToken` before writing; `csrfToken` is not a secret requiring the same protection (it only needs to not be forgeable/guessable by a third party, which the existing `crypto.randomBytes(32)` generation already ensures) and was already an intended candidate for Redis persistence per the module's own design (only `accessToken` is deliberately excluded).
- **Accessibility:** Not applicable.
- **Audit:** No existing audit-log call is affected.

## Complexity Rating

**Rating:** 1 — a single-line addition inside one function, in the one place a new token is minted; the surrounding no-op-safe design of `persistSession` means no new error handling is needed.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
