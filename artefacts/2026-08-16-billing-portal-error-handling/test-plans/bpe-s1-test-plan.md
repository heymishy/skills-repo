## Test Plan: Add error handling and a missing-customer guard to the Stripe Billing Portal redirect

**Story reference:** artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Valid session + stripeCustomerId → createPortalSession called, 302 to returned URL | 1 test | — | — | — | — | 🟢 |
| AC2 | returnUrl passed to createPortalSession contains `/dashboard` | 1 test (same case as AC1) | — | — | — | — | 🟢 |
| AC3 | No session / no accessToken → 302 to `/`, Stripe not called | 2 tests (no session, null session) | — | — | — | — | 🟢 |
| AC4 | Missing/null/undefined/empty stripeCustomerId → 302 to `/settings?error=no_billing_account`, Stripe not called | 3 tests | — | — | — | — | 🟢 |
| AC5 | createPortalSession throws → caught, 302 to `/settings?error=billing_unavailable` | 1 test | — | — | — | — | 🟢 |

**E2E / browser-layout detection (Step 3a):** Scanned all 5 ACs for CSS-layout-dependent language (drag-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, on-screen-position checks, `e.target` identity from stacking, visual rendering). None triggered — every AC concerns HTTP response status/Location header and whether a mocked adapter function was called, all verifiable via direct handler invocation with mock `req`/`res` objects and a mock Stripe adapter, exactly matching `tests/check-lab-s3.5-billing-portal.js`'s existing convention for this same handler. No E2E tooling gap applies to this story.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `req`/`session`/`res` objects, matching `tests/check-lab-s3.5-billing-portal.js`'s own existing precedent for this exact handler — no database state is read; the Stripe adapter is fully monkeypatched via `stripeClient.setStripeAdapter()`, no real Stripe API calls)
**PCI/sensitivity in scope:** No — no real Stripe customer IDs, cards, or payment data used anywhere in this test suite; all values are synthetic string literals (`'cus_test_123'`, etc.)
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2 | Mock session with `accessToken` + `stripeCustomerId`; mock Stripe adapter returning a fake portal URL | Mock req object + monkeypatched adapter | None | Reuses `tests/check-lab-s3.5-billing-portal.js`'s exact mock shape |
| AC3 | Mock session that is absent, `{}` (no accessToken), or `null` | Mock req object | None | Three session shapes already covered by the existing test file's AC2 precedent |
| AC4 | Mock session with `accessToken` set and `stripeCustomerId` set to `undefined`, `null`, and `''` respectively | Mock req object | None | New case — the actual bug being fixed |
| AC5 | Mock Stripe adapter whose `billingPortal.sessions.create` rejects (throws) | Monkeypatched adapter that returns a rejected Promise | None | New case — the actual bug being fixed |

### PCI / sensitivity constraints

None — no real payment data anywhere in this test suite.

### Gaps

None.

---

## Unit Tests

### billingPortal_validCustomerId_redirectsToPortalUrl

- **Verifies:** AC1
- **Precondition:** Mock session `{ accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_123' }`; mock Stripe adapter's `billingPortal.sessions.create` returns `{ url: 'https://billing.stripe.com/session/test_portal_123' }`
- **Action:** Call `handleGetBillingPortal(req, res)` directly
- **Expected result:** `res._statusCode === 302`, `res._headers['Location'] === 'https://billing.stripe.com/session/test_portal_123'`, and the mock adapter was called exactly once with `customer: 'cus_test_123'`
- **Edge case:** No

### billingPortal_returnUrlContainsDashboard

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Inspect the args passed to the mock adapter's `create` call from the AC1 test run
- **Expected result:** `return_url` contains `/dashboard`
- **Edge case:** No

### billingPortal_noSession_redirectsToRoot

- **Verifies:** AC3
- **Precondition:** `req.session` is `{}` (no `accessToken`)
- **Action:** Call `handleGetBillingPortal(req, res)`
- **Expected result:** `res._statusCode === 302`, `res._headers['Location'] === '/'`, mock adapter's `create` never called
- **Edge case:** No

### billingPortal_nullSession_redirectsToRoot

