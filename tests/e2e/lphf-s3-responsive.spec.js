'use strict';
const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) {
  test(`crypto-verification hero card has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
    const card = page.locator('[data-hero="crypto-verification"]');
    await expect(card).toBeVisible();
  });
}
