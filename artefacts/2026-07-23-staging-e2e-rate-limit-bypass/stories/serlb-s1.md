# Story: Narrow, staging-only rate-limit bypass so Scenario A's real-staging CI gate can pass without weakening staging signup abuse-prevention

**Epic reference:** None — short-track (bounded fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live-verified defect found this session while running the newly-wired "Scenario A E2E (staging)" CI job (PR https://github.com/heymishy/skills-repo/pull/563, story a5-ci-gate-scenario-a-blocking) against real `wuce-staging`.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below, tied honestly to the parent feature's own benefit metric (m1) rather than fabricating a new metric artefact.

## User Story

As **the "Scenario A E2E (staging)" CI job** (and any future non-CI use that legitimately drives multiple E2E signups against real staging in a short window),
I want **a real signup/login attempt tagged with the `e2e-test-` email convention to be exempt from the real 10-attempt/5-minute per-IP signup rate limiter, but only when a staging-only enabling secret is also present on both the server and the request**,
So that **the CI gate wired by PR #563 can genuinely pass on a clean run, without weakening the real abuse-prevention rate limit for any real user or any request that is not both staging-enabled and explicitly `e2e-test-`-tagged**.

## Benefit Linkage

**Metric moved:** `2026-07-23-e2e-core-journey-coverage`'s own benefit metric (m1 — real, staging-verified E2E coverage of the core product journey, replacing untested/unverified confidence with live-verified confidence). Not a new metric artefact (short-track) — without this fix, the just-wired Scenario A CI-blocking gate (PR #563) is structurally unable to pass on a clean run: `tests/e2e/a1-staging-auth-stub.spec.js`, `a2-stripe-test-mode-plan-selection.spec.js`, `a3-product-feature-ideate-canvas.spec.js`, and `a4-ideate-session-resume.spec.js` each call `tests/e2e/fixtures/staging-auth.js`'s `signUpEmail()` at least once, and the shared real per-IP counter (`src/web-ui/routes/auth-email.js`) legitimately exceeds `RATE_MAX=10` within the run's short window, causing a cascade of real HTTP 429 failures unrelated to any application defect.

**How:** confirmed via the real CI run (`gh run view` on job https://github.com/heymishy/skills-repo/actions/runs/29979492616/job/89118171804 — 9 failed, 2 skipped, all 9 failures are `signUpEmail() failed: HTTP 429 {"error":"Too many attempts"}` at `tests/e2e/fixtures/staging-auth.js:127`). This is a structural CI-wiring gap in how PR #563's gate was introduced, not a code regression in a1-a4's own application logic — none of a1-a4's PRs touched the rate limiter.

## Architecture Constraints

- **MUST NOT blanket-disable or globally raise `RATE_MAX` for staging traffic.** The naive fix — mirroring the existing local-harness `E2E_RATE_LIMIT_BYPASS=true` flag (`playwright.config.js`'s `webServer.env`, bri-s3.4) onto the real `wuce-staging` Fly app — would remove signup rate-limiting for ALL traffic to that app, not just tagged E2E traffic. Even though `wuce-staging` is not production, it is still a real, live, publicly reachable app; blanket-disabling its only signup abuse control is a real regression, not an acceptable shortcut.
- **Reuses `a1-staging-safe-auth-stub`'s existing double-gate philosophy** (`src/web-ui/routes/auth-stub.js`'s `E2E_STAGING_AUTH_STUB_SECRET` + header pattern), extended with a third gate specific to this route:
  1. `process.env.E2E_STAGING_AUTH_STUB_SECRET` is configured on this server (the SAME secret a1 already established and already has deployed to `wuce-staging` as a Fly secret — confirmed via `flyctl secrets list --app wuce-staging`, digest `fac147fc86ee577f`, `Deployed`). Never set on the production `wuce.fly.dev` app; this is the same production-isolation guarantee `tests/check-a1-fly-config-isolation.js` already enforces for `fly.toml`, so no new config-isolation test is needed for gate 1 — it inherits a1's existing guardrail for free by reusing the same env var name.
  2. The request carries a matching `x-e2e-rate-limit-bypass` header (constant-time compared via `crypto.timingSafeEqual`, mirroring `auth-stub.js`'s `_secretMatches()`).
  3. **New, route-specific third gate:** the signup/login attempt's own email (after the existing lowercase/trim normalisation) starts with `e2e-test-` — the tag convention `tests/e2e/fixtures/staging-auth.js`'s `uniqueEmail()` already applies to every email it generates. This is the gate a1's own two-gate GitHub-stub scheme does not need (that stub mints its own synthetic identity rather than accepting caller-supplied email input) — it is what prevents "a request that only has the env var set but signs up a non-`e2e-test-` email" from getting any special treatment, which is the critical difference from the naive "just raise `RATE_MAX` globally" approach.
- **Both `handleEmailSignup` and `handleEmailLogin` share the same `_rateLimits` Map and `RATE_MAX` constant** in `auth-email.js` — the bypass is applied identically to both call sites (not just signup), because a2's `loginEmail()` re-authentication step (used after the Stripe Checkout round trip) shares the exact same per-IP counter as every spec's signup calls. Fixing only `handleEmailSignup` would leave `handleEmailLogin` still able to 429 an `e2e-test-` tagged login once the shared counter is already past `RATE_MAX` from prior signups in the same run.
- **All three gates are only evaluated once the normal `RATE_MAX` threshold is already exceeded.** A normal, in-limit request (the overwhelming majority of traffic, staging or production) never reads the request body early and behaves exactly as it did before this story — this is a pure additive carve-out on the already-existing "over limit" branch, not a change to the counting/threshold logic itself.
- **No change to `RATE_MAX`'s value, `RATE_WIN_MS`, the per-IP `_getIP()` key, or the local-harness `E2E_RATE_LIMIT_BYPASS=true` mechanism** — all untouched.
- **MUST NOT touch `routes/auth.js` or `auth/oauth-adapter.js`** (existing file-level constraint already documented at the top of `auth-email.js`, unaffected by this story).

## Dependencies

- **Upstream:** `a1-staging-safe-auth-stub` (merged) — this story reuses its `E2E_STAGING_AUTH_STUB_SECRET` env var and its double-gate design philosophy; no code coupling (this story does not `require()` `auth-stub.js`), just a shared secret name and pattern.
- **Downstream:** PR #563 (`a5-ci-gate-scenario-a-blocking`) — the "Scenario A E2E (staging)" CI job cannot pass a clean run without this fix. `tests/e2e/fixtures/staging-auth.js`'s `signUpEmail()`/`loginEmail()` are updated by this story to send the new header whenever the staging secret is available in the Playwright process's own environment (already the case in CI per `.github/workflows/e2e.yml`'s `scenario-a-staging-e2e` job, which injects `E2E_STAGING_AUTH_STUB_SECRET` from `secrets.E2E_STAGING_AUTH_STUB_SECRET`).

## Acceptance Criteria

**AC1:** Given the per-IP signup/login counter (shared by `handleEmailSignup` and `handleEmailLogin`) already has 10 recorded attempts for an IP within the 5-minute window, When an 11th attempt is made from that same IP with no bypass secret configured on the server at all, Then the response is HTTP 429 "Too many attempts" — identical to today's pre-fix behaviour (regression baseline).

**AC2:** Given the same over-the-limit counter state, When an 11th signup/login attempt is made carrying BOTH (a) a `x-e2e-rate-limit-bypass` header that exactly matches the server's configured `E2E_STAGING_AUTH_STUB_SECRET`, AND (b) an email address that starts with `e2e-test-`, Then the request is allowed through (HTTP 302, not 429) — proving the new triple-gated carve-out genuinely activates. Given the same over-the-limit state and the same matching header, but an email that does NOT start with `e2e-test-`, Then the response is still HTTP 429 — the two outcomes must differ, proving the bypass is scoped to the tagged email, not to the header alone (defense in depth for a real user's signup).

**AC3:** Given `process.env.E2E_STAGING_AUTH_STUB_SECRET` is NOT set on the server (the real, permanent state of the production `wuce.fly.dev` app, since this variable is only ever provisioned as a `wuce-staging` Fly secret), When an over-the-limit request carries the bypass header AND an `e2e-test-`-tagged email, Then the response is still HTTP 429 — the bypass never fires without the staging-only enabling secret, mirroring a1's own AC3-style production-isolation proof.

**AC4:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC5:** Given this fix is deployed to real `wuce-staging` (subject to no concurrent deploy in progress from another agent), When `npx playwright test tests/e2e/a1-staging-auth-stub.spec.js tests/e2e/a2-stripe-test-mode-plan-selection.spec.js tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js` is run together — the exact same command PR #563's "Scenario A E2E (staging)" CI job runs — Then no test in that run fails with HTTP 429 "Too many attempts", reported honestly as observed including if deploy could not be completed this session.

## Out of Scope

- Changing `RATE_MAX`'s value, `RATE_WIN_MS`, or the per-IP key derivation (`_getIP`).
- Any change to the local-harness `E2E_RATE_LIMIT_BYPASS=true` mechanism (`playwright.config.js`) — untouched, still the correct mechanism for the pre-existing 29 local-mocked specs.
- Any change to `routes/auth.js`, `auth/oauth-adapter.js`, or `routes/auth-stub.js` — this story reads `E2E_STAGING_AUTH_STUB_SECRET` directly via `process.env`, with no code coupling to `auth-stub.js`.
- Provisioning a NEW Fly secret — this story deliberately reuses the already-deployed `E2E_STAGING_AUTH_STUB_SECRET` on `wuce-staging`, requiring zero new secret rollout.
- Any other pre-existing, already-documented gap in the a1-a5 chain (credits-upsert gap, a4's NFR-Security staging-freshness question) — both out of scope and unrelated to this fix.

## NFRs

- **Performance:** Negligible — the three new gate checks only execute on the already-rare "over RATE_MAX" branch; a normal in-limit request is entirely unaffected.
- **Security:** No new attack surface for any request that is not already over the rate limit. For over-limit requests, the bypass requires knowledge of a staging-only secret AND a header AND an `e2e-test-`-prefixed email — three independent conditions, none of which are satisfiable from the production app (secret is never provisioned there). `crypto.timingSafeEqual` prevents a timing side-channel on the header comparison, matching `auth-stub.js`'s existing precedent.
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Not applicable — this bypass affects only the in-memory rate-limit counter check; it does not change what gets written to the `users` table, the session, or any audit log.

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed by real CI failure logs, fix shape mirrors an existing, already-shipped precedent (`auth-stub.js`'s double gate) with one additive third condition, and the enabling secret is already deployed to `wuce-staging` (zero new secrets rollout needed).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High — solo-operator default, per CLAUDE.md's estimation model)
