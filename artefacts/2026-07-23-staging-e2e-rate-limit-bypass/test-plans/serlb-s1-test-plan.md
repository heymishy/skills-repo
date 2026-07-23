## Test Plan: Narrow, staging-only rate-limit bypass so Scenario A's real-staging CI gate can pass without weakening staging signup abuse-prevention

**Story reference:** artefacts/2026-07-23-staging-e2e-rate-limit-bypass/stories/serlb-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No bypass secret configured: 11th attempt still 429 (regression baseline) | 1 | — | — | — | — | 🟢 |
| AC2 | Secret + matching header + e2e-test- email: 11th attempt allowed; secret + matching header + non-e2e-test- email: still 429 | 3 | — | — | — | — | 🟢 |
| AC3 | Secret NOT configured (production-isolation): bypass never fires regardless of header/email | 1 | — | — | — | — | 🟢 |
| AC4 | Full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |
| AC5 | Real staging: a1-a4 run together no longer 429-cascade | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** No new fixtures needed — tests construct requests directly via the existing `mockReq`/`mockRes`/`mockUserDb` helper shape already used by `tests/check-lab-s2.2-email-password.js`, duplicated locally in the new test file to keep this story's test file self-contained and independently runnable.
**PCI/sensitivity in scope:** No.
**Availability:** AC1-AC4 available now, fully deterministic, no staging dependency. AC5 requires a live `flyctl deploy` to `wuce-staging` within this session (this story reuses the already-deployed `E2E_STAGING_AUTH_STUB_SECRET` Fly secret — no new secret rollout needed) — if it cannot complete, reported as not run, not fabricated as passing.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | 10 prior signup attempts from one IP, no bypass secret set | Test-constructed | None | |
| AC2 | 10 prior attempts + matching header + e2e-test- email (positive case); same + non-e2e-test- email (negative case) | Test-constructed | None | Both signup and login entry points covered (shared counter) |
| AC3 | 10 prior attempts, secret deliberately unset, header/email both present | Test-constructed | None | Simulates the real, permanent production state |
| AC4 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |
| AC5 | Real `wuce-staging`, the exact four specs PR #563's CI job runs together | Real staging | None | Reuses the exact repro command from the CI failure log |

### PCI / sensitivity constraints

None.

### Gaps

AC5 depends on a live `flyctl deploy` succeeding within this session and on real `wuce-staging` being reachable. If it cannot complete, it is reported as pending/not-run, not claimed as passing — AC1-AC4 provide full deterministic verification of the fix itself independent of AC5's outcome.

---

## Unit Tests

### UT1 — no bypass configured: 11th signup attempt still 429 (AC1)
- **Verifies:** AC1
- **Component:** `_checkRateLimit` / `handleEmailSignup` (`src/web-ui/routes/auth-email.js`)
- **Action:** Drive 10 signup attempts from one IP with `E2E_STAGING_AUTH_STUB_SECRET` unset, then an 11th.
- **Expected result:** 11th attempt returns 429 — identical to pre-fix behaviour.
- **RED against current (pre-fix) code:** N/A — this is the regression baseline; it already passes against the unmodified code (there is no bypass to interfere with it) and must continue to pass after the fix.

### UT2 — secret + matching header + e2e-test- email: 11th attempt allowed (AC2, positive)
- **Verifies:** AC2
- **Component:** `_checkRateLimit` / `handleEmailSignup`
- **Action:** Drive 10 signup attempts from one IP, set `E2E_STAGING_AUTH_STUB_SECRET`, then an 11th attempt carrying the matching `x-e2e-rate-limit-bypass` header and an `e2e-test-`-prefixed email.
- **Expected result:** 302 (signup succeeds), not 429.
- **RED against current code:** 429 — no bypass mechanism exists yet; this is the primary RED case confirming the fix is needed before implementation.

### UT3 — secret + matching header + NON-e2e-test- email: still 429 (AC2, defense-in-depth)
- **Verifies:** AC2
- **Component:** `_checkRateLimit` / `handleEmailSignup`
- **Action:** Same as UT2 but the 11th attempt's email does NOT start with `e2e-test-`.
- **Expected result:** 429 — a real user's signup is still rate-limited even when the staging secret/header are both present, proving the bypass is scoped to the tagged email and not merely to possession of the header.
- **RED against current code:** Already passes pre-fix (no bypass exists at all yet) and must continue to pass post-fix — this is the critical regression guard against a too-broad implementation.

