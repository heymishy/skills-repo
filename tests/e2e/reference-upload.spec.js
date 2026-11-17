// reference-upload.spec.js — E2E tests for sdg.1 (Reference upload modal UI)
// Tests: T9–T15
//
// The strategy grounding modal has no entry in the journey form (nothing in
// src/web-ui emits a new-product checkbox), so each test creates a journey the
// way the page does (POST /api/journey with the form's CSRF token), reads its
// id from the chat page it redirects to, and opens /journey/:id/reference-modal
// directly. What is under test is the modal and its upload, skip and
// reference-page routes, not how a person gets there.

'use strict';

const { expect }       = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

async function createJourney(page, featureName) {
  const csrf = await getCsrfToken(page.request, '/journey', 'journey home page');
  const created = await page.request.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery', _csrf: csrf },
    maxRedirects: 0
  });
  expect(created.status(), 'POST /api/journey').toBe(303);
  const chat = await page.request.get(created.headers()['location']);
  const m = (await chat.text()).match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  expect(m, 'journey id on the chat page').toBeTruthy();
  return m[1];
}

async function openModal(page, featureName) {
  const journeyId = await createJourney(page, featureName);
  await page.goto('/journey/' + journeyId + '/reference-modal');
  return journeyId;
}

// T9 — The modal shows the strategy grounding gate with a Skip option

withAuth('T9: reference-modal shows the strategy grounding gate and a Skip button', async ({ page }) => {
  await openModal(page, 'sdg1-e2e-test-' + Date.now());
  await expect(page).toHaveURL(/\/journey\/[^/]+\/reference-modal/);
  await expect(page.locator('h1')).toContainText(/ground|strategy|reference/i);
  await expect(page.locator('text=/Skip/i')).toBeVisible();
});

// T10 — Modal displays file input with accept=".md"

withAuth('T10: reference-modal shows file input with accept=".md"', async ({ page }) => {
  await openModal(page, 'sdg1-modal-test-' + Date.now());
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();
  await expect(fileInput).toHaveAttribute('accept', '.md');
  await expect(page.locator('text=/Upload one or more markdown/i')).toBeVisible();
});

// T11 — File input has ARIA label and error messages are accessible

withAuth('T11: file input has aria-label and error container has role=alert', async ({ page }) => {
  await openModal(page, 'sdg1-aria-test-' + Date.now());
  const ariaLabel = await page.locator('input[type="file"]').getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();
  await expect(page.locator('[role="alert"], [aria-live="polite"]')).toHaveCount(1);
});

// T12 — Invalid file upload shows per-file error message

withAuth('T12: uploading non-.md file shows error message', async ({ page }) => {
  await openModal(page, 'sdg1-error-test-' + Date.now());
  await page.locator('input[type="file"]').setInputFiles({ name: 'strategy.xlsx', mimeType: 'application/vnd.ms-excel', buffer: Buffer.from('not markdown') });
  await page.click('#rm-upload-btn');
  await expect(page.locator('[role="alert"]')).toBeVisible();
  await expect(page.locator('[role="alert"]')).toContainText(/strategy\.xlsx|not a valid markdown/i);
  await expect(page.locator('input[type="file"]')).toBeVisible();
});

// T13 — Valid file upload closes the modal and proceeds to the first skill

withAuth('T13: valid .md upload closes modal and proceeds to first skill', async ({ page }) => {
  await openModal(page, 'sdg1-upload-e2e-' + Date.now());
  await page.locator('input[type="file"]').setInputFiles({ name: 'strategy.md', mimeType: 'text/markdown', buffer: Buffer.from('# Strategy\n\nMVP focus: enterprise first.') });
  await page.click('#rm-upload-btn');
  await page.waitForURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/, { timeout: 10000 });
});

// T14 — Skip closes modal and proceeds without files

withAuth('T14: Skip button proceeds to first skill without files', async ({ page }) => {
  await openModal(page, 'sdg1-skip-test-' + Date.now());
  await page.click('button:has-text("Skip")');
  await page.waitForURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/, { timeout: 10000 });
  await expect(page.locator('[role="alert"]')).not.toBeVisible();
});

// T15 — An uploaded file is listed on the journey's reference page

withAuth('T15: an uploaded file is listed on the journey reference page', async ({ page }) => {
  const journeyId = await openModal(page, 'sdg1-session-ref-test-' + Date.now());
  await page.locator('input[type="file"]').setInputFiles({ name: 'market-data.md', mimeType: 'text/markdown', buffer: Buffer.from('# Market data\n\nTAM: 5 billion.') });
  await page.click('#rm-upload-btn');
  await page.waitForURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/, { timeout: 10000 });

  await page.goto('/journey/' + journeyId + '/reference');
  await expect(page.locator('body')).toContainText('market-data.md');
});
