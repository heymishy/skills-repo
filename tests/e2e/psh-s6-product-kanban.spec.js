const { test, expect } = require('@playwright/test');

test('product kanban 8 columns visible without horizontal overflow at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/products/test-product-id/kanban');
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1280);
  const columns = await page.locator('[data-stage]').count();
  expect(columns).toBe(8);
});
