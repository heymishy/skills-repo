// bmau-s1-bulk-assign-rerender.spec.js — E2E coverage for AC3 (bulk-assign
// success visually moves the affected rows into their new module's section
// without a full page reload), story
// artefacts/2026-08-10-bulk-module-assignment-ui-gap/stories/bmau-s1-bulk-assign-checkbox-ui.md
//
// NOT in npm test chain (ADR-018, matching a4-module-expand-collapse.spec.js's
// own precedent) — run with:
//   npx playwright test tests/e2e/bmau-s1-bulk-assign-rerender.spec.js
//
// KNOWN GAP (pre-existing, not introduced by this story): modulesAdapter
// (src/web-ui/adapters/modules-adapter.js) is only wired in server.js's
// `if (process.env.DATABASE_URL)` block -- it has no in-memory
// createFakeTestDb() backing, unlike products/journeys/standards. Running
// this spec against the standard local/CI harness (NODE_ENV=test, no
// DATABASE_URL) will fail with "Adapter not wired: modulesDb" the moment it
// tries to create a module. Running it against a real Postgres instance
// (DATABASE_URL set) works, but creates real product/module/feature rows in
// whatever database that is -- do not point this at a shared staging/dev
// database without a deliberate, intentional cleanup plan (this repo has
// already accumulated significant real-data E2E pollution from exactly this
// pattern elsewhere -- see workspace/learnings.md). A real Postgres test
// instance (local, disposable, or a dedicated E2E-only database) is the
// right target. Follow-up: extend fake-test-db.js with product_modules/
// feature_module_assignments support (mirroring smug-s1's standards
// extension) so this spec runs in the standard harness like every other one.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'bmau-s1-' + label + '-' + Date.now();
}

/** Extract the _csrf token embedded as a hidden field in a rendered page. */
function extractCsrf(html) {
  const m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

withAuth('bulk-assigning checked features moves their rows into the target module section without a page reload (AC2, AC3)', async ({ page }) => {
  // ── Fixture setup: a product with 2 modules and 2 unclassified features ──
  const productName = uniqueName('product');
  const draftRes = await page.request.post('/products/new', {
    data: { name: productName, description: 'bmau-s1 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'product draft creation').toBe(200);

  // Neither /products/new (draft) nor /products/confirm require CSRF --
  // matching bri-s3.4-cross-tenant-isolation-journey.spec.js's own
  // createProduct() helper. /products/:id/features also has no CSRF check
  // (handlePostProductFeature) -- only the module-mutating routes below do.
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: productName, description: 'bmau-s1 E2E fixture product.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  const productId = confirmRes.headers()['location'].split('/products/')[1];

  // das-s2's repo-connection gate blocks a product's first feature creation
  // until a repo is connected, which normally requires a real GitHub
  // accessToken the synthetic withAuth session doesn't have -- seed one
  // directly via the test-only fixture endpoint (see server.js's own
  // comment on /test/seed-product-repo for why this exists).
  const repoSeedRes = await page.request.post('/test/seed-product-repo', {
    data: { productId: productId },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(repoSeedRes.status(), 'repo seed fixture').toBe(200);

  // Two features, created unclassified.
  const feature1Res = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: uniqueName('feature-a'), startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(feature1Res.status(), 'handlePostProductFeature redirects with 303 (See Other), not 302').toBe(303);
  const feature2Res = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: uniqueName('feature-b'), startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(feature2Res.status(), 'handlePostProductFeature redirects with 303 (See Other), not 302').toBe(303);

  // One module -- the target. Both features start unclassified (the default
  // for a freshly-created feature), matching this story's primary real-world
  // use case: bulk-classifying a batch of not-yet-organized features.
  const productHtml = await (await page.request.get('/products/' + productId)).text();
  const pageCsrf = extractCsrf(productHtml);
  expect(pageCsrf, 'product page must embed a _csrf token').toBeTruthy();

  const moduleRes = await page.request.post('/products/' + productId + '/modules', {
    form: { name: 'Target Module', _csrf: pageCsrf }
  });
  expect(moduleRes.status(), 'handlePostProductModule returns 201 on creation').toBe(201);

  // ── Real browser: navigate, check 2 boxes, select Target Module, assign ──
  await page.goto('/products/' + productId);
  await page.waitForLoadState('networkidle');

  const checkboxes = page.locator('.bmau-item-checkbox');
  await expect(checkboxes).toHaveCount(2);
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();

  const assignBtn = page.locator('#bmau-assign-btn');
  await expect(assignBtn, 'AC4: button enables once >=1 checkbox is checked').toBeEnabled();

  const select = page.locator('#bmau-module-select');
  await select.selectOption({ label: 'Target Module' });

  // Grab the target module's section body BEFORE clicking, so we can assert
  // real DOM node insertion, not merely "text appears somewhere."
  const targetHeader = page.locator('.a4-module-header', { hasText: 'Target Module' });
  const targetBodyId = await targetHeader.getAttribute('aria-controls');
  const targetBody = page.locator('#' + targetBodyId);
  await expect(targetBody.locator('.pvc-item')).toHaveCount(0, { timeout: 1000 });

  const urlBeforeAssign = page.url();
  await assignBtn.click();

  // AC3: rows move into the target module's own section -- confirm the DOM
  // node count directly, not a full page reload (URL/navigation unchanged).
  await expect(targetBody.locator('.pvc-item')).toHaveCount(2, { timeout: 5000 });
  expect(page.url()).toBe(urlBeforeAssign);

  // The Unclassified section (both features started there) must now show
  // zero items -- moved out, not duplicated.
  const unclassifiedHeader = page.locator('.a4-module-header', { hasText: 'Unclassified' });
  const unclassifiedBodyId = await unclassifiedHeader.getAttribute('aria-controls');
  const unclassifiedBody = page.locator('#' + unclassifiedBodyId);
  await expect(unclassifiedBody.locator('.pvc-item')).toHaveCount(0);

  // Both section headers' count badges reflect the move.
  await expect(targetHeader).toContainText('(2)');
  await expect(unclassifiedHeader).toContainText('(0)');
});
