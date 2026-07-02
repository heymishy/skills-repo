# Definition of Ready — lab-s3.2 — Stripe Checkout + plan subscription flow

**Story:** lab-s3.2
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 10 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s3.2-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC5 (no hardcoded price IDs) is verified by a grep-style test assertion against the source file, not just "checked manually". AC4 (`{CHECKOUT_SESSION_ID}` literal) is asserted on the `success_url` argument to the mock adapter. `client_reference_id = tenantId` is verified in AC1 test setup. D37 stub-throws requirement is AC7.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As a new visitor / prospective user selecting a plan…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T7.1, IT1/IT2 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 4 explicit exclusions |
| H5 | Benefit linkage references named metrics | PASS | M3, M4, M5 |
| H6 | Complexity rated | PASS | Complexity: 2 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | No gaps |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared; field in schema |
| H9 | Architecture Constraints populated | PASS | D37, ADR-011, no hardcoded price IDs (SCOPE-001), Stripe PCI scope, CJS-only |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None (Stripe handles PCI; platform is out of scope) |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | `stripe-client.js` D37: stub throws (AC7); production wiring in server.js required touchpoint (separate task) |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — No Stripe key committed, PostHog non-blocking, test mode only until pre-launch |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s3.2

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s3.1 must be signed-off before implementation begins.**

---

## Coding Agent Instructions

**Story:** lab-s3.2 — Stripe Checkout + plan subscription flow
**Complexity:** 2 | **Oversight:** Low
**Entry gate:** lab-s3.1 DoR signed-off (credits table + credits.js module in place).

### What to build

**`src/web-ui/modules/stripe-client.js`** — D37 injectable Stripe wrapper:
- `createCheckoutSession({ priceId, tenantId, successUrl, cancelUrl })` — calls Stripe `checkout.sessions.create`
- `createPortalSession(customerId, returnUrl)` — (stub only in this story; implemented in lab-s3.5)
- `setStripeAdapter(impl)` — injectable; default stub throws `Error('Adapter not wired: stripeClient. Call setStripeAdapter() before use.')`

**`src/web-ui/routes/billing.js`** — Two handlers:
- `POST /billing/checkout`: auth guard (no session → 401); read plan name from `req.body.planId`; look up `process.env.STRIPE_PRICE_ID_[PLAN]` — if missing or === `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` → 500 "Billing not configured"; call `createCheckoutSession` with `client_reference_id = req.session.tenantId`, `success_url = https://<host>/billing/success?session_id={CHECKOUT_SESSION_ID}`, `cancel_url = /welcome`; respond 302 to `session.url`
- `GET /billing/success`: auth guard; fire `checkout_completed` PostHog event with `{ planName }`; respond 302 to `/dashboard`

Update `.env.example` with placeholder values for `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_STARTER=STRIPE_PLAN_PRICE_ID_PLACEHOLDER`, `STRIPE_PRICE_ID_PRO=STRIPE_PLAN_PRICE_ID_PLACEHOLDER`.

### Required touchpoints

- `src/web-ui/modules/stripe-client.js` — CREATE
- `src/web-ui/routes/billing.js` — CREATE
- `src/web-ui/server.js` — MODIFY (register billing routes, wire real Stripe adapter — separate task)
- `.env.example` — MODIFY (Stripe env var placeholders)

### MUST NOT touch

- `src/web-ui/modules/credits.js` (lab-s3.1 module — do not modify)
- Any auth routes or OAuth adapter files

### Test runner

`node tests/check-lab-s3.2-stripe-checkout.js`

### Task order (implementation plan)

**Task 1:** Create `stripe-client.js` — injectable module, throwing stub default, `createCheckoutSession` signature defined
**Task 2:** Implement `POST /billing/checkout` handler in `billing.js` — auth guard, env var lookup, placeholder check, Stripe session create, 302 redirect
**Task 3:** Implement `GET /billing/success` handler in `billing.js` — PostHog fire-and-forget, 302 /dashboard
**Task 4 (separate D37 task):** Wire real Stripe SDK adapter in `server.js`, register billing routes
**Task 5:** Update `.env.example` with STRIPE_PLAN_PRICE_ID_PLACEHOLDER values
**Task 6:** Run test suite — 0 failures

### Architecture constraints

- Price IDs MUST come from `process.env` — no string literals like `price_xxx` in source code (AC5 test asserts this)
- `success_url` MUST include literal `{CHECKOUT_SESSION_ID}` (Stripe template parameter) — not URL-encoded (AC4)
- `client_reference_id` MUST be `req.session.tenantId` — this is how the webhook (lab-s3.4) identifies the tenant
- `STRIPE_SECRET_KEY` must never appear in any committed file
- D37: `stripe-client.js` default stub MUST throw

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 6 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s3.2-stripe-checkout.js` 0 failures
5. /branch-complete
