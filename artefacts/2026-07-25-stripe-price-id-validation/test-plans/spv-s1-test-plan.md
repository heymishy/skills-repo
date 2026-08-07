## Test Plan: Reject a non-price-shaped Stripe price ID config

**Story reference:** artefacts/2026-07-25-stripe-price-id-validation/stories/spv-s1-reject-non-price-id-checkout-config.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Non-price-shaped value -> 500 "Billing not configured", no Stripe call | 2 tests | — | 🟢 |
| AC2 | Specific console.error naming the env var is emitted | 1 test | — | 🟢 |
| AC3 | Valid price_... value -> unchanged happy path | 1 test | — | 🟢 |
| AC4 | Existing missing-env-var / placeholder checks unchanged | 2 tests (regression) | — | 🟢 |

## Integration Tests

### productIdInsteadOfPriceIdReturns500NoStripeCall
- **Verifies:** AC1
- **Precondition:** `STRIPE_PRICE_ID_STARTER = 'prod_UucwFl0LpPlOod'` (a real-shaped Product ID, matching the actual staging incident)
- **Action:** `POST /billing/checkout` with `{ planId: 'starter' }`
- **Expected result:** `500`, body `"Billing not configured"`, zero calls recorded in the `stripeCalls` spy

### arbitraryNonPriceShapedValueReturns500NoStripeCall
- **Verifies:** AC1
- **Precondition:** `STRIPE_PRICE_ID_STARTER = 'some-typo-value'` (not `price_`-prefixed, not the placeholder, not a `prod_` id either -- any other non-conforming string)
- **Action:** `POST /billing/checkout` with `{ planId: 'starter' }`
- **Expected result:** `500`, body `"Billing not configured"`, zero Stripe calls

### specificLogLineNamesTheEnvVar
- **Verifies:** AC2
- **Precondition:** `STRIPE_PRICE_ID_STARTER = 'prod_UucwFl0LpPlOod'`, `console.error` spied
- **Action:** `POST /billing/checkout` with `{ planId: 'starter' }`
- **Expected result:** `console.error` called at least once with a message containing `STRIPE_PRICE_ID_STARTER` and indicating a Price-ID-shape mismatch

### validPriceIdUnchangedHappyPath
- **Verifies:** AC3
- **Precondition:** `STRIPE_PRICE_ID_STARTER = 'price_env_configured_value'`
- **Action:** `POST /billing/checkout` with `{ planId: 'starter' }`
- **Expected result:** `stripeClient.createCheckoutSession` called exactly once with the configured price ID; `302` redirect to the Stripe session URL (byte-identical to pre-existing T1/T4 assertions in `check-lab-s3.2-stripe-checkout.js`)

### existingMissingAndPlaceholderChecksStillPass (regression, 2 tests)
- **Verifies:** AC4
- **Action:** Re-run `check-lab-s3.2-stripe-checkout.js`'s existing T3.1 (missing env var) and T3.2 (placeholder sentinel) cases unmodified
- **Expected result:** Both still return `500` / `"Billing not configured"` / zero Stripe calls, exactly as before this story

## Out of Scope for This Test Plan

- Testing Stripe's own API behaviour for a real `price_...` vs `prod_...` lookup -- this story's check happens entirely before any Stripe API call is made.
