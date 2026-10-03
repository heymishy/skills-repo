// ep2-s3-signals-pagination.spec.js -- E2E coverage for ep2-s3's AC7
// (keyboard Tab-order across a single real, bounded page of /signals,
// using this repo's own real, unmodified getSignals() data -- NO
// /test/seed-signals fixture seeding, unlike ep2-s1's own existing
// Accessibility test, which needed that fixture specifically because
// pagination did not yet exist. This test proves the real production fix
// at real scale, not a test-side workaround.
//
// Calls /test/reset-signals-source FIRST: ep2-s1's own existing spec in
// this same directory seeds a small fixture via /test/seed-signals and
// never resets it, and Playwright's shared webServer process means that
// override can leak into this spec when both run in the same invocation
// (e.g. a full `tests/e2e/` directory run). Without this reset, this test
// could silently pass against ep2-s1's small fixture instead of real data,
// defeating its own purpose with no visible failure.
//
// NOT in npm test chain (ADR-018) -- run with:
// npx playwright test tests/e2e/ep2-s3-signals-pagination.spec.js

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('AC7: Tab-order across a single real, bounded page of /signals completes in normal time, using real unseeded data', async ({ page }) => {
  const resetRes = await page.request.post('/test/reset-signals-source');
  expect(resetRes.ok()).toBeTruthy();

  await page.goto('/signals'); // page 1, no ?page= param, real unmodified getSignals() data
  await page.waitForLoadState('networkidle');

  const ctaButtons = page.locator('.signal-item .sw-btn--primary');
  const count = await ctaButtons.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(50); // SIGNALS_PAGE_SIZE -- confirms real bounding, not the old unbounded list

  await page.locator('body').evaluate((el) => el.focus());
  let seen = 0;
  for (let i = 0; i < 120 && seen < count; i++) {
    await page.keyboard.press('Tab');
    const inCta = await page.evaluate(() => {
      const active = document.activeElement;
      return !!(active && active.closest('.signal-item'));
    });
    if (inCta) seen++;
  }
  expect(seen).toBe(count); // Tab order reaches every CTA on this one real, bounded page -- within the test's own default timeout, unlike ep2-s1's own Task 5 finding against the unbounded list
});
