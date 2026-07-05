const { test, expect } = require('@playwright/test');

test('org kanban product groups visible without horizontal overflow at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/org/kanban');
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(1280);
});
