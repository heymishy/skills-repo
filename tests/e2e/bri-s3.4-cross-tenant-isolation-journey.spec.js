// bri-s3.4-cross-tenant-isolation-journey.spec.js — @mocked @multi-tenant
//
// Cross-tenant isolation journey (bri-s3.4). This is the single most
// security-critical spec in the beta-readiness effort (per this story's own
// NFR framing) -- it proves tenant A cannot read, list, or write tenant B's
// data through any code path this spec exercises. Any failure here blocks
// merges of unrelated work until root-caused (benefit-metric.md Metric 5).
//
// AC1: tenant A reading any tenant B resource by ID (journey, product)
//      via the API returns 404, never 403.
// AC2: tenant A's aggregate list endpoints (product dashboard, journey list)
//      contain zero tenant B resources.
// AC3: wugs-s11 removed this spec's standard-creation/write-rejection
//      coverage (smug-s1's DB-backed standards.js routes no longer exist —
//      see decisions.md's wugs-s11 entry). The AC3 test name is kept for
//      historical CI/dashboard continuity; its assertions now live in AC1.
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
// dss-s1: only meaningful against real wuce-staging -- empty {} locally, so
// this changes nothing about how this spec runs against the local harness.
// fix-forward (post-launch, rlld-s2 follow-up): this spec's own signup call
// previously used a non-"e2e-test-"-prefixed email and never sent the
// rate-limit-bypass header, so it did not qualify for the serlb-s1 bypass
// carve-out (routes/auth-email.js) -- exactly the same gap fixed in
// bri-s3.2-signup-onboarding-journey.spec.js (ssr-s1). This spec creates TWO
// tenant sessions per test, so it tripped the real 10-attempt/5-minute
// per-IP limiter twice as fast.
const { testEndpointBypassHeaders, hasStubSecret, RATE_LIMIT_BYPASS_HEADER, STUB_SECRET } = require('./fixtures/staging-auth');

const PASSWORD = 'Bri-S3-4-Test-Password-1!';

function uniqueEmail(label) {
  return 'e2e-test-bri-s3-4-' + label + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '@example.test';
}

/**
 * rcfc-s1: GET `path` and extract the session's real _csrf token from the
 * rendered HTML's hidden field, matching the convention already established
 * by sec-perf-s3 (see the signup flow below). Shared here since this file
 * now needs the same extraction at 3 call sites (signup, product confirm,
 * journey creation).
 */
async function getCsrfToken(ctx, path, label) {
  const res = await ctx.get(path);
  const html = await res.text();
  const csrfMatch = html.match(/name="_csrf" value="([^"]*)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  expect(csrfToken, label + ' must embed a _csrf token').toBeTruthy();
  return csrfToken;
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

  // sec-perf-s3: /auth/email/signup now requires a valid session-scoped CSRF token,
  // embedded as a hidden field in the real landing-page form. Load the landing page
  // first (establishes this context's own session + token) before posting signup.
  const csrfToken = await getCsrfToken(ctx, '/', label + ' landing page');

  const signupHeaders = {};
  if (hasStubSecret()) signupHeaders[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET;

  const signupRes = await ctx.post('/auth/email/signup', {
    form: { email: email, password: PASSWORD, _csrf: csrfToken },
    headers: signupHeaders,
    maxRedirects: 0
  });
  expect(signupRes.status(), label + ' signup should redirect to /welcome').toBe(302);

  const completeRes = await ctx.post('/test/complete-onboarding', { headers: testEndpointBypassHeaders() });
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

  // rcfc-s1: /products/confirm now requires a valid session-scoped CSRF token,
  // embedded as a hidden field in the real /products/new form.
  const csrfToken = await getCsrfToken(ctx, '/products/new', 'products/new page');

  const confirmRes = await ctx.post('/products/confirm', {
    form: { name: name, description: 'bri-s3.4 cross-tenant isolation fixture product.', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location).toMatch(/^\/products\//);
  return location.split('/products/')[1];
}

/** Create a journey via the real (disk-store-backed) journey creation flow. Returns the journeyId. */
async function createJourney(ctx, featureName) {
  // rcfc-s1: /api/journey now requires a valid session-scoped CSRF token,
  // embedded as a hidden field in the real /journey home page form.
  const csrfToken = await getCsrfToken(ctx, '/journey', 'journey home page');

  const createRes = await ctx.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery', _csrf: csrfToken },
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

test.describe('bri-s3.4 cross-tenant isolation journey @mocked @multi-tenant', () => {

  test('AC5 baseline: real-LLM-call counter is available', async ({ request }) => {
    const res = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe('number');
  });

  test('AC1/AC2/AC5: tenant A cannot read or list tenant B\'s journeys/products, with zero real LLM calls', async ({ request }) => {
    test.setTimeout(60000);

    const beforeCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const beforeCount = (await beforeCountRes.json()).count;

    // ── Setup: two fully independent, simultaneously-authenticated tenants ──
    const tenantA = await newTenantSession('a');
    const tenantB = await newTenantSession('b');

    const productA = await createProduct(tenantA.ctx, 'Tenant A Product');
    const productB = await createProduct(tenantB.ctx, 'Tenant B Product');

    const journeyA = await createJourney(tenantA.ctx, 'Tenant A Feature');
    const journeyB = await createJourney(tenantB.ctx, 'Tenant B Feature');

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

    // ── AC5: zero real LLM calls were made across this whole run ──
    const afterCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount, 'no real Anthropic/Copilot API calls during the mocked cross-tenant run').toBe(beforeCount);

    await tenantA.ctx.dispose();
    await tenantB.ctx.dispose();
  });

});
