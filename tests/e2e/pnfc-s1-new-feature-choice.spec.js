// pnfc-s1-new-feature-choice.spec.js — story pnfc-s1
// artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md
//
// Runs against the LOCAL NODE_ENV=test Playwright harness (playwright.config.js
// webServer, port 3999) via the withAuth fixture, per this story's own test
// plan ("local NODE_ENV=test harness"), not the real-staging model used by
// tests/e2e/a3-product-feature-ideate-canvas.spec.js and similar @real-staging
// specs.
//
// AC1: clicking "New feature" on a product's page presents the same two-option
// rough-idea/formed-idea choice already used on /journey's own form, BEFORE
// any journey/session is created — not an immediate single-click POST/redirect.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

/**
 * Create a product via the real /products/new -> /products/confirm API path
 * (same flow used by tests/e2e/a3-product-feature-ideate-canvas.spec.js
 * against real staging), driven locally against the NODE_ENV=test webServer.
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 * @returns {Promise<string>} productId
 */
async function createProduct(page, name) {
  const draftRes = await page.request.post('/products/new', {
    data: { name: name, description: 'Product created by the pnfc-s1 E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed').toBe(200);

  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: name, description: 'Product created by the pnfc-s1 E2E spec.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location, 'product confirm should redirect under /products/').toMatch(/^\/products\//);
  return location.split('/products/')[1];
}

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

withAuth('AC1: clicking "New feature" on a product page presents the rough-idea/formed-idea choice before creating a journey', async ({ page }) => {
  const productId = await createProduct(page, 'PNFC Product ' + uniqueLabel('ac1'));

  await page.goto('/products/' + productId);
  const urlBeforeClick = page.url();

  // The choice panel starts hidden.
  await expect(page.locator('#psh-new-feature-panel')).toBeHidden();

  await page.locator('#psh-new-feature-btn').click();

  // AC1: a choice is shown -- not an immediate redirect/session creation.
  await expect(page.locator('#psh-new-feature-panel')).toBeVisible();
  await expect(page.locator('input[name="startSkill"][value="ideate"]')).toBeVisible();
  await expect(page.locator('input[name="startSkill"][value="discovery"]')).toBeVisible();
  // Matching /journey's own existing default: formed idea (discovery) pre-checked.
  await expect(page.locator('input[name="startSkill"][value="discovery"]')).toBeChecked();
  await expect(page.locator('input[name="startSkill"][value="ideate"]')).not.toBeChecked();

  // Still on the product page -- no journey/session has been created yet.
  expect(page.url()).toBe(urlBeforeClick);
});

withAuth('AC2 (UI-level): submitting the rough-idea choice routes into /skills/ideate/...', async ({ page }) => {
  const productId = await createProduct(page, 'PNFC Product ' + uniqueLabel('ac2'));

  await page.goto('/products/' + productId);
  await page.locator('#psh-new-feature-btn').click();
  await page.locator('input[name="startSkill"][value="ideate"]').check();

  await Promise.all([
    page.waitForURL(/\/skills\/ideate\/sessions\//, { timeout: 15000 }),
    page.locator('#psh-new-feature-panel form button[type="submit"]').click()
  ]);

  expect(page.url()).toMatch(/\/skills\/ideate\/sessions\/[^/]+\/chat$/);
});

withAuth('AC3 (UI-level): submitting the formed-idea choice (default) routes into /skills/discovery/...', async ({ page }) => {
  const productId = await createProduct(page, 'PNFC Product ' + uniqueLabel('ac3'));

  await page.goto('/products/' + productId);
  await page.locator('#psh-new-feature-btn').click();
  // Discovery is pre-checked by default -- submit without changing selection.

  await Promise.all([
    page.waitForURL(/\/skills\/discovery\/sessions\//, { timeout: 15000 }),
    page.locator('#psh-new-feature-panel form button[type="submit"]').click()
  ]);

  expect(page.url()).toMatch(/\/skills\/discovery\/sessions\/[^/]+\/chat$/);
});

withAuth('AC4 (UI-level): a feature created via the rough-idea path is visible on the product page afterward', async ({ page }) => {
  const productId = await createProduct(page, 'PNFC Product ' + uniqueLabel('ac4'));

  await page.goto('/products/' + productId);
  await page.locator('#psh-new-feature-btn').click();
  await page.locator('input[name="startSkill"][value="ideate"]').check();

  await Promise.all([
    page.waitForURL(/\/skills\/ideate\/sessions\//, { timeout: 15000 }),
    page.locator('#psh-new-feature-panel form button[type="submit"]').click()
  ]);

  // Go back to the product page and confirm the feature is listed.
  await page.goto('/products/' + productId);
  const featuresJson = await page.request.get('/products/' + productId, {
    headers: { Accept: 'application/json' }
  });
  // The route always renders HTML for a browser GET (res.json is a test-mock-only
  // path) -- assert via the rendered page instead: at least one feature row
  // should now be present where none existed before.
  void featuresJson;
  const body = await page.content();
  expect(body).not.toContain('No features yet');
});
