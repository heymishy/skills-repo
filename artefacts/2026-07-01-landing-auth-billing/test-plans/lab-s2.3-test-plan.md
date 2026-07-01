# Test Plan — lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect

**Story:** lab-s2.3
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s2.3-welcome.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. `user-flags.js` Postgres adapter is injectable (D37) — tests inject a mock that returns `firstLogin: true` or `firstLogin: false` as needed. No real DB calls in unit tests.

- `posthog-server.js` adapter is monkeypatched to capture events.
- Plan config (plan names, price IDs) is set via `process.env` in test setup.
- AC5 (`POST /billing/checkout` form action) requires lab-s3.2 to be merged for end-to-end verification — the unit test for AC5 verifies HTML structure only (form action and planId field presence) which is independently testable.

**PCI/sensitivity:** None.

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | First-login → redirect to /welcome | Unit | T1.1, T1.2 | None |
| AC2 | Returning user → redirect to /dashboard | Unit | T2.1 | None |
| AC3 | Unauthenticated /welcome → 302 / | Unit | T3.1 | None |
| AC4 | /welcome renders plan options (content, not layout) | Unit | T4.1, T4.2 | CSS layout manual (RISK-ACCEPT) |
| AC5 | Plan CTA form has correct action and planId | Unit | T5.1, T5.2 | None |
| AC6 | `plan_selected` PostHog event fires on plan submission | Unit | T6.1 | None |
| AC7 | Already-completed user → 302 /dashboard | Unit | T7.1 | None |

---

## Gap table

| AC | Gap type | Handling | Justification |
|----|----------|----------|---------------|
| AC4 (layout) | CSS-layout-dependent | Content assertion tested at unit level; visual layout verified by manual smoke test (lab-s3.5) | "Plan options are all visible" at the CSS level cannot be verified by a Node.js unit test. The content presence (plan names, CTA buttons exist in HTML) IS testable at unit level. RISK-ACCEPT recorded in decisions.md (2026-07-01). |

---

## E2E / browser-layout detection

AC4 has a CSS-layout component (plan options visible on screen) but the core content assertion (plan names, CTA elements present in HTML response) is testable at the unit level. Only the visual layout aspect is CSS-layout-dependent. No E2E tooling required for the unit assertions.

---

## Unit tests

### T1 — Auth callbacks redirect first-time users to /welcome (AC1)

**T1.1** — `first-login-auth-callback-redirects-to-welcome`
Covers: AC1
Precondition: Auth callback handler (for any provider — use GitHub scenario); user-flags adapter returns `firstLogin: true` for the user
Action: Call the auth callback handler with a valid mock identity
Expected: Response is 302 to `/welcome`
Edge case: Verify the `firstLogin: true` flag is written to the user record — not just that the redirect happens

**T1.2** — `first-login-flag-set-on-user-record`
Covers: AC1 §1
Precondition: DB adapter (user-flags) captures writes; first-login scenario
Action: Call auth callback handler; inspect DB adapter calls
Expected: `setFirstLoginFlag(userId, true)` (or equivalent) was called; the user record now has `firstLogin: true`
Edge case: none

### T2 — Returning user redirects to /dashboard (AC2)

**T2.1** — `returning-user-auth-callback-redirects-to-dashboard`
Covers: AC2
Precondition: user-flags adapter returns `firstLogin: false` (flag was cleared after first welcome completion)
Action: Call auth callback handler
Expected: Response is 302 to `/dashboard`; `/welcome` is not visited
Edge case: none

### T3 — Unauthenticated /welcome → 302 / (AC3)

**T3.1** — `unauthenticated-welcome-redirects-to-landing`
Covers: AC3
Precondition: Mock request with no session (no `req.session.accessToken`)
Action: Call `GET /welcome` handler
Expected: Response is 302 to `/`
Edge case: none

### T4 — /welcome renders plan options (AC4)

**T4.1** — `welcome-page-200-for-first-time-user`
Covers: AC4 (response code)
Precondition: Authenticated session with `firstLogin: true`; env vars `STRIPE_PRICE_ID_STARTER` and `STRIPE_PRICE_ID_PRO` set to test values (not placeholder)
Action: Call `GET /welcome` handler
Expected: Response is 200
Edge case: none

**T4.2** — `welcome-page-contains-plan-options-from-env`
Covers: AC4 §2 (plan options sourced from env vars)
Precondition: `PLAN_NAME_STARTER=Starter` and `PLAN_NAME_PRO=Pro` set in test environment
Action: Inspect response body
Expected: Response HTML contains plan names "Starter" and "Pro" (from env vars); does NOT contain the string `PLAN_NAME_PLACEHOLDER` or `STRIPE_PLAN_PRICE_ID_PLACEHOLDER`; contains "Select this plan" CTA text
Edge case: If env vars are not set, test must assert the page does NOT render placeholder text

### T5 — Plan CTA form structure (AC5)

**T5.1** — `welcome-plan-cta-form-action-targets-billing-checkout`
Covers: AC5
Precondition: T4.1 setup
Action: Assert response HTML contains `action="/billing/checkout"` on a form or button element
Expected: At least one element with `action` or `formaction` set to `/billing/checkout` is present
Edge case: This test verifies form wiring independent of lab-s3.2 being live

**T5.2** — `welcome-plan-cta-includes-plan-id-field`
Covers: AC5
Precondition: T4.1 setup
Action: Assert response HTML contains a hidden input or field named `planId` within each plan's form
Expected: `<input name="planId"` (or equivalent) present for each plan option
Edge case: none

### T6 — `plan_selected` PostHog event (AC6)

**T6.1** — `plan-selected-posthog-event-fires-on-plan-submission`
Covers: AC6
Precondition: PostHog adapter monkeypatched to capture calls; authenticated first-login session; form submission to plan selection endpoint (or the equivalent handler that captures the plan choice)
Action: Simulate plan selection form submission
Expected: PostHog adapter called with event name `plan_selected` and `{ planName }` property
Edge case: Event must not delay the form submission response (fire-and-forget pattern)

### T7 — Already-completed user redirected to /dashboard (AC7)

**T7.1** — `already-completed-welcome-redirects-to-dashboard`
Covers: AC7
Precondition: Authenticated session; user-flags adapter returns `firstLogin: false` (flag cleared after plan selection)
Action: Call `GET /welcome` handler
Expected: Response is 302 to `/dashboard`
Edge case: Distinguish from AC2: AC2 is about the auth callback redirect; AC7 is about direct navigation to `/welcome` by a user who already completed it

---

## Integration tests

**IT1** — `user-flags-adapter-wired-in-server`
Covers: AC1, AC2 (integration — user-flags module wired correctly)
Precondition: Server module or routes loaded in test mode; `user-flags.js` D37 stub not throwing
Expected: `getUserFlags` can be called without throwing (real adapter wired via `setUserFlagsAdapter()` in `server.js`)
Edge case: If the throwing stub is active, this test will fail — D37 production wiring is a separate implementation task

**IT2** — `welcome-route-requires-auth-guard`
Covers: AC3 (integration — auth guard applied to /welcome)
Precondition: `/welcome` route loaded; request with no session
Action: Send `GET /welcome` without a session
Expected: 302 to `/` — auth guard fires before the welcome handler
Edge case: none

---

## NFR tests

No explicit NFR tests beyond what is covered above. PostHog non-blocking behaviour is verified implicitly in T6.1 (fire-and-forget pattern — if PostHog call is synchronous and blocking, T6.1 would need to detect this).

---

## State update fields

- `totalTests`: 11
- `acTotal`: 7
- `hasLayoutDependentGaps`: true
- `e2eToolingRequired`: false
