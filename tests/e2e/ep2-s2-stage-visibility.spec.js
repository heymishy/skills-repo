// tests/e2e/ep2-s2-stage-visibility.spec.js — story ep2-s2
// artefacts/new-feature-2b74a292/stories/ep2-s2.md
//
// Follows the real product -> repo -> pod -> feature creation flow
// established by ep2-s1-presence-sidebar.spec.js / ep1-s3-feature-pod-
// inheritance.spec.js.
//
// --- Role-identity investigation (read before touching the assertions) ---
//
// withAuth (tests/e2e/fixtures/auth.js) always authenticates as a single
// fixed synthetic identity: { userId: 9999, login: 'e2e-tester',
// tenantId: 'e2e-tester' } (confirmed by reading auth.js and the /test/session
// handler in src/web-ui/server.js -- login is hardcoded 'e2e-tester' with no
// override; only sessionId/tenantId accept query overrides). The real
// handler this story adds, handleGetJourneyStageVisibility
// (src/web-ui/routes/journey.js), resolves "my" role with
// `collaborators.find(c => c.userId === req.session.login)` -- i.e. it is
// keyed on req.session.login, 'e2e-tester' for every Playwright test in this
// spec, not on any roster display name.
//
// ORG_ROSTER (src/web-ui/public/pod-manager.html) was read directly: it has
// exactly 3 demo entries -- Hamish (roleId 'conductor'), Susan (roleId
// 'engineer'), Darren (roleId 'engineer'). No entry has roleId 'product' --
// pod-manager.html's own VALID_ROLES lists 'product' as a legal role, but no
// demo person is tagged with it. Building a pod through the pod-manager.html
// UI (its fixed roster + hardcoded 'me-uuid'/'conductor' creator entry)
// therefore cannot produce a collaborator whose userId equals the real
// session login AND whose role is 'product' or 'engineer' -- confirmed via
// openModal(): the creator is always inserted as
// { userId: 'me-uuid', roleId: 'conductor' }, which never matches
// req.session.login ('e2e-tester'), so a UI-built pod would leave "my" role
// resolving to null -> ALL_STAGES (the fail-open branch in
// getVisibleStages), never actually exercising AC1 (product) or AC2
// (engineer) filtering for the one identity this browser session can ever
// render as.
//
// Resolution used here: routes/pods.js's handlePostPodsCreate (backing the
// real POST /api/pods/create route, read directly) validates ONLY
// `isValidRole(m.roleId)` against VALID_ROLES -- it does not check `userId`
// against ORG_ROSTER or any allowlist at all; pod-store.js's createPod()
// inserts exactly the members array it is given, with no implicit
// creator-add. ORG_ROSTER is therefore client-side demo data used only to
// populate the picker UI in pod-manager.html, not a server-side constraint.
// This spec calls POST /api/pods/create directly via page.request (the same
// real, unauthenticated-by-CSRF JSON route pod-manager.html's own fetch()
// call hits -- confirmed no CSRF middleware wraps this route in server.js,
// only authGuard) with a members array that includes
// { userId: 'e2e-tester', roleId: '<product|engineer>' } -- i.e. the
// AUTHENTICATED TEST SESSION'S OWN login, assigned the specific role each
// test needs. After pod-inheritance copies pod_members into
// feature_collaborators (ep1-s3, unmodified by this story), the real
// handler's `c.userId === req.session.login` match now succeeds against a
// genuine, deliberately-chosen role -- so the rendered page, loaded by this
// exact browser session, is a real, non-vacuous, end-to-end exercise of
// AC1's product-role view and AC2's engineer-role view: real HTTP route,
// real DB round trip, real client-side fetch + render in stage-list.js, not
// a value asserted only via require()'d module internals. AC3's toggle
// behaviour does not depend on which specific role is filtered, so it rides
// on the AC1 (product, 3 of 8 stages) fixture rather than needing a third
// full setup.
//
// Two independent product/pod/feature setups are used (one per role) rather
// than one shared feature, because only ONE person's view is ever
// observable per browser session -- there is no way to render "Susan's
// view" and "the session's own view" side by side in a single page load.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');
const stageVisibility = require('../../src/web-ui/modules/stage-visibility');

