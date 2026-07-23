# Decisions: staging-e2e-rate-limit-bypass (serlb-s1)

## DECISION — serlb-s1 triple-gate rate-limit bypass design

**Date:** 2026-07-23

**Context:** PR https://github.com/heymishy/skills-repo/pull/563 (story a5-ci-gate-scenario-a-blocking) wired a real, CI-blocking "Scenario A E2E (staging)" job that runs a1-a4's specs against real `wuce-staging`. Every spec calls `tests/e2e/fixtures/staging-auth.js`'s `signUpEmail()` at least once, and the real per-IP signup rate limiter in `src/web-ui/routes/auth-email.js` (`RATE_MAX=10` per 5 minutes) genuinely trips within the run's short window — confirmed via the real failed job (https://github.com/heymishy/skills-repo/actions/runs/29979492616/job/89118171804: 9 failed, all `HTTP 429 "Too many attempts"` at `fixtures/staging-auth.js:127`). This is a structural CI-wiring gap (PR #563 signs up multiple tenants per run without accounting for the real rate limit), not an application defect in a1-a4's own code.

**Decision:** Add a narrow, triple-gated bypass to `_checkRateLimit`, evaluated only once the normal 10-attempt threshold is already exceeded:
1. `process.env.E2E_STAGING_AUTH_STUB_SECRET` is configured on the server — reusing the SAME secret `a1-staging-safe-auth-stub` already established and already has deployed to `wuce-staging` as a Fly secret (confirmed via `flyctl secrets list --app wuce-staging`: digest `fac147fc86ee577f`, status `Deployed`).
2. The request carries a matching `x-e2e-rate-limit-bypass` header, constant-time compared via `crypto.timingSafeEqual`.
3. The specific signup/login attempt's own email starts with `e2e-test-` (the tag convention `staging-auth.js`'s `uniqueEmail()` already applies to every email it generates).

Applied identically to both `handleEmailSignup` and `handleEmailLogin`, since both share the same `_rateLimits` Map/`RATE_MAX` constant.

**Rationale — why reuse `E2E_STAGING_AUTH_STUB_SECRET` rather than mint a new secret:**
- Zero new Fly secret rollout needed — the secret is already deployed on `wuce-staging` and already injected into the "Scenario A E2E (staging)" CI job's environment (`.github/workflows/e2e.yml`'s `scenario-a-staging-e2e` job already sets `E2E_STAGING_AUTH_STUB_SECRET: ${{ secrets.E2E_STAGING_AUTH_STUB_SECRET }}` for the Playwright process — confirmed by reading the PR #563 branch's workflow file directly), meaning this fix can be deployed and verified against real staging in the same session with no operator action required.
- Production isolation is inherited for free: `tests/check-a1-fly-config-isolation.js` already asserts `E2E_STAGING_AUTH_STUB_SECRET` is absent from `fly.toml` (production). Because this story introduces no new env var name, that existing guardrail already covers this bypass's production-isolation property — no new config-isolation test file is required (though a unit-level equivalent, UT4 in the test plan, still directly proves the code-level behaviour: with the secret unset, the bypass never fires regardless of header/email).
- One secret to manage for "this is a legitimate staging-only E2E mechanism" rather than secret sprawl across every future staging-only carve-out.

**Rationale — why a THIRD gate (email prefix) beyond a1's two-gate scheme:**
- `auth-stub.js`'s GitHub-stub mechanism mints its own synthetic identity from scratch (`login = 'e2e-test-gh-' + ...`) — there is no caller-supplied identity to validate, so two gates (secret + header) are sufficient.
- `auth-email.js`'s signup/login handlers accept an arbitrary, caller-supplied email in the request body. If only two gates were used here (mirroring a1 exactly), ANY signup carrying the header+secret would bypass the rate limit regardless of the email being signed up — including a real user's email, if an attacker ever obtained the header value. The third gate (`e2e-test-` prefix match) is what keeps the bypass scoped to E2E test traffic specifically, not to "anyone who knows the secret." This directly satisfies the task constraint: "A request that only has the env var set but signs up a non-`e2e-test-` email must still be rate-limited normally."

**Rationale — why NOT the naive fix (raising `RATE_MAX` globally via a staging flag):**
- Mirroring the existing local-harness `E2E_RATE_LIMIT_BYPASS=true` (`playwright.config.js`, bri-s3.4) onto real `wuce-staging` would disable signup rate-limiting for ALL traffic to that app, not just E2E traffic. `wuce-staging` is a real, live, publicly reachable Fly app — removing its only signup abuse control, even non-production, is a real regression, not an acceptable shortcut. The triple gate achieves the same CI-unblocking outcome while leaving every other request's rate-limiting fully intact.

**Rationale — why both `handleEmailSignup` AND `handleEmailLogin` needed the fix, not just signup:**
- Both handlers call the same `_checkRateLimit` against the same `_rateLimits` Map. a2's `loginEmail()` (used after the Stripe Checkout redirect) shares the exact same per-IP counter as every spec's `signUpEmail()` calls in the same CI run. A signup-only fix would still let the shared counter exceed `RATE_MAX` from prior signups and then legitimately 429 an `e2e-test-`-tagged login later in the same run — an incomplete fix that would still intermittently fail depending on call ordering within a run.

**Alternative considered and rejected:** A brand-new, distinctly-named env var + header pair (e.g. `E2E_STAGING_RATE_LIMIT_BYPASS_SECRET`). Rejected because it requires a new Fly secret rollout before this fix can be verified against real staging, with no corresponding benefit — the reused secret is already staging-only-scoped and already has a production-isolation guardrail; a second secret purely to keep concerns nominally separate did not justify the added deployment step and secret-management surface.

---

## FOLLOW-UP (post-merge, not applied on this branch)

After merge, on master, per cdg.6/B2 (epic-nested vs flat stories — this is a flat `feature.stories[]` entry, so this note is precautionary, not strictly required):
```
node bin/skills advance 2026-07-23-staging-e2e-rate-limit-bypass serlb-s1 dorStatus=complete prStatus=<merged-or-open>
```
