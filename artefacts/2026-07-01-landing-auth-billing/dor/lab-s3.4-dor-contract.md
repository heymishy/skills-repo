# DoR Contract — lab-s3.4 — Stripe webhook handler (provision credits, idempotency)

**Story:** lab-s3.4
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

`POST /webhook/stripe` handler added to `src/web-ui/routes/billing.js`. Handler verifies Stripe signature (via injectable adapter, D37), dispatches on event type, and calls `adjustBalance(tenantId, creditAmount)` from `credits.js` (lab-s3.1). Idempotency store: `INSERT INTO stripe_events (stripe_event_id, event_type, processed_at) VALUES ($1, $2, now()) ON CONFLICT DO NOTHING` — duplicate events (same stripe_event_id) skip `adjustBalance`. `verifyWebhookSignature(payload, sig, secret)` method added to `stripe-client.js` (from lab-s3.2). Route registered in `server.js` BEFORE any JSON body-parsing middleware (raw body required for Stripe signature verification). Event types handled: `checkout.session.completed`, `invoice.paid`, `payment_intent.succeeded`; all others return 200 with `stripe_unhandled_event` log.

## What will NOT be built

- Stripe Customer Portal (lab-s3.5)
- Subscription cancellation or refund handling (post-MVP)
- Email notification on credit provisioning (post-MVP)
- Manual credit grants or Stripe tax/invoice line-item details

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock Stripe adapter verifyWebhookSignature throws → assert 400; valid signature → event dispatched | Unit |
| AC2 | `checkout.session.completed` with `client_reference_id=tenant-abc`, plan=starter → assert `adjustBalance('tenant-abc', 1000)` called; assert tenantId comes from `client_reference_id` | Unit |
| AC3 | `invoice.paid` → monthly credit renewal provisioning via `adjustBalance` | Unit |
| AC4 | `payment_intent.succeeded` with `metadata.credit_amount='500'` → `adjustBalance(tenantId, 500)` (string parsed to int) | Unit |
| AC5 | First receipt of event → idempotency store INSERT called + adjustBalance called; second receipt of same stripe_event_id → adjustBalance NOT called (explicit invocation count assertion) | Unit |
| AC6 | Unhandled event type (e.g. `customer.updated`) → 200, no adjustBalance, log `stripe_unhandled_event` | Unit |
| AC7 | `setStripeAdapter()` NOT called → `verifyWebhookSignature()` throws "Adapter not wired" | Unit |

## Assumptions

- lab-s3.1 is complete — `credits` table, `stripe_events` table, and `credits.js` module exist
- lab-s3.2 is complete — `stripe-client.js` module with injectable adapter exists; `verifyWebhookSignature` is added to it in this story
- `STRIPE_WEBHOOK_SECRET` is a Fly.io secret (never committed)
- `CREDITS_PLAN_STARTER=1000`, `CREDITS_PLAN_PRO=2500` (or equivalent) env vars set at test time
- Raw body for signature verification: `POST /webhook/stripe` route is registered BEFORE `express.json()` or equivalent JSON body parser in `server.js` — this is a hard constraint

## Estimated touchpoints

Files: `src/web-ui/routes/billing.js` (modified — add POST /webhook/stripe), `src/web-ui/modules/stripe-client.js` (modified — add verifyWebhookSignature method), `src/web-ui/server.js` (modified — register webhook route BEFORE JSON body parser)
Services: Neon Postgres (stripe_events idempotency table — monkeypatched in tests), credits.js adapter
APIs: Stripe (signature verification — monkeypatched in tests)

## schemaDepends

`dorStatus` — upstream stories lab-s3.1 and lab-s3.2 must both be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json`.
