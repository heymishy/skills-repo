# Definition of Done: lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist

**PR:** https://github.com/heymishy/skills-repo/pull/433 | **Merged:** 2026-07-03
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s3.5-billing-portal-prelaunch.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s3.5-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s3.5-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `GET /settings/billing` with valid session + `stripeCustomerId` → `createPortalSession` called → 302 to portal URL | ✅ | Test mocks Stripe adapter `billingPortal.sessions.create`. Asserts called with correct customerId. Asserts 302 to mock portal URL. 12/12 pass. | Automated test | None |
| AC2 — `GET /settings/billing` with no session → 302 to `/`; Stripe adapter NOT called | ✅ | Test with no session asserts 302 to `/` and Stripe adapter call count = 0. | Automated test | None |
| AC3 — `check-prelaunch-stripe.js` exits 0 when all env vars are non-placeholder | ✅ | Test sets all vars to non-placeholder values; asserts exit code 0 and output lists "✓ set (not placeholder)" for each var. | Automated test | None |
| AC4 — `check-prelaunch-stripe.js` exits 1 and names the failing var when any = `STRIPE_PLAN_PRICE_ID_PLACEHOLDER` | ✅ | Test sets one var to placeholder; asserts exit code 1 and failing var name appears in output. | Automated test | None |
| AC5 — Pricing configurability end-to-end: Stripe dashboard price change + env var update → new checkout sessions use new price ID | ⚠️ RISK-ACCEPT | Manual smoke test required: change price in Stripe test dashboard, update env var in Fly.io, redeploy, verify new checkout session. RISK-ACCEPT logged in decisions.md. Pre-launch task for operator. | Manual pre-launch smoke test (pending) | RISK-ACCEPT: requires live Stripe API + Fly.io deploy. Accepted by operator 2026-07-01. |
| AC6 — `createPortalSession` second argument (returnUrl) asserted to be `/dashboard` | ✅ | Test asserts `billingPortal.sessions.create` called with `return_url` containing `/dashboard`. | Automated test | None |

## Scope Deviations

None. Invoice download, cancellation handling, Stripe Tax, automated CI gate for placeholder check all correctly deferred.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12
**Tests passing:** 12 / 12

**Test gaps:** 1 — AC5 (pricing configurability live test) is a manual pre-launch task by design. RISK-ACCEPT in decisions.md.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No credentials committed | ✅ | `check-prelaunch-stripe.js` reads only `process.env` at runtime. No API keys in committed code. |
| `check-prelaunch-stripe.js` zero npm dependencies | ✅ | Script uses only `process.env` reads and `process.exit()`. No `require()` calls for external packages. |
| Pre-launch checklist is the go/no-go gate for real payments | ✅ | Script exits 1 if any Stripe env var = `STRIPE_PLAN_PRICE_ID_PLACEHOLDER`. Operator must run and confirm exit 0 before switching to live Stripe keys. |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M3 — Monthly cost recovery rate | not-yet-measured | Billing portal gives users self-serve subscription management. No real payments received; platform not yet live. | null |
| M4 — Time to first paid plan | not-yet-measured | Pre-launch checklist (this story) is the go/no-go gate before real payments can flow. Checklist not yet run with live Stripe keys. | null |
| M5 — Pricing configurability | not-yet-measured | Structural guarantee implemented (`check-prelaunch-stripe.js` exits 1 if placeholders present). AC5 end-to-end smoke test (Stripe dashboard → env var → checkout) not yet run — pre-launch task. | null |

---

## Outcome: COMPLETE WITH DEVIATIONS ✅

ACs satisfied: 5/6 (AC5 RISK-ACCEPT)
Scope deviations: None
Test gaps: 1 (AC5 live Stripe end-to-end — RISK-ACCEPT, manual pre-launch smoke test pending)

**Follow-up action (pre-launch):** Run `node scripts/check-prelaunch-stripe.js` and confirm exit 0. Then run AC5 manual smoke test (change Stripe test price → update env var → redeploy → verify new checkout session uses new price ID). Only after both pass should live Stripe keys be activated.
