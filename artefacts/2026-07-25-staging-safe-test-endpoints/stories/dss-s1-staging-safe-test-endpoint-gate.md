## Story: Make the 4 test-support endpoints the @mocked smoke suite needs staging-safe

**Short-track:** bug fix / security-scoped gap — the `Staging smoke test (@mocked)` job has structurally never been able to pass against real `wuce-staging`, discovered while investigating tonight's smoke-test failure.

## User Story

As **Hamish King (Founder/Operator)**,
I want **the specific `/test/*` support endpoints the `@mocked` smoke suite depends on to work against real deployed staging, without reopening the auth-bypass exposure that same gate exists to prevent**,
So that **`Staging smoke test (@mocked)` (which gates `promote-to-prod`) can actually run and mean something, instead of being structurally guaranteed to fail forever**.

## Background / Investigation

Every `/test/*` route in `server.js` — session seeding, canvas seeding, board-journey seeding, multi-user-role seeding, the real-LLM-call counter, the Stripe-call counter, and the onboarding-completion bypass — sits inside one shared `if (process.env.NODE_ENV === 'test')` block (`server.js:1097`). `wuce-staging` runs with `NODE_ENV=staging` (confirmed via `fly ssh console -a wuce-staging -C "printenv NODE_ENV"`), so this entire block has never executed there. The `Staging smoke test (@mocked)` job (`.github/workflows/staging-deploy.yml`) runs `npx playwright test --grep "@mocked"` with `E2E_BASE_URL: https://wuce-staging.fly.dev` — i.e. the real, deployed app — so every `@mocked` spec calling one of these routes has always failed on real staging, masked until tonight by earlier blockers in the same pipeline (`FLY_API_TOKEN`, the seed step) that failed first.

**Why this isn't a simple gate-widening:** the same `NODE_ENV === 'test'` block also seeds a fully authenticated session using a fixed, publicly-known token (`'e2e-test-access-token'`, per the block's own `SECURITY` comment) and other real-DB-mutating operations. Widening the whole block to also run under `NODE_ENV === 'staging'` would restore the smoke tests but would also expose that auth-bypass mechanism, and several DB-writing seed endpoints, on a real, internet-reachable server.

**Actual scope needed (not all 8 routes):** grepping the 5 `@mocked`-tagged spec files (`tests/e2e/bri-s3.2` through `bri-s3.6`) for `/test/` calls shows only **4** of the 8 routes are ever exercised by specs the smoke-test job runs:
- `GET /test/real-llm-call-count` (bri-s3.2, bri-s3.3, bri-s3.4) — read-only counter
- `POST /test/complete-onboarding` (bri-s3.2, bri-s3.4) — mutates the caller's own already-authenticated session only (`req.session.firstLogin = false`)
- `POST /test/seed-multi-user-roles` (bri-s3.3) — writes `person_identities`/`team_memberships` rows via the real DB pool
- `GET /test/stripe-call-count` (bri-s3.5) — read-only counter (the underlying `_checkoutCallCount` in `stripe-client.js` is already tracked unconditionally, only the read-route is gated)

The other 4 routes (`/test/session`, `/test/seed-definition-session`, `/test/canvas`, `/test/seed-board-journey`) are not called by any `@mocked` spec and stay exactly as they are — untouched, `NODE_ENV=test`-only, narrower blast radius preserved.

**Established precedent to reuse, not reinvent:** this exact repo already solved this exact class of problem twice — `a1-staging-safe-auth-stub` (`src/web-ui/routes/auth-stub.js`, ADR-018 addendum) and `serlb-s1`'s rate-limit bypass (`src/web-ui/routes/auth-email.js`). Both reuse the SAME staging-only secret (`E2E_STAGING_AUTH_STUB_SECRET`, already provisioned as both a Fly secret on `wuce-staging` and a GitHub Actions repo secret) with a double gate: (1) the secret must be configured on the server, (2) the request must carry a matching, constant-time-compared header — each mechanism gets its OWN distinctly-named header, not a shared one, matching `auth-email.js`'s own self-contained-function convention rather than a shared helper module.

**Separate, already-safe instrumentation gap found along the way:** the real-LLM-call counter's `https.request`-wrapping instrumentation (`server.js:1384-1395`, sets `global.__BRI_S3_2_REAL_LLM_CALL_COUNT__`) is ALSO nested inside the same `NODE_ENV === 'test'`-only block — so even once the read-route is gate-widened, the counter itself would never have been wired on staging, meaning it would always read 0 and the "zero real LLM calls" assertions would trivially, falsely pass without ever actually counting anything. The instrumentation itself has no side effects (per its own doc comment: "never affects the call itself, always forwards to the original https.request") and is safe to run unconditionally in every environment.

## Architecture Constraints

