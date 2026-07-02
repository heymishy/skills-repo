# Story lab-s3.2 — Stripe Checkout + plan subscription flow

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e3-billing-credits
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As a new visitor / prospective user selecting a plan,
I want to be redirected to a Stripe Checkout page where I can enter my payment details,
So that I can subscribe to a plan and begin using the platform with credits automatically provisioned.

## Metric linkage

- **M3** (Monthly cost recovery rate, benefit-metric.md §M3): Stripe Checkout is the mechanism through which Stripe revenue is collected. Without it, M3 is 0%.
- **M4** (Time to first paid plan, benefit-metric.md §M4): The `checkout.session.completed` Stripe webhook (lab-s3.4) is triggered when a user completes Stripe Checkout. This story creates the checkout session — it is the first step of M4.
- **M5** (Pricing configurability, benefit-metric.md §M5): This story wires checkout to env-var-sourced Stripe price IDs. A price ID change in Stripe + env var update propagates to new checkout sessions — no code deploy required. AC5 is the verification.

## Acceptance criteria

**AC1** — `POST /billing/checkout` creates a Stripe Checkout session and redirects to it
Given an authenticated user submits a plan selection (plan name → Stripe price ID looked up from env vars),
When `POST /billing/checkout` is handled,
Then: (1) a Stripe Checkout Session is created via the Stripe API with `mode: 'subscription'`, the selected price ID, and `success_url`/`cancel_url` set to the platform domain, (2) the response is 302 to the Stripe Checkout session URL (`session.url`).

**AC2** — Unauthenticated access to `POST /billing/checkout` returns 401
Given a request to `POST /billing/checkout` with no valid session,
When the handler runs,
Then HTTP 401 is returned — no Stripe API call is made.

**AC3** — Stripe price IDs are sourced from environment variables — not hardcoded
Given the `POST /billing/checkout` handler,
When it resolves a plan name to a Stripe price ID,
Then the price ID is read from an environment variable (e.g. `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`) — not from a constant in the source code. A missing or `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` value causes the handler to return HTTP 500 with "Billing not configured" — not a checkout redirect.

**AC4** — Checkout `success_url` includes a `session_id={CHECKOUT_SESSION_ID}` template parameter
Given a Stripe Checkout session is created (AC1),
When the `success_url` is constructed,
Then it is of the form `https://<host>/billing/success?session_id={CHECKOUT_SESSION_ID}` using the Stripe template literal — so the platform can verify checkout completion on the success redirect.

**AC5** — Pricing configurability: changing a Stripe price ID in env vars + redeploying propagates to new checkout sessions (no code change)
Given the operator changes `STRIPE_PRICE_ID_STARTER` in Fly.io secrets and redeploys,
When a new user selects the Starter plan on `/welcome`,
Then the Stripe Checkout session created uses the new price ID. This is a structural guarantee — verified once as a pre-launch smoke test (lab-s3.5 AC3).

**AC6** — `GET /billing/success` handles Stripe redirect after successful checkout
Given Stripe redirects back to `/billing/success?session_id=<cs_xxx>` after payment,
When the handler runs with a valid authenticated session,
Then: (1) the response is 302 to `/dashboard`, (2) a `checkout_completed` PostHog event is fired with `{ planName }`.

**AC7** — Stripe adapter is injectable (D37)
Given `src/web-ui/modules/stripe-client.js` is loaded without calling `setStripeAdapter()`,
When `createCheckoutSession()` is called,
Then the call throws `Error('Adapter not wired: stripeClient. Call setStripeAdapter() before use.')`.

## Out of scope

- Credit provisioning (that is lab-s3.4 — the webhook fires after checkout completion and provisions credits)
- Invoice management, tax handling, or VAT (deferred per discovery)
- Credit top-up (one-time payment via Payment Intents) — a separate Stripe flow, deferred to post-MVP if the subscription model covers needs
- Stripe Customer Portal (lab-s3.5)

## Dependencies

- **lab-s3.1 must be complete** — `credits` table must exist (the webhook that provisions credits depends on it)
- `stripe` npm package — approved for this feature under the npm relaxation
- Stripe account, test mode API key (`STRIPE_SECRET_KEY`), webhook signing secret (`STRIPE_WEBHOOK_SECRET`)
- Stripe product and price IDs created in Stripe dashboard (test mode initially; replaced at go-live per lab-s3.5)

## Implementation touchpoints

- `src/web-ui/modules/stripe-client.js` (new): Stripe API wrapper with injectable adapter; exports `createCheckoutSession`, `setStripeAdapter`
- `src/web-ui/routes/billing.js` (new): `POST /billing/checkout` and `GET /billing/success` handlers
- `src/web-ui/server.js` (modified): register billing routes; wire Stripe adapter with real Stripe SDK
- `.env.example` (modified): add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO` (with `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` as the placeholder value per discovery)

## Architecture Constraints

- **D37 (Injectable adapter rule, CLAUDE.md)**: Stripe client default stub MUST throw. Production wiring in `server.js` is a separate implementation task. AC7 enforces this.
- **ADR-011 (Artefact-first)**: `src/web-ui/modules/stripe-client.js` and `src/web-ui/routes/billing.js` are new `src/` modules — covered by this story artefact.
- **No hardcoded Stripe price IDs (SCOPE-001, decisions.md)**: Price IDs are env vars. AC3 enforces this. The `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` pattern is used in `.env.example` and validated absent in lab-s3.5.
- **Stripe handles cardholder data**: The platform never receives or stores card numbers. Stripe Checkout is the correct mechanism for this — the platform is out of PCI scope.
- **Path traversal guard (CLAUDE.md)**: No file writes occur in this story — guard not applicable.

## NFRs

- **No Stripe secret key committed**: `STRIPE_SECRET_KEY` must not appear in any committed file. Fly.io secrets only.
- **PostHog non-blocking (AC6)**: `checkout_completed` event must not delay the `/billing/success` redirect.
- **Test mode only until pre-launch**: Stripe test mode keys (`sk_test_...`) are used in all non-production environments. Live keys (`sk_live_...`) are set only by lab-s3.5 pre-launch checklist.

## Test

Node.js tests: `tests/check-lab-s3.2-stripe-checkout.js` (new) — verify (1) default Stripe adapter stub throws (AC7), (2) `POST /billing/checkout` with no session → 401 (AC2), (3) `POST /billing/checkout` with missing/placeholder price ID → 500 "Billing not configured" (AC3), (4) `POST /billing/checkout` with valid session and price ID → calls `createCheckoutSession` with correct params and returns 302 to mock checkout URL (AC1), (5) `GET /billing/success` → 302 to `/dashboard` + PostHog event (AC6). Monkeypatch Stripe adapter.
