# Story: Wire the existing staging rate-limit bypass header into admin-credits-topup.js's login/signup calls

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is a live-verified intermittent CI defect found while auditing Scenario A/B's real-staging E2E pass rate after the `bssm-s1` fix (PR #572) merged.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **an operator relying on Scenario A's and Scenario B's CI-blocking gates to give real, consistent signal about the ideate-canvas and outer-loop journeys**,
I want **`tests/e2e/fixtures/admin-credits-topup.js`'s admin login/signup HTTP calls to carry the same staging rate-limit bypass header that every other staging E2E signup call already sends**,
So that **a3's AC3, a4's AC2&AC3, and b1's AC1-AC3 do not intermittently and non-deterministically skip when the full Scenario A or Scenario B spec suite runs back-to-back in one CI job, purely because the shared `e2e-test-admin` identity's login attempts count against the real per-IP rate limiter**.

## Benefit Linkage

**Metric moved:** Restores consistent, reliable CI signal for the AC1-3 tests already fixed and verified working by `catc-s1` (PR #568, credits tenant-check fix) and `bssm-s1` (PR #572, stage-sequence fix) — both of those tests currently pass when run standalone, but were observed skipping in the real, full-suite CI run on PR #572 due to this separate, previously-undiagnosed cause.

**How:** `src/web-ui/routes/auth-email.js`'s `_checkRateLimit()` already implements a narrow, triple-gated staging-only bypass (env secret configured + matching `x-e2e-rate-limit-bypass` header + `e2e-test-`-prefixed email) specifically so repeated E2E signups don't trip the real 10-attempts/5-minute per-IP limiter — `tests/e2e/fixtures/staging-auth.js`'s `signUpEmail()` already sends this header correctly. But `tests/e2e/fixtures/admin-credits-topup.js`'s `_adminLogin()`/`_adminSignupOnce()` — which authenticate as the SAME fixed `e2e-test-admin@example.test` identity on every single one of a3/a4/b1's credit-topup calls, run back-to-back in the same CI job — never send this header at all. The identity's email does start with the required `e2e-test-` prefix (gate 3 would pass), but gates 1+2 are never attempted because the header is simply missing from these two specific request calls. This causes intermittent, non-deterministic `test.skip()`s whenever the accumulated real (non-bypassed) attempt count against the CI runner's IP crosses the real 10/5-min threshold within a single job run — confirmed by a direct comparison this session: `a3`'s AC3 and `a4`'s AC2&AC3 skipped in a real full-suite CI run (PR #572, run 30041728074) but passed immediately when re-run standalone moments later against the same live staging environment.

## Architecture Constraints

- **Fixture-file-only fix, in `tests/e2e/fixtures/admin-credits-topup.js`.** No change to `auth-email.js`'s rate-limiter or bypass-gating logic — the mechanism is already correct and sufficiently narrow (see `serlb-s1`'s own decisions.md); this is purely a case of an existing, correct mechanism not being wired into every caller that needs it.
- **Reuse the exact same pattern already used by `staging-auth.js`'s `signUpEmail()`/`loginEmail()`**: `hasStubSecret()` check, then set `headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET` on the request. Do not invent a new mechanism or a new header name.
- **`ADMIN_EMAIL` already satisfies gate 3** (`e2e-test-admin@example.test` starts with `e2e-test-`) — no change needed to the admin identity's email itself.
- **Do not weaken or bypass the rate limiter for any non-`e2e-test-`-tagged traffic** — this fix only adds the already-existing, already-narrow bypass header to two specific internal request calls; it does not touch the server-side gating logic at all.

## Dependencies

- **Upstream:** `serlb-s1` (already merged) — established the rate-limit-bypass mechanism this story wires into a previously-missed caller.
- **Downstream:** None known. Restores full, reliable signal to `catc-s1`'s and `bssm-s1`'s already-shipped fixes; does not block any other in-flight story.

## Acceptance Criteria

**AC1:** Given `tests/e2e/fixtures/admin-credits-topup.js`'s `_adminLogin()` and `_adminSignupOnce()` functions, When `hasStubSecret()` (imported from `staging-auth.js`) returns true, Then both functions include the `x-e2e-rate-limit-bypass` header (matching the configured `E2E_STAGING_AUTH_STUB_SECRET`) on their respective `POST /auth/email/login` and `POST /auth/email/signup` requests — exactly mirroring `signUpEmail()`'s existing pattern.

**AC2:** Given a full, real-staging run of `a3-product-feature-ideate-canvas.spec.js`, `a4-ideate-session-resume.spec.js`, and `b1-formed-idea-outer-loop-story-map.spec.js` run back-to-back in a single CI-equivalent invocation (`--workers=1`, all files in one command, mirroring the real `scenario-a-staging-e2e`/`scenario-b-staging-e2e` jobs), When this fix is applied, Then none of a3's AC3, a4's AC2&AC3, or b1's AC1-3 skip due to a rate-limit-caused credits-topup failure — each either passes or, if it skips, skips for a genuinely different, honestly-reported reason (not rate-limit contention).

**AC3:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC4:** Given this fix, When re-run against real `wuce-staging` in the real CI workflow (`.github/workflows/e2e.yml`'s `scenario-a-staging-e2e` and `scenario-b-staging-e2e` jobs, via a real PR), Then both jobs report the real, observed pass/skip/fail counts — including honest reporting if some other, previously-undiscovered cause still produces an occasional skip.

## Out of Scope

- Any change to `auth-email.js`'s rate-limiter thresholds, window, or bypass-gating logic.
- Any change to the credits-topup logic itself (`admin-credits-topup.js`'s actual top-up call, `catc-s1`'s tenant-check fix) — already correct and separately verified.
- Investigating or fixing any other, unrelated cause of test skips not related to this specific rate-limit gap.

## NFRs

- **Performance:** Neutral — adds one header to two existing HTTP requests; no new round-trips.
- **Security:** None — reuses an existing, already-reviewed, narrowly-scoped staging-only bypass mechanism (triple-gated: env secret + header + `e2e-test-` email prefix); does not touch or weaken it. The admin identity's email already independently satisfies gate 3.
- **Cost:** Neutral — no change to the number of real/mocked model turns or API calls.
- **Accessibility:** Not applicable (test-fixture-only change).
- **Audit:** Not applicable — no change to any audited production code path (`auth-email.js` is untouched).

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed via direct code inspection (`_checkRateLimit()`'s exact three gates) and a reproducing observation (standalone pass vs full-suite skip on the identical live environment, same session).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic
