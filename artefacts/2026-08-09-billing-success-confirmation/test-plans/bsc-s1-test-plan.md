## Test Plan: Show a real, visible confirmation after a successful checkout instead of a silent redirect

**Story reference:** artefacts/2026-08-09-billing-success-confirmation/stories/bsc-s1-real-checkout-confirmation.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real plan read from Stripe session metadata, not a query param | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Visible confirmation page names the real plan | 1 test | — | — | — | — | 🟢 |
| AC3 | Continue link takes the user to /dashboard | 1 test | — | — | — | — | 🟢 |
| AC4 | checkout_completed event carries the real plan name | 1 test | — | — | — | — | 🟢 |
| AC5 | Fails open to the original 302 when session_id missing/invalid | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked — the D37-injectable Stripe adapter (`setStripeAdapter`) is replaced with a fake object in tests, following this repo's own established pattern for testing Stripe-dependent code without real API calls.
**PCI/sensitivity in scope:** No — no card data is ever handled by this codebase (Stripe Checkout is hosted, per `lab-s3.2`'s own architecture).
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fake Stripe checkout session object with `metadata: { planId: 'PRO' }` | Hand-authored fixture, mocked adapter | None | Also verifies `createCheckoutSession` now sets this metadata at creation |
| AC2/AC3 | Rendered confirmation page HTML | Real render output | None | String assertions |
| AC4 | The PostHog capture call's arguments | Mocked PostHog client (existing pattern in this codebase) | None | Asserts the `planName` property specifically |
| AC5 | Missing `session_id`; a mocked adapter that throws on retrieve | Hand-authored fixtures | None | Two distinct failure modes |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### createCheckoutSession_setsMetadataPlanId_atCreationTime

- **Verifies:** AC1 (creation half)
- **Precondition:** Mocked Stripe adapter
- **Action:** Call `createCheckoutSession({ priceId, tenantId, successUrl, cancelUrl, planId: 'PRO' })`
- **Expected result:** The `stripe.checkout.sessions.create` call includes `metadata: { planId: 'PRO' }`
- **Edge case:** No

### billingSuccess_rendersConfirmation_namingTheRealPlan

- **Verifies:** AC2
- **Precondition:** Mocked adapter's session-retrieve returns `{ metadata: { planId: 'PRO' } }`
- **Action:** Call `handleGetBillingSuccess` with a valid `session_id`
- **Expected result:** Response body contains a visible confirmation naming "Pro" (or the resolved human-readable plan label) and states the payment succeeded — not a bare 302 with no body
- **Edge case:** No

### billingSuccess_confirmationHasContinueLinkToDashboard

- **Verifies:** AC3
- **Precondition:** Same as above
- **Action:** Inspect the rendered confirmation page's markup
- **Expected result:** A real `<a href="/dashboard">`-style link/button is present — not a bare clickable `<div>`, not missing entirely
- **Edge case:** No

### checkoutCompletedEvent_capturesRealPlanName_notEmptyString

- **Verifies:** AC4
- **Precondition:** Mocked PostHog client; mocked adapter's session-retrieve returns a real plan in metadata
- **Action:** Call `handleGetBillingSuccess` with a valid `session_id`
- **Expected result:** The PostHog `capture` call's event properties include `planName` set to the real plan — not an empty string
- **Edge case:** Yes — this is the exact pre-existing bug being fixed

### billingSuccess_missingSessionId_failsOpenToOriginalRedirect

- **Verifies:** AC5
- **Precondition:** Request with no `session_id` query parameter
- **Action:** Call `handleGetBillingSuccess`
- **Expected result:** Falls back to a direct 302 to `/dashboard`, no confirmation page, no thrown error
- **Edge case:** Yes

### billingSuccess_stripeRetrieveFails_failsOpenToOriginalRedirect

- **Verifies:** AC5
- **Precondition:** Mocked adapter's session-retrieve throws (simulating a network error or invalid session ID)
- **Action:** Call `handleGetBillingSuccess` with a `session_id` present
- **Expected result:** Falls back to a direct 302 to `/dashboard`, no confirmation page, no thrown error, no unhandled promise rejection
- **Edge case:** Yes

---

## Integration Tests

### fullCheckoutToSuccessFlow_metadataRoundTrips_correctly

- **Verifies:** AC1 (full round-trip)
- **Components involved:** `handlePostCheckout` (sets metadata) → mocked Stripe → `handleGetBillingSuccess` (reads metadata back)
- **Precondition:** Mocked adapter that echoes back whatever metadata was set on creation when the session is later retrieved
- **Action:** Simulate the full flow: create a checkout session for plan "PRO", then call the success handler with the resulting session ID
- **Expected result:** The plan name surfaced on the confirmation page and in the analytics event matches the plan originally selected at checkout — proving the metadata actually round-trips end to end, not just that each half works in isolation

---

## NFR Tests

### noClientSuppliablePlanNameAccepted

- **NFR addressed:** Security
- **Measurement method:** Send a request to `GET /billing/success?session_id=<valid>&plan_name=ENTERPRISE` where the mocked Stripe session's real metadata says `planId: 'FREE'`
- **Pass threshold:** The confirmation page and analytics event both reflect "FREE" (the real, server-sourced value) — the client-supplied `plan_name=ENTERPRISE` query parameter is never read or trusted
- **Tool:** Direct assertion in the same test harness as the other unit tests

---

## Out of Scope for This Test Plan

- Any change to the webhook-driven entitlement flow (`handlePostStripeWebhook`) — unaffected by this story
- Dashboard-level banner rendering — this story's confirmation is a dedicated page, not a dashboard injection

---

## Test Gaps and Risks

None identified.