- **Reuse `E2E_STAGING_AUTH_STUB_SECRET` — do not mint a new secret.** Already provisioned as both a Fly secret (`wuce-staging`) and a GitHub Actions repo secret; a third mechanism reusing it needs zero new operator action beyond what's already done.
- **A new, distinctly-named header for THIS mechanism** (`x-e2e-test-endpoint-bypass`), matching the established one-secret/many-distinctly-named-headers convention (`x-e2e-stub-secret` for a1, `x-e2e-rate-limit-bypass` for serlb-s1) — never reuse another mechanism's header name, even though the underlying secret is shared.
- **Self-contained gate functions directly in `server.js`**, matching `auth-email.js`'s own precedent (its own local `_stagingBypassSecretConfigured`/`_stagingBypassHeaderMatches` pair, not a shared cross-module helper) — do not introduce a new shared gate module.
- **Widen exactly 4 route conditions, touch nothing else.** The remaining 4 `/test/*` routes and the rest of the `NODE_ENV === 'test'` block (test-session seeding, canvas seeding, board-journey seeding) are out of scope and must remain exactly as gated as they are today.
- **Constant-time comparison** (`crypto.timingSafeEqual`), matching both existing precedents exactly — never a plain `===` string comparison for a secret-bearing header.
- **The counter-wrapping instrumentation moves outside the `NODE_ENV === 'test'` block entirely** (runs in every environment, including real production) — it has zero side effects on the underlying call and this is the only way the widened `/test/real-llm-call-count` route can report a true, non-trivial value on staging.
- **No new config-isolation test needed** (matching the ADR-018 addendum's own note): no new env var name is introduced, so `tests/check-a1-fly-config-isolation.js`'s existing `fly.toml`-absence guardrail already covers it.

## Dependencies

- **Upstream:** a1-staging-safe-auth-stub (reused secret), serlb-s1 (established precedent pattern).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `E2E_STAGING_AUTH_STUB_SECRET` is unset (every environment except `wuce-staging`), When any of the 4 named routes is called without the new header, Then behaviour is completely unchanged from today (`NODE_ENV=test` still works locally exactly as before; every other environment still 404s/falls through exactly as before).

**AC2:** Given `E2E_STAGING_AUTH_STUB_SECRET` is set and the request carries a matching `x-e2e-test-endpoint-bypass` header (constant-time compared), When any of the 4 named routes is called, Then it behaves exactly as it does today under `NODE_ENV=test` (not a different, degraded behaviour for the staging path).

**AC3:** Given `E2E_STAGING_AUTH_STUB_SECRET` is set but the request's header does not match (wrong value, or header absent), When any of the 4 named routes is called, Then it behaves exactly as if the secret were unset (same 404/fallthrough as today) — no partial access.

**AC4:** Given the real-LLM-call-counter instrumentation now runs in every environment, When a real `https.request` call is made to `api.anthropic.com` or a `githubcopilot.com` host, Then the call itself is completely unaffected (forwarded exactly as before) and the counter increments correctly regardless of `NODE_ENV`.

**AC5:** Given the 4 spec files (bri-s3.2, bri-s3.3, bri-s3.4, bri-s3.5) now send the new header when `E2E_STAGING_AUTH_STUB_SECRET` is present in the Playwright process's own environment, When they run locally (secret absent, `NODE_ENV=test`), Then behaviour is unchanged — the header is simply omitted, and the existing `NODE_ENV=test` gate continues to admit the request exactly as before.

**AC6:** Given the `Staging smoke test (@mocked)` job now passes `E2E_STAGING_AUTH_STUB_SECRET` as an env var (matching `e2e.yml`'s existing pattern for Scenario A/B), When the job runs against real staging after this story merges, Then the 4 previously-failing `/test/*` calls succeed and the affected @mocked specs no longer fail on this specific cause.

**AC7:** Given the other 4 `/test/*` routes (`/test/session`, `/test/seed-definition-session`, `/test/canvas`, `/test/seed-board-journey`), When called under any condition, Then behaviour is completely unchanged — still `NODE_ENV=test`-only, no new bypass path added for these.

## Out of Scope

- Widening the other 4 `/test/*` routes not needed by any `@mocked` spec.
- The separate, adjacent rate-limiting gap in these same 4 spec files (they don't currently send `serlb-s1`'s own rate-limit-bypass header either, unlike a1-a4) — a real gap, but unrelated to this story's scope; flag as a follow-up, don't fix here.
- Any change to the `promote-to-prod` job's own gating logic.

## NFRs

- **Security:** The single most important property (matching ADR-018's addendum framing exactly): this mechanism is a complete no-op everywhere `E2E_STAGING_AUTH_STUB_SECRET` is unset, which includes production (`wuce.fly.dev`, `fly.toml`) — no code path there can ever set this variable.
- **Performance:** The relocated counter instrumentation adds one cheap hostname string comparison per outbound `https.request` call, in every environment — negligible.
- **Observability:** The real-LLM-call counter, once actually wired on staging, gives a true (not silently-always-zero) signal for "did this spec run make a real, billed API call."

## Complexity Rating

**Rating:** 2 — mechanically small (widen 4 conditions, add one gate-function pair, relocate one instrumentation block, update 4 spec files + 1 workflow env var), but genuinely security-sensitive and needs care to keep the blast radius to exactly the 4 named routes.
**Scope stability:** Stable.
