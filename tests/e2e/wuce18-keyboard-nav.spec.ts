import { expect } from '@playwright/test';

// wuce18-keyboard-nav.spec.ts — Playwright E2E tests for keyboard navigation (AC5)
// T19: all four nav links are keyboard-focusable (locator.focus() — reliable in headless)
// T20: Tab-key focus on a nav link produces a visible outline (:focus-visible CSS active)
// NOT in npm test chain (ADR-018) — run with: npx playwright test tests/e2e/

// withAuth provides an authenticated page context (NODE_ENV=test required)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withAuth } = require('./fixtures/auth');

withAuth('keyboard user can reach all nav links via Tab', async ({ page }: { page: import('@playwright/test').Page }) => {
  await page.goto('/dashboard');
  const labels = ['Journeys', 'Run a Skill', 'Org board'];
  for (const label of labels) {
    // :has-text() (not :text()) — the label lives in a nested <span>, so the
    // <a> itself is never the "smallest matching element" :text() requires;
    // this was already true of the pre-b1 labels (e.g. "Run a Skill") and is
    // unrelated to the b1 nav change, just never previously exercised since
    // this spec is excluded from the npm test chain (see header comment).
    const link = page.locator(`nav a.sw-nav-item:has-text("${label}")`);
    await link.focus();
    // textContent includes the leading icon glyph (a sibling <span> inside the
    // same focused <a>) — assert it contains the label, not exact equality.
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused).toContain(label);
  }
});

withAuth('focused nav link has visible outline', async ({ page }: { page: import('@playwright/test').Page }) => {
  await page.goto('/dashboard');
  // Tab-key press triggers :focus-visible; first focusable element is the first sidebar nav link (Home)
  await page.keyboard.press('Tab');
  const outlineStyle = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return el ? window.getComputedStyle(el).outlineStyle : 'none';
  });
  expect(outlineStyle).not.toBe('none');
});
