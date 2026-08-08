// kbsf-s1-shell-wrapping-visual.spec.js — E2E visual confirmation that the
// product-scope kanban board renders with real (non-default) CSS after
// being wrapped in the shared page shell.
//
// AC1 (visual half): a .kb-card's border-left-color resolves to a real,
// non-transparent colour once the shared design-token :root block is
// present in the page -- this is exactly the class of real-CSS-layout
// assertion csd-s2's own diagram-legibility spec already uses.
//
// Story: artefacts/2026-08-08-kanban-board-unstyled-shell-fix/stories/kbsf-s1-wrap-kanban-html-in-shared-shell.md

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function createProduct(request, name) {
  await request.post('/products/new', {
    data: { name: name, description: 'kbsf-s1 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 'kbsf-s1 E2E fixture product.' },
    maxRedirects: 0
  });
  const location = confirmRes.headers()['location'];
  return location.split('/products/')[1];
}

async function seedBoardJourney(request, opts) {
  const res = await request.post('/test/seed-board-journey', {
    data: opts,
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

withAuth('AC1: a kanban card renders with a real, non-default border colour once shell-wrapped', async ({ page }) => {
  test.setTimeout(30000);
  const request = page.context().request;
  const productId = await createProduct(request, 'kbsf-s1 Visual Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: true,
    featureSlug: 'kbsf-s1-visual-feature-' + Date.now()
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const card = page.locator('.kb-card[data-journey-id="' + seeded.journeyId + '"]');
  await expect(card).toBeVisible();

  const borderColor = await card.evaluate((el) => window.getComputedStyle(el).borderLeftColor);
  // Before this fix, the var(--green)/(--amber)/(--red) token resolved to
  // nothing, so the browser fell back to the border's own default (a
  // transparent/initial colour, indistinguishable from "no border set").
  expect(borderColor).not.toBe('');
  expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(borderColor).not.toBe('rgb(0, 0, 0)');

  await page.screenshot({ path: 'test-results/kbsf-s1-styled-kanban-board.png', fullPage: false });
});
