# DoR Contract — lab-s3.2 — Stripe Checkout + plan subscription flow

**Story:** lab-s3.2
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

A `src/web-ui/modules/stripe-client.js` (new) Stripe API wrapper exporting `createCheckoutSession(priceId, tenantId, successUrl, cancelUrl)` and `setStripeAdapter(impl)` (D37: default stub throws). A new `src/web-ui/routes/billing.js` with `POST /billing/checkout` and `GET /billing/success` handlers. `POST /billing/checkout` reads price ID from env var (`STRIPE_PRICE_ID_[PLAN]`), creates Stripe session with `mode: 'subscription'`, `client_reference_id = tenantId`, `success_url` with `{CHECKOUT_SESSION_ID}` template, responds 302. `GET /billing/success` responds 302 to `/dashboard` and fires `checkout_completed` PostHog event. Routes and Stripe adapter wired in `server.js` (separate wiring task). `.env.example` updated with `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` placeholder values.

## What will NOT be built

- Credit provisioning (lab-s3.4 webhook handler)
- Invoice management, tax handling, or VAT
- Credit top-up Payment Intents
- Stripe Customer Portal (lab-s3.5)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock Stripe adapter: POST /billing/checkout with valid session + price ID → assert `createCheckoutSession` called with `mode: 'subscription'`, correct priceId, 302 to mock checkout URL | Unit |
| AC2 | POST /billing/checkout with no session → assert 401, Stripe adapter NOT called | Unit |
| AC3 | POST /billing/checkout with price ID = `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` → assert 500 "Billing not configured"; missing price ID env var → same 500 | Unit |
| AC4 | Assert `success_url` argument contains literal string `{CHECKOUT_SESSION_ID}` (Stripe template parameter) | Unit |
| AC5 | Structural guarantee: price ID read from `process.env.STRIPE_PRICE_ID_[PLAN]` — no hardcoded price ID string in source (verified by T5.1 grep-style test) | Unit |
| AC6 | GET /billing/success with valid session → assert 302 to /dashboard + PostHog `checkout_completed` event called | Unit |
| AC7 | `setStripeAdapter()` NOT called → `createCheckoutSession()` throws "Adapter not wired: stripeClient" | Unit |

## Assumptions

- lab-s3.1 is complete — `credits` table exists (webhook in lab-s3.4 will provision credits; checkout itself does not provision)
- `stripe` npm package is approved for this feature
- `STRIPE_SECRET_KEY` is a Fly.io secret, never committed
- In tests, Stripe adapter is fully monkeypatched — no real Stripe API calls
- `client_reference_id` is the tenant's `tenantId` from `req.session.tenantId`

## Estimated touchpoints

Files: `src/web-ui/modules/stripe-client.js` (new), `src/web-ui/routes/billing.js` (new), `src/web-ui/server.js` (modified — register billing routes, wire Stripe adapter), `.env.example` (modified — add Stripe env var placeholders)
Services: Stripe API (monkeypatched in tests)
APIs: Stripe Checkout Sessions API

## schemaDepends

`dorStatus` — upstream story lab-s3.1 must be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json`.