- **Verifies:** AC3
- **Precondition:** `req.session` is `null`
- **Action:** Call `handleGetBillingPortal(req, res)`
- **Expected result:** `res._statusCode === 302`, `res._headers['Location'] === '/'`, mock adapter's `create` never called
- **Edge case:** Yes — null (not just missing-field) session shape

### billingPortal_missingCustomerId_redirectsToSettingsWithNoBillingAccountError

- **Verifies:** AC4
- **Precondition:** `req.session = { accessToken: 'tok', tenantId: 'tenant-abc' }` — no `stripeCustomerId` key at all
- **Action:** Call `handleGetBillingPortal(req, res)`
- **Expected result:** `res._statusCode === 302`, `res._headers['Location'] === '/settings?error=no_billing_account'`, mock adapter's `create` never called
- **Edge case:** Yes — this is the exact real-world defect condition (beta-001 #1/#6)

### billingPortal_nullCustomerId_redirectsToSettingsWithNoBillingAccountError

- **Verifies:** AC4
- **Precondition:** `req.session = { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: null }`
- **Action:** Call `handleGetBillingPortal(req, res)`
- **Expected result:** Same as above
- **Edge case:** Yes — explicit `null` value, distinct from the key being absent

### billingPortal_emptyStringCustomerId_redirectsToSettingsWithNoBillingAccountError

- **Verifies:** AC4
- **Precondition:** `req.session = { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: '' }`
- **Action:** Call `handleGetBillingPortal(req, res)`
- **Expected result:** Same as above
- **Edge case:** Yes — empty string is falsy but a different shape than missing/null; confirms the guard uses a general falsy check, not a strict `=== undefined`/`=== null` check

### billingPortal_stripeThrows_caughtAndRedirectsToSettingsWithBillingUnavailableError

- **Verifies:** AC5
- **Precondition:** `req.session = { accessToken: 'tok', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_456' }`; mock Stripe adapter's `billingPortal.sessions.create` is set to `async function() { throw new Error('Stripe API error: no such customer'); }`
- **Action:** Call `handleGetBillingPortal(req, res)`
- **Expected result:** The call does not throw out of `handleGetBillingPortal` (the test's own `await` does not reject); `res._statusCode === 302`; `res._headers['Location'] === '/settings?error=billing_unavailable'`
- **Edge case:** Yes — this is the exact mechanism that produced the raw 500 observed live on staging (beta-001)

---

## Integration Tests

None — this story only changes error-handling and a pre-flight guard inside one existing handler (`handleGetBillingPortal`); it introduces no new component handoff. `stripeClient.createPortalSession` itself is an existing, already-integration-tested seam (`tests/check-lab-s3.5-billing-portal.js`'s AC1/AC6 predate this story and remain valid regression coverage, folded into this plan's AC1/AC2).

---

## NFR Tests

### billingPortal_errorLogging_structuredNoRawErrorLeaked

- **Verifies:** Security NFR (no raw error/stack sent to the client), Audit NFR (structured log emitted on both new failure paths)
- **Precondition:** Same as AC4 and AC5 test cases above; spy on `console.warn`/`console.error`
- **Action:** Trigger both the missing-customerId path and the Stripe-throws path
- **Expected result:** A log line is emitted on each path (`billing_portal_no_customer_id` for the guard, `billing_portal_error` for the catch); neither the 302 response body nor its headers contain the raw error message or stack trace — only the fixed `?error=<code>` string
- **Edge case:** Yes — this is the NFR test proving the security/audit requirements, distinct from the AC4/AC5 behavioural tests above

---

## Out of Scope for This Test Plan

- Testing `handlePostCheckout` or `handlePostStripeWebhook` — unchanged by this story, already covered by their own existing test suites (`check-sec-perf-s3-billing-checkout-csrf.js`, `check-bri-s3.5-billing-webhook.js`, `check-bjs-s1-billing-journey-staging-safe.js`).
- Testing a visible error banner on the Settings page reading `?error=` — no such UI is built by this story (see story's Out of Scope); a future story's job.
- A live Chrome/staging re-check confirming the raw 500 no longer reproduces — recommended as good post-merge practice (the same method that originally surfaced this defect) but not a blocking AC verification step for this test plan, since the fix's behaviour is fully deterministic and covered by the unit tests above.

---

## Test Gaps and Risks

None identified as blocking.
