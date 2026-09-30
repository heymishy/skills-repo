// ep1-s3-launcher-layout.spec.js — E2E coverage for ep1-s3 AC1/AC4
// (CSS-layout-dependent, per this story's own DoR H-E2E classification —
// real Playwright browser tests, not DOM-presence checks).
// Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
// NOT in npm test chain (ADR-018) — run with:
// npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('AC1: primary CTAs render above the advanced section, with larger sizing', async ({ page }) => {
  await page.goto('/skills');
  await page.waitForLoadState('networkidle');

  const primaryButtons = page.locator('.el-primary .sw-btn--primary');
  const primaryCount = await primaryButtons.count();
  expect(primaryCount).toBeGreaterThan(0);
  expect(primaryCount).toBeLessThanOrEqual(5);

  const advancedSummary = page.locator('.el-advanced-summary');
  const primaryBox = await page.locator('.el-primary').boundingBox();
  const advancedBox = await advancedSummary.boundingBox();
  expect(primaryBox).not.toBeNull();
  expect(advancedBox).not.toBeNull();
  expect(primaryBox.y).toBeLessThan(advancedBox.y); // primary CTAs render above the advanced section

  const primaryFontSize = await primaryButtons.first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const advancedFontSize = await advancedSummary.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(primaryFontSize).toBeGreaterThan(advancedFontSize);
});

withAuth('AC4: the advanced section is collapsed by default and visually de-emphasized', async ({ page }) => {
  await page.goto('/skills');
  await page.waitForLoadState('networkidle');

  const details = page.locator('details.el-advanced');
  const isOpenBefore = await details.evaluate((el) => el.open);
  expect(isOpenBefore).toBe(false); // collapsed by default -- no `open` attribute

  const bodyVisibleBefore = await page.locator('.el-advanced-body').first().isVisible();
  expect(bodyVisibleBefore).toBe(false);

  await page.locator('.el-advanced-summary').click();
  const bodyVisibleAfter = await page.locator('.el-advanced-body').first().isVisible();
  expect(bodyVisibleAfter).toBe(true); // expands without a page reload (native <details>, zero JS)
});
