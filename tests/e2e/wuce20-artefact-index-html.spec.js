// wuce20-artefact-index-html.spec.js — E2E tests for GET /features/:slug HTML view (wuce.20)
//
// AC1: authenticated GET /features/:slug with Accept: text/html returns 200 HTML page
// AC2: HTML response includes renderShell structure (nav, page title)
// AC3: unauthenticated GET /features/:slug redirects to sign-in (authGuard)
// AC4: unknown feature slug returns HTML (not JSON error) — error handled in-page
// AC5: Content-Type is text/html when Accept: text/html sent

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const TEST_SLUG = '2026-05-02-web-ui-copilot-execution-layer';

// ── Unauthenticated ──────────────────────────────────────────────────────────

test('unauthenticated GET /features/:slug redirects to sign-in', async ({ page }) => {
  await page.goto(`/features/${TEST_SLUG}`);
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated ────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET /features/:slug returns 200 text/html', async ({ page }) => {
  const response = await page.request.get(`/features/${TEST_SLUG}`, {
    headers: { 'Accept': 'text/html' },
  });
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

withAuth('AC2: GET /features/:slug HTML page includes nav shell structure', async ({ page }) => {
  await page.goto(`/features/${TEST_SLUG}`);
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  const html = await page.content();
  // Page should contain the slug or a title — not a bare JSON body
  expect(html).toContain('<html');
});

withAuth('AC4: unknown slug returns HTML response (not JSON) — error handled in page', async ({ page }) => {
  const response = await page.request.get('/features/unknown-slug-xyz', {
    headers: { 'Accept': 'text/html' },
  });
  // Should be 200 HTML (empty artefact list) or a rendered error page — never raw JSON
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

withAuth('AC5: Content-Type is text/html — not application/json — for HTML accept header', async ({ page }) => {
  const response = await page.request.get(`/features/${TEST_SLUG}`, {
    headers: { 'Accept': 'text/html' },
  });
  const ct = response.headers()['content-type'] || '';
  expect(ct).not.toContain('application/json');
  expect(ct).toContain('text/html');
});
