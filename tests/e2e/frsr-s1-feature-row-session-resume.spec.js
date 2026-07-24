// frsr-s1-feature-row-session-resume.spec.js — story frsr-s1
// artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
//
// AC1 (end-to-end confirmation): clicking a feature row in a product's view
// navigates to that feature's artefact-index page (/features/:slug) in a
// real browser — both mouse click and keyboard activation work. AC2-AC5
// (sessionId recording, resume-link presence, chat-history reuse, honest
// not-found handling) are covered at the integration level in
// tests/check-frsr-s1-feature-row-session-resume.js, which can construct the
// completedStages/sessionId fixtures directly rather than driving a full
// mocked-LLM journey through to a completed stage just to click one row.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

async function createProduct(page, name) {
  const draftRes = await page.request.post('/products/new', {
    data: { name: name, description: 'Product created by the frsr-s1 E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed').toBe(200);

  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: name, description: 'Product created by the frsr-s1 E2E spec.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location, 'product confirm should redirect under /products/').toMatch(/^\/products\//);
  return location.split('/products/')[1];
}

async function createFeature(page, productId) {
  // handlePostProductFeature auto-generates the featureSlug (new-feature-<id>);
  // it does not read a featureName field.
  const res = await page.request.post('/products/' + productId + '/features', {
    form: { startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(res.status(), 'feature creation should redirect into a skill session').toBe(303);
}

withAuth('AC1: clicking a feature row navigates to its artefact-index page (/features/:slug)', async ({ page }) => {
  const productId = await createProduct(page, 'FRSR Product ' + uniqueLabel('click'));
  await createFeature(page, productId);

  await page.goto('/products/' + productId);

  const featureLink = page.locator('a.pvc-item-link').first();
  await expect(featureLink).toBeVisible();
  const href = await featureLink.getAttribute('href');
  expect(href, 'expected the feature row link to point at /features/:slug').toMatch(/^\/features\//);

  await Promise.all([
    page.waitForURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')),
    featureLink.click()
  ]);

  expect(page.url()).toContain(href);
  await expect(page.locator('h1')).toBeVisible();
});

withAuth('AC1: a feature row is keyboard-activatable (not mouse-only)', async ({ page }) => {
  const productId = await createProduct(page, 'FRSR Product ' + uniqueLabel('kbd'));
  await createFeature(page, productId);

  await page.goto('/products/' + productId);

  const featureLink = page.locator('a.pvc-item-link').first();
  await expect(featureLink).toBeVisible();
  const href = await featureLink.getAttribute('href');

  await featureLink.focus();
  await expect(featureLink).toBeFocused();

  await Promise.all([
    page.waitForURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')),
    page.keyboard.press('Enter')
  ]);

  expect(page.url()).toContain(href);
});
