# Test Plan — lab-s3.4 — Stripe webhook handler (provision credits, idempotency)

**Story:** lab-s3.4
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s3.4-stripe-webhook.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. Both the Stripe signature verification adapter and the credits DB adapter are injectable. Tests inject:
- A mock Stripe adapter whose `verifyWebhookSignature(payload, sig, secret)` method either returns a pre-parsed event object (valid signature) or throws `Error('Stripe signature invalid')` (invalid signature)
- A mock credits adapter that captures `adjustBalance` calls and tracks whether a `stripe_event_id` was already processed (idempotency store mock)

Env vars set in test: `CREDITS_PLAN_STARTER=1000`, `CREDITS_PLAN_PRO=2500`, `STRIPE_WEBHOOK_SECRET=whsec_test`.

Raw body constraint: tests construct a raw Buffer body to simulate the raw request before JSON parsing.

**PCI/sensitivity:** None — webhook events contain Stripe metadata only (no cardholder data).

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | Signature verification: invalid → 400; valid → dispatch | Unit | T1.1, T1.2 | None |
| AC2 | `checkout.session.completed` → `adjustBalance(tenantId, creditAmount)` | Unit | T2.1, T2.2 | None |
| AC3 | `invoice.paid` → monthly credit renewal provisioning | Unit | T3.1 | None |
| AC4 | `payment_intent.succeeded` → top-up via `metadata.credit_amount` | Unit | T4.1 | None |
| AC5 | Idempotency: duplicate event → `adjustBalance` NOT called second time | Unit | T5.1, T5.2 | None |
| AC6 | Unknown event type → 200 (no retry) | Unit | T6.1 | None |
| AC7 | Stripe adapter injectable in tests | Unit | T7.1 | None |

---

## Gap table

No gaps — all ACs are unit testable with injectable adapters.

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T1 — Signature verification (AC1)

**T1.1** — `invalid-signature-returns-400`
Covers: AC1 §2
Precondition: Mock Stripe adapter's `verifyWebhookSignature` throws `Error('Stripe signature invalid')` when called
Action: POST to `/webhook/stripe` with any body and a wrong `stripe-signature` header
Expected: Response is 400; `adjustBalance` NOT called; no event dispatched
Edge case: none

**T1.2** — `valid-signature-dispatches-event`
Covers: AC1 §3
Precondition: Mock Stripe adapter's `verifyWebhookSignature` returns a pre-parsed `checkout.session.completed` event; credits adapter wired
Action: POST to `/webhook/stripe` with matching signature header
Expected: Event is dispatched to the correct handler (`checkout.session.completed` branch); `adjustBalance` is called; response is 200
Edge case: none

### T2 — checkout.session.completed (AC2)

**T2.1** — `checkout-completed-provisions-correct-credit-amount`
Covers: AC2 §3
Precondition: Mock Stripe adapter returns `{ type: 'checkout.session.completed', data: { object: { client_reference_id: 'tenant-abc', metadata: { planName: 'starter' } } } }`; `CREDITS_PLAN_STARTER=1000`; idempotency mock returns "not yet processed"
Action: POST webhook with this event
Expected: `adjustBalance('tenant-abc', 1000)` called; response is 200
Edge case: none

**T2.2** — `checkout-completed-uses-client-reference-id-for-tenant`
Covers: AC2 §1
Precondition: T2.1 setup
Action: Inspect the `adjustBalance` call arguments
Expected: First argument is `client_reference_id` value (`'tenant-abc'`) — NOT the Stripe session ID or any other field
Edge case: none

### T3 — invoice.paid (AC3)

**T3.1** — `invoice-paid-provisions-monthly-renewal-credits`
Covers: AC3
Precondition: Mock Stripe adapter returns `{ type: 'invoice.paid', data: { object: { subscription: 'sub_test', lines: { data: [{ price: { id: 'price_test_starter' } }] } } } }`; `CREDITS_PLAN_STARTER=1000`; `client_reference_id` or customer metadata carries `tenantId`; idempotency not yet processed
Action: POST webhook with `invoice.paid` event
Expected: `adjustBalance(tenantId, 1000)` called; response is 200
Edge case: none

