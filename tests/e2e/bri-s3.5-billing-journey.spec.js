// bri-s3.5-billing-journey.spec.js — @mocked @billing E2E coverage for the
// trial→paid upgrade, usage-gate enforcement, payment-failure, and
// downgrade/cancellation billing journeys (ADR-018: Playwright, tests/e2e/).
//
// AC1: Stripe test-mode checkout → tenant/session reflects paid plan immediately
//      after the mocked checkout.session.completed webhook is processed.
// AC2: Tenant at usage limit attempts to exceed it via the browser UI → the
//      pre-flight usage gate blocks with a clear, human-readable error page.
// AC3: Mocked payment-failure webhook → tenant plan state reflects the failure
//      (past_due) — not silently ignored.
// AC4: Paid tenant downgrades/cancels → mocked cancellation webhook → plan
//      state and usage gates reflect the downgrade (access restricted per the
//      new plan, not left at the old plan's unlimited access).
// AC5: This spec uses only S3.1's mock gateway and mocked/test-mode Stripe —
//      zero real Stripe API calls, asserted via a call-count spy.
//
// No real Stripe API or DB calls anywhere in this spec: the webhook events are
// synthetic JSON payloads POSTed directly to /webhook/stripe, verified server-side
// by a NODE_ENV=test-only fake Stripe adapter (see server.js) that simply parses
// the raw body instead of checking a real signature — there is no real Stripe
// secret available in this @mocked/@billing per-PR variant to sign a real one.
//
// Session/tenant isolation: each scenario seeds its own session + tenantId via
// GET /test/session?sessionId=&tenantId= (bri-s3.5 extension to the existing
// test-only endpoint) so this spec never touches the shared 'e2e-tester' tenant
// other spec files rely on, and scenarios don't interfere with each other.

const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const TENANT_CAPS_PATH = path.join(__dirname, '..', '..', 'tenant-caps.json');

/** Seed an isolated session (own cookie, own tenantId) and return the cookie header value. */
async function seedTenantSession(request, suffix, tenantId) {
  const sessionId = 'e2e' + '0'.repeat(58) + suffix; // suffix is 2 hex chars — stays within [a-f0-9]+
  const resp = await request.get(`/test/session?sessionId=${sessionId}&tenantId=${encodeURIComponent(tenantId)}`);
  expect(resp.ok()).toBeTruthy();
  return `session_id=${sessionId}`;
}

async function getPlanState(request, cookie) {
  const resp = await request.get('/billing/plan-state', { headers: { cookie } });
  expect(resp.status()).toBe(200);
  return resp.json();
}

async function postWebhook(request, event) {
  return request.post('/webhook/stripe', {
    headers: { 'content-type': 'application/json', 'stripe-signature': 'test-mode-bypass' },
    data: JSON.stringify(event),
  });
}

/** Write (or update) a single tenant's cap override in tenant-caps.json, restoring the prior file afterward. */
function withTenantCap(tenantId, cap, fn) {
  let priorContent = null;
  let hadFile = false;
  try { priorContent = fs.readFileSync(TENANT_CAPS_PATH, 'utf8'); hadFile = true; } catch (_) {}
  const caps = hadFile ? JSON.parse(priorContent) : {};
  caps[tenantId] = cap;
  fs.writeFileSync(TENANT_CAPS_PATH, JSON.stringify(caps));
  return Promise.resolve(fn()).finally(function() {
    if (hadFile) {
      fs.writeFileSync(TENANT_CAPS_PATH, priorContent);
    } else {
      try { fs.unlinkSync(TENANT_CAPS_PATH); } catch (_) {}
    }
  });
}

