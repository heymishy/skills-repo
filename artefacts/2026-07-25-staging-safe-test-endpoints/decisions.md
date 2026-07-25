# Decisions: Staging-Safe Test Endpoint Gate

## RESOLVED — widen exactly 4 named routes via a reused secret + new header, not a blanket NODE_ENV check (2026-07-25)

**Context:** `Staging smoke test (@mocked)` has structurally never been able to pass against real `wuce-staging` — every `/test/*` support route sits behind one shared `NODE_ENV === 'test'` block, and staging genuinely runs `NODE_ENV=staging`. The same block also seeds a fully authenticated session via a fixed, publicly-known token, so blanket-widening the whole block to include `NODE_ENV === 'staging'` would fix the smoke tests but reopen that auth-bypass exposure on a real, internet-reachable server.
**Decision:** Only the 4 specific `/test/*` routes actually called by `@mocked`-tagged specs (`real-llm-call-count`, `complete-onboarding`, `seed-multi-user-roles`, `stripe-call-count`) get a second, independent admission path: `E2E_STAGING_AUTH_STUB_SECRET` (already provisioned — see below) configured on the server AND a matching, constant-time-compared `x-e2e-test-endpoint-bypass` header on the request. The other 4 `/test/*` routes are untouched.
**Rationale:** This repo already solved this exact class of problem twice (`a1-staging-safe-auth-stub`, `serlb-s1`) with the identical shape of fix — reuse the one staging-only secret, add a new distinctly-named header per mechanism, keep each gate self-contained and independently auditable. Following the same pattern keeps the security reasoning consistent and reviewable against precedent, rather than inventing a new approach for a problem this repo has already solved.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25 ("I think do it properly please" — in response to being shown the security tradeoff of the blanket-widening shortcut).

## RESOLVED — reuse `E2E_STAGING_AUTH_STUB_SECRET`, do not mint a new secret (2026-07-25)

**Context:** A new gate needs a shared secret between the server and the CI job driving Playwright against staging.
**Decision:** Reuse `E2E_STAGING_AUTH_STUB_SECRET` — already a Fly secret on `wuce-staging` and already a GitHub Actions repo secret (set 2026-07-23 for a1-a4's own use).
**Rationale:** Zero new operator action required beyond what's already in place; `tests/check-a1-fly-config-isolation.js`'s existing `fly.toml`-absence guardrail already covers this secret's production-isolation, so no new isolation test is needed either (matches the ADR-018 addendum's own explicit note about this same reuse benefit).
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.

## RESOLVED — relocate the real-LLM-call-counter instrumentation outside the NODE_ENV=test gate entirely (2026-07-25)

**Context:** The counter-wiring code (wraps `https.request`, sets `global.__BRI_S3_2_REAL_LLM_CALL_COUNT__`) sits inside the same `NODE_ENV === 'test'` block as the route that reads it. Widening only the route's own condition would leave the counter itself never wired on staging — the read route would always report 0, making the "zero real LLM calls" assertions trivially and falsely pass without ever actually counting anything.
**Decision:** Move the instrumentation block outside the `NODE_ENV === 'test'` gate so it always runs, in every environment including real production.
**Rationale:** The instrumentation has no side effects on the underlying call (per its own doc comment — always forwards to the original `https.request`), so running it unconditionally is safe; this is also the only way the widened read-route can report a true, non-trivial value on staging.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.

## Process note — repeatedly re-requiring server.js in one test process hangs it (2026-07-25)

**Context:** Initial AC4 tests deleted `require.cache` and re-required `server.js` 2-3 times within the SAME long-lived test process, to exercise it under different `NODE_ENV` values. The test file hung indefinitely (observed across 3 separate attempts, each exceeding a 180s timeout) even though the very same assertions, run once, completed in well under a second.
**Root cause (inferred, not fully isolated):** `server.js` opens real DB/Redis-adapter resources at module scope; re-requiring it repeatedly in one process almost certainly leaks those across each re-require, accumulating open/pending handles that keep the Node event loop alive past when the test logic itself finished.
**Fix:** Moved the NODE_ENV-dependent behavioural check into a single, disposable **child process** (`child_process.spawnSync`) that requires `server.js` exactly once and calls `process.exit(0)` explicitly at the end, sidestepping the issue entirely — this is also a more faithful simulation of "a fresh staging server process starting up" than repeated re-requires in-process.
**Worth remembering:** never delete-and-re-require `server.js` (or likely any file with module-scope DB/Redis adapter wiring) more than once within the same long-lived test process; use a child process instead if a test genuinely needs the module loaded under a different environment.

## Deferred — the adjacent rate-limiting gap in bri-s3.2/s3.3/s3.4/s3.5's own signup calls (2026-07-25)

**Context:** While investigating, found these 4 spec files re-implement their own inline signup/CSRF logic rather than using `tests/e2e/fixtures/staging-auth.js`, and do not send `serlb-s1`'s own rate-limit-bypass header (unlike a1-a4, which do). Running repeatedly against real staging, they are exposed to the same real per-IP signup rate limiter serlb-s1 fixed for a1-a4.
**Decision:** Not fixed as part of this story — genuinely a different, adjacent gap (rate-limiting, not the `/test/*` endpoint gate this story addresses).
**Rationale:** Keeps this story's diff scoped to what it set out to fix; flagged here so it isn't lost.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.