### T4 — payment_intent.succeeded (AC4)

**T4.1** — `payment-intent-succeeded-provisions-top-up-amount`
Covers: AC4
Precondition: Mock Stripe adapter returns `{ type: 'payment_intent.succeeded', data: { object: { metadata: { credit_amount: '500', tenant_id: 'tenant-abc' } } } }`; idempotency not yet processed
Action: POST webhook with `payment_intent.succeeded` event
Expected: `adjustBalance('tenant-abc', 500)` called (amount from `metadata.credit_amount`); response is 200
Edge case: `metadata.credit_amount` is a string — must be parsed to integer before calling `adjustBalance`

### T5 — Idempotency (AC5)

**T5.1** — `first-receipt-writes-stripe-event-id`
Covers: AC5 §1
Precondition: Idempotency store mock starts empty; `checkout.session.completed` event with `id: 'evt_test_123'`
Action: POST webhook
Expected: Idempotency mock `insert('evt_test_123')` was called; `adjustBalance` was called
Edge case: none

**T5.2** — `duplicate-stripe-event-id-skips-adjust-balance`
Covers: AC5 §2
Precondition: Idempotency store mock returns "already processed" for `'evt_test_123'`
Action: POST the same `checkout.session.completed` event with same `id: 'evt_test_123'`
Expected: `adjustBalance` is NOT called (invocation count remains 0 for this second call); response is 200 (acknowledged, not errored)
Edge case: The response must still be 200 — not 4xx or 5xx; returning 200 for a duplicate is the correct Stripe idempotency pattern

### T6 — Unknown event type → 200 (AC6)

**T6.1** — `unknown-event-type-returns-200-with-log`
Covers: AC6
Precondition: Mock Stripe adapter returns `{ type: 'customer.updated', data: { object: {} } }`; logger captured
Action: POST webhook with `customer.updated` event (or any unhandled type)
Expected: Response is 200; `adjustBalance` NOT called; log entry contains `stripe_unhandled_event` or similar; no unhandled exception thrown
Edge case: none

### T7 — Stripe adapter injectable (AC7)

**T7.1** — `default-stripe-adapter-throws-in-webhook-handler`
Covers: AC7
Precondition: `stripe-client.js` loaded without calling `setStripeAdapter()`
Action: Call `verifyWebhookSignature()` on the default (un-wired) adapter
Expected: Throws with "Adapter not wired" error message
Edge case: none

---

## Integration tests

**IT1** — `webhook-route-registered-before-json-body-parser`
Covers: Architecture Constraint — raw body requirement
Precondition: Server route registration order inspected
Action: Verify `POST /webhook/stripe` is registered BEFORE any `express.json()` or equivalent JSON body-parsing middleware in `server.js`
Expected: The webhook route appears in the route registration sequence before the JSON parser middleware; a comment or explicit ordering mechanism is present
Edge case: If the JSON parser runs first, Stripe signature verification will always fail — this is a hard constraint

**IT2** — `idempotency-store-uses-on-conflict-do-nothing`
Covers: AC5 (idempotency SQL pattern)
Precondition: Idempotency DB adapter captures SQL; first receipt scenario
Action: Process a `checkout.session.completed` event; inspect SQL calls to `stripe_events` table
Expected: INSERT SQL contains `ON CONFLICT DO NOTHING` or equivalent upsert pattern; no `SELECT` before the `INSERT` (check-then-insert is not safe under concurrent delivery)
Edge case: none

---

## NFR tests

**NFR1** — `credits-provisioning-audit-logged`
Covers: NFR — `adjustBalance` calls must be accompanied by structured log entry
Precondition: Logger captured; `checkout.session.completed` scenario
Action: Process event; inspect log entries
Expected: At least one log entry with `{ event: 'credits_provisioned', tenantId, amount, stripeEventId }` present after `adjustBalance` call
Edge case: none

---

## State update fields

- `totalTests`: 10
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
