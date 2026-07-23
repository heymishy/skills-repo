// a2-stripe-test-mode-plan-selection.spec.js — story a2-stripe-test-mode-plan-selection
//
// Targets a REAL deployed environment (wuce-staging by default, overridable via
// E2E_STAGING_BASE_URL) — never a local mock. Per ADR-018's addendum
// (.github/architecture-guardrails.md), this spec must never be invoked from the
// unit test chain (npm test / scripts/run-all-tests.js); it only ever runs via
// `npm run test:e2e` (or a scoped `npx playwright test` invocation).
//
// Reuses A1's shared staging-auth fixture (tests/e2e/fixtures/staging-auth.js) for
// authentication rather than building a second auth mechanism, per the DoR contract.
// Uses signUpEmail() (not stubGithubLogin()) because only the real email/password
// signup path sets req.session.firstLogin = true (routes/auth-email.js) — the
// GitHub OAuth stub added by A1 (routes/auth-stub.js) does not set that flag, so a
// stub-authenticated session is immediately bounced from GET /welcome to
// /dashboard before plan selection can be exercised. This is A1's session shape,
// not something this story modifies.
//
// AC1: Successful test-mode checkout (Stripe's documented success card,
//      4242 4242 4242 4242) activates the tenant's plan, verified via a real
//      Stripe test-mode webhook round trip landing on GET /billing/plan-state.
// AC2: The Stripe-hosted checkout redirect lands on the expected authenticated
//      post-checkout page, and the session remains authenticated.
// AC3: A declined test-mode card (4000 0000 0000 0002) shows a decline message
//      and leaves the tenant's plan state unchanged.
//
// *** REAL, VERIFIED FINDING (see decisions.md, "A2 SameSite=Strict session-cookie
// finding") ***
// AC2 is written below to assert its literal, intended behaviour and is expected
// to FAIL against real staging as currently built. This was confirmed by manual
// exploratory runs against real wuce-staging before writing this spec (not
// simulated): the session cookie is set with SameSite=Strict
// (src/web-ui/middleware/session.js), and Stripe's hosted Checkout page returns
// control to wuce-staging via a cross-site-initiated top-level GET redirect. A
// SameSite=Strict cookie is never attached to a cross-site-initiated top-level
// navigation (this is the defining difference between Strict and Lax), so
// GET /billing/success arrives with no session, is treated as unauthenticated,
// and 302s to '/' (the public landing page) instead of the expected
// authenticated /dashboard page. This reproduced on every real run performed
// against wuce-staging while building this spec. Fixing it (e.g. relaxing
// SameSite to Lax for the billing redirect path, or another token-handoff
// mechanism) is a session-middleware change affecting all cookie-scoped
// traffic, not a billing-only change — out of scope for this observation-only
// story (see the story's Out of Scope section and the "do not modify billing
// code itself" constraint) and is logged as a genuine follow-up finding rather
// than worked around here.
//
// AC1 and AC3 do not depend on the browser session surviving that redirect:
// - AC1 verifies plan-state via a fresh re-login (same tenant identity,
//   email = tenantId for email/password accounts) rather than the original
//   browser session, since the webhook that activates the plan is a
//   server-to-server call from Stripe and is provably independent of whatever
//   happens to the user's browser cookie.
// - AC3 never leaves wuce-staging.fly.dev in the first place (a declined card
//   keeps the user on the Stripe Checkout page showing an inline error; there
//   is no cross-site redirect back to verify), so the original session/context
//   is still valid for a same-site follow-up request.

'use strict';

const { test, expect } = require('@playwright/test');
const {
  STAGING_BASE_URL,
  signUpEmail,
  loginEmail
} = require('./fixtures/staging-auth');

test.use({ baseURL: STAGING_BASE_URL });

const SUCCESS_CARD = '4242424242424242';
const DECLINE_CARD = '4000000000000002';

