// a3-product-feature-ideate-canvas.spec.js — story a3-product-feature-ideate-canvas
// artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
//
// Targets a REAL deployed environment (wuce-staging by default, overridable via
// E2E_STAGING_BASE_URL) — NOT the local NODE_ENV=test mocked harness. Per
// ADR-018's addendum (.github/architecture-guardrails.md), this spec must
// never be invoked from the unit test chain (npm test); it only ever runs via
// `npm run test:e2e` (or a scoped Playwright invocation).
//
// Per the 2026-07-23 ARCH decision in decisions.md ("Staging E2E model calls
// must use the mock-LLM-gateway, not the real model"), this spec drives the
// /ideate session's turns against wuce-staging's already-live
// MOCK_LLM_GATEWAY=true configuration (fly.staging.toml [env] block) and the
// deterministic tests/e2e/fixtures/llm-gateway/ideate.success.json fixture —
// never the real Anthropic API. AC3's canvas-marker assertion is fully
// deterministic as a result (no bounded-retry/manual-fallback needed, matching
// the 2026-07-23 revision to this story's AC3 and test plan).
//
// AC1: product creation persists across a page reload (driven through the
//      real /products/new -> /products/confirm UI, then confirmed on a
//      genuine reload and on a second, independent route — /dashboard).
// AC2: a "rough idea" feature creation routes into /ideate and the resulting
//      session is reachable at its own URL (re-fetched independently, in a
//      new browser tab sharing the same authenticated context, and shown to
//      resolve to the identical session — not a blank/new one).
// AC3: 2 turns of ideation conversation against the mock-LLM-gateway's
//      deterministic canvas-marker fixture cause the visual canvas DOM to
//      render card/block elements and to grow (new elements appear) between
//      turn 1 and turn 2 — not a static/frozen canvas.
// AC4 (disk-persisted artefact match) is verified separately and
//      deterministically by tests/check-a3-ideate-artefact-disk-match.js — it
//      exercises the real skills.js parseCanvasBlock/mergeRedisSessionData
//      functions directly against this spec's own mock fixture content and
//      does not depend on real staging, real credits, or a real model turn.
//      See that file for the AC4 coverage.
//
// Reuses tests/e2e/fixtures/staging-auth.js (A1) for authentication and
// tests/e2e/fixtures/admin-credits-topup.js (B1 follow-up, PR #555) to top up
// this spec's own e2e-test- tagged tenant's credits before driving any turn —
// per this repo's D37/reuse convention, neither fixture is duplicated here.
// Each test creates its own independent product/tenant context (no run-order
// coupling to any other spec file), matching the established precedent in
// tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js.
//
// *** KNOWN, SEPARATELY-TRACKED BLOCKER (see decisions.md "b1 follow-up" entry
//     and tests/e2e/fixtures/admin-credits-topup.js's own header comment) ***
// The `credits` table has no INSERT/upsert path for a brand-new tenant, so the
// real POST /api/admin/credits/adjust top-up this spec attempts in setup can
// still return HTTP 400 for a tenant with no existing credits row, even once
// the e2e-test-admin identity is correctly provisioned into
// ADMIN_GITHUB_LOGINS. AC3 (the only AC that requires a real skill turn) skips
// with the exact, accurate reason from topUpTestTenantCredits() when this
// happens, rather than fabricating a pass — mirroring b1's own precedent. AC1
// and AC2 do not require any skill turn (product/feature creation and session
// reachability are not credit-gated) and always run unconditionally.
//
// *** SECOND, DEEPER, INDEPENDENT BLOCKER FOUND WHILE VERIFYING THIS SPEC AGAINST
//     REAL STAGING (see decisions.md's "a3: the deployed wuce-staging container
//     never ships tests/" FINDING, 2026-07-23) ***
// Even once Finding 3 (credits-upsert) is resolved, AC3 would still fail for a
// separate reason: Dockerfile's production stage never COPYs tests/ into the
// deployed image, so mock-llm-gateway.js's FIXTURE_DIR (tests/e2e/fixtures/
// llm-gateway/) does not exist in the running container. flyctl ssh console
// confirms MOCK_LLM_GATEWAY=true is genuinely set as an env var, but a real turn
// (verified via the admin-bypass identity, which skips the credits gate
// entirely) returns an empty response ({"done":false,"response":"","usage":null})
// rather than the fixture's deterministic text -- _loadFixtureFile() throws
// "No fixture found" when the fixture directory itself is missing, and
// htmlSubmitTurn's surrounding try/catch silently swallows that throw. This is
// stage-independent (confirmed identically for both /ideate and /discovery), so
// it is not specific to this story's new ideate.success.json fixture. Recorded
// as a separate FINDING rather than worked around here -- deciding how fixture
// files should reach the deployed container is an architecture decision (image
// size, ADR-018's test/runtime separation) outside this story's scope.

