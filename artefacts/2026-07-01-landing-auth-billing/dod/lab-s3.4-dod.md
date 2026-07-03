# Definition of Done: lab-s3.4 — Stripe webhook handler (provision credits, idempotency)

**PR:** https://github.com/heymishy/skills-repo/pull/430 | **Merged:** 2026-07-03
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s3.4-stripe-webhook.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s3.4-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s3.4-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `POST /webhook/stripe` verifies Stripe signature; invalid/missing → 400; valid → parsed and dispatched | ✅ | Test with invalid signature asserts 400. Test with valid mock signature asserts event parsed and dispatched. 26/26 pass. Route registered in `server.js` BEFORE JSON body parser (raw body preserved). | Automated test | None |
| AC2 — `checkout.session.completed` event provisions credits: extracts `tenant_id` from `client_reference_id`, reads credit amount from env vars, calls `adjustBalance(tenantId, creditAmount)` → 200 | ✅ | Test mocks Stripe adapter (returns pre-verified event) and credits adapter. Asserts `adjustBalance` called with correct tenantId and credit amount from `CREDITS_PLAN_STARTER` env var. | Automated test | None |
| AC3 — `invoice.paid` event provisions monthly credit renewal | ✅ | Test with `invoice.paid` event asserts `adjustBalance` called with correct monthly credit allocation from env vars. | Automated test | None |
| AC4 — `payment_intent.succeeded` provisions credits from `metadata.credit_amount` | ✅ | Test with `payment_intent.succeeded` event asserts `adjustBalance` called with `metadata.credit_amount` value. | Automated test | None |
| AC5 — Idempotency: duplicate `stripe_event_id` → `adjustBalance` NOT called second time | ✅ | Test sends same event twice. Asserts `adjustBalance` call count = 1. Second receipt checks `stripe_events` table (mock DB returns "already exists") and returns 200 without provisioning. | Automated test | None |
| AC6 — Unknown event type → 200 `stripe_unhandled_event` logged | ✅ | Test with `customer.updated` event asserts 200 response and log entry `stripe_unhandled_event` emitted. No 4xx/5xx that would cause Stripe retry. | Automated test | None |
| AC7 — Stripe adapter injectable (D37); test can inject mock bypassing real signature check | ✅ | Test wires mock Stripe adapter. Without wired adapter, default stub throws. | Automated test | None |

## Scope Deviations

None. Billing portal deferred to s3.5. Subscription cancellation, refunds, email notifications, manual credit grants all correctly out of scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 26 / 26
**Tests passing:** 26 / 26

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Signature verification non-bypassable in production | ✅ | Signature verification only bypassed when test injects mock adapter. In production, `STRIPE_WEBHOOK_SECRET` env var is required. Raw body preserved by registering route before JSON body parser. |
| Audit log on every credit provisioning event | ✅ | Tests assert structured log entry `{ event: 'credits_provisioned', tenantId, amount, stripeEventId }` emitted on every `adjustBalance` call from webhook handler. |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M3 — Monthly cost recovery rate | not-yet-measured | Webhook handler implemented and tested (26/26). Credits will be provisioned automatically after Stripe payments. No real payments received yet; platform not live. | null |
| M4 — Time to first paid plan | not-yet-measured | First `checkout.session.completed` event handled by this webhook will be the M4 signal. Not yet received. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 7/7
Scope deviations: None
Test gaps: None
