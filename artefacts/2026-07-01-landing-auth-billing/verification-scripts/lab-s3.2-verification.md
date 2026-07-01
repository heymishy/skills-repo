# AC Verification Script — lab-s3.2 — Stripe Checkout + plan subscription flow

**Story:** lab-s3.2
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / QA / Platform Engineer

---

## Setup

Stripe test mode keys must be set in `.env`:
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_PRICE_ID_STARTER=price_test_...` (from Stripe dashboard, test mode)
- `STRIPE_PRICE_ID_PRO=price_test_...`

Start server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s3.2-stripe-checkout.js
```
Expected: all checks pass.

---

## Scenarios

### Scenario AC1 — Plan selection redirects to Stripe Checkout

1. Log in and navigate to `/welcome` (first-time user flow).
2. Click "Select this plan" for the Starter plan.
3. **Expected:** Your browser is redirected to a Stripe Checkout page at `checkout.stripe.com`. You can see a payment form asking for card details. The plan name and price should be visible on the Stripe page.
4. If you get a 500 error or the redirect does not go to Stripe, AC1 fails.

---

### Scenario AC2 — Unauthenticated users cannot access checkout

1. In an incognito window (no session), send a POST request to `/billing/checkout`:
   ```
   curl -X POST http://localhost:3000/billing/checkout -H "Content-Type: application/json" -d '{"planId":"starter"}'
   ```
2. **Expected:** Response is 401 Unauthorized. No redirect to Stripe occurs.
3. If a Stripe redirect happens without a session, AC2 fails — this is a security issue.

---

### Scenario AC3 — Missing price ID returns an error (not a Stripe redirect)

1. Temporarily remove or rename `STRIPE_PRICE_ID_STARTER` in your `.env`.
2. Restart the server and attempt to select the Starter plan from `/welcome`.
3. **Expected:** Response is 500 with message "Billing not configured". No redirect to Stripe.
4. Restore the env var and restart after this check.
5. Also test with `STRIPE_PRICE_ID_STARTER=STRIPE_PLAN_PRICE_ID_PLACEHOLDER`:
   **Expected:** Same 500 "Billing not configured" — the placeholder value is treated as unconfigured.

---

### Scenario AC4 — Checkout success URL contains session ID template (technical reviewer)

*This is verified automatically by the test "success-url-contains-checkout-session-id-template". Human verification:*

1. Complete the AC1 checkout flow using Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC).
2. After "payment", observe the browser URL in the address bar on the success redirect.
3. **Expected:** The URL is something like `http://localhost:3000/billing/success?session_id=cs_test_xxx`. The `session_id` parameter contains the actual Stripe Checkout session ID (starting with `cs_`).

---

### Scenario AC5 — Price ID change propagates without code deploy

*This scenario is verified as part of the lab-s3.5 pre-launch checklist. Document the outcome in the pre-launch checklist notes.*

1. In the Stripe test dashboard, change the price for the Starter plan.
2. Update `STRIPE_PRICE_ID_STARTER` in Fly.io secrets (or local `.env` for local test) to the new price ID.
3. Restart the server (or redeploy to Fly.io).
4. Select the Starter plan from `/welcome`.
5. **Expected:** The Stripe Checkout page shows the new price. No code change was required — only the env var update.

---

### Scenario AC6 — Returning from Stripe success lands on /dashboard

1. Complete the Stripe Checkout flow using test card `4242 4242 4242 4242`.
2. After Stripe processes the payment, Stripe redirects to `/billing/success?session_id=cs_...`.
3. **Expected:** The platform immediately redirects you to `/dashboard`. A `checkout_completed` PostHog event is fired (verify in PostHog live stream if configured).
4. If you land on an error page instead of `/dashboard`, AC6 fails.

---

### Scenario AC7 — Stripe adapter default throws (test-only verification)

*Verified automatically. Human verification:*

1. Run `node tests/check-lab-s3.2-stripe-checkout.js`.
2. Check the test named "default-stripe-adapter-throws-on-create-checkout".
3. **Expected:** This test passes — confirming that calling Stripe functions without wiring the real adapter throws an immediate, loud error.

---

## Reset instructions

Between scenarios: use separate incognito windows. Stripe test mode payments do not charge real cards. After AC4/AC5/AC6, check the Stripe test dashboard to verify checkout sessions were created correctly.
