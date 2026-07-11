// bri-s3.4-cross-tenant-isolation-journey.spec.js — @mocked @multi-tenant
//
// Cross-tenant isolation journey (bri-s3.4). This is the single most
// security-critical spec in the beta-readiness effort (per this story's own
// NFR framing) -- it proves tenant A cannot read, list, or write tenant B's
// data through any code path this spec exercises. Any failure here blocks
// merges of unrelated work until root-caused (benefit-metric.md Metric 5).
//
// AC1: tenant A reading any tenant B resource by ID (journey, product,
//      standard) via the API returns 404, never 403.
// AC2: tenant A's aggregate list endpoints (product dashboard, journey list)
//      contain zero tenant B resources.
// AC3: tenant A's write/mutation against a tenant B resource (editing a
//      standard) is rejected and tenant B's data is unmodified afterward.
// AC4: enforced via CI configuration (--repeat-each=20, zero-tolerance gate)
//      — not a per-run assertion in this spec.
// AC5: this spec never calls the real Copilot/Anthropic APIs, asserted via
//      the server's real-LLM-call counter (GET /test/real-llm-call-count) —
//      same pattern as bri-s3.1's and bri-s3.2's specs.
//
// Two independent tenants are created via the real email/password signup
// flow (bri-s3.2 pattern) -- each new email is its own tenant (tenantId ===
// email, per routes/auth-email.js). Two SEPARATE Playwright request
// contexts are used (not the shared `request` fixture) so each tenant's
// session cookie is held in its own, independent cookie jar -- both tenants
// need to be simultaneously authenticated within the same test.

'use strict';

const { test, expect, request: playwrightRequest } = require('@playwright/test');

const PASSWORD = 'Bri-S3-4-Test-Password-1!';

function uniqueEmail(label) {
  return 'bri-s3-4-' + label + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '@example.test';
}

/**
 * Create a brand-new, independent Playwright APIRequestContext (its own
 * cookie jar) and sign up + complete onboarding as a fresh user within it.
 * Returns { ctx, email } — `ctx` carries the authenticated session cookie for
 * all subsequent calls made through it.
 */
async function newTenantSession(label) {
  const ctx = await playwrightRequest.newContext({
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3999'
  });
  const email = uniqueEmail(label);

  const signupRes = await ctx.post('/auth/email/signup', {
    form: { email: email, password: PASSWORD },
    maxRedirects: 0
  });
  expect(signupRes.status(), label + ' signup should redirect to /welcome').toBe(302);

  const completeRes = await ctx.post('/test/complete-onboarding');
  expect(completeRes.status()).toBe(200);

  return { ctx: ctx, email: email };
}