function uniqueName(label) {
  return 'ep2-s2-' + label + '-' + Date.now();
}

/**
 * Shared setup: product -> repo seed -> pod (real POST /api/pods/create,
 * with the AUTHENTICATED SESSION's own login as one of the members) ->
 * default pod -> feature creation -> resolve journeyId + real featureSlug.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} label - unique-name seed for this setup's product/pod
 * @param {{userId: string, roleId: string}[]} members - pod members; MUST
 *   include one entry with userId 'e2e-tester' (the fixed test-session
 *   login) for the role this call wants to exercise.
 * @returns {Promise<{journeyId: string, featureHref: string}>}
 */
async function setupFeatureWithPodMembers(page, label, members) {
  const productName = uniqueName('product-' + label);
  const podName = uniqueName('pod-' + label);

  const draftRes = await page.request.post('/products/new', {
    data: { name: productName, description: 'ep2-s2 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);
  const newPageCsrf = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: productName, description: 'ep2-s2 E2E fixture product.', _csrf: newPageCsrf },
    maxRedirects: 0
  });
  expect(confirmRes.status()).toBe(302);
  const productId = confirmRes.headers()['location'].split('/products/')[1];

  const repoSeedRes = await page.request.post('/test/seed-product-repo', { data: { productId: productId } });
  expect(repoSeedRes.status()).toBe(200);

  // Real POST /api/pods/create (routes/pods.js) -- no CSRF middleware on
  // this JSON route, only authGuard. Bypasses pod-manager.html's fixed
  // ORG_ROSTER picker entirely so the pod can include the actual
  // authenticated session's own login with a deliberately-chosen role --
  // see the file-header investigation notes above for why this is required.
  const podCreateRes = await page.request.post('/api/pods/create', {
    data: { name: podName, members: members },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(podCreateRes.status(), 'POST /api/pods/create should succeed').toBe(200);
  const podCreateJson = await podCreateRes.json();
  expect(podCreateJson.memberCount).toBe(members.length);

  await page.goto('/products/' + productId);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podName });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText(podName);

  const productPageCsrf = await getCsrfToken(page.request, '/products/' + productId, 'product page');
  const featureRes = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: 'Ep2 S2 Stage Visibility E2E Feature ' + label, _csrf: productPageCsrf },
    maxRedirects: 0
  });
  expect(featureRes.status(), 'feature creation should redirect to a discovery chat session').toBe(303);
  const location = featureRes.headers()['location'] || '';
  const sessionIdMatch = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(location);
  expect(sessionIdMatch, 'redirect Location should carry a session id').not.toBeNull();
  const sessionId = sessionIdMatch[1];

  const podStateRes = await page.request.get('/test/pod-inheritance-state/' + encodeURIComponent(sessionId));
  expect(podStateRes.status()).toBe(200);
  const podState = await podStateRes.json();
  expect(podState.collaboratorCount).toBe(members.length);
  const journeyId = podState.featureId;
  expect(journeyId, 'expected a journeyId resolved from the session').toBeTruthy();

  // Real featureSlug from the feature-row link (frsr-s1's established
  // pattern, reused verbatim from ep2-s1-presence-sidebar.spec.js) -- never
  // predicted client-side.
  await page.goto('/products/' + productId);
  await page.getByRole('button', { name: /Other features/ }).click();
  const featureLink = page.locator('#pvc-tab-panel-phase a.pvc-item-link').first();
  await expect(featureLink).toBeVisible();
  const featureHref = await featureLink.getAttribute('href');
  expect(featureHref, 'expected the feature row link to point at /features/:slug').toMatch(/^\/features\//);

  return { journeyId: journeyId, featureHref: featureHref };
}

