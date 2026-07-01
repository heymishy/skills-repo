# Test Plan — lab-s3.2 — Stripe Checkout + plan subscription flow

**Story:** lab-s3.2
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s3.2-stripe-checkout.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. The Stripe adapter is injectable (D37 — `setStripeAdapter()`). Tests inject a mock Stripe adapter that captures calls and returns preset Stripe Checkout session objects. No real Stripe API calls in unit tests.

- Mock checkout session: `{ id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' }`
- Mock price IDs are set via `process.env.STRIPE_PRICE_ID_STARTER = 'price_test_starter'` in test setup
- `posthog-server.js` adapter is monkeypatched to capture events
- Authenticated sessions use `{ accessToken: 'test-token', userId: 'user-123', tenantId: 'tenant-abc' }`

**PCI/sensitivity:** None — no cardholder data handled by the platform. Stripe Checkout handles cardholder data; the platform only receives session URLs.

**Test data gaps:** AC5 (pricing configurability end-to-end) requires a real Stripe environment — tested via pre-launch smoke test (lab-s3.5).

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | POST /billing/checkout → Stripe session + 302 | Unit | T1.1, T1.2, T1.3 | None |
| AC2 | Unauthenticated → 401, no Stripe call | Unit | T2.1 | None |
| AC3 | Missing/placeholder price ID → 500 | Unit | T3.1, T3.2 | None |
| AC4 | success_url includes {CHECKOUT_SESSION_ID} | Unit | T4.1 | None |
| AC5 | Pricing configurability (structural guarantee) | Unit (structural) | T5.1 | End-to-end requires real Stripe (lab-s3.5) |
| AC6 | GET /billing/success → 302 /dashboard + PostHog | Unit | T6.1, T6.2 | None |
| AC7 | Stripe adapter stub throws | Unit | T7.1 | None |

---

## Gap table

| AC | Gap type | Handling | Justification |
|----|----------|----------|---------------|
| AC5 (end-to-end) | Requires real Stripe API | Structural unit test (T5.1) covers the code path; end-to-end verification is lab-s3.5 AC3 pre-launch smoke test | Verifying that a changed env var propagates to a real Stripe Checkout session requires a live Stripe connection. The structural guarantee (price ID read from env var, not hardcoded) is testable at unit level. |

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T1 — POST /billing/checkout happy path (AC1)

**T1.1** — `checkout-calls-stripe-create-session-with-subscription-mode`
Covers: AC1
Precondition: Authenticated session; mock Stripe adapter wired; `STRIPE_PRICE_ID_STARTER=price_test_starter`; request body `{ planId: 'starter' }`
Action: Call `POST /billing/checkout` handler
Expected: Mock Stripe adapter `createCheckoutSession` called with `{ mode: 'subscription', line_items: [{ price: 'price_test_starter', quantity: 1 }], success_url: ..., cancel_url: ... }`
Edge case: none

**T1.2** — `checkout-redirects-to-stripe-session-url`
Covers: AC1
Precondition: T1.1; mock adapter returns `{ url: 'https://checkout.stripe.com/pay/cs_test_123' }`
Action: Inspect response after handler
Expected: Response is 302; `Location` header is `https://checkout.stripe.com/pay/cs_test_123`
Edge case: none

**T1.3** — `checkout-includes-client-reference-id`
Covers: AC1 (needed for lab-s3.4 webhook to identify tenant)
Precondition: T1.1 setup; authenticated session with `tenantId: 'tenant-abc'`
Action: Inspect mock Stripe adapter call arguments
Expected: `createCheckoutSession` called with `client_reference_id: 'tenant-abc'`
Edge case: This is critical for the webhook handler in lab-s3.4 — missing `client_reference_id` means credits cannot be provisioned

### T2 — Unauthenticated → 401 (AC2)

**T2.1** — `checkout-unauthenticated-returns-401-no-stripe-call`
Covers: AC2
Precondition: No session (no `req.session.accessToken`)
Action: Call `POST /billing/checkout`
Expected: Response is 401; mock Stripe adapter `createCheckoutSession` was NOT called (invocation count is 0)
Edge case: none

### T3 — Missing/placeholder price ID → 500 (AC3)

