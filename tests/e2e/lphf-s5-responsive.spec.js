'use strict';
const { test, expect } = require('@playwright/test');

test('auth panel has reduced padding relative to the pre-redesign baseline (28px)', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('.auth-panel');
  const padding = await panel.evaluate((el) => window.getComputedStyle(el).paddingTop);
  const paddingPx = parseFloat(padding);
  expect(paddingPx).toBeLessThan(28);
});

for (const width of [320, 1280]) {
  test(`auth panel is functional and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
    const githubBtn = page.locator('.auth-btn--github');
    await expect(githubBtn).toBeVisible();
    const box = await githubBtn.boundingBox();
    expect(box.width).toBeGreaterThan(0);
  });
}
