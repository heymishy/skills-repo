import { test, expect } from '@playwright/test';

// wuce18-keyboard-nav.spec.ts — Playwright E2E tests for keyboard navigation (AC5)
// T19: keyboard user can reach all four nav links via Tab
// T20: focused nav link has visible outline
// NOT in npm test chain (ADR-018) — run with: npx playwright test tests/e2e/

test('keyboard user can reach all four nav links via Tab', async ({ page }) => {
  await page.goto('/dashboard');
  // Tab through nav links
  for (const label of ['Features', 'Actions', 'Status', 'Run a Skill']) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused).toBe(label);
  }
});

test('focused nav link has visible outline', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return window.getComputedStyle(el).outlineStyle;
  });
  expect(outline).not.toBe('none');
});
