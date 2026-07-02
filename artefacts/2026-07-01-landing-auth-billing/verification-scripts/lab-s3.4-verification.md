# AC Verification Script — lab-s3.4 — Stripe webhook handler (provision credits, idempotency)

**Story:** lab-s3.4
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / Platform Engineer

---

## Setup

`STRIPE_WEBHOOK_SECRET`, `CREDITS_PLAN_STARTER`, `CREDITS_PLAN_PRO` must be set in `.env`. Use the Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

This gives you a webhook secret to put in `STRIPE_WEBHOOK_SECRET`. Stripe CLI triggers can simulate events.

Start server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s3.4-stripe-webhook.js
```
Expected: all checks pass. Zero failures.

---

## Scenarios

### Scenario AC1 — Stripe signature verification blocks invalid requests

1. Send a POST request to `/webhook/stripe` without a `stripe-signature` header (or with a wrong one):
   ```
   curl -X POST http://localhost:3000/webhook/stripe -H "Content-Type: application/json" -d '{"type":"test.event"}'
   ```
2. **Expected:** Response is 400. No credits are provisioned. Server log shows "signature invalid" or similar.
3. If the webhook returns 200 or processes the event, AC1 fails — any request without a valid Stripe signature should be rejected.

---

### Scenario AC2 — Subscription checkout provisions credits

1. Using the Stripe CLI, trigger a `checkout.session.completed` event:
   ```
   stripe trigger checkout.session.completed
   ```
   Note: The `client_reference_id` must be set to a valid tenant ID in your system. For a more realistic test, complete a real Stripe Checkout (AC1 of lab-s3.2) with a test card.
2. After the event is received, check the credits balance for the test tenant:
   ```sql
   SELECT balance FROM credits WHERE tenant_id = 'your-test-tenant-id';
   ```
3. **Expected:** Balance increased by `CREDITS_PLAN_STARTER` (e.g. 1000) or `CREDITS_PLAN_PRO` depending on which plan was purchased.
4. If the balance did not change, AC2 fails.

---

### Scenario AC3 — Invoice.paid provisions monthly renewal credits

1. Trigger an `invoice.paid` event for a subscription renewal:
   ```
   stripe trigger invoice.paid
   ```
2. Check the credits balance.
3. **Expected:** Balance increased by the monthly allocation for the subscribed plan (same as initial provisioning in AC2).
4. If balance did not change, AC3 fails.

---

### Scenario AC4 — payment_intent.succeeded provisions top-up credits

1. Create a test `payment_intent.succeeded` event with `metadata.credit_amount = 500`:
   ```
   stripe trigger payment_intent.succeeded --add payment_intent:metadata.credit_amount=500 --add payment_intent:metadata.tenant_id=your-test-tenant-id
   ```
2. Check the balance.
3. **Expected:** Balance increased by exactly 500.
4. If balance changed by a different amount, AC4 fails.

---

### Scenario AC5 — Same event received twice does not double-credit (idempotency)

1. Note the current credits balance.
2. Using the Stripe CLI or webhook replay, send the same `checkout.session.completed` event twice (with the same Stripe event ID).
3. After both deliveries, check the balance.
4. **Expected:** Balance increased by the credit amount exactly once. If the balance increased twice (double-credit), AC5 fails — idempotency is broken. Check the `stripe_events` table:
   ```sql
   SELECT * FROM stripe_events WHERE stripe_event_id = 'evt_the_event_id';
   ```
   **Expected:** Exactly one row with that event ID.

---

### Scenario AC6 — Unknown event type returns 200 without error

1. Trigger an event type that the webhook does not handle:
   ```
   stripe trigger customer.updated
   ```
2. **Expected:** Response is 200. No error in the server log. No credits change. A log entry notes "unhandled event type: customer.updated".
3. If the server returns 4xx or 5xx for this event, Stripe will retry it — which is wasteful. AC6 requires 200 for all acknowledged (even unhandled) events.

---

### Scenario AC7 — Webhook adapter is injectable

*Verified automatically. Human verification:*

1. Run `node tests/check-lab-s3.4-stripe-webhook.js`.
2. Check the test named "default-stripe-adapter-throws-in-webhook-handler".
3. **Expected:** This test passes — confirming the Stripe adapter is injectable and the default stub throws.

---

## Reset instructions

Between scenarios, reset the test tenant's credits balance:
```sql
UPDATE credits SET balance = 0 WHERE tenant_id = 'your-test-tenant-id';
```
Also clear processed stripe event IDs if re-running idempotency tests:
```sql
DELETE FROM stripe_events WHERE stripe_event_id = 'evt_the_event_id';
```