**T3.1** — `checkout-missing-price-id-returns-500`
Covers: AC3
Precondition: `STRIPE_PRICE_ID_STARTER` is not set (undefined); authenticated session
Action: Call `POST /billing/checkout` with `planId: 'starter'`
Expected: Response is 500 with body containing "Billing not configured"; no Stripe API call
Edge case: none

**T3.2** — `checkout-placeholder-price-id-returns-500`
Covers: AC3
Precondition: `STRIPE_PRICE_ID_STARTER=STRIPE_PLAN_PRICE_ID_PLACEHOLDER`; authenticated session
Action: Call `POST /billing/checkout` with `planId: 'starter'`
Expected: Response is 500 "Billing not configured"; no Stripe call
Edge case: none

### T4 — success_url includes {CHECKOUT_SESSION_ID} (AC4)

**T4.1** — `success-url-contains-checkout-session-id-template`
Covers: AC4
Precondition: T1.1 setup
Action: Inspect the `success_url` parameter passed to mock Stripe `createCheckoutSession`
Expected: `success_url` contains the literal string `{CHECKOUT_SESSION_ID}` (Stripe template literal — not substituted at this point)
Edge case: The `{CHECKOUT_SESSION_ID}` must be the Stripe-specific template parameter — not a platform-generated value

### T5 — Price ID sourced from env var (structural) (AC5)

**T5.1** — `price-id-read-from-env-not-hardcoded`
Covers: AC5 (structural guarantee)
Precondition: Set `STRIPE_PRICE_ID_STARTER=price_env_configured_value`; authenticated session
Action: Call `POST /billing/checkout`; inspect the price ID passed to mock Stripe adapter
Expected: `createCheckoutSession` called with `price: 'price_env_configured_value'` — the env var value, not a hardcoded string
Edge case: If the source code contains a hardcoded price ID like `'price_1234'`, this test fails

### T6 — GET /billing/success (AC6)

**T6.1** — `billing-success-redirects-to-dashboard`
Covers: AC6 §1
Precondition: Authenticated session; `GET /billing/success?session_id=cs_test_123`
Action: Call handler
Expected: Response is 302 to `/dashboard`
Edge case: none

**T6.2** — `billing-success-fires-posthog-checkout-completed`
Covers: AC6 §2
Precondition: PostHog adapter monkeypatched; same setup as T6.1
Action: Call handler; check captured PostHog calls
Expected: `checkout_completed` event captured with `{ planName }` property
Edge case: Event must not block the redirect response

### T7 — Stripe adapter stub throws (AC7)

**T7.1** — `default-stripe-adapter-throws-on-create-checkout`
Covers: AC7
Precondition: `stripe-client.js` required fresh without calling `setStripeAdapter()`
Action: Call `createCheckoutSession({})`
Expected: Throws `Error('Adapter not wired: stripeClient. Call setStripeAdapter() before use.')`
Edge case: none

---

## Integration tests

**IT1** — `billing-routes-registered-in-server`
Covers: AC1, AC6 (route registration integration)
Precondition: Server module loaded
Action: Verify `POST /billing/checkout` and `GET /billing/success` routes are registered
Expected: Both routes exist; `POST /billing/checkout` is protected by auth guard (returns 401 without session); `GET /billing/success` also requires auth
Edge case: none

**IT2** — `stripe-adapter-wired-in-server`
Covers: AC7 (D37 production wiring)
Precondition: Server started with `STRIPE_SECRET_KEY` set (test mode key)
Action: Require server; verify `setStripeAdapter` was called with a real Stripe SDK instance
Expected: Calling `createCheckoutSession` does not throw "Adapter not wired"
Edge case: none

---

## NFR tests

**NFR1** — `no-stripe-secret-key-in-committed-files`
Covers: NFR — `STRIPE_SECRET_KEY` must not be committed
Precondition: Running in git repository
Action: `git grep STRIPE_SECRET_KEY` (check for literal value)
Expected: Zero results where `STRIPE_SECRET_KEY` appears as a value (i.e. `STRIPE_SECRET_KEY=sk_test_...`); references like `process.env.STRIPE_SECRET_KEY` in source are acceptable
Edge case: none

---

## State update fields

- `totalTests`: 10
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
