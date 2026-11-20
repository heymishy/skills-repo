// ctab-s1-collapsed-group-tab-order.spec.js -- story ctab-s1
// artefacts/2026-11-20-collapsed-group-tab-order/stories/ctab-s1-collapsed-group-not-focusable.md
//
// Content inside a collapsed module group on the product view must not be
// reachable by keyboard until the group is opened. A collapsed group is clipped
// to zero height, so a focus stop inside it would land on something the user
// cannot see. NOT in the npm test chain (ADR-018) -- run with:
//   NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/ctab-s1-collapsed-group-tab-order.spec.js

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { connectRepoToProduct } = require('./fixtures/product-repo');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

async function createProduct(page, name) {
  const draftRes = await page.request.post('/products/new', {
    data: { name: name, description: 'Product created by the ctab-s1 E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed').toBe(200);
  const csrfToken = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: name, description: 'Product created by the ctab-s1 E2E spec.', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);
  return confirmRes.headers()['location'].split('/products/')[1];
}

async function createFeature(page, productId) {
  await connectRepoToProduct(page.request, productId);
  const csrfToken = await getCsrfToken(page.request, '/products/' + productId, 'product view page');
  const res = await page.request.post('/products/' + productId + '/features', {
    form: { startSkill: 'discovery', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(res.status(), 'feature creation should redirect into a skill session').toBe(303);
}

// The visible group (the page also holds hidden copies in the inactive tab panels)
// that contains a feature row link.
function featureGroup(page) {
  return page.locator('.a4-module-section:visible').filter({ has: page.locator('a.pvc-item-link') }).first();
}

// Presses Tab `count` times and describes each stop: is it inside a collapsed group body,
// and (optionally) inside the body with the given id.
async function tabStops(page, count, bodyId) {
  const stops = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate((id) => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const body = el.closest('.a4-module-body');
      return {
        tag: el.tagName,
        cls: String(el.className).slice(0, 40),
        inCollapsed: !!(body && body.classList.contains('a4-module-body--collapsed')),
        inBody: !!(body && id && body.id === id)
      };
    }, bodyId || null);
    if (info) stops.push(info);
  }
  return stops;
}

withAuth('AC1: Tab never lands inside a collapsed group (T-E1)', async ({ page }) => {
  const productId = await createProduct(page, 'CTAB Product ' + uniqueLabel('t1'));
  await createFeature(page, productId);
  await page.goto('/products/' + productId);

  await expect(featureGroup(page).locator('.a4-module-header')).toHaveAttribute('aria-expanded', 'false');

  await page.locator('body').click({ position: { x: 2, y: 2 } });
  const stops = await tabStops(page, 120);

  expect(stops.length, 'the traversal must really have visited the page').toBeGreaterThan(10);
  const inside = stops.filter((s) => s.inCollapsed);
  expect(inside, 'no Tab stop may land inside a collapsed group; found: ' + JSON.stringify(inside)).toHaveLength(0);
});

withAuth('AC2: the header opens the group with Enter and the next Tab stop is inside it (T-E2)', async ({ page }) => {
  const productId = await createProduct(page, 'CTAB Product ' + uniqueLabel('t2'));
  await createFeature(page, productId);
  await page.goto('/products/' + productId);

  const group = featureGroup(page);
  const header = group.locator('.a4-module-header');
  const bodyId = await header.getAttribute('aria-controls');

  await header.focus();
  await expect(header).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(header).toHaveAttribute('aria-expanded', 'true');

  const stops = await tabStops(page, 1, bodyId);
  expect(stops.length, 'Tab after opening the group must land somewhere').toBe(1);
  expect(stops[0].inBody, 'the next Tab stop must be inside the group just opened; got ' + JSON.stringify(stops[0])).toBe(true);
  expect(stops[0].inCollapsed).toBe(false);
});

withAuth('AC3: closing the group again takes its content out of the tab order (T-E3)', async ({ page }) => {
  const productId = await createProduct(page, 'CTAB Product ' + uniqueLabel('t3'));
  await createFeature(page, productId);
  await page.goto('/products/' + productId);

  const group = featureGroup(page);
  const header = group.locator('.a4-module-header');
  const bodyId = await header.getAttribute('aria-controls');

  await header.focus();
  await page.keyboard.press('Enter');
  await expect(header).toHaveAttribute('aria-expanded', 'true');

  await header.focus();
  await page.keyboard.press('Enter');
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  // the visibility change applies after the 0.25s collapse animation
  await expect(page.locator('#' + bodyId)).toHaveCSS('visibility', 'hidden');

  await header.focus();
  const stops = await tabStops(page, 40, bodyId);
  expect(stops.filter((s) => s.inBody), 'no Tab stop may land inside the group once it is closed again').toHaveLength(0);
});

withAuth('AC6: a group opened by a search has its rows in the tab order (T-E4)', async ({ page }) => {
  const productId = await createProduct(page, 'CTAB Product ' + uniqueLabel('t4'));
  await createFeature(page, productId);
  await page.goto('/products/' + productId);

  const group = featureGroup(page);
  const header = group.locator('.a4-module-header');
  const bodyId = await header.getAttribute('aria-controls');
  const slug = (await group.locator('a.pvc-item-link').first().getAttribute('href')).split('/features/')[1];

  await page.locator('.pvc-search:visible').first().fill(slug.slice(0, 8));
  await expect(header).toHaveAttribute('aria-expanded', 'true');

  await header.focus();
  const stops = await tabStops(page, 1, bodyId);
  expect(stops[0] && stops[0].inBody, 'after a search opens the group, Tab from its header must enter it; got ' + JSON.stringify(stops[0])).toBe(true);
});