/** Create a product via the real product-creation flow. Returns the productId. */
async function createProduct(ctx, name) {
  const draftRes = await ctx.post('/products/new', {
    data: { name: name, description: 'bri-s3.4 cross-tenant isolation fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);

  const confirmRes = await ctx.post('/products/confirm', {
    form: { name: name, description: 'bri-s3.4 cross-tenant isolation fixture product.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location).toMatch(/^\/products\//);
  return location.split('/products/')[1];
}

/** Create a journey via the real (disk-store-backed) journey creation flow. Returns the journeyId. */
async function createJourney(ctx, featureName) {
  const createRes = await ctx.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const location = createRes.headers()['location'];
  const m = location.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  expect(m, 'journey creation should redirect to a discovery chat session').toBeTruthy();

  // Resolve the journeyId from the chat page's embedded gate-confirm URL
  // (same technique as bri-s3.2's spec).
  const chatRes = await ctx.get(location);
  expect(chatRes.status()).toBe(200);
  const html = await chatRes.text();
  const jm = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  expect(jm, 'journeyId should be resolvable from the chat page').toBeTruthy();
  return jm[1];
}

/** Create a standard for a product via the real standard-creation flow. Returns the standardId. */
async function createStandard(ctx, productId, name, content) {
  const res = await ctx.post('/products/' + productId + '/standards', {
    data: { name: name, content: content },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(res.status(), 'standard creation').toBe(201);
  const body = await res.json();
  expect(body.standard_id).toBeTruthy();
  return body.standard_id;
}

test.describe('bri-s3.4 cross-tenant isolation journey @mocked @multi-tenant', () => {

  test('AC5 baseline: real-LLM-call counter is available', async ({ request }) => {
    const res = await request.get('/test/real-llm-call-count');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe('number');
  });

  test('AC1/AC2/AC3/AC5: tenant A cannot read, list, or write tenant B\'s journeys/products/standards, with zero real LLM calls', async ({ request }) => {
    test.setTimeout(60000);

    const beforeCountRes = await request.get('/test/real-llm-call-count');
    const beforeCount = (await beforeCountRes.json()).count;

    // ── Setup: two fully independent, simultaneously-authenticated tenants ──
    const tenantA = await newTenantSession('a');
    const tenantB = await newTenantSession('b');

    const productA = await createProduct(tenantA.ctx, 'Tenant A Product');
    const productB = await createProduct(tenantB.ctx, 'Tenant B Product');

    const journeyA = await createJourney(tenantA.ctx, 'Tenant A Feature');
    const journeyB = await createJourney(tenantB.ctx, 'Tenant B Feature');

    const standardB = await createStandard(tenantB.ctx, productB, 'Tenant B Standard', 'Tenant B standard content — must never be readable or editable by tenant A.');

    // ── AC1: tenant A reading tenant B's resources by ID -> 404, never 403 ──
    const crossProductRes = await tenantA.ctx.get('/products/' + productB);
    expect(crossProductRes.status(), 'tenant A reading tenant B product by ID must be 404').toBe(404);

    const crossJourneyRes = await tenantA.ctx.get('/api/journey/' + journeyB);
    expect(crossJourneyRes.status(), 'tenant A reading tenant B journey by ID must be 404').toBe(404);

    const crossKanbanRes = await tenantA.ctx.get('/products/' + productB + '/kanban');
    expect(crossKanbanRes.status(), 'tenant A reading tenant B product kanban must be 404').toBe(404);

    // Regression guard: tenant A's own resources remain reachable.
    const ownProductRes = await tenantA.ctx.get('/products/' + productA);
    expect(ownProductRes.status(), 'tenant A reading its own product must succeed').toBe(200);
    const ownJourneyRes = await tenantA.ctx.get('/api/journey/' + journeyA);
    expect(ownJourneyRes.status(), 'tenant A reading its own journey must succeed').toBe(200);

    // ── AC2: aggregate lists contain zero tenant B resources ──
    const dashboardRes = await tenantA.ctx.get('/dashboard');
    expect(dashboardRes.status()).toBe(200);
    const dashboardHtml = await dashboardRes.text();
    expect(dashboardHtml).toContain('Tenant A Product');
    expect(dashboardHtml).not.toContain('Tenant B Product');
    expect(dashboardHtml).not.toContain(productB);

    const journeysListRes = await tenantA.ctx.get('/journeys');
    expect(journeysListRes.status()).toBe(200);
    const journeysHtml = await journeysListRes.text();
    expect(journeysHtml).not.toContain(journeyB);

    // ── AC2 (standards list): tenant A listing tenant B's product's standards
    //    (a request tenant A cannot legitimately make anyway, since it 404s
    //    at the product-ownership check first) returns zero rows either way.
    const crossStandardsListRes = await tenantA.ctx.get('/products/' + productB + '/standards');
    if (crossStandardsListRes.status() === 200) {
      const crossStandardsBody = await crossStandardsListRes.json();
      expect((crossStandardsBody.standards || []).length, 'tenant A must see zero standards for tenant B\'s product').toBe(0);
    } else {
      expect(crossStandardsListRes.status()).toBe(404);
    }

    // ── AC3: tenant A attempts to write tenant B's standard -> rejected, no data modified ──
    const crossWriteRes = await tenantA.ctx.put('/standards/' + standardB, {
      data: { name: 'Hacked By Tenant A', content: 'This should never be written.' },
      headers: { 'Content-Type': 'application/json' }
    });
    expect(crossWriteRes.status(), 'tenant A writing tenant B\'s standard must be rejected').toBe(404);

    // Confirm, from tenant B's own session, that its standard is unchanged.
    const bStandardsRes = await tenantB.ctx.get('/products/' + productB + '/standards');
    expect(bStandardsRes.status()).toBe(200);
    const bStandardsBody = await bStandardsRes.json();
    const bStandard = (bStandardsBody.standards || []).find(function (s) { return s.standard_id === standardB; });
    expect(bStandard, 'tenant B\'s standard must still exist').toBeTruthy();
    expect(bStandard.name, 'tenant B\'s standard name must be unmodified after the rejected cross-tenant write').toBe('Tenant B Standard');

    // ── AC5: zero real LLM calls were made across this whole run ──
    const afterCountRes = await request.get('/test/real-llm-call-count');
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount, 'no real Anthropic/Copilot API calls during the mocked cross-tenant run').toBe(beforeCount);

    await tenantA.ctx.dispose();
    await tenantB.ctx.dispose();
  });

});