test.describe('@mocked @billing bri-s3.5 billing journey', () => {

  test('@mocked @billing AC5: zero real Stripe API calls at the start of the suite', async ({ request }) => {
    const resp = await request.get('/test/stripe-call-count');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.count).toBe(0);
  });

  test('@mocked @billing AC1: checkout.session.completed upgrade reflects paid plan immediately', async ({ request }) => {
    const cookie = await seedTenantSession(request, '01', 'e2e-bri-billing-upgrade');

    const before = await getPlanState(request, cookie);
    expect(before.plan).toBe('trial');

    const webhookResp = await postWebhook(request, {
      id: 'evt_e2e_ac1',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'e2e-bri-billing-upgrade', metadata: { planName: 'STARTER' } } },
    });
    expect(webhookResp.status()).toBe(200);

    const after = await getPlanState(request, cookie);
    expect(after.plan).toBe('paid');
    expect(after.status).toBe('active');
  });

  test('@mocked @billing AC3: payment-failure webhook reflects failure state, not silently ignored', async ({ request }) => {
    const cookie = await seedTenantSession(request, '02', 'e2e-bri-billing-failure');

    // Start from paid/active (as if the tenant had already upgraded).
    await postWebhook(request, {
      id: 'evt_e2e_ac3_upgrade',
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'e2e-bri-billing-failure', metadata: { planName: 'STARTER' } } },
    });
    const whilePaid = await getPlanState(request, cookie);
    expect(whilePaid.plan).toBe('paid');
    expect(whilePaid.status).toBe('active');

    const webhookResp = await postWebhook(request, {
      id: 'evt_e2e_ac3_failure',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_e2e', metadata: { tenant_id: 'e2e-bri-billing-failure' } } },
    });
    expect(webhookResp.status()).toBe(200);

    const afterFailure = await getPlanState(request, cookie);
    expect(afterFailure.status).toBe('past_due');
    expect(afterFailure.status).not.toBe(whilePaid.status);
  });

  test('@mocked @billing AC2: hitting the usage limit blocks with a clear, human-readable error in the UI', async ({ page, request }) => {
    const tenantId = 'e2e-bri-billing-capped';
    const cookie = await seedTenantSession(request, '03', tenantId);
    await page.context().addCookies([{
      name: 'session_id', value: cookie.split('=')[1], domain: 'localhost', path: '/',
    }]);

    await withTenantCap(tenantId, 0, async () => {
      // cap=0 means the very first journey attempt is already "at the limit" —
      // a valid, deterministic way to exercise the blocked path without first
      // needing to create N journeys through the UI.
      // Drive the real HTML form (not a raw API call) — a native form submit
      // navigates the browser, so the gate's rendered HTML page (status 402)
      // becomes the resulting document, exactly as a real user would see it.
      await page.goto('/journey');
      await page.fill('#jh-fname', 'E2E capped feature');
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('.jh-submit'),
      ]);
      expect(response.status()).toBe(402);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toContain('Journey limit reached');
      expect(bodyText).toContain('You have reached the maximum of');
      // Human-readable rendered HTML page, not a raw JSON error blob.
      expect((await page.content()).trim().startsWith('{')).toBe(false);
    });
  });

  test('@mocked @billing AC4: cancellation downgrades plan and restricts usage gates per the new plan', async ({ request }) => {
    const tenantId = 'e2e-bri-billing-cancel';
    const cookie = await seedTenantSession(request, '04', tenantId);

    await withTenantCap(tenantId, 1, async () => {
      // Upgrade to paid — usage gate becomes unlimited regardless of the cap=1 override.
      await postWebhook(request, {
        id: 'evt_e2e_ac4_upgrade',
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: tenantId, metadata: { planName: 'STARTER' } } },
      });
      const paidState = await getPlanState(request, cookie);
      expect(paidState.plan).toBe('paid');

      // While paid: create two journeys — exceeding the nominal cap=1, allowed because paid+active.
      for (let i = 0; i < 2; i++) {
        const createResp = await request.post('/api/journey', {
          headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
          data: 'featureName=' + encodeURIComponent('E2E cancel feature ' + i),
        });
        expect(createResp.status()).not.toBe(402);
      }

      // Cancel the subscription.
      const cancelResp = await postWebhook(request, {
        id: 'evt_e2e_ac4_cancel',
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_e2e_cancel', metadata: { tenant_id: tenantId } } },
      });
      expect(cancelResp.status()).toBe(200);

      const canceledState = await getPlanState(request, cookie);
      expect(canceledState.plan).toBe('trial');
      expect(canceledState.status).toBe('canceled');

      // Now attempting a third journey is blocked — restricted per the new (trial, cap=1) plan,
      // not left at the old (paid, unlimited) plan's access level.
      const blockedResp = await request.post('/api/journey', {
        headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
        data: 'featureName=' + encodeURIComponent('E2E cancel feature blocked'),
      });
      expect(blockedResp.status()).toBe(402);
    });
  });

  test('@mocked @billing AC5: zero real Stripe API calls at the end of the suite', async ({ request }) => {
    const resp = await request.get('/test/stripe-call-count');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.count).toBe(0);
  });

});