/**
 * Drive a freshly-authenticated first-login user from /welcome through to
 * Stripe's hosted Checkout page for the first available plan, and fill in the
 * given test card. Stops just before submitting Pay/Subscribe so the caller
 * can assert on either the success or decline path.
 * @param {import('@playwright/test').Page} page
 * @param {string} cardNumber
 */
async function goToCheckoutAndFillCard(page, cardNumber) {
  await page.goto('/welcome');
  const firstPlan = page.locator('.plan-card').first();
  await expect(firstPlan, 'at least one plan must be offered on /welcome').toBeVisible();

  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 }),
    firstPlan.locator('button').click()
  ]);

  await page.fill('#email', 'e2e-checkout-contact@example.test');
  await page.fill('#cardNumber', cardNumber);
  await page.fill('#cardExpiry', '12/34');
  await page.fill('#cardCvc', '123');
  await page.fill('#billingName', 'E2E Test');
}

/** Poll GET /billing/plan-state (JSON) until it changes or the timeout is hit. */
async function pollPlanState(request, predicate, { attempts = 10, intervalMs = 1500 } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    const res = await request.get('/billing/plan-state');
    if (res.status() === 200) {
      last = await res.json();
      if (predicate(last)) return last;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return last;
}

test.describe('a2-stripe-test-mode-plan-selection', () => {

  test('AC1: successful test-mode checkout activates the tenant plan', async ({ page, request }) => {
    const { email, password } = await signUpEmail(page.context().request, 'a2-ac1');

    await goToCheckoutAndFillCard(page, SUCCESS_CARD);
    await page.locator('button[type="submit"]').click();
    // Give Stripe's test-mode webhook delivery a moment to land on the server
    // before checking plan-state (asynchronous, server-to-server).
    await page.waitForTimeout(2000);

    // Verify via a fresh re-login for the same tenant identity (email = tenantId
    // for email/password accounts) rather than the original browser session —
    // see the file-level comment on why the original session cannot be trusted
    // to survive the Stripe redirect (AC2's own finding).
    await loginEmail(request, email, password);
    const planState = await pollPlanState(request, (s) => s && s.plan === 'paid' && s.status === 'active');

    expect(planState, 'GET /billing/plan-state must reflect the selected plan as active after a successful test-mode checkout').not.toBeNull();
    expect(planState.plan).toBe('paid');
    expect(planState.status).toBe('active');
  });

  test('AC2: the Stripe checkout redirect lands on the expected authenticated page with the session still valid', async ({ page }) => {
    await signUpEmail(page.context().request, 'a2-ac2');

    await goToCheckoutAndFillCard(page, SUCCESS_CARD);
    await Promise.all([
      page.waitForURL(/wuce-staging\.fly\.dev/, { timeout: 30000 }),
      page.locator('button[type="submit"]').click()
    ]);
    await page.waitForTimeout(2000);

    // AC2's literal requirement: land on the expected post-checkout page
    // (dashboard), not an error/landing page, with the session still valid.
    expect(page.url(), 'must land on the authenticated post-checkout page, not the public landing page').toContain('/dashboard');

    const meRes = await page.context().request.get('/api/me');
    const me = await meRes.json().catch(() => ({}));
    expect(me.authenticated, 'the session must remain authenticated after the checkout redirect').toBe(true);
  });

  test('AC3: a declined test-mode card leaves plan state unchanged and shows a decline message', async ({ page }) => {
    await signUpEmail(page.context().request, 'a2-ac3');

    await goToCheckoutAndFillCard(page, DECLINE_CARD);
    await page.locator('button[type="submit"]').click();

    // A decline keeps the user on the Stripe Checkout page (no redirect back) —
    // no cross-site round trip to verify, so the original context's session
    // cookie is still valid for the same-site plan-state check below.
    await expect(page.getByText(/declined/i)).toBeVisible({ timeout: 15000 });

    const planRes = await page.context().request.get('/billing/plan-state');
    expect(planRes.status()).toBe(200);
    const planState = await planRes.json();
    expect(planState.plan, 'a declined card must not silently activate the plan').not.toBe('paid');
  });

});
