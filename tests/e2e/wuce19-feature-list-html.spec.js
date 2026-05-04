// wuce19-feature-list-html.spec.js — E2E tests for GET /features HTML view (wuce.19)
//
// AC1: authenticated GET /features with Accept: text/html returns 200 HTML page
// AC2: response includes renderShell navigation structure (nav landmarks, page title)
// AC3: unauthenticated GET /features redirects to sign-in (authGuard)
// AC4: page.goto('/features') via browser (which sends Accept: text/html) returns HTML
// AC5: escHtml applied — response is text/html Content-Type

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated (authGuard → redirect) ───────────────────────────────────

test('unauthenticated GET /features redirects to sign-in', async ({ page }) => {
  await page.goto('/features');
  // authGuard redirects to root sign-in page
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated — HTML response ────────────────────────────────────────────

withAuth('AC1: authenticated GET /features returns 200 text/html', async ({ page }) => {
  const response = await page.request.get('/features', {
    headers: { 'Accept': 'text/html' },
  });
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

withAuth('AC2: GET /features HTML page includes nav and shell structure', async ({ page }) => {
  await page.goto('/features');
  // renderShell emits <nav> with the four navigation links
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  const html = await page.content();
  expect(html).toContain('Features');
});

withAuth('AC4: browser page.goto sends Accept text/html — page renders HTML (not JSON)', async ({ page }) => {
  await page.goto('/features');
  // If response were JSON the page would show raw JSON text; check for HTML document
  const htmlEl = page.locator('html');
  await expect(htmlEl).toBeDefined();
  // Confirm it is not a bare JSON response (no opening brace as first content)
  const text = await page.locator('body').innerText().catch(() => '');
  expect(text.trimStart()).not.toMatch(/^\{/);
});

withAuth('AC5: Content-Type is text/html (not application/json) when Accept: text/html', async ({ page }) => {
  const response = await page.request.get('/features', {
    headers: { 'Accept': 'text/html, application/xhtml+xml' },
  });
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});
