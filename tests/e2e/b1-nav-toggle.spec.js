// b1-nav-toggle.spec.js — E2E coverage for AC2 (Home List/Board toggle),
// story artefacts/2026-07-21-web-ui-experience-redesign/stories/b1-remove-dead-links-add-missing-nav.md
// NOT in npm test chain (ADR-018) — run with: npx playwright test tests/e2e/b1-nav-toggle.spec.js

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

// Note: only the List → Board direction is asserted here, matching AC2's own
// wording ("Given a signed-in user viewing the sidebar... switches ... without
// a full nav-item click") and the verification script's Scenario 2. The board
// view itself (/dashboard?view=board) renders a bare kanban fragment with no
// sidebar — that rendering is kbc-s1's already-shipped behaviour and explicitly
// out of scope for this story ("Any change to how /org/kanban or
// /dashboard?view=board themselves render"), so there is no List link to
// click back from the board view; a Board → List round trip is not part of
// this story's AC2.
withAuth('Board toggle under Home switches to the board view without a full nav click', async ({ page }) => {
  await page.goto('/dashboard');
  const board = page.locator('.sw-nav-subitem:text("Board")');
  await board.click();
  await page.waitForLoadState('networkidle');
  expect(page.url()).toContain('view=board');
  const boardMarkup = await page.locator('.kb-board').count();
  expect(boardMarkup).toBeGreaterThan(0);
});

withAuth('List toggle under Home is present and points at /dashboard (no query string)', async ({ page }) => {
  await page.goto('/dashboard');
  const list = page.locator('.sw-nav-subitem:text("List")');
  await expect(list).toHaveAttribute('href', '/dashboard');
});
