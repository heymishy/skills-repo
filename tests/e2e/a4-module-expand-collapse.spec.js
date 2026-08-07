// a4-module-expand-collapse.spec.js — E2E coverage for AC5 (smooth expand/
// collapse transition), story
// artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md
// NOT in npm test chain (ADR-018) — run with: npx playwright test tests/e2e/a4-module-expand-collapse.spec.js
//
// This spec drives a real browser against a running dev server (per this
// story's DoR H-E2E check: AC5 is CSS-layout-dependent and Playwright is
// already configured in this repo — `test:e2e`). It confirms the module
// section's expand/collapse uses a real, non-zero-duration CSS transition
// (grid-template-rows 0fr<->1fr) rather than an instant snap, by sampling
// the section's rendered height mid-animation and confirming it differs
// from the settled end-state height.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('module section expands/collapses with a real CSS transition, not an instant snap (AC5)', async ({ page }) => {
  await page.goto('/dashboard');
  const firstProduct = page.locator('a[href^="/products/"]').first();
  const productCount = await firstProduct.count();
  withAuth.skip(productCount === 0, 'no product available to open on this environment');
  await firstProduct.click();
  await page.waitForLoadState('networkidle');

  const header = page.locator('.a4-module-header').first();
  const headerCount = await header.count();
  withAuth.skip(headerCount === 0, 'no modules configured on this product yet -- AC4 flat fallback, not this test\'s concern');

  const bodyId = await header.getAttribute('aria-controls');
  const body = page.locator('#' + bodyId);

  const transitionDuration = await body.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transitionDuration).not.toBe('0s');

  await header.click();
  await page.waitForTimeout(80); // mid-animation, given a 0.25s transition
  const midHeight = await body.evaluate((el) => el.getBoundingClientRect().height);
  await page.waitForTimeout(300); // let the transition settle
  const endHeight = await body.evaluate((el) => el.getBoundingClientRect().height);
  expect(midHeight).not.toBe(endHeight); // proves an actual transition occurred, not an instant state change
});
