# Definition of Ready: serlb-s1 — Narrow, staging-only rate-limit bypass

**Story:** artefacts/2026-07-23-staging-e2e-rate-limit-bypass/stories/serlb-s1.md
**Test plan:** artefacts/2026-07-23-staging-e2e-rate-limit-bypass/test-plans/serlb-s1-test-plan.md
**Date:** 2026-07-23
**Human oversight level:** High (solo-operator default, per CLAUDE.md's estimation model — no parent epic to inherit from; short-track story)

---

## Pre-check

- [x] ACs are testable without ambiguity (AC1-AC5, all binary pass/fail)
- [x] Out of scope declared (story's "Out of Scope" section)
- [x] Benefit linkage written (tied to `2026-07-23-e2e-core-journey-coverage`'s m1, honestly not fabricated as a new metric)
- [x] Complexity rated (1 — well understood; see story)
- [x] No dependency on an incomplete upstream story (`a1-staging-safe-auth-stub` is merged)
- [x] NFRs identified (Performance/Security/Accessibility/Audit — see story)
- [x] Tests written and confirmed RED before implementation, then GREEN after (`tests/check-serlb-s1-staging-rate-limit-bypass.js` — 7 tests; T2 and T6 confirmed failing against unmodified `auth-email.js`, all 7 passing after the fix)

## Contract

**In scope:**
- `src/web-ui/routes/auth-email.js`: add the triple-gated bypass to `_checkRateLimit` (now async), applied to both `handleEmailSignup` and `handleEmailLogin` call sites.
- `tests/e2e/fixtures/staging-auth.js`: `signUpEmail()` and `loginEmail()` send the new `x-e2e-rate-limit-bypass` header (carrying `E2E_STAGING_AUTH_STUB_SECRET`) whenever that secret is available in the Playwright process's own environment.
- `tests/check-serlb-s1-staging-rate-limit-bypass.js`: new dedicated test file (7 tests, AC1-AC3 coverage).

**Out of scope (MUST NOT touch):**
- `RATE_MAX`'s value, `RATE_WIN_MS`, `_getIP()` — untouched.
- `playwright.config.js`'s local-harness `E2E_RATE_LIMIT_BYPASS=true` mechanism — untouched.
- `routes/auth.js`, `auth/oauth-adapter.js`, `routes/auth-stub.js` — no code coupling; this story only reads the same env var name via `process.env` independently.
- No new Fly secret provisioned — reuses the already-deployed `E2E_STAGING_AUTH_STUB_SECRET`.

**Cross-check against test plan (B1/D1, CLAUDE.md):** The test plan's required touchpoints are `src/web-ui/routes/auth-email.js` (IT1/UT1-UT7 all assert its behaviour directly) and `tests/e2e/fixtures/staging-auth.js` (E2E1 depends on it sending the header). Neither file appears in the contract's out-of-scope list — no conflict.

## Coding Agent Instructions

1. Implement the triple gate in `_checkRateLimit` exactly as scoped above — do not widen it to a blanket flag.
2. Run `node tests/check-serlb-s1-staging-rate-limit-bypass.js` and confirm 7/7 pass.
3. Run `node tests/check-lab-s2.2-email-password.js` and `node tests/check-sec-perf-s3-auth-email-csrf.js` to confirm no regression in the pre-existing rate-limit/CSRF suites.
4. Run full `npm test`; compare failure set against `tests/known-baseline-failures.json` — zero new regressions required (AC4).
5. If `flyctl` is available and authenticated, check `flyctl releases --app wuce-staging` for concurrent activity, then deploy and re-run the exact four-spec Playwright command PR #563's CI job runs (AC5) — report the real outcome, including if deploy could not complete.
6. Commit, push to `fix-forward-staging-e2e-rate-limit-bypass`, open a **draft PR** (never mark ready for review).
7. Update `.github/pipeline-state.json` with a new flat `feature.stories[]` entry for `serlb-s1`.
8. Once deployed and verified, re-run PR #563's own "Scenario A E2E (staging)" CI check to confirm it now passes for real.

## Sign-off

**Proceed:** Yes
**Rationale:** Tests written and RED/GREEN cycle already completed (TDD discipline satisfied before this DoR is even written, per the story's own short-track path). Fix is additive, narrowly scoped, reuses an already-deployed secret, and has a clear, testable production-isolation guarantee inherited from `a1-staging-safe-auth-stub`'s existing config-isolation check.
