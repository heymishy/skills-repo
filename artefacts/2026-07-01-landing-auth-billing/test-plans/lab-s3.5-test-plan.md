# Test Plan — lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist

**Story:** lab-s3.5
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s3.5-billing-portal.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. The Stripe adapter is injectable (from lab-s3.2 — `setStripeAdapter()`). Tests inject a mock adapter whose `createPortalSession(customerId, returnUrl)` method captures calls and returns a mock portal URL.

- Authenticated sessions carry `{ accessToken: 'test-token', userId: 'user-123', tenantId: 'tenant-abc', stripeCustomerId: 'cus_test_123' }`
- Pre-launch check script tests use `process.env` overrides to simulate placeholder and non-placeholder env var states
- No real Stripe API calls in unit tests

**PCI/sensitivity:** `stripe_customer_id` is internal data — not a secret, but treated as internal. Never logged at INFO level in tests.

**Test data gaps:** AC5 (pricing configurability end-to-end verification) requires a real Stripe environment — this is the manual pre-launch smoke test.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | GET /settings/billing → createPortalSession → 302 to portal URL | Unit | T1.1, T1.2 | None |
| AC2 | Unauthenticated → 302 / (no Stripe call) | Unit | T2.1 | None |
| AC3 | check-prelaunch-stripe.js exits 0 when all env vars set | Unit | T3.1 | None |
| AC4 | check-prelaunch-stripe.js exits 1 when any var is placeholder | Unit | T4.1, T4.2 | None |
| AC5 | Pricing configurability (end-to-end) | Manual | — | Manual pre-launch check |
| AC6 | Stripe Customer Portal return URL is /dashboard | Unit | T6.1 | None |

---

## Gap table

| AC | Gap type | Handling | Justification |
|----|----------|----------|---------------|
| AC5 | Requires real Stripe API + real Fly.io deploy | Manual pre-launch scenario in verification script; [Testability: accepted by operator on 2026-07-01] | Verifying that a price ID change in the Stripe dashboard propagates to new checkout sessions requires a live Stripe API call and a real deploy. This is the M5 minimum validation signal — confirmed manually once before go-live per benefit-metric.md. |

---

## E2E / browser-layout detection

No browser-layout-dependent ACs. No E2E tooling required.

---

## Unit tests

### T1 — GET /settings/billing → portal redirect (AC1)

**T1.1** — `billing-settings-calls-create-portal-session`
Covers: AC1 §1
Precondition: Authenticated session with `stripeCustomerId: 'cus_test_123'`; mock Stripe adapter wired with `createPortalSession` spy
Action: Call `GET /settings/billing` handler
Expected: `createPortalSession('cus_test_123', '<return_url>')` called on mock adapter
Edge case: none

**T1.2** — `billing-settings-redirects-to-portal-url`
Covers: AC1 §2
Precondition: T1.1; mock adapter returns `{ url: 'https://billing.stripe.com/p/session/test_123' }`
Action: Inspect response
Expected: Response is 302; `Location` header is `https://billing.stripe.com/p/session/test_123`
Edge case: none

### T2 — Unauthenticated → 302 / (AC2)

**T2.1** — `billing-settings-unauthenticated-returns-302-to-root`
Covers: AC2
Precondition: No session (no `req.session.accessToken`)
Action: Call `GET /settings/billing`
Expected: Response is 302 to `/`; mock Stripe adapter `createPortalSession` NOT called
Edge case: none

### T3 — Prelaunch script exits 0 when no placeholders (AC3)

**T3.1** — `prelaunch-script-exits-0-all-vars-set`
Covers: AC3
Precondition: `process.env` set with all Stripe price ID env vars to non-placeholder values: `STRIPE_PRICE_ID_STARTER=price_real_1`, `STRIPE_PRICE_ID_PRO=price_real_2`
Action: Run `scripts/check-prelaunch-stripe.js` (via child process or require the script's check function directly)
Expected: Exit code 0; output lists each checked env var with "✓ set (not placeholder)" or similar; no "STRIPE_PLAN_PRICE_ID_PLACEHOLDER" appears in output
Edge case: none

### T4 — Prelaunch script exits 1 on placeholder (AC4)

**T4.1** — `prelaunch-script-exits-1-starter-price-id-is-placeholder`
Covers: AC4
Precondition: `STRIPE_PRICE_ID_STARTER=STRIPE_PLAN_PRICE_ID_PLACEHOLDER`; `STRIPE_PRICE_ID_PRO=price_real_2`
Action: Run `scripts/check-prelaunch-stripe.js`
Expected: Exit code 1; output names `STRIPE_PRICE_ID_STARTER` as the failing variable
Edge case: none

**T4.2** — `prelaunch-script-exits-1-names-specific-failing-var`
Covers: AC4 (specific naming)
Precondition: Multiple env vars set — one is placeholder, others are real
Action: Run script; inspect output
Expected: Output identifies the SPECIFIC env var that holds the placeholder (not just "a variable failed")
Edge case: If multiple vars are placeholder, all failing vars should be listed

### T6 — return_url is /dashboard (AC6)

**T6.1** — `portal-session-return-url-is-dashboard`
Covers: AC6
Precondition: T1.1 setup
Action: Inspect `createPortalSession` call arguments
Expected: Second argument (return URL) is the platform's `/dashboard` URL (e.g. `https://platform.example.com/dashboard` or `http://localhost:3000/dashboard` in test)
Edge case: none

---

## Integration tests

**IT1** — `billing-settings-route-registered-and-auth-guarded`
Covers: AC1, AC2 (route registration)
Precondition: Server module loaded
Action: Verify `GET /settings/billing` route exists and is protected by auth guard
Expected: Without a session, `GET /settings/billing` returns 302 to `/`; with a valid session, proceeds to portal handler
Edge case: none

**IT2** — `prelaunch-script-handles-missing-env-vars`
Covers: AC4 (edge case: env var not set at all vs set to placeholder)
Precondition: `STRIPE_PRICE_ID_STARTER` is not set (undefined); other vars set correctly
Action: Run `scripts/check-prelaunch-stripe.js`
Expected: Exit code 1; script reports `STRIPE_PRICE_ID_STARTER` as missing or placeholder (unset is treated same as placeholder — not configured)
Edge case: none

---

## NFR tests

No explicit NFR tests. The `stripe_customer_id` logging constraint (must not appear at INFO level) is verified via the audit log test in IT1 — no `cus_xxx` values should appear in INFO-level log output.

---

## State update fields

- `totalTests`: 8
- `acTotal`: 6
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
