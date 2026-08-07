# Definition of Ready: eatrl-s1 — Wire rate-limit bypass header into admin-credits-topup.js

## Summary

Short-track bug fix (`/test-plan → /definition-of-ready → coding agent`). Story: `artefacts/2026-07-23-e2e-admin-topup-rate-limit-bypass/stories/eatrl-s1.md`. Test plan: `artefacts/2026-07-23-e2e-admin-topup-rate-limit-bypass/test-plans/eatrl-s1-test-plan.md`.

## Root Cause (independently confirmed via code inspection + reproducing comparison)

`src/web-ui/routes/auth-email.js`'s `_checkRateLimit()` implements a narrow, triple-gated staging-only bypass for the real 10-attempts/5-minute per-IP signup/login limiter:

```js
const BYPASS_SECRET_ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';
const BYPASS_HEADER_NAME    = 'x-e2e-rate-limit-bypass';
const E2E_TEST_EMAIL_PREFIX = 'e2e-test-';
```

Gate 1: `E2E_STAGING_AUTH_STUB_SECRET` configured on the server. Gate 2: request carries a matching `x-e2e-rate-limit-bypass` header. Gate 3: the specific email being signed up/logged in is `e2e-test-`-prefixed. All three must hold.

`tests/e2e/fixtures/staging-auth.js`'s `signUpEmail()` already sends the header correctly:
```js
if (hasStubSecret()) headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET;
```

`tests/e2e/fixtures/admin-credits-topup.js`'s `_adminLogin()` and `_adminSignupOnce()` — used by `a3`, `a4`, and `b1` to top up the SAME fixed `e2e-test-admin@example.test` identity's credits before every real turn-driving test — never send this header on either their `POST /auth/email/login` or `POST /auth/email/signup` calls. The identity's email already satisfies gate 3 (`e2e-test-admin@example.test` starts with `e2e-test-`), but gates 1+2 are never attempted because the header is simply absent from these two specific calls.

**Live-verified evidence (this session):** In PR #572's real CI run (run 30041728074, job 89322999081, `scenario-a-staging-e2e`), the compact Playwright reporter's dot-pattern (`···°°°··°°·`, 11 tests total across a1/a2/a3/a4 run back-to-back with `--workers=1`) showed a3's AC3 (position 9) and a4's combined AC2&AC3 (position 10) both skipped. Moments later, re-running `a3-product-feature-ideate-canvas.spec.js -g "AC3"` standalone against the identical live `wuce-staging` passed immediately (`1 passed`). The only material difference between the two runs is that the full-suite run accumulates many more admin-identity login attempts (from a1, a3, a4, and separately b1) within the same rate-limit window, none of which carry the bypass header — consistent with the real per-IP limiter tripping on the admin identity's un-bypassed login volume, not a real product or test-logic defect.

## The Fix

**Confirmed by direct inspection:** `staging-auth.js`'s `module.exports` (line 199) currently exports only `{ STAGING_BASE_URL, hasStubSecret, uniqueEmail, stubGithubLogin, stubAuditLookup, signUpEmail, loginEmail }` — `RATE_LIMIT_BYPASS_HEADER` (line 107, value `'x-e2e-rate-limit-bypass'`) and `STUB_SECRET` (line 33, `process.env.E2E_STAGING_AUTH_STUB_SECRET || ''`) are both currently module-private, NOT exported.

**Preferred approach:** add both to `staging-auth.js`'s `module.exports` (they are already correctly defined constants — this is a one-line export addition, not a new mechanism), then import and use them in `admin-credits-topup.js`:

```js
// staging-auth.js — add to existing module.exports:
module.exports = {
  STAGING_BASE_URL,
  hasStubSecret,
  uniqueEmail,
  stubGithubLogin,
  stubAuditLookup,
  signUpEmail,
  loginEmail,
  RATE_LIMIT_BYPASS_HEADER,  // new
  STUB_SECRET                // new
};
```

```js
// admin-credits-topup.js
const { STAGING_BASE_URL, hasStubSecret, RATE_LIMIT_BYPASS_HEADER, STUB_SECRET } = require('./staging-auth');

async function _adminLogin(ctx) {
  const csrfToken = await _getLandingCsrf(ctx);
  if (!csrfToken) return false;
  const headers = {};
  if (hasStubSecret()) headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET;
  const res = await ctx.post('/auth/email/login', {
    form: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, _csrf: csrfToken },
    headers: headers,
    maxRedirects: 0
  });
  return res.status() === 302;
}
// same pattern for _adminSignupOnce()
```

