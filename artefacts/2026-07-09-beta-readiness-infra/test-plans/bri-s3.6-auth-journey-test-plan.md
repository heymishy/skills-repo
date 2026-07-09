## Test Plan: Auth journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.6-auth-journey.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

<!--
  Gap types:
    CSS-layout-dependent — relies on real browser rendering (drag-drop, getBoundingClientRect, CSS position)
    DOM-behaviour       — e2e-testable but not jsdom-compatible
    External-dependency — relies on third-party API/service unavailable in test
    Untestable-by-nature — inherently non-automatable (e.g. visual aesthetics, physical hardware)
-->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | First-time GitHub OAuth login → redirected to `/welcome` | — | 1 | 1 | — | — | 🟢 |
| AC2 | Returning GitHub OAuth login → redirected to `/dashboard` | — | 1 | 1 | — | — | 🟢 |
| AC3 | Session expiry → redirected to re-authenticate, not silent failure | — | — | 1 | — | — | 🟢 |
| AC4 | `accessToken` never appears in HTML response or logs, any provider | 1 | 1 | 1 | — | — | 🟢 |
| AC5 | Spec tagged `@mocked`, real OAuth endpoints not called | — | 1 | 1 | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures (stubbed OAuth provider exchange, mirroring the existing pattern in `check-wuce1-oauth-flow.js`) + `tests/e2e/fixtures/auth.js`'s `NODE_ENV=test`-gated bypass
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A synthetic GitHub identity with no prior `github_first_login` record | Stubbed OAuth exchange | None | Regression coverage for `f845caf7` |
| AC2 | A synthetic GitHub identity with an existing `github_first_login` record (returning user) | Stubbed OAuth exchange | None | This is the specific regression this spec exists to prevent from recurring |
| AC3 | A session that has expired or been deliberately invalidated | Session store manipulation (test-only) | None | |
| AC4 | Successful logins across GitHub, Google, and email/password | Stubbed exchanges (GitHub/Google) + real email/password flow | None (must never see a real token) | |
| AC5 | Stubbed GitHub and Google OAuth provider exchange functions | Stub, consistent with `check-wuce1-oauth-flow.js` | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `rotateSessionId` is called after every provider login

- **Verifies:** Session-security mandatory constraint (session rotation after every provider login, tracked in `landing-auth-billing`'s guardrails), underpins AC1/AC2/AC4.
- **Precondition:** `rotateSessionId` spied/stubbed (mirrors `check-arl-s4-admin-billing-bypass.js`'s pattern of stubbing session module functions).
- **Action:** Drive a successful login through each provider's callback handler directly (GitHub, Google, email/password) with the provider exchange stubbed.
- **Expected result:** `rotateSessionId` is invoked exactly once per login, for every provider — not just GitHub.
- **Edge case:** No.

---

## Integration Tests

### First-time vs. returning GitHub OAuth login redirects correctly

- **Verifies:** AC1, AC2.
- **Components involved:** `auth.js` (`handleAuthCallback`), `user-flags.js` (`getFirstLoginFlag`), stubbed OAuth adapter — extends the existing pattern in `check-arl-s4-admin-billing-bypass.js` to the non-admin, non-bypass path.
- **Precondition:** A non-admin synthetic GitHub identity; provider exchange stubbed to succeed.
- **Action:** Call `handleAuthCallback` directly for (a) a first-time login (no `github_first_login` record) and (b) a returning login (existing record).
- **Expected result:** (a) responds with a 302 redirect to `/welcome`; (b) responds with a 302 redirect to `/dashboard` — the fixed behaviour from `f845caf7`, not the pre-fix bug where every login went to `/welcome`.

### `accessToken` never appears in the HTML response body or captured logs, any provider

- **Verifies:** AC4.
- **Components involved:** Auth callback handlers for GitHub, Google, email/password (`auth.js`, `auth-email.js`), response body, captured console/log output.
- **Precondition:** Successful login via each provider, response body and log output captured.
- **Action:** Inspect the raw HTML response body and captured log output after each login.
- **Expected result:** No literal `accessToken` value appears in the HTML body or in captured logs, for any of the three providers — this is a hard structural check per the story's Security NFR, not a trust-based assumption.

### `@mocked` runs stub the OAuth provider exchange, no real endpoint calls

- **Verifies:** AC5.
- **Components involved:** OAuth adapter (`oauth-adapter.js`), stubbed provider exchange functions (consistent with `check-wuce1-oauth-flow.js`).
- **Precondition:** `NODE_ENV=test`; a spy installed on the real GitHub/Google OAuth HTTP endpoints.
- **Action:** Drive logins for GitHub and Google through the stubbed exchange.
- **Expected result:** Zero real HTTP calls recorded to either provider's real OAuth endpoint; login still completes using the stub.

---

## E2E (Playwright — `tests/e2e/bri-s3.6-auth-journey.spec.js`, tagged `@mocked`)

- **AC1:** Given a first-time GitHub OAuth login (provider exchange stubbed), When the callback completes, Then the browser is redirected to `/welcome` (plan selection).
- **AC2:** Given a returning GitHub OAuth login, When the callback completes, Then the browser is redirected straight to `/dashboard`, not `/welcome`.
- **AC3:** Given a session expires or is deliberately invalidated, When the user makes a subsequent request (e.g. navigates to a protected page), Then they are redirected to re-authenticate, not shown a silent failure or dead-end error page.
- **AC4:** Given a successful login of any provider, When the resulting session cookie and rendered HTML are inspected via the browser's dev tools / Playwright's page content API, Then no `accessToken` value appears anywhere in the page.
- **AC5:** Given the spec is tagged `@mocked`, When it runs on every PR, Then the real GitHub/Google OAuth endpoints are never called (asserted via a call-count spy) while the browser still drives a real redirect chain through the app's own routes.

---

## NFR Tests

### `accessToken` leak into HTML/logs is structurally impossible to miss

- **NFR addressed:** Security
- **Measurement method:** Triangulated at three layers — unit (session rotation), integration (response body/log scan), and E2E (rendered page content scan) — per AC4's "hard structural check" framing in the story.
- **Pass threshold:** Zero matches across all three layers, every provider.
- **Tool:** Hand-rolled `assert`-based Node tests (unit/integration) + Playwright page-content assertion (E2E).

### `@mocked` suite runtime contribution

- **NFR addressed:** Performance
- **Measurement method:** Contributes to the shared under-10-minute `@mocked` suite budget (Metric 6).
- **Pass threshold:** N/A per-spec.
- **Tool:** CI suite timer (existing).

### Accessibility

Not applicable beyond the app's existing bar — confirmed with story owner.

### Audit

None beyond standard CI logging — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Testing the GitHub org allowlist (`TENANT_ORG_ALLOWLIST`) tenancy path — not currently active in this deployment; out of scope until live, per the story.
- Admin-role bypass behaviour (`ADMIN_GITHUB_LOGINS`, `f845caf7`) as its own dedicated assertion — already covered at the unit level by `check-arl-s4-admin-billing-bypass.js`; incidentally exercised (not separately asserted) by this spec's AC2 returning-user path.
- Better Auth ESM/CJS edge cases — not applicable; this repo uses Path C (roll-your-own OAuth via `fetch()`, staying CJS) per `landing-auth-billing/decisions.md` ARCH-002, not Better Auth.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | Stubbed provider exchange (consistent with existing `check-wuce1-oauth-flow.js` pattern) gives full coverage of the redirect/session/token-leak logic without depending on a real GitHub/Google endpoint | N/A |
