# AC Verification Script — lab-s3.5 — Billing portal + pre-launch Stripe ID swap checklist

**Story:** lab-s3.5
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / Platform Engineer

---

## Purpose

This script covers two distinct concerns:
1. The `/settings/billing` portal route (AC1, AC2, AC6)
2. The pre-launch Stripe checklist (AC3, AC4, AC5) — **this is the go/no-go gate before accepting real payments**

---

## Setup

Stripe Customer Portal must be configured in the Stripe dashboard (portal settings, return URL set to `/dashboard`, features enabled — e.g. subscription management, payment method updates).

Start server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s3.5-billing-portal.js
```
Expected: all checks pass. Zero failures.

---

## Scenarios — Billing Portal

### Scenario AC1 — Authenticated user is redirected to their Stripe Customer Portal

1. Log in to the platform with an account that has completed a Stripe Checkout (has a `stripe_customer_id`).
2. Navigate to `http://localhost:3000/settings/billing`.
3. **Expected:** Your browser is redirected to the Stripe Customer Portal (`billing.stripe.com/...`). You can see your subscription details, payment method, and subscription management options in the Stripe portal.
4. If you see an error or are NOT redirected to Stripe, AC1 fails.

---

### Scenario AC2 — Unauthenticated access to /settings/billing is blocked

1. In an incognito window (no session), navigate to `http://localhost:3000/settings/billing`.
2. **Expected:** You are redirected to `http://localhost:3000/` (the landing page). No Stripe API call is made. You do NOT see any billing information.
3. If you can access the billing portal without being logged in, AC2 fails.

---

### Scenario AC6 — Stripe portal "Return to platform" goes to /dashboard

1. Complete AC1 — you are in the Stripe Customer Portal.
2. Find the "Return to [platform name]" link in the Stripe portal and click it.
3. **Expected:** Your browser navigates to `/dashboard` on the platform — not to the landing page or a 404.
4. If the return URL goes anywhere other than `/dashboard`, AC6 fails.

---

## Scenarios — Pre-launch checklist

### Scenario AC3 — Pre-launch script passes when all price IDs are configured

1. Ensure your `.env` has all Stripe price ID env vars set to REAL Stripe price IDs (not placeholders):
   - `STRIPE_PRICE_ID_STARTER=price_xxx` (real test mode or live price ID)
   - `STRIPE_PRICE_ID_PRO=price_yyy`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
2. Run the pre-launch check:
   ```
   node scripts/check-prelaunch-stripe.js
   ```
3. **Expected:** Exit code 0. Output lists each checked env var with a green check or "not placeholder". No "STRIPE_PLAN_PRICE_ID_PLACEHOLDER" string appears.
4. If exit code is 1, one of your env vars still contains a placeholder — fix it and rerun.

---

### Scenario AC4 — Pre-launch script fails when a placeholder is present

1. Temporarily set one env var to the placeholder value:
   ```powershell
   $env:STRIPE_PRICE_ID_STARTER = "STRIPE_PLAN_PRICE_ID_PLACEHOLDER"
   ```
2. Run the pre-launch check:
   ```
   node scripts/check-prelaunch-stripe.js
   ```
3. **Expected:** Exit code 1. The output specifically names `STRIPE_PRICE_ID_STARTER` as the problematic variable.
4. Restore the correct value and rerun — exit code must be 0 before you can proceed to go-live.

---

### Scenario AC5 — 🔴 Pricing configurability verification (MANUAL — pre-launch gate)

*Run this as part of the pre-launch go/no-go process. Do this BEFORE switching from Stripe test mode to live mode.*

1. In the Stripe test dashboard, find the Starter plan price and note its price ID.
2. Change the Starter plan price (e.g. from $29/month to $39/month — a test price change).
3. In Fly.io secrets (or `.env` for local), update `STRIPE_PRICE_ID_STARTER` to the new price ID.
4. Redeploy (or restart the server).
5. Log in as a first-time user and navigate to `/welcome`. Click "Select this plan" for the Starter plan.
6. **Expected:** The Stripe Checkout page shows the updated price ($39/month, not the old $29/month). No code change was required — only the env var update.
7. **What broken looks like:** The Checkout page still shows the old price. This means a price ID is hardcoded somewhere in the source code.
8. After verifying, revert the test price change in Stripe dashboard.

*If this scenario fails, a price ID is hardcoded — find and fix before go-live.*

---

## Pre-launch go/no-go checklist (run before opening to paying users)

Complete ALL of the following before switching Fly.io secrets from `sk_test_` to `sk_live_`:

- [ ] `node scripts/check-prelaunch-stripe.js` exits 0
- [ ] AC3 scenario passed with real (non-placeholder) Stripe price IDs
- [ ] AC5 scenario verified — price change propagates without code deploy
- [ ] Stripe Customer Portal configured with return URL pointing to `/dashboard`
- [ ] `STRIPE_WEBHOOK_SECRET` updated to the live mode webhook signing secret
- [ ] AC1 scenario tested with a real Stripe test checkout (card 4242 4242 4242 4242)

---

## Reset instructions

Between scenarios, no state reset needed for AC1/AC2/AC6 (session-only state). For AC4, restore the env var after testing. For AC5, revert the price change in the Stripe dashboard.
