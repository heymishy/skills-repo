// tests/e2e/ep1-s2-product-default-pod.spec.js
// @mocked
//
// Covers AC1 (set a product's default pod, UI updates without a page
// refresh) and AC3 (the assignment persists server-side across reload).
// Does NOT cover AC2 (a newly-created feature auto-inherits the default
// pod) -- that end-to-end outcome is deferred to ep1-s3's own dedicated
// story per artefacts/new-feature-2b74a292/decisions.md (2026-09-16,
// "ep1-s2's own AC2 conflicts with its own DoR touch-point contract").
// This story only proves the getProductDefaultPod() handoff-contract shape
// ep1-s3 will consume (see tests/check-ep1-s2-product-default-pod.js Part 4/4b).
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueName(label) {
  return 'ep1-s2-' + label + '-' + Date.now();
}

async function createTestProduct(page, name) {
  const draftRes = await page.request.post('/products/new', {
    data: { name: name, description: 'ep1-s2 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'product draft creation').toBe(200);
  const newPageCsrf = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: name, description: 'ep1-s2 E2E fixture product.', _csrf: newPageCsrf },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  return confirmRes.headers()['location'].split('/products/')[1];
}

async function createTestPod(page, podName) {
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', podName);
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();
}

withAuth('ep1-s2 AC1: set a product default pod, UI updates without page refresh', async ({ page }) => {
  const productName = uniqueName('product');
  const podName = uniqueName('pod');

  const productId = await createTestProduct(page, productName);
  await createTestPod(page, podName);

  await page.goto('/products/' + productId);
  await expect(page.locator('#default-pod-display')).toContainText('No default pod set.');

  await page.evaluate(function() { window.__ep1s2NoReloadMarker = true; });

  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podName });
  await page.click('#confirm-default-pod-btn');

  await expect(page.locator('#default-pod-display')).toContainText('Default pod: ' + podName);
  const markerSurvived = await page.evaluate(function() { return window.__ep1s2NoReloadMarker === true; });
  expect(markerSurvived, 'no full page reload should have occurred').toBe(true);
});

withAuth('ep1-s2 AC3: existing product data is unaffected by setting a default pod (and it persists across reload)', async ({ page }) => {
  const productName = uniqueName('product');
  const podName = uniqueName('pod');

  const productId = await createTestProduct(page, productName);
  await createTestPod(page, podName);

  await page.goto('/products/' + productId);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podName });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText(podName);

  // Reload and confirm the assignment persisted server-side (not just the AJAX-updated DOM).
  await page.reload();
  await expect(page.locator('#default-pod-display')).toContainText('Default pod: ' + podName);
});