### UT4 — secret NOT configured (production-isolation): bypass never fires (AC3)
- **Verifies:** AC3
- **Component:** `_checkRateLimit`
- **Action:** Drive 10 signup attempts from one IP with `E2E_STAGING_AUTH_STUB_SECRET` deliberately unset, then an 11th attempt carrying the header and an `e2e-test-`-prefixed email anyway.
- **Expected result:** 429 — the bypass never fires without the staging-only enabling secret, the same guarantee production relies on since this variable is only ever a `wuce-staging` Fly secret.
- **RED against current code:** Already passes pre-fix and must continue to pass post-fix — proves the third-party production-isolation claim, mirroring a1's own AC3 config-isolation proof (`tests/check-a1-fly-config-isolation.js`).

### UT5 — mismatched header value: still 429
- **Verifies:** AC2 (header-match precision)
- **Action:** Secret configured, 11th attempt carries a header with the WRONG value plus an `e2e-test-` email.
- **Expected result:** 429 — a bare env var leak alone (without knowing the exact secret value) is not enough.

### UT6 — login shares the same counter and honours the same bypass (AC1/AC2, shared limiter)
- **Verifies:** AC1, AC2
- **Component:** `handleEmailLogin`
- **Action:** Drive 10 signup attempts from one IP (shared counter), then an 11th LOGIN attempt (not signup) for an `e2e-test-`-tagged email with the matching header.
- **Expected result:** 302 (login succeeds) — proving the bypass is applied at both call sites that share the same `_rateLimits` Map, not just `handleEmailSignup`.
- **RED against current code:** 429 — `handleEmailLogin` also has no bypass pre-fix.

### UT7 — different IP unaffected (sanity)
- **Verifies:** AC1 (no regression to the per-IP scoping itself)
- **Action:** A fresh IP with zero prior attempts signs up normally.
- **Expected result:** 302 — unaffected by any other IP's counter state.

---

## Integration Tests

### IT1 — full existing regression suite (AC4)
- **Verifies:** AC4
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`. Specifically re-confirms `tests/check-lab-s2.2-email-password.js` (T4.1/T4.2, the pre-existing rate-limit tests) and `tests/check-sec-perf-s3-auth-email-csrf.js` (CSRF round-trip through the now-async `_checkRateLimit`) both still pass unmodified.

---

## E2E / Manual Tests

### E2E1 — real `wuce-staging`, all four Scenario A specs run together (AC5)
- **Verifies:** AC5
- **Components involved:** Real `wuce-staging` Fly app; this fix does not require a new Fly secret (reuses the already-deployed `E2E_STAGING_AUTH_STUB_SECRET`), so only an app redeploy is needed.
- **Precondition:** No concurrent deploy in progress from another agent (checked via `flyctl releases --app wuce-staging` before deploying).
- **Action:** Run the exact command PR #563's "Scenario A E2E (staging)" CI job runs: `npx playwright test tests/e2e/a1-staging-auth-stub.spec.js tests/e2e/a2-stripe-test-mode-plan-selection.spec.js tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js` with `E2E_STAGING_AUTH_STUB_SECRET` set in the local Playwright process's environment.
- **Expected result:** No test in the run fails with HTTP 429 "Too many attempts".
- **Contingency:** If deploy cannot complete this session, reported as not run — UT1-UT7 remain the deterministic, always-available verification level for the fix's correctness.

---

## NFR Tests

None beyond IT1 (no new NFR-specific behaviour introduced — this is an additive carve-out on an already-existing rate-limit check, not new application logic).

---

## Out of Scope for This Test Plan

- Re-verifying a1-a4's own already-passing/skipped ACs unrelated to the rate limiter.
- Any test of `auth-stub.js`'s own GitHub-stub mechanism (unchanged by this story; already covered by its own test suite).
- The pre-existing, already-documented credits-upsert gap or a4's NFR-Security staging-freshness question (both out of scope).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| E2E1 depends on a live `flyctl deploy` succeeding within this session | Deploy environment availability is not guaranteed at test-plan-authoring time | Contingency clause requires explicit "not run" reporting rather than a fabricated pass; UT1-UT7 provide full deterministic verification of the fix's correctness independent of E2E1's outcome |
