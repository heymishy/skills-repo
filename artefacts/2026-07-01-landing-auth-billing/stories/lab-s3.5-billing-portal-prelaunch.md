# Story lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e3-billing-credits
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 1
**Scope stability:** Stable

## User story

As the platform operator,
I want a `/settings/billing` route that redirects authenticated users to their Stripe Customer Portal, and a pre-launch checklist that verifies all Stripe placeholder IDs are replaced with live production values before any paying user reaches checkout,
So that users can self-serve their subscription management and the operator can confidently open the platform to paying users.

## Metric linkage

- **M3** (Monthly cost recovery rate, benefit-metric.md §M3): The billing portal gives users self-serve access to update payment methods and manage subscriptions — reducing operator overhead and increasing retention.
- **M4** (Time to first paid plan, benefit-metric.md §M4): The pre-launch checklist is the go/no-go gate before any real payment can be processed. Until this story's checklist passes, M4 cannot be measured.
- **M5** (Pricing configurability, benefit-metric.md §M5): AC3 verifies that a price ID change in Stripe propagates to new checkout sessions without a code deploy — this is the M5 minimum validation signal.

## Acceptance criteria

**AC1** — `GET /settings/billing` redirects authenticated users to their Stripe Customer Portal session
Given an authenticated user navigates to `/settings/billing`,
When the handler runs,
Then: (1) a Stripe Customer Portal session is created via the Stripe API using the tenant's `stripe_customer_id` (stored in the `credits` table or a `customers` table), (2) the response is 302 to the Stripe Customer Portal session URL.

**AC2** — `GET /settings/billing` returns 302 to `/` for unauthenticated users
Given an unauthenticated user navigates to `/settings/billing`,
When the handler runs,
Then HTTP 302 to `/` is returned — no Stripe API call is made.

**AC3** — Pre-launch smoke test: `scripts/check-prelaunch-stripe.js` passes when all placeholder IDs are replaced
Given the environment variables are set with real (non-placeholder) Stripe price IDs,
When `node scripts/check-prelaunch-stripe.js` is run,
Then: (1) exit code 0 and the output lists each checked env var with "✓ set (not placeholder)", (2) the script verifies that no environment variable value matches `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` string.

**AC4** — Pre-launch smoke test fails when any placeholder ID is present
Given any Stripe price ID environment variable (`STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`, etc.) is set to `STRIPE_PLAN_PRICE_ID_PLACEHOLDER`,
When `node scripts/check-prelaunch-stripe.js` is run,
Then exit code is 1 and the output names the specific env var that still holds the placeholder value.

**AC5** — Pricing configurability verification: changing a Stripe price ID in Stripe dashboard + env var updates checkout sessions (M5 minimum validation signal)
Given the operator: (1) changes a plan's price in the Stripe test dashboard, (2) updates the corresponding env var in Fly.io secrets, (3) redeploys,
When a new user selects that plan on `/welcome`,
Then the Stripe Checkout session created uses the new price ID — confirmed by inspecting the checkout session in the Stripe dashboard. [Testability: accepted by operator on 2026-07-01 — automated verification requires a live Stripe API call; M5 is explicitly a pre-launch smoke test per benefit-metric.md. Verified manually once before go-live as part of the pre-launch checklist.]

**AC6** — Stripe Customer Portal session uses the operator-configured return URL
Given the Stripe Customer Portal is opened,
When the user clicks "Return to platform" in the portal,
Then the browser navigates to the platform's `/dashboard` URL (configured as the `return_url` in the Customer Portal session creation call).

## Out of scope

- Invoice download or email invoice history
- Subscription cancellation handling in the platform (Stripe handles the cancellation UI; the webhook for `customer.subscription.deleted` is post-MVP)
- Tax or VAT configuration (Stripe Tax is post-MVP)
- Automated CI gate that blocks deployment when placeholders are present (the script is a manual pre-launch step in MVP; CI integration is a post-MVP improvement)

## Dependencies

- **lab-s3.2 must be complete** — Stripe Checkout creates `stripe_customer_id` on first checkout; the billing portal needs that ID
- **lab-s3.4 must be complete** — webhook handler must be live before the portal is meaningful (subscriptions must be provisioned before users can manage them)
- Stripe Customer Portal must be configured in the Stripe dashboard (portal settings, return URL, features enabled)

## Implementation touchpoints

- `src/web-ui/routes/billing.js` (modified, from lab-s3.2): add `GET /settings/billing` handler
- `src/web-ui/modules/stripe-client.js` (modified, from lab-s3.2): add `createPortalSession(customerId, returnUrl)` method
- `scripts/check-prelaunch-stripe.js` (new): pre-launch validation script — checks all Stripe env vars for placeholder values
- `src/web-ui/server.js` (modified): register `/settings/billing` route

## Architecture Constraints

- **D37 (Injectable adapter rule, CLAUDE.md)**: `createPortalSession` uses the existing Stripe adapter (injectable from lab-s3.2) — no new adapter needed.
- **No credentials committed**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must never appear in committed code. AC3/AC4 check env vars at runtime only.
- **CJS-only (Style Guide)**: `scripts/check-prelaunch-stripe.js` uses `require()` / process.env reads only — no npm dependencies in the script.

## NFRs

- **`stripe_customer_id` stored securely**: The Stripe customer ID is not a secret (it's a Stripe-side reference, not a payment instrument) but must not be logged at INFO level in production — it should be treated as internal data.
- **Pre-launch checklist is the go/no-go gate for real payments**: The operator must run `node scripts/check-prelaunch-stripe.js` and confirm exit 0 before switching Fly.io secrets from test to live Stripe keys. This is a named process constraint, not a technical one.

## Test

Node.js tests: `tests/check-lab-s3.5-billing-portal.js` (new) — verify (1) `GET /settings/billing` with no session → 302 to `/` (AC2), (2) `GET /settings/billing` with valid session → calls `createPortalSession` with correct `stripe_customer_id` and `return_url` → 302 to portal URL (AC1), (3) `scripts/check-prelaunch-stripe.js` exits 0 when all env vars set to non-placeholder values (AC3), (4) exits 1 when any env var is `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` (AC4). Monkeypatch Stripe adapter and process.env.
