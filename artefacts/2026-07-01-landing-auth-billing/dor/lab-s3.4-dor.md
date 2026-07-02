# Definition of Ready — lab-s3.4 — Stripe webhook handler (provision credits, idempotency)

**Story:** lab-s3.4
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 10 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s3.4-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. Raw body constraint (route registered BEFORE JSON body parser) is an Integration Test (IT1) assertion in the test plan — not a documentation note. Idempotency uses `ON CONFLICT DO NOTHING` SQL pattern (IT2 asserts the exact SQL pattern, not just outcome). `metadata.credit_amount` string-to-int coercion is explicitly noted in T4.1. Both upstream stories (lab-s3.1 and lab-s3.2) are declared in schemaDepends.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As the platform operator…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T7.1, IT1/IT2, NFR1 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 5 explicit exclusions |
| H5 | Benefit linkage references named metrics | PASS | M3, M4 |
| H6 | Complexity rated | PASS | Complexity: 2 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | No gaps |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared (lab-s3.1 + lab-s3.2); field in schema |
| H9 | Architecture Constraints populated | PASS | Raw body constraint, D37, idempotency SQL pattern, HTTP 200 for all acknowledged events, no credentials committed |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified (webhook payloads: Restricted) |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | Stripe signature adapter (D37 from lab-s3.2): stub throws (AC7); wiring already in server.js from lab-s3.2; credits adapter already wired from lab-s3.1 |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — Signature non-bypassable in production, audit log on every credit provisioning event |
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

## ✅ Definition of Ready: PROCEED — lab-s3.4

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s3.1 AND lab-s3.2 must both be signed-off before implementation begins.**

---

## Coding Agent Instructions

**Story:** lab-s3.4 — Stripe webhook handler (provision credits, idempotency)
**Complexity:** 2 | **Oversight:** Low
**Entry gate:** lab-s3.1 DoR signed-off (credits table + credits.js) AND lab-s3.2 DoR signed-off (stripe-client.js with injectable adapter).

### What to build

**Add to `src/web-ui/modules/stripe-client.js`:** `verifyWebhookSignature(rawBody, sig, secret)` method — calls real Stripe `webhooks.constructEvent(rawBody, sig, secret)` (throws if invalid). Injectable via existing `setStripeAdapter`.

**Add to `src/web-ui/routes/billing.js`:** `POST /webhook/stripe` handler:
```
1. Verify signature (verifyWebhookSignature) → 400 on failure
2. Check idempotency: SELECT if stripe_event_id already in stripe_events → if found, return 200 (no adjustBalance)
3. INSERT stripe_event_id with ON CONFLICT DO NOTHING
4. Switch on event.type:
   - checkout.session.completed → adjustBalance(client_reference_id, CREDITS_PLAN_[plan])
   - invoice.paid → adjustBalance(tenantId, CREDITS_PLAN_[plan])
   - payment_intent.succeeded → adjustBalance(metadata.tenant_id, parseInt(metadata.credit_amount))
   - default → log stripe_unhandled_event, return 200
5. Log { event: 'credits_provisioned', tenantId, amount, stripeEventId } after each adjustBalance
6. Return 200
```

**`server.js`:** Register `POST /webhook/stripe` BEFORE `express.json()` or equivalent body parser. Use `express.raw({ type: 'application/json' })` as the body parser for this route only.

### Required touchpoints

- `src/web-ui/modules/stripe-client.js` — MODIFY (add verifyWebhookSignature method)
- `src/web-ui/routes/billing.js` — MODIFY (add POST /webhook/stripe handler)
- `src/web-ui/server.js` — MODIFY (register webhook route BEFORE JSON body parser — critical ordering)

### MUST NOT touch

- `src/web-ui/modules/credits.js` (use as-is from lab-s3.1)
- Auth routes, OAuth adapter, or unrelated billing handlers
- `scripts/migrate-schema-credits.js` (migration already done in lab-s3.1)

### Test runner

`node tests/check-lab-s3.4-stripe-webhook.js`

### Task order (implementation plan)

**Task 1:** Add `verifyWebhookSignature` to `stripe-client.js` — injectable via existing setStripeAdapter
**Task 2:** Implement `POST /webhook/stripe` handler in `billing.js` — signature check, idempotency SELECT+INSERT, event dispatch switch, audit log
**Task 3 (CRITICAL):** Register webhook route in `server.js` BEFORE JSON body parser — use `express.raw({ type: 'application/json' })` for this route
**Task 4:** Run test suite — 0 failures

### Architecture constraints

- **CRITICAL: raw body first** — `/webhook/stripe` MUST be registered BEFORE `express.json()`. If the JSON body parser runs first, Stripe signature verification will ALWAYS fail. IT1 asserts the route order. Do not miss this.
- Idempotency MUST use `INSERT ... ON CONFLICT DO NOTHING` — not `SELECT` then `INSERT` (check-then-insert is not safe under concurrent delivery)
- `metadata.credit_amount` is a string in the Stripe event — coerce to integer with `parseInt(metadata.credit_amount)` before calling `adjustBalance`
- ALL event types must return 200 (including unhandled) — 4xx or 5xx causes Stripe to retry indefinitely
- `STRIPE_WEBHOOK_SECRET` must never appear in any committed file

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 4 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s3.4-stripe-webhook.js` 0 failures
5. /branch-complete
