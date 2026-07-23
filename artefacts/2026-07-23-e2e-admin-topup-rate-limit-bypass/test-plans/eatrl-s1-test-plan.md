# Test Plan: eatrl-s1 — Wire rate-limit bypass header into admin-credits-topup.js

## Scope

Modified fixture file: `tests/e2e/fixtures/admin-credits-topup.js` (no new standalone Node unit-test file — this is a real-staging Playwright fixture; verification is via the real specs that consume it, run in the same multi-file, single-worker shape as the real CI jobs).

## Preconditions

- Real `wuce-staging` deployment with `MOCK_LLM_GATEWAY=true` active and the `catc-s1`/`bssm-s1` fixes already deployed (both merged and confirmed live).
- `E2E_STAGING_AUTH_STUB_SECRET` available in the environment (set in CI; may need to be exported locally for a full reproducing run — if unavailable locally, rely on the real CI job's own run for AC2/AC4 verification instead of a local repro).

## Test Cases

| ID | AC | Scenario | Expected | Type |
|----|----|----------|----------|------|
| T1 | AC1 | Code inspection / diff review of `_adminLogin()` and `_adminSignupOnce()` | Both functions set `headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET` when `hasStubSecret()` is true, matching `signUpEmail()`'s existing pattern exactly | Static/code review |
| T2 | AC2 | Real-staging run: `npx playwright test tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js --workers=1` (mirrors the real CI jobs' multi-file, single-worker invocation shape) | None of a3 AC3, a4 AC2&AC3, b1 AC1-3 skip due to rate-limit-caused credits-topup failure | Behavioural (real staging) |
| T3 | AC3 | Full `npm test` | No new regressions vs `tests/known-baseline-failures.json` | Full suite |
| T4 | AC4 | Real CI run (`scenario-a-staging-e2e` and `scenario-b-staging-e2e` jobs) on the fix's own PR | Both jobs report real, honest pass/skip/fail counts; reported in `decisions.md` | E2E (real CI) |

## Verification Discipline

Root cause was reproduced this session via direct comparison, not assumed: the same `a3-product-feature-ideate-canvas.spec.js` AC3 test skipped in a real full-suite CI run (PR #572, run 30041728074, job 89322999081 — pattern `···°°°··°°·` showing position 9 as skip) but passed cleanly (`1 passed`) when re-run standalone against the identical live `wuce-staging` moments later. Combined with direct code inspection of `auth-email.js`'s `_checkRateLimit()` (confirming the exact three gates) and `admin-credits-topup.js` (confirming the header is absent from both `_adminLogin()` and `_adminSignupOnce()`), this is the root cause, not a hypothesis.

Post-fix, re-run the SAME multi-file, single-worker local reproduction (T2) as the most direct confirmation, since this defect is specifically about request volume/contention across multiple spec files sharing one identity within a rate-limit window — a single-file run cannot exercise it.

## Data/Fixture Notes

No new fixtures. Uses the existing, already-provisioned `e2e-test-admin@example.test` identity and the existing `E2E_STAGING_AUTH_STUB_SECRET`/`x-e2e-rate-limit-bypass` mechanism — no new secrets or configuration required.

## Out of Scope for This Test Plan

- Any change to `auth-email.js`'s rate-limiter logic (see story's Out of Scope).
- Any other, separately-caused test skip not related to this specific rate-limit contention pattern.
