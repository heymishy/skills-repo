# Definition of Ready — lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist

**Story:** lab-s3.5
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 8 tests covering 6 ACs (AC5 manual RISK-ACCEPT)
**Verification script:** 6 scenarios + pre-launch go/no-go checklist

---

## Contract Proposal

See `dor/lab-s3.5-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC5 (pricing configurability end-to-end) is correctly classified as RISK-ACCEPT with a manual pre-launch verification step documented in the verification script. `createPortalSession` re-uses the existing injectable Stripe adapter from lab-s3.2 — no new D37 setter required. AC6 return URL assertion is a unit test on the second argument of the adapter call.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As the platform operator…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 6 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T6.1, IT1/IT2 cover all ACs; AC5 gap acknowledged |
| H4 | Out-of-scope section populated | PASS | 4 explicit exclusions |
| H5 | Benefit linkage references named metrics | PASS | M3, M4, M5 |
| H6 | Complexity rated | PASS | Complexity: 1 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | AC5 gap: RISK-ACCEPT — manual pre-launch; acknowledged in gap table with operator sign-off note |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared (lab-s3.2 + lab-s3.4); field in schema |
| H9 | Architecture Constraints populated | PASS | D37 (re-uses existing Stripe adapter), no credentials committed, CJS-only |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None (PCI handled by Stripe) |
| H-NFR3 | Data classification not blank | PASS | Classified (stripe_customer_id: Internal) |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | `createPortalSession` re-uses existing Stripe adapter from lab-s3.2; no new setX() needed; existing wiring in server.js covers it |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — stripe_customer_id not logged at INFO level, pre-launch checklist is go/no-go gate |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS — AC5 classified as RISK-ACCEPT (manual pre-launch), not UNCERTAIN |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s3.5

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s3.2 AND lab-s3.4 must both be signed-off before implementation begins.**

**Note: AC5 (pricing configurability) is a manual pre-launch gate. Run `node scripts/check-prelaunch-stripe.js` and complete the full pre-launch checklist in the verification script before switching Fly.io secrets from test to live Stripe keys.**

---

## Coding Agent Instructions

**Story:** lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist
**Complexity:** 1 | **Oversight:** Low
**Entry gate:** lab-s3.2 DoR signed-off (stripe-client.js with injectable adapter) AND lab-s3.4 DoR signed-off (webhook handler + credit provisioning live).

### What to build

**Add to `src/web-ui/modules/stripe-client.js`:** `createPortalSession(customerId, returnUrl)` method — calls `stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })`. Uses existing injectable Stripe adapter from lab-s3.2.

**Add to `src/web-ui/routes/billing.js`:** `GET /settings/billing` handler:
- Auth guard: no session → 302 /
- Get `stripeCustomerId` from `req.session.stripeCustomerId` (or equivalent — populated by webhook when checkout completes)
- Call `createPortalSession(stripeCustomerId, '/dashboard')` (or full URL)
- Respond 302 to portal session URL

**`scripts/check-prelaunch-stripe.js`** — pure CJS, no npm deps:
```js
const vars = ['STRIPE_PRICE_ID_STARTER', 'STRIPE_PRICE_ID_PRO', 'STRIPE_WEBHOOK_SECRET'];
const PLACEHOLDER = 'STRIPE_PLAN_PRICE_ID_PLACEHOLDER';
let failed = false;
vars.forEach(v => {
  const val = process.env[v];
  if (!val || val === PLACEHOLDER) {
    console.error(`FAIL: ${v} is not set or is placeholder`);
    failed = true;
  } else {
    console.log(`✓ ${v} set (not placeholder)`);
  }
});
process.exit(failed ? 1 : 0);
```

Register `GET /settings/billing` in `server.js`.

### Required touchpoints

- `src/web-ui/modules/stripe-client.js` — MODIFY (add createPortalSession method)
- `src/web-ui/routes/billing.js` — MODIFY (add GET /settings/billing handler)
- `scripts/check-prelaunch-stripe.js` — CREATE
- `src/web-ui/server.js` — MODIFY (register /settings/billing route)

### MUST NOT touch

- `POST /billing/checkout` or `POST /webhook/stripe` handlers (prior stories — regression risk)
- `src/web-ui/modules/credits.js` or any credits-related code
- Auth routes or OAuth adapter files

### Test runner

`node tests/check-lab-s3.5-billing-portal.js`

### Task order (implementation plan)

**Task 1:** Add `createPortalSession(customerId, returnUrl)` to `stripe-client.js`
**Task 2:** Add `GET /settings/billing` handler to `billing.js` — auth guard, createPortalSession call, 302
**Task 3:** Create `scripts/check-prelaunch-stripe.js` — env var checks, exit 0/1
**Task 4:** Register `/settings/billing` route in `server.js`
**Task 5:** Run test suite — 0 failures

### Pre-launch gate (MANUAL — run before going live)

After implementation, before switching from Stripe test keys to live keys:
1. Run `node scripts/check-prelaunch-stripe.js` → must exit 0
2. Complete all steps in `artefacts/2026-07-01-landing-auth-billing/verification-scripts/lab-s3.5-verification.md` pre-launch checklist
3. Verify AC5 (pricing configurability) manually: change price in Stripe test dashboard, update env var, redeploy, confirm new price appears in checkout
4. Only then: update Fly.io secrets to live Stripe keys

### Architecture constraints

- `check-prelaunch-stripe.js` MUST have zero npm dependencies — pure Node.js `process.env` reads only (CJS `require()` forbidden for npm modules in this script)
- `stripe_customer_id` must NOT appear in INFO-level logs (NFR — treat as internal data)
- `createPortalSession` return URL MUST be `/dashboard` (AC6)
- AC5 is manual-only — do not attempt to automate the Stripe dashboard price change verification

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 5 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s3.5-billing-portal.js` 0 failures
5. /branch-complete
