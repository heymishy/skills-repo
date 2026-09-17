// tests/e2e/ep1-s3-feature-pod-inheritance.spec.js
// @mocked
//
// No browser rendering — there is no UI surfacing this story's outcome yet
// (DoR: "Listing pod members in the feature creation UI" is explicitly
// deferred to Epic 2). This test uses page.request only, to prove the real
// server + real fake-test-db.js dispatch path works end-to-end -- the same
// risk class (a handler correct in isolation but never exercised through
// its real wiring) that caused a severe bug in ep1-s1.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueName(label) {
  return 'ep1-s3-' + label + '-' + Date.now();
}

withAuth('ep1-s3: a feature created under a product with a default pod inherits it, end-to-end through the real server', async ({ page }) => {
  const productName = uniqueName('product');
  const podName = uniqueName('pod');

  // Create product (API-based fixture, established pattern from bmau-s1/ep1-s2).
  const draftRes = await page.request.post('/products/new', {
    data: { name: productName, description: 'ep1-s3 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);
  const newPageCsrf = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: productName, description: 'ep1-s3 E2E fixture product.', _csrf: newPageCsrf },
    maxRedirects: 0
  });
  expect(confirmRes.status()).toBe(302);
  const productId = confirmRes.headers()['location'].split('/products/')[1];

  // das-s2's repo-connection gate needs a repo before the product's FIRST
  // feature can be created -- seed one via the same test-only fixture
  // endpoint bmau-s1's own spec already establishes for exactly this reason.
  const repoSeedRes = await page.request.post('/test/seed-product-repo', { data: { productId: productId } });
  expect(repoSeedRes.status()).toBe(200);

  // Create pod via the real UI (fast, already-tested flow — matches ep1-s1/ep1-s2's own pattern).
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', podName);
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  // Set as product default (real endpoint, ep1-s2's own feature).
  await page.goto('/products/' + productId);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podName });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText(podName);

  // Create a feature under this product via the REAL handler (page.request only).
  const productPageCsrf = await getCsrfToken(page.request, '/products/' + productId, 'product page');
  const featureRes = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: 'ep1-s3 E2E Feature', _csrf: productPageCsrf },
    maxRedirects: 0
  });
  expect(featureRes.status(), 'feature creation should redirect to a discovery chat session').toBe(303);
  const location = featureRes.headers()['location'] || '';
  expect(location).toMatch(/\/skills\/discovery\/sessions\/[^/]+\/chat/);

  // ep1-s3 Task 7 (fix): the redirect succeeding is NOT sufficient proof --
  // handlePostProductFeature wraps its whole pod-inheritance block in a
  // non-fatal try/catch (products.js), so this same 303 redirect happens
  // identically whether pod-inheritance ran correctly, threw and was
  // swallowed, or never ran at all. Confirmed empirically: reverting this
  // story's entire fake-test-db.js extension still left the redirect
  // assertion above passing 1/1. Real proof requires reading DB state, and
  // an E2E spec has no require()-level access to journey-store.js/
  // feature-collaborator-store.js internals -- only the session id is
  // available, extracted from the Location header above. The new
  // GET /test/pod-inheritance-state/:sessionId endpoint (server.js)
  // resolves journeyId server-side via skillsRoute._getHtmlSession and
  // reads real pod_assignments/feature_collaborators counts. See
  // decisions.md (2026-09-17).
  const sessionIdMatch = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(location);
  expect(sessionIdMatch, 'redirect Location should carry a session id').not.toBeNull();
  const sessionId = sessionIdMatch[1];

  const podStateRes = await page.request.get('/test/pod-inheritance-state/' + encodeURIComponent(sessionId));
  expect(podStateRes.status()).toBe(200);
  const podState = await podStateRes.json();

  // Exactly one pod_assignments row: the feature-level default-pod
  // assignment written by setFeatureDefaultPod for this journey.
  expect(podState.podAssignmentCount).toBe(1);
  // The pod created above has 2 members: the creator ("You", pre-included
  // by openModal() in pod-manager.html regardless of who is added) plus
  // "Hamish" (added explicitly via the roster's Add button). Both are
  // written to feature_collaborators by populateFeatureCollaboratorsFromPod,
  // which copies every pod_members row 1:1 with no filtering.
  expect(podState.collaboratorCount).toBe(2);
});
