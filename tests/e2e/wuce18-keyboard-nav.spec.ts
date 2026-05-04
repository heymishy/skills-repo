import { expect } from '@playwright/test';

// wuce18-keyboard-nav.spec.ts — Playwright E2E tests for keyboard navigation (AC5)
// T19: all four nav links are keyboard-focusable (locator.focus() — reliable in headless)
// T20: Tab-key focus on a nav link produces a visible outline (:focus-visible CSS active)
// NOT in npm test chain (ADR-018) — run with: npx playwright test tests/e2e/

// withAuth provides an authenticated page context (NODE_ENV=test required)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withAuth } = require('./fixtures/auth');

withAuth('keyboard user can reach all four nav links via Tab', async ({ page }: { page: import('@playwright/test').Page }) => {
  await page.goto('/dashboard');
  const labels = ['Features', 'Actions', 'Status', 'Run a Skill'];
  for (const label of labels) {
    const link = page.locator(`nav a:text("${label}")`);
    await link.focus();
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused).toBe(label);
  }
});

withAuth('focused nav link has visible outline', async ({ page }: { page: import('@playwright/test').Page }) => {
  await page.goto('/dashboard');
  // Tab-key press triggers :focus-visible; first focusable element is the Features nav link
  await page.keyboard.press('Tab');
  const outlineStyle = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return el ? window.getComputedStyle(el).outlineStyle : 'none';
  });
  expect(outlineStyle).not.toBe('none');
});
