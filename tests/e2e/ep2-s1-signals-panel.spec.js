// ep2-s1-signals-panel.spec.js -- E2E coverage for ep2-s1's Accessibility NFR
// (keyboard Tab-order across signal CTAs), classified CSS-layout-dependent
// by analogy to ep1-s3's own precedent (jsdom cannot reproduce real
// sequential Tab-order focus movement) -- see test-plan Step 3a note.
// NOT in npm test chain (ADR-018) -- run with:
// npx playwright test tests/e2e/ep2-s1-signals-panel.spec.js

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('NFR-Accessibility: every signal CTA has a non-empty accessible name and is Tab-reachable', async ({ page }) => {
  await page.goto('/signals');
  await page.waitForLoadState('networkidle');

  const ctaButtons = page.locator('.signal-item .sw-btn--primary');
  const count = await ctaButtons.count();
  expect(count).toBeGreaterThan(0); // real signals must be present -- confirm WIRE_SKILL_ADAPTERS-equivalent real data path is wired before trusting this test (ep1-s3's own DoD lesson)

  for (let i = 0; i < count; i++) {
    const name = await ctaButtons.nth(i).evaluate((el) => el.textContent.trim());
    expect(name.length).toBeGreaterThan(0);
  }

  await page.locator('body').evaluate((el) => el.focus());
  let seen = 0;
  for (let i = 0; i < 100 && seen < count; i++) {
    await page.keyboard.press('Tab');
    const inCta = await page.evaluate(() => {
      const active = document.activeElement;
      return !!(active && active.closest('.signal-item'));
    });
    if (inCta) seen++;
  }
  expect(seen).toBe(count); // Tab order reaches every rendered CTA button
});
