# DoR Contract — lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist

**Story:** lab-s3.5
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

`GET /settings/billing` handler added to `src/web-ui/routes/billing.js`: auth guard (no session → 302 /); call `createPortalSession(stripe_customer_id, returnUrl='/dashboard')` from `stripe-client.js` (method added in this story); respond 302 to portal URL. `createPortalSession(customerId, returnUrl)` method added to `stripe-client.js` — re-uses existing injectable Stripe adapter from lab-s3.2 (no new setX() function needed). Route registered in `server.js`. A new `scripts/check-prelaunch-stripe.js` script: reads all Stripe price ID env vars, checks none equal `STRIPE_PLAN_PRICE_ID_PLACEHOLDER`, exits 0 (all clean) or exits 1 (names specific failing vars).

## What will NOT be built

- Invoice download, email invoice history
- Subscription cancellation handling in the platform
- Stripe Tax / VAT configuration
- Automated CI gate that blocks deployment when placeholders present (manual pre-launch step only in MVP)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | GET /settings/billing with valid session containing `stripeCustomerId` → assert `createPortalSession('cus_test_123', '<returnUrl>')` called on mock adapter, 302 to portal URL | Unit |
| AC2 | GET /settings/billing with no session → assert 302 to `/`, Stripe adapter NOT called | Unit |
| AC3 | `check-prelaunch-stripe.js` with all env vars set to non-placeholder → exit code 0, output lists each var with "✓ set (not placeholder)" | Unit |
| AC4 | `check-prelaunch-stripe.js` with one var = `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` → exit code 1, output names specific failing var | Unit |
| AC5 | Pricing configurability end-to-end: RISK-ACCEPT — requires live Stripe API + Fly.io deploy. Manual pre-launch smoke test only. | Manual (RISK-ACCEPT) |
| AC6 | `createPortalSession` second argument (returnUrl) asserted to be `/dashboard` or `https://<host>/dashboard` | Unit |

## Assumptions

- lab-s3.2 is complete — `stripe-client.js` with injectable Stripe adapter exists
- lab-s3.4 is complete — webhook handler live (billing portal is meaningful once subscriptions exist)
- `stripe_customer_id` is stored per tenant in the `credits` table or a `customers` table after first checkout (populated by webhook flow — lab-s3.4)
- Stripe Customer Portal configured in Stripe dashboard with return URL pointing to `/dashboard`
- `check-prelaunch-stripe.js` uses only `process.env` reads and `process.exit()` — no npm dependencies

## Estimated touchpoints

Files: `src/web-ui/routes/billing.js` (modified — add GET /settings/billing), `src/web-ui/modules/stripe-client.js` (modified — add createPortalSession method), `scripts/check-prelaunch-stripe.js` (new), `src/web-ui/server.js` (modified — register /settings/billing route)
Services: Stripe Customer Portal API (monkeypatched in tests)
APIs: Stripe Portal Sessions API

## schemaDepends

`dorStatus` — upstream stories lab-s3.2 and lab-s3.4 must both be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json`.
