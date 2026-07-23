## Test Plan: Fix session cookie SameSite=Strict dropping the session on Stripe's post-checkout redirect

**Story reference:** artefacts/2026-07-23-session-cookie-samesite-fix/stories/scsf-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | cookie config and header string both say `lax` | 2 | — | — | — | — | 🟢 |
| AC2 | cross-site top-level GET-shaped request with cookie resolves the existing session | — | 2 | — | — | — | 🟢 |
| AC3 | documentation that Lax still excludes non-top-level cross-site requests (browser-enforced) | 1 | — | — | — | — | 🟢 |
| AC4 | `NFR1` test updated to assert `lax` | 1 | — | — | — | — | 🟢 |
| AC5 | full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |
| AC2 (real-world) | PR #552's own `tests/e2e/a2-stripe-test-mode-plan-selection.spec.js` AC2 passes against real `wuce-staging` post-deploy | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — a mocked `req`/`res` pair simulating a request carrying a valid session cookie header but no other cross-site markers a real browser would otherwise strip; no real Stripe or OAuth calls in the unit/integration suite.
**PCI/sensitivity in scope:** No — the unit/integration tests never touch real card data or Stripe API keys.
**Availability:** Available now for UT1-UT4/IT1-IT2. The final E2E row requires a real deploy to `wuce-staging` and is tracked separately (see "Deploy-dependent" note above and the story's DoR).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Direct import of `SESSION_COOKIE_CONFIG` and `_buildCookieHeader` (or the module's exported cookie-building behaviour) | Existing module, no fixture needed | None | |
| AC2 | A session already created via `createSession()`/`_sessions` seeding, then a mock `req` whose `headers.cookie` carries that session's ID (simulating "cookie was attached") | Fixture | None | This test cannot make Playwright/a real browser enforce SameSite — it proves the **server-side** behaviour (session lookup succeeds when the cookie *is* presented) is correct once the cookie's `SameSite` attribute is `Lax`. Browser-side attachment behaviour itself is proven by AC2's real-world E2E row (PR #552's spec) once deployed. |
| AC3 | No new test execution — a written note in this test plan and a code comment in `session.js` | N/A | None | `SameSite` enforcement is entirely a browser mechanism; a Node test cannot simulate "the browser refused to attach the cookie" except by *not* including the cookie header in the request. UT4 below does exactly that as the negative-case documentation. |
| AC4 | Existing `tests/check-wuce1-oauth-flow.js` NFR1 test | Existing test file | None | Updated, not new |
| AC5 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |

### PCI / sensitivity constraints

None — no real payment data anywhere in this story's own tests.

### Gaps

