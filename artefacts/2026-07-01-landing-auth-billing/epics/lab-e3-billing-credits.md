# Epic 3: Billing + Credits

**Feature:** 2026-07-01-landing-auth-billing
**Epic slug:** lab-e3-billing-credits
**Slicing strategy:** Risk-first — billing stories are ordered by the dependency chain: data model first, then Stripe Checkout (which /welcome links to), then enforcement (which requires credits to exist), then webhook handler (which provisions credits after payment), then the billing portal and pre-launch checklist (which cap the MVP and are the go/no-go gate before any paying user arrives).
**Architecture guardrails:** Checked against `.github/architecture-guardrails.md` 2026-07-01. Constraints: ADR-011 (Artefact-first — new `src/modules/credits.js` and `src/routes/billing.js`); D37 (Injectable adapter rule for Stripe adapter); path traversal guard (CLAUDE.md); no credentials committed; Stripe handles cardholder data — platform is out of PCI scope. No regulated constraints.
**Human oversight level:** High (solo operator — W4 risk-accepted)
**Status:** Not started

---

## Rationale for grouping

Epic 3 is the billing and credits implementation. It delivers platform financial sustainability: credits tracking, Stripe Checkout, credit enforcement on turns, webhook-driven provisioning, billing portal, and the pre-launch validation gate. Story s3.5 is deliberately the last story — it is a go/no-go gate that must be passed before any real money changes hands.

---

## Stories

| Slug | Title | Dependency | Metric |
|------|-------|------------|--------|
| lab-s3.1 | Credits table + plan data model (Postgres) | Neon Postgres already provisioned (s3.1 wuce) | M2, M3 |
| lab-s3.2 | Stripe Checkout + plan subscription flow | lab-s3.1 | M3, M4 |
| lab-s3.3 | Credit enforcement — 402 turn guard | lab-s3.1 | M2 |
| lab-s3.4 | Stripe webhook handler (provision credits, idempotency) | lab-s3.2 | M3 |
| lab-s3.5 | Billing portal + pre-launch Stripe ID swap checklist | lab-s3.2, lab-s3.4 | M3, M4, M5 |

---

## Exit criteria

Epic 3 is complete when:
1. Credits table exists in Neon Postgres and is correctly seeded on plan selection
2. Stripe Checkout flow works end-to-end in test mode
3. Turn attempts with zero/negative credit balance return 402 (automated test green)
4. Stripe webhook correctly provisions credits for `checkout.session.completed`, `invoice.paid`, and `payment_intent.succeeded` events with idempotency
5. `/settings/billing` redirects authenticated users to Stripe Customer Portal
6. Pre-launch checklist passes: all `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` values replaced in live config, verified by smoke test
