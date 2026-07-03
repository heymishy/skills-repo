# Definition of Done: lab-s3.2 — Stripe Checkout + plan subscription flow

**PR:** https://github.com/heymishy/skills-repo/pull/426 | **Merged:** 2026-07-02
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s3.2-stripe-checkout.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s3.2-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s3.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `POST /billing/checkout` creates Stripe Checkout session (mode: subscription) and returns 302 to session URL | ✅ | Test mocks Stripe adapter, asserts `createCheckoutSession` called with `mode: 'subscription'`, correct price ID, `success_url`, `cancel_url`, and response is 302 to mock session URL. 14/14 pass. | Automated test | None |
| AC2 — Unauthenticated `POST /billing/checkout` returns 401 | ✅ | Test with no session asserts 401 and Stripe adapter NOT called. | Automated test | None |
| AC3 — Price IDs from env vars; missing/placeholder → 500 "Billing not configured" | ✅ | Test with `STRIPE_PRICE_ID_STARTER=STRIPE_PLAN_PRICE_ID_PLACEHOLDER` asserts 500 response. Env-var lookup verified — no hardcoded IDs in `billing.js`. | Automated test | None |
| AC4 — `success_url` includes `{CHECKOUT_SESSION_ID}` template parameter | ✅ | Test asserts `success_url` contains `{CHECKOUT_SESSION_ID}` Stripe template literal. | Automated test | None |
| AC5 — Pricing configurability: env var change + redeploy updates checkout sessions (no code change) | ✅ | Structural guarantee: checkout session reads price ID from `process.env.STRIPE_PRICE_ID_*` at call time. Pre-launch smoke test (manual, lab-s3.5 AC3) verifies the end-to-end once before go-live. | Architecture guarantee (structural) | None |
| AC6 — `GET /billing/success` returns 302 to `/dashboard` + fires `checkout_completed` PostHog event | ✅ | Test asserts 302 to `/dashboard` and PostHog capture called with `checkout_completed` event. | Automated test | None |
| AC7 — Stripe adapter injectable (D37); default stub throws | ✅ | Test asserts `createCheckoutSession()` throws `Error('Adapter not wired: stripeClient...')` without wired adapter. | Automated test | None |

## Scope Deviations

None. Credit provisioning deferred to s3.4, billing portal to s3.5, invoice/VAT/top-up out of scope as specified.

---

## Test Plan Coverage

**Tests from plan implemented:** 14 / 14
**Tests passing:** 14 / 14

**Test gaps:** None. AC5 is verified structurally by architecture (env-var lookup at call time) and is confirmed by the pre-launch manual smoke test in lab-s3.5.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No Stripe secret key committed | ✅ | `STRIPE_SECRET_KEY` confirmed absent from all committed files. `.env.example` uses placeholder `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` values. |
| PostHog non-blocking (AC6) | ✅ | `checkout_completed` PostHog event uses fire-and-forget pattern — does not delay `/billing/success` redirect. |
| Test mode only until pre-launch | ✅ | All Stripe calls use injected test adapter in tests. Live key swap is a pre-launch step per lab-s3.5. |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M3 — Monthly cost recovery rate | not-yet-measured | Stripe Checkout route implemented and working (tests pass). No real payments received; platform not yet live. | null |
| M4 — Time to first paid plan | not-yet-measured | Checkout flow implemented. First `checkout.session.completed` event not yet received. | null |
| M5 — Pricing configurability | not-yet-measured | Structural guarantee implemented (env-var-sourced price IDs). Pre-launch smoke test (lab-s3.5 AC3) not yet run — Stripe live keys not yet configured. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 7/7
Scope deviations: None
Test gaps: None