The final AC Coverage row (PR #552's real E2E AC2 against real staging) depends on an actual `flyctl deploy` to `wuce-staging` succeeding and Stripe test-mode webhooks reaching it. If deploy is not completed in this session, this row remains unverified and must be reported as pending, not claimed as passing.

---

## Unit Tests

### UT1 — `SESSION_COOKIE_CONFIG.sameSite` is `'lax'`
- **Verifies:** AC1
- **Component:** `src/web-ui/middleware/session.js` — `SESSION_COOKIE_CONFIG`
- **Action:** Import the module, read `SESSION_COOKIE_CONFIG.sameSite`
- **Expected result:** `'lax'`

### UT2 — `Set-Cookie` header string says `SameSite=Lax`
- **Verifies:** AC1
- **Component:** `src/web-ui/middleware/session.js` — cookie-building logic exercised via `sessionMiddleware` (new-session path) or a direct call to the header-building helper
- **Action:** Trigger a new-session `Set-Cookie` write (no existing cookie on the mock request) and inspect the header value
- **Expected result:** Header string contains `SameSite=Lax`, still contains `HttpOnly`, still contains `Secure` outside `NODE_ENV=development`, does not contain `SameSite=Strict` or `SameSite=None`

### UT3 — negative-case documentation: a request with no cookie header still gets a fresh session (unchanged behaviour)
- **Verifies:** AC3 (documents the boundary — this is what "no cookie attached" looks like server-side, whether caused by a genuine first visit or a browser declining to attach a `Lax` cookie to a disallowed cross-site subrequest)
- **Component:** `sessionMiddleware`
- **Action:** Call `sessionMiddleware` with a mock `req` whose `headers.cookie` is absent
- **Expected result:** A brand-new session is created (same as today's behaviour) — proves this fix does not change what happens when a cookie legitimately isn't present, which is the server-observable proxy for "Lax correctly withheld the cookie on a disallowed cross-site request"

### UT4 — `tests/check-wuce1-oauth-flow.js` NFR1 updated
- **Verifies:** AC4
- **Component:** `tests/check-wuce1-oauth-flow.js`
- **Action:** Update the existing NFR1 test's assertion and its descriptive string
- **Expected result:** Asserts `SESSION_COOKIE_CONFIG.sameSite === 'lax'`, with an inline comment referencing this story (`scsf-s1`) and explaining that `Lax` (not `Strict`) is required for cross-site top-level redirect flows (Stripe Checkout, OAuth callbacks) to keep the session cookie, while cross-site subrequests/POSTs/AJAX/iframes remain blocked

---

## Integration Tests

### IT1 — a cookie presented on a request resolves the pre-existing session (simulates the cookie surviving a cross-site top-level redirect)
- **Verifies:** AC2
- **Components involved:** `sessionMiddleware`, `_sessions` in-memory store
- **Precondition:** A session already exists (created via `createSession()`) with known data (e.g. `{ accessToken: 'tok', tenantId: 'e2e-tester' }`)
- **Action:** Call `sessionMiddleware` with a mock `req` whose `headers.cookie` is `session_id=<that session's id>` — this is the server-side shape of "the browser did attach the cookie," which is what `Lax` (and not `Strict`) permits for a cross-site top-level GET
- **Expected result:** `req.session` resolves to the pre-existing session's data (not a new empty session); `req.sessionId` matches the presented ID

### IT2 — full `handleAuthCallback`/billing-success-shaped round trip keeps the existing session (regression guard against re-creating a fresh, empty session)
- **Verifies:** AC2
- **Components involved:** `sessionMiddleware` + a route handler that reads `req.session.accessToken`
- **Precondition:** Same as IT1
- **Action:** Simulate the full request-handling path a redirect target route (e.g. `/billing/success` or `/auth/github/callback`) would see: `sessionMiddleware` runs first, then the guarded handler reads `req.session.accessToken`
- **Expected result:** `req.session.accessToken` is present and correct (not `undefined`) — proves a redirect-target route sees the authenticated session, not a fresh unauthenticated one

### IT3 — full existing regression suite
- **Verifies:** AC5
- **Components involved:** All existing test files
- **Precondition:** None
- **Action:** Run `npm test`
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`

---

## E2E Tests

### E2E1 — PR #552's own AC2 spec passes against real `wuce-staging` post-deploy
- **Verifies:** AC2 (real-world confirmation)
- **Components involved:** Real `wuce-staging` deployment, real Stripe test-mode checkout, real browser (Playwright)
- **Precondition:** This story's fix is deployed to `wuce-staging` via `flyctl deploy`
- **Action:** `npx playwright test tests/e2e/a2-stripe-test-mode-plan-selection.spec.js` (fetched from PR #552's branch) against real staging
- **Expected result:** AC2 ("the Stripe checkout redirect lands on the expected authenticated page with the session still valid") passes — `page.url()` contains `/dashboard`, `GET /api/me` reports `authenticated: true`
- **Contingency:** If a real deploy cannot be completed in this session, this test is reported as **not run** — not claimed as passing. A manual deploy + re-run is the pending follow-up action.

---

## NFR Tests

### NFR-Security — Lax does not reintroduce a CSRF gap
Covered narratively by UT2 (header no longer says `Strict` or `None`) and the Architecture Constraints section of the story: `SameSite=Lax` is a browser-enforced attribute; this repo's server code makes no CSRF-relevant assumption beyond "the cookie may or may not be present," which UT3 preserves. No new automated test can force a real browser to attempt a disallowed cross-site subrequest from Node — this is documented as an inherent testing-boundary limitation of `SameSite`, consistent with how AC3 is scoped (a documentation check, not a runtime assertion).

---

## Out of Scope for This Test Plan

- Testing Stripe webhook signature verification or checkout-session creation — unrelated to this story's change.
- Testing the OAuth CSRF-state (`validateOAuthState`) mechanism itself — unchanged by this fix.
- A general cookie/header security audit across the rest of the app.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No automated test can make a real browser attempt a disallowed cross-site subrequest and observe the cookie withheld | `SameSite` enforcement is a browser mechanism, not something Node's HTTP layer can simulate meaningfully | UT2/UT3 assert the correct header value and the correct server-side fallback behaviour when no cookie is presented; the "still blocked" claim rests on documented, standard browser `SameSite=Lax` semantics, not a bespoke test |
| Real-staging E2E confirmation (E2E1) depends on a live `flyctl deploy` succeeding within this session | Deploy environment availability is not guaranteed at test-plan-authoring time | E2E1's contingency clause requires explicit "not run" reporting rather than a fabricated pass, per the story's DoR and the operator's standing instruction not to claim unperformed verification |