This touches two files (`staging-auth.js`'s exports + `admin-credits-topup.js`'s two functions) rather than one — acceptable, since exporting two already-existing constants is not a behavioural change to `staging-auth.js` itself (no existing caller is affected). If re-deriving the constants locally in `admin-credits-topup.js` instead (duplicating the literal header name and re-reading `process.env.E2E_STAGING_AUTH_STUB_SECRET`) is preferred to avoid touching `staging-auth.js` at all, that is also acceptable — but must use the IDENTICAL header name/value, not a new one, since the server-side gate is a fixed string.

## Acceptance Criteria Coverage

| AC | Verified by |
|----|-------------|
| eatrl AC1 | T1 — code inspection confirms both functions send the header |
| eatrl AC2 | T2 — multi-file, single-worker real-staging re-run shows no rate-limit-caused skips |
| eatrl AC3 | T3 — full `npm test`, diffed against `tests/known-baseline-failures.json` |
| eatrl AC4 | T4 — real CI run on the fix's own PR, reported honestly in `decisions.md` |

## Coding Agent Instructions

1. Read `tests/e2e/fixtures/staging-auth.js` in full first to confirm the exact export shape of `hasStubSecret`, the bypass header constant name, and `STUB_SECRET` (or equivalent) — do not assume the exact names without checking, since this DoR's code sketch above may not exactly match what's actually exported.
2. Implement the fix in `tests/e2e/fixtures/admin-credits-topup.js` ONLY — add the bypass header to both `_adminLogin()` and `_adminSignupOnce()`.
3. Do NOT touch `auth-email.js`, `staging-auth.js`'s own signup/login functions, or any server-side rate-limiting logic.
4. Re-run the multi-file, single-worker real-staging reproduction: `E2E_STAGING_BASE_URL="https://wuce-staging.fly.dev" npx playwright test tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js --workers=1`. IMPORTANT: this hits a real, live staging environment with a real per-IP rate limiter with no bypass available for YOUR OWN test-runner IP beyond what this fix itself provides — if you still hit `429`, wait 5-6 minutes (poll properly, don't just report "waiting") before retrying, and avoid re-running the full suite repeatedly; target failing tests specifically with `-g` where possible.
5. Run `npm test` and confirm zero new regressions vs `tests/known-baseline-failures.json`.
6. Update `.github/pipeline-state.json`: create a new flat `feature.stories[]` entry for `eatrl-s1` (per cdg.6/cdg.7 — use `node bin/skills advance`/`gate-advance`, or careful direct JSON edit validated with `node scripts/check-pipeline-state-integrity.js` and a conflict-marker scan if this file is mid-conflict from concurrent work — this file is a known merge-conflict hotspot in this repo, see `standards/governance/delivery-patterns.md`).
7. Append a `workspace/capture-log.md` entry (source: agent-auto) documenting the root cause and fix.
8. Commit, push to a new branch (`fix-forward-e2e-admin-topup-rate-limit-bypass`), open a **draft PR** against `master`.
9. In your final report, include the real, observed pass/skip/fail breakdown from the multi-file local reproduction AND (if you have visibility into a real CI run on your own PR) the real CI job outcome — not an assumption that it will work.
10. Per this repo's own mandatory convention: expect independent verification via `git status`/`git log`/`gh pr view` before any "done" report is trusted — do the real work, not just the narration.

## Definition of Ready Sign-off

- [x] Story exists and is complete (`stories/eatrl-s1.md`)
- [x] Test plan exists and is complete (`test-plans/eatrl-s1-test-plan.md`)
- [x] Root cause independently confirmed (code inspection of exact rate-limit gates + reproducing standalone-vs-full-suite comparison)
- [ ] Fix implemented and verified GREEN against real staging — pending coding-agent dispatch
- [x] No contradiction between DoR contract and test plan required touchpoints (single file touched: `tests/e2e/fixtures/admin-credits-topup.js`)
- [x] Conflict-marker scan not applicable (no merge/rebase/cherry-pick performed yet)
- [x] Human oversight level: Low (single-file, additive-header fixture fix, reusing an existing, already-reviewed mechanism; short-track)

**Proceed:** Yes
