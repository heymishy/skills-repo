const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

// lpw-s3: this spec used the unauthenticated test() and a product id that does not exist
// (/products/test-product-id/kanban), so the server redirected it to sign-in and it always found 0 columns. It now
// signs in and opens the board of a real product, which is what "8 columns visible without horizontal overflow" means.
async function createProduct(request, name) {
  const draft = await request.post('/products/new', { data: { name: name, description: 'psh-s6 E2E fixture product.' }, headers: { 'Content-Type': 'application/json' } });
  expect(draft.status(), 'POST /products/new (draft)').toBe(200);
  const csrfToken = await getCsrfToken(request, '/products/new', 'product creation page');
  const confirm = await request.post('/products/confirm', { form: { name: name, description: 'psh-s6 E2E fixture product.', _csrf: csrfToken }, maxRedirects: 0 });
  expect(confirm.status(), 'POST /products/confirm should redirect to the product view').toBe(302);
  return confirm.headers()['location'].split('/products/')[1];
}

withAuth('product kanban 8 columns visible without horizontal overflow at 1280x800', async ({ page }) => {
  const productId = await createProduct(page.context().request, 'PSH-S6 Kanban Product ' + Date.now());
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1280);
  const columns = await page.locator('[data-stage]').count();
  expect(columns).toBe(8);
});
