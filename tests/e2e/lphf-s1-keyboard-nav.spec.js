'use strict';
const { test, expect } = require('@playwright/test');

test('golden-trace frames are reachable via keyboard, no focus trap', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('Tab');

  const frames = page.locator('.gt-frame');
  await expect(frames).toHaveCount(4);

  let reachedAllFrames = 0;
  const seen = new Set();
  for (let i = 0; i < 30; i++) {
    const isFrame = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('gt-frame'));
    if (isFrame) {
      const idx = await page.evaluate(() => Array.from(document.querySelectorAll('.gt-frame')).indexOf(document.activeElement));
      seen.add(idx);
    }
    await page.keyboard.press('Tab');
  }
  expect(seen.size, 'expected all 4 frames to be reachable via Tab').toBe(4);
});