withAuth('ep2-s2: AC1 + AC3 (+ NFR-A11y) — product role sees its filtered 3-stage default view on load; the Show all stages toggle reveals all 8 without losing any originally-visible stage, and reverts via keyboard', async ({ page }) => {
  // Generous budget: pod/product/feature setup (~10-15s) + several
  // fetch-driven waits + toggle round trips.
  test.setTimeout(120000);

  const { journeyId, featureHref } = await setupFeatureWithPodMembers(page, 'product', [
    { userId: 'e2e-tester', roleId: 'product' },  // the authenticated session's own login
    { userId: 'hamish-uuid', roleId: 'conductor' } // a second, differently-roled collaborator for realism
  ]);

  const expectedProductStages = stageVisibility.getVisibleStages('product');
  expect(expectedProductStages).toEqual(['discovery', 'benefit-metric', 'definition']);

  // --- Verify the real endpoint's role resolution directly (proves the ---
  // --- wiring, not just the pure mapping function) ---
  const apiRes = await page.request.get('/api/journey/' + encodeURIComponent(journeyId) + '/stage-visibility');
  expect(apiRes.status()).toBe(200);
  const apiJson = await apiRes.json();
  expect(apiJson.role, 'the authenticated session should resolve to the product-role collaborator row it was seeded with').toBe('product');
  expect(apiJson.visibleStages).toEqual(expectedProductStages);
  expect(apiJson.allStages).toEqual(stageVisibility.ALL_STAGES);

  // --- AC1: the rendered page (real client fetch + render) shows exactly ---
  // --- the product role's 3-stage default view on load ---
  await page.goto(featureHref);
  await expect(page.locator('#stage-list')).toBeVisible();

  const items = page.locator('#stage-list-items .stage-item');
  await expect(items).toHaveCount(expectedProductStages.length, { timeout: 10000 });
  const initialTexts = await items.allTextContents();

  const toggleBtn = page.locator('#stage-list-toggle');
  await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

  // No-page-reload marker for AC3.
  await page.evaluate(() => { window.__ep2s2NoReloadMarker = true; });

  // --- AC3: clicking the toggle reveals all 8 stages, without a reload, ---
  // --- and every originally-visible stage is still present (real union ---
  // --- check, not just a count change) ---
  await toggleBtn.click();
  await expect(items).toHaveCount(stageVisibility.ALL_STAGES.length, { timeout: 5000 });
  const allTexts = await items.allTextContents();
  for (const t of initialTexts) {
    expect(allTexts, 'no originally-visible stage should disappear when showing all stages').toContain(t);
  }
  await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__ep2s2NoReloadMarker)).toBe(true);

  // --- NFR-A11y: the toggle is keyboard-reachable and activates via Enter ---
  // --- (real <button> element -- focusable/activatable by default, no ---
  // --- extra work needed in the markup; verified directly here rather ---
  // --- than assumed) -- also exercises toggling back to the filtered view.
  await toggleBtn.focus();
  await expect(toggleBtn).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(items).toHaveCount(expectedProductStages.length, { timeout: 5000 });
  const finalTexts = await items.allTextContents();
  expect(finalTexts.slice().sort()).toEqual(initialTexts.slice().sort());
  await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.__ep2s2NoReloadMarker)).toBe(true);
});

withAuth('ep2-s2: AC2 — engineer role sees its own, differently-filtered 3-stage default view on load', async ({ page }) => {
  test.setTimeout(90000);

  const { journeyId, featureHref } = await setupFeatureWithPodMembers(page, 'engineer', [
    { userId: 'e2e-tester', roleId: 'engineer' }, // the authenticated session's own login
    { userId: 'susan-uuid', roleId: 'engineer' }  // real roster member, same role, confirms no cross-collaborator leakage
  ]);

  const expectedEngineerStages = stageVisibility.getVisibleStages('engineer');
  expect(expectedEngineerStages).toEqual(['test-plan', 'review', 'definition-of-ready']);
  expect(expectedEngineerStages).not.toEqual(stageVisibility.getVisibleStages('product'));

  const apiRes = await page.request.get('/api/journey/' + encodeURIComponent(journeyId) + '/stage-visibility');
  expect(apiRes.status()).toBe(200);
  const apiJson = await apiRes.json();
  expect(apiJson.role).toBe('engineer');
  expect(apiJson.visibleStages).toEqual(expectedEngineerStages);

  await page.goto(featureHref);
  await expect(page.locator('#stage-list')).toBeVisible();

  const items = page.locator('#stage-list-items .stage-item');
  await expect(items).toHaveCount(expectedEngineerStages.length, { timeout: 10000 });
});