'use strict';

const { test, expect } = require('@playwright/test');
const { STAGING_BASE_URL, signUpEmail } = require('./fixtures/staging-auth');
const { topUpTestTenantCredits } = require('./fixtures/admin-credits-topup');

test.use({ baseURL: STAGING_BASE_URL });

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

function creditsBlockedReason(topUpOutcome) {
  const topUpPart = topUpOutcome && topUpOutcome.reason
    ? 'Top-up attempt result: ' + topUpOutcome.reason
    : 'Top-up attempt reported toppedUp=true but the turn was still credit-blocked -- unexpected, investigate.';
  return (
    'wuce-staging blocks every real skill turn with HTTP 402 (Insufficient credits) for a tenant ' +
    'with a zero credit balance. This spec attempts a real admin-authenticated top-up in setup ' +
    '(tests/e2e/fixtures/admin-credits-topup.js) before driving any /ideate turn -- it did not succeed ' +
    'this run. ' + topUpPart + ' Skipping rather than fabricating a pass -- see this story\'s ' +
    'coding-agent report and decisions.md for the full, live-verified blocker writeup.'
  );
}

/**
 * Sign up a brand-new e2e-test- tagged tenant and create this spec's own
 * product context via the real /products/new -> /products/confirm API path
 * (independent of any other spec file's product, per the established
 * per-test-isolation convention).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} label
 * @returns {Promise<{email: string, productId: string, productName: string}>}
 */
