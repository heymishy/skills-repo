// tests/e2e/ep1-s1-pod-creation.spec.js
// @mocked
//
// ep1-s1 TASK 8 NOTE: /admin/pods/manager and /api/pods/create are both
// mounted behind authGuard in server.js (unauthenticated html -> 302
// /auth/github). Every other @mocked spec in this repo that hits an
// authGuard-protected route uses the withAuth fixture (tests/e2e/fixtures/
// auth.js), not the bare `test`/`expect` import from @playwright/test --
// see tests/e2e/b1-nav-toggle.spec.js, tests/e2e/action-queue.spec.js, etc.
// The dispatch prompt's literal spec text used the bare import, which was
// confirmed (Step 2) to time out waiting for #create-pod-btn on every test --
// page.goto('/admin/pods/manager') 302-redirects an unauthenticated request
// away before the modal markup ever renders, so the button locator never
// resolves. Swapped to withAuth here, matching repo convention exactly;
// test bodies/assertions are otherwise unchanged from the dispatched spec.
//
// CORRECTION (final review, 2026-09-16): the third test below was originally
// labeled "AC3" but it tests the gated-primary-action UX affordance
// (design.md), not AC3's invalid-role-rejection requirement -- that
// mislabeling was already present in the DoR-signed-off implementation plan
// itself (artefacts/new-feature-2b74a292/plans/ep1-s1-plan.md), not
// introduced by this task. Renamed to describe what it actually verifies.
// AC3 (invalid role rejection) has NO UI-level E2E coverage and, as this UI
// is currently built, cannot have any: every member's roleId comes directly
// from their fixed ORG_ROSTER entry (grep "roleId" in pod-manager.html --
// there is no role-selection input anywhere a user could submit an invalid
// value from). AC3 is fully covered at the API/backend level only
// (tests/check-ep1-s1-pod-creation.js Part 4, via handlePostPodsCreate
// directly) -- see decisions.md for the full writeup of this gap and why it
// was not treated as a blocking finding.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('ep1-s1 AC1: create a pod with multiple members', async ({ page }) => {
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', 'Core Platform E2E Test');
  await page.click('.add-btn >> nth=0'); // add Hamish
  await page.click('.add-btn >> nth=0'); // add Susan (list re-renders; first remaining row)
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toContainText('Pod created: Core Platform E2E Test');
  await expect(page.locator('#pod-list')).toContainText('Core Platform E2E Test');
});

withAuth('ep1-s1 AC2: duplicate pod name is rejected', async ({ page }) => {
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', 'Core Platform Duplicate E2E');
  await page.click('.add-btn >> nth=0');
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', 'Core Platform Duplicate E2E');
  await page.click('.add-btn >> nth=0');
  await page.click('#save-pod-btn');
  await expect(page.locator('#error-banner')).toContainText("A pod named 'Core Platform Duplicate E2E' already exists");
  await expect(page.locator('#create-pod-modal')).toHaveClass(/open/);
});

withAuth('ep1-s1: gated primary action stays disabled with only the creator selected (design.md UX affordance, not AC3 -- see file header)', async ({ page }) => {
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', 'Gate Test Pod');
  await expect(page.locator('#save-pod-btn')).toBeDisabled();
  await page.click('.add-btn >> nth=0');
  await expect(page.locator('#save-pod-btn')).toBeEnabled();
});
