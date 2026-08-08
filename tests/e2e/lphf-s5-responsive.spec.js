'use strict';
const { test, expect } = require('@playwright/test');

test('auth panel has reduced padding relative to the pre-redesign baseline (28px)', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('.auth-panel');
  const padding = await panel.evaluate((el) => window.getComputedStyle(el).paddingTop);
  const paddingPx = parseFloat(padding);
  expect(paddingPx).toBeLessThan(28);
});