async function createOwnProduct(request, label) {
  const { email } = await signUpEmail(request, label);
  const productName = 'A3 Product ' + label;

  const draftRes = await request.post('/products/new', {
    data: { name: productName, description: 'Product created by the a3-product-feature-ideate-canvas E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed for a freshly authenticated tenant').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: productName, description: 'Product created by the a3-product-feature-ideate-canvas E2E spec.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location, 'product confirm should redirect under /products/').toMatch(/^\/products\//);

  return { email: email, productId: location.split('/products/')[1], productName: productName };
}

/**
 * Create a feature via the "rough idea" path (the only shipped mechanism in
 * this codebase that routes a new feature into /ideate — the journey-wizard
 * form's `startSkill=ideate` radio option, journey.js `POST /api/journey`).
 * Mirrors b1's own `createFormedIdeaJourney` helper, choosing 'ideate' instead
 * of 'discovery'.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} featureName
 * @returns {Promise<{journeyId: string, sessionId: string, chatPath: string}>}
 */
async function createRoughIdeaFeature(request, featureName) {
  const createRes = await request.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'ideate' },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey (rough idea) should redirect to the new session').toBe(303);
  const location = createRes.headers()['location'];
  expect(location, 'rough-idea path must route into an /ideate chat session').toMatch(/^\/skills\/ideate\/sessions\//);

  const chatRes = await request.get(location);
  expect(chatRes.status()).toBe(200);
  const html = await chatRes.text();
  const journeyMatch = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  const sessionMatch = location.match(/\/skills\/ideate\/sessions\/([^/]+)\/chat/);

  return {
    journeyId: journeyMatch ? journeyMatch[1] : null,
    sessionId: sessionMatch ? sessionMatch[1] : null,
    chatPath: location
  };
}

test.describe('a3-product-feature-ideate-canvas @real-staging', () => {

  test('AC1: creating a product persists its details across a page reload', async ({ page }) => {
    test.setTimeout(60000);
    const { email } = await signUpEmail(page.request, uniqueLabel('a3-ac1'));
    void email;

    const productName = 'A3 Product ' + uniqueLabel('ac1-ui');

    await page.goto('/products/new');
    await page.locator('#psh-name').fill(productName);
    await page.locator('#psh-description').fill('e2e-test- product created via the real product-creation UI.');
    await page.locator('#psh-draft-btn').click();

    // Draft generation is an async fetch — wait for the confirm panel to appear.
    await expect(page.locator('#psh-drafts')).toBeVisible({ timeout: 15000 });

    await Promise.all([
      page.waitForURL(/\/products\/[^/]+$/, { timeout: 15000 }),
      page.locator('#psh-confirm-form button[type="submit"]').click()
    ]);

    // Immediate post-submit DOM state.
    await expect(page.locator('h1')).toHaveText(productName);
    const productUrl = page.url();

    // AC1: confirmed via a subsequent page load, not just the immediate post-submit DOM state.
    await page.reload();
    await expect(page.locator('h1')).toHaveText(productName, { timeout: 10000 });

    // Second, independent confirmation route: the products dashboard card.
    await page.goto('/dashboard');
    await expect(page.getByText(productName, { exact: true })).toBeVisible({ timeout: 10000 });

    expect(productUrl).toMatch(/\/products\//);
  });

  test('AC2: a rough-idea feature creation routes into /ideate and the session is reachable at its own URL', async ({ page }) => {
    test.setTimeout(60000);
    await createOwnProduct(page.request, uniqueLabel('a3-ac2'));

    const feature = await createRoughIdeaFeature(page.request, 'A3 E2E AC2 Feature ' + uniqueLabel('feat'));
    expect(feature.sessionId, 'a session ID must be resolvable from the redirect URL').toBeTruthy();
    expect(feature.journeyId, 'a journeyId must be resolvable from the rendered chat page').toBeTruthy();

    // First load, in a real browser page.
    await page.goto(feature.chatPath);
    const firstPageContent = await page.content();
    expect(firstPageContent).toContain('IS_IDEATE      = true');
    await expect(page.locator('#canvas-panel')).toBeAttached();

    // "Copy that URL, open a new browser tab, and paste it in" — a second page
    // sharing the same authenticated browser context, navigating directly to
    // the exact same URL.
    const secondPage = await page.context().newPage();
    await secondPage.goto(feature.chatPath);
    const secondPageContent = await secondPage.content();
    expect(secondPageContent).toContain('IS_IDEATE      = true');

    // Proves it is the SAME session, not a new/blank one: the embedded
    // journeyId (derived from this exact session's gate-confirm URL) must be
    // identical across both independent loads of the same URL.
    const firstJourneyMatch = firstPageContent.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
    const secondJourneyMatch = secondPageContent.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
    expect(firstJourneyMatch && firstJourneyMatch[1]).toBeTruthy();
    expect(secondJourneyMatch && secondJourneyMatch[1]).toBe(firstJourneyMatch[1]);

    await secondPage.close();
  });

  test('AC3: 2 ideation turns against the deterministic mock fixture render and update the canvas', async ({ page }) => {
    test.setTimeout(90000);
    const { email } = await createOwnProduct(page.request, uniqueLabel('a3-ac3'));

    // Credits gate applies to every real skill turn (including /ideate), per
    // src/web-ui/middleware/credits-guard.js. Attempt the real,
    // admin-authenticated top-up before driving any turn.
    const topUpOutcome = await topUpTestTenantCredits(email, 1000);
    test.skip(topUpOutcome.toppedUp !== true, creditsBlockedReason(topUpOutcome));

    const feature = await createRoughIdeaFeature(page.request, 'A3 E2E AC3 Feature ' + uniqueLabel('feat'));
    await page.goto(feature.chatPath);

    const canvasBlocks = page.locator('#canvas-panel .canvas-block');
    const initialCount = await canvasBlocks.count();

    // Turn 1 — mock-LLM-gateway (tests/e2e/fixtures/llm-gateway/ideate.success.json)
    // always includes exactly one ---CANVAS-JSON:...--- marker.
    await page.locator('#chat-input').fill('Here is my rough idea: an internal tool that captures meeting decisions automatically so nothing gets lost after a workshop.');
    await page.locator('#chat-form button[type="submit"]').click();

    await expect.poll(
      async () => canvasBlocks.count(),
      { timeout: 20000, message: 'canvas must render at least one card/block element after turn 1 (AC3)' }
    ).toBeGreaterThan(initialCount);

    const afterTurn1Count = await canvasBlocks.count();
    await expect(canvasBlocks.first().locator('.canvas-block-title')).toHaveText('Opportunity map');

    // Turn 2 — same deterministic fixture; the canvas must grow again (append,
    // not replace) — proving it is not a static/frozen canvas.
    await page.locator('#chat-input').fill('Let\'s focus on the capture problem first -- that seems like the highest-value cluster.');
    await page.locator('#chat-form button[type="submit"]').click();

    await expect.poll(
      async () => canvasBlocks.count(),
      { timeout: 20000, message: 'canvas must render a NEW element after turn 2, not stay frozen at its turn-1 count (AC3)' }
    ).toBeGreaterThan(afterTurn1Count);
  });

});
