# Story lab-s3.4 — Stripe webhook handler (provision credits, idempotency)

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e3-billing-credits
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As the platform operator,
I want a Stripe webhook handler that listens for payment and subscription events and provisions credits to the paying tenant,
So that credits are automatically available after a successful Stripe Checkout without any manual operator action.

## Metric linkage

- **M3** (Monthly cost recovery rate, benefit-metric.md §M3): Credits are provisioned by this handler after each successful payment. Without it, M3 cannot be measured (payments arrive but credits are never allocated).
- **M4** (Time to first paid plan, benefit-metric.md §M4): The first `checkout.session.completed` event handled by this webhook is the M4 signal: credits provisioned for the first paying user, completing the full flow.

## Acceptance criteria

**AC1** — `POST /webhook/stripe` receives and verifies Stripe events
Given Stripe sends a webhook to `POST /webhook/stripe`,
When the handler runs,
Then: (1) the Stripe signature header (`stripe-signature`) is verified against the raw request body using the Stripe webhook signing secret (`STRIPE_WEBHOOK_SECRET`), (2) an invalid or missing signature returns HTTP 400, (3) a valid event is parsed and dispatched to the appropriate event handler.

**AC2** — `checkout.session.completed` event provisions the correct credit amount to the tenant
Given Stripe sends a `checkout.session.completed` event for a subscription purchase,
When the handler processes the event,
Then: (1) the `tenant_id` is extracted from the Stripe session's `client_reference_id` field (set when creating the checkout session in lab-s3.2), (2) the credit amount associated with the purchased plan is read from environment variables (e.g. `CREDITS_PLAN_STARTER=1000`), (3) `adjustBalance(tenantId, creditAmount)` is called, (4) the response is HTTP 200.

**AC3** — `invoice.paid` event provisions monthly credit renewal
Given Stripe sends an `invoice.paid` event for a subscription renewal,
When the handler processes the event,
Then the subscription plan is identified, the monthly credit allocation is read from env vars, and `adjustBalance(tenantId, creditAmount)` is called — identical provisioning logic to AC2.

**AC4** — `payment_intent.succeeded` event provisions credits for one-time top-up payments
Given Stripe sends a `payment_intent.succeeded` event (for a credit top-up, not a subscription),
When the handler processes the event,
Then the credit amount is read from the payment intent's `metadata.credit_amount` field (set when creating the top-up Payment Intent), and `adjustBalance(tenantId, creditAmount)` is called.

**AC5** — Idempotency: processing the same Stripe event twice does not double-credit
Given a `checkout.session.completed` event is received,
When the same `stripe_event_id` arrives a second time (replay scenario on Fly.io without sticky routing),
Then: (1) on first receipt, `stripe_event_id` is written to the `stripe_events` table (created in lab-s3.1), (2) on second receipt, the `stripe_event_id` is found in the table and the event is acknowledged with HTTP 200 without calling `adjustBalance` a second time.

**AC6** — Unknown or unhandled event types return HTTP 200 (acknowledged but not processed)
Given Stripe sends an event type not handled by this webhook (e.g. `customer.updated`),
When the handler runs,
Then HTTP 200 is returned and a `stripe_unhandled_event` log entry is emitted — no error thrown, no 4xx/5xx that would cause Stripe to retry.

**AC7** — Stripe adapter is injectable (D37)
Given `src/web-ui/modules/stripe-client.js` (from lab-s3.2) is called for signature verification,
When the webhook handler runs in tests,
Then the test can inject a mock Stripe adapter that bypasses the real signature check — the default stub throws per D37.

## Out of scope

- Stripe Customer Portal (lab-s3.5)
- Subscription cancellation or refund handling (post-MVP)
- Email notification on credit provisioning (post-MVP — Stripe sends its own transactional emails)
- Manual credit grants by the operator (post-MVP)
- Stripe tax or invoice line-item details (post-MVP)

## Dependencies

- **lab-s3.1 must be complete** — `credits` table and `stripe_events` table must exist (used for AC5 idempotency and AC2 balance write)
- **lab-s3.2 must be complete** — the `checkout.session.completed` event includes `client_reference_id` set in the checkout session creation; this story requires that field to be set correctly
- `STRIPE_WEBHOOK_SECRET` environment variable (Fly.io secret, not committed)
- `CREDITS_PLAN_STARTER`, `CREDITS_PLAN_PRO` (or equivalent) env vars for credit amounts per plan

## Implementation touchpoints

- `src/web-ui/routes/billing.js` (modified, from lab-s3.2): add `POST /webhook/stripe` handler
- `src/web-ui/modules/credits.js` (from lab-s3.1): `adjustBalance` called by webhook handler
- `src/web-ui/modules/stripe-client.js` (from lab-s3.2): `verifyWebhookSignature` method added
- `src/web-ui/server.js` (modified): register `/webhook/stripe` route; ensure raw body parsing is configured for this route (Stripe requires the raw body for signature verification — JSON body parser must NOT run on this route)

## Architecture Constraints

- **Raw body requirement (Stripe)**: `POST /webhook/stripe` must receive the raw, unparsed request body for signature verification. The route must be registered BEFORE any JSON body-parsing middleware. If the JSON body parser runs first, the signature check will fail. This is a hard constraint.
- **D37 (Injectable adapter rule, CLAUDE.md)**: Stripe signature verification adapter must be injectable for tests (AC7).
- **Idempotency (AC5)**: The `stripe_events` table is the idempotency store. The check-and-insert must use a Postgres upsert or `INSERT ... ON CONFLICT DO NOTHING` pattern to be safe under concurrent webhook delivery.
- **HTTP 200 on all acknowledged events (AC6)**: Returning 4xx or 5xx for unhandled event types causes Stripe to retry — do not do this.
- **No credentials committed**: `STRIPE_WEBHOOK_SECRET` must not appear in any committed file.

## NFRs

- **Signature verification non-bypassable in production**: The webhook handler must never skip signature verification outside of `NODE_ENV=test`. In tests, the adapter stub returns a pre-verified event object.
- **Audit log on every credit provisioning event**: `adjustBalance` calls from the webhook handler must be accompanied by a structured log entry: `{ event: 'credits_provisioned', tenantId, amount, stripeEventId }`.

## Test

Node.js tests: `tests/check-lab-s3.4-stripe-webhook.js` (new) — verify (1) invalid signature → 400 (AC1), (2) `checkout.session.completed` with valid signature → `adjustBalance(tenantId, creditAmount)` called (AC2), (3) `invoice.paid` → provisioning (AC3), (4) `payment_intent.succeeded` with `metadata.credit_amount` → provisioning (AC4), (5) duplicate event ID → `adjustBalance` NOT called second time (AC5), (6) unknown event type → 200 (AC6). Monkeypatch Stripe adapter, DB adapter for idempotency store.
