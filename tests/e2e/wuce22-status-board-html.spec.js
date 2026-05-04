// wuce22-status-board-html.spec.js — E2E tests for GET /status HTML view (wuce.22)
//
// /status uses content negotiation: Accept: text/html → HTML shell; else JSON.
// Unauthenticated requests return 401 (auth check inside handler, not authGuard).
//
// AC1: authenticated GET /status with Accept: text/html returns 200 HTML
// AC2: HTML response includes renderShell structure (nav, page title)
// AC3: unauthenticated GET /status returns 401 (not redirect — handler-level auth check)
// AC4: page.goto('/status') sends browser Accept header → renders HTML
// AC5: Content-Type is text/html when Accept: text/html sent

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated (handler-level auth → 401, not authGuard 302) ────────────

test('unauthenticated GET /status returns 401', async ({ request }) => {
  const response = await request.get('/status');
  expect(response.status()).toBe(401);
});

// ── Authenticated ─────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET /status with Accept: text/html returns 200 HTML', async ({ page }) => {
  const response = await page.request.get('/status', {
    headers: { 'Accept': 'text/html' },
  });
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

withAuth('AC2: GET /status HTML page includes nav and shell structure', async ({ page }) => {
  await page.goto('/status');
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  const html = await page.content();
  expect(html).toContain('<html');
});

withAuth('AC4: browser page.goto sends text/html Accept — status page renders HTML', async ({ page }) => {
  await page.goto('/status');
  // Body should be an HTML document, not raw JSON
  const bodyText = await page.locator('body').innerText().catch(() => '');
  expect(bodyText.trimStart()).not.toMatch(/^\{/);
});

withAuth('AC5: Content-Type is text/html when Accept: text/html sent', async ({ page }) => {
  const response = await page.request.get('/status', {
    headers: { 'Accept': 'text/html, application/xhtml+xml' },
  });
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
  expect(ct).not.toContain('application/json');
});
