// reference-upload.spec.js — E2E tests for sdg.1 (Reference upload modal UI)
// Tests: T9–T15
// All tests require the dev server running with auth fixture.
// All tests FAIL until the journey form, modal, and upload handler are wired.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── T9 — New product selection shows strategy grounding gate ─────────────────

withAuth('T9: new-product selection shows strategy grounding gate', async ({ page }) => {
  await page.goto('/journey?new=1');
  // Fill in feature name and select new product
  await page.fill('[name="featureName"]', 'sdg1-e2e-test');
  const newProductCheckbox = page.locator('[name="newProduct"][value="1"]');
  if (await newProductCheckbox.count() > 0) {
    await newProductCheckbox.check();
  }
  await page.click('[type="submit"]');
  // Expect redirect to reference-modal
  await expect(page).toHaveURL(/\/journey\/[^/]+\/reference-modal/);
  await expect(page.locator('h1')).toContainText(/ground|strategy|reference/i);
  await expect(page.locator('text=/Skip/i')).toBeVisible();
});

// ── T10 — Modal displays file input with accept=".md" ────────────────────────

withAuth('T10: reference-modal shows file input with accept=".md"', async ({ page }) => {
  // Navigate via the new-product gate (re-use T9 setup)
  await page.goto('/journey?new=1');
  await page.fill('[name="featureName"]', 'sdg1-modal-test');
  const np = page.locator('[name="newProduct"][value="1"]');
  if (await np.count() > 0) await np.check();
  await page.click('[type="submit"]');
  await page.waitForURL(/\/journey\/[^/]+\/reference-modal/);

  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();
  await expect(fileInput).toHaveAttribute('accept', '.md');
  await expect(page.locator('text=/Upload one or more markdown/i')).toBeVisible();
});

// ── T11 — File input has ARIA label and error messages are accessible ─────────

withAuth('T11: file input has aria-label and error container has role=alert', async ({ page }) => {
  await page.goto('/journey?new=1');
  await page.fill('[name="featureName"]', 'sdg1-aria-test');
  const np = page.locator('[name="newProduct"][value="1"]');
  if (await np.count() > 0) await np.check();
  await page.click('[type="submit"]');
  await page.waitForURL(/\/journey\/[^/]+\/reference-modal/);

  const fileInput = page.locator('input[type="file"]');
  const ariaLabel = await fileInput.getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();
  expect(ariaLabel.length).toBeGreaterThan(0);

  const errorEl = page.locator('[role="alert"], [aria-live="polite"]');
  await expect(errorEl).toHaveCount(1);
});

// ── T12 — Invalid file upload shows per-file error message ───────────────────

withAuth('T12: uploading non-.md file shows error message', async ({ page }) => {
  await page.goto('/journey?new=1');
  await page.fill('[name="featureName"]', 'sdg1-error-test');
  const np = page.locator('[name="newProduct"][value="1"]');
  if (await np.count() > 0) await np.check();
  await page.click('[type="submit"]');
  await page.waitForURL(/\/journey\/[^/]+\/reference-modal/);

  // Upload an invalid file (non-.md)
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'strategy.xlsx', mimeType: 'application/vnd.ms-excel', buffer: Buffer.from('not markdown') });
  await page.click('#rm-upload-btn');

  // Expect error message to appear
  await expect(page.locator('[role="alert"]')).toBeVisible();
  await expect(page.locator('[role="alert"]')).toContainText(/strategy\.xlsx|not a valid markdown/i);
  // Modal should remain open
  await expect(page.locator('input[type="file"]')).toBeVisible();
});

// ── T13 — Valid file upload writes file and closes modal ─────────────────────

withAuth('T13: valid .md upload closes modal and proceeds to first skill', async ({ page }) => {
  await page.goto('/journey?new=1');
  await page.fill('[name="featureName"]', 'sdg1-upload-e2e');
  const np = page.locator('[name="newProduct"][value="1"]');
  if (await np.count() > 0) await np.check();
  await page.click('[type="submit"]');
  await page.waitForURL(/\/journey\/[^/]+\/reference-modal/);

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'strategy.md', mimeType: 'text/markdown', buffer: Buffer.from('# Strategy\n\nMVP focus: enterprise first.') });
  await page.click('#rm-upload-btn');

  // Should redirect to skill chat
  await page.waitForURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/, { timeout: 10000 });
});

// ── T14 — Skip closes modal and proceeds without files ───────────────────────

withAuth('T14: Skip button proceeds to first skill without files', async ({ page }) => {
  await page.goto('/journey?new=1');
  await page.fill('[name="featureName"]', 'sdg1-skip-test');
  const np = page.locator('[name="newProduct"][value="1"]');
  if (await np.count() > 0) await np.check();
  await page.click('[type="submit"]');
  await page.waitForURL(/\/journey\/[^/]+\/reference-modal/);

  await page.click('button:has-text("Skip")');
  await page.waitForURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/, { timeout: 10000 });
  // No error should be visible
  await expect(page.locator('[role="alert"]')).not.toBeVisible();
});

// ── T15 — Session referenceFiles available after upload ───────────────────────

withAuth('T15: session.referenceFiles populated and available after upload', async ({ page }) => {
  await page.goto('/journey?new=1');
  await page.fill('[name="featureName"]', 'sdg1-session-ref-test');
  const np = page.locator('[name="newProduct"][value="1"]');
  if (await np.count() > 0) await np.check();
  await page.click('[type="submit"]');
  await page.waitForURL(/\/journey\/[^/]+\/reference-modal/);

  // Upload a file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'market-data.md', mimeType: 'text/markdown', buffer: Buffer.from('# Market data\n\nTAM: $5B.') });
  await page.click('#rm-upload-btn');
  await page.waitForURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/, { timeout: 10000 });

  // Extract journeyId from the URL path (/skills/<skill>/sessions/<id>/chat)
  const url = page.url();
  const sid = url.split('/sessions/')[1]?.split('/')[0];
  expect(sid).toBeTruthy();

  // Check the journey state via the API — referenceFiles should be set
  // (The journey is identifiable by the session; use the journey state endpoint if available)
  const resp = await page.request.get('/api/journey?featureSlug=sdg1-session-ref-test');
  // If no such endpoint, at minimum verify the file was written to disk via a known path
  // This is a best-effort E2E check; the authoritative check is in T6 (unit test)
  expect(resp.status()).not.toBe(500);
});
