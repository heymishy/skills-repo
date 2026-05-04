// wuce21-action-queue-html.spec.js — E2E tests for GET /actions HTML view (wuce.21)
//
// /actions is distinct from /api/actions (JSON). handleGetActionsHtml always
// returns text/html regardless of Accept header.
//
// AC1: authenticated GET /actions returns 200 text/html
// AC2: response includes renderShell structure (nav, page title)
// AC3: unauthenticated GET /actions redirects to sign-in (authGuard → 302)
// AC4: page body is not raw JSON
// AC5: Content-Type is text/html

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated ──────────────────────────────────────────────────────────

test('unauthenticated GET /actions redirects to sign-in', async ({ page }) => {
  await page.goto('/actions');
  // authGuard: 302 → root
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated ────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET /actions returns 200 text/html', async ({ page }) => {
  const response = await page.request.get('/actions');
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

withAuth('AC2: GET /actions HTML page includes nav shell and title', async ({ page }) => {
  await page.goto('/actions');
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  const title = await page.title();
  // Title should be Actions (from renderShell title: 'Actions')
  expect(title).toMatch(/actions/i);
});

withAuth('AC4: /actions response body is HTML — not raw JSON', async ({ page }) => {
  await page.goto('/actions');
  const bodyText = await page.locator('body').innerText().catch(() => '');
  expect(bodyText.trimStart()).not.toMatch(/^\{/);
});

withAuth('AC5: /actions always returns text/html regardless of Accept header', async ({ page }) => {
  const response = await page.request.get('/actions', {
    headers: { 'Accept': 'application/json' },
  });
  const ct = response.headers()['content-type'] || '';
  // Route always returns HTML — content negotiation not used on /actions
  expect(ct).toContain('text/html');
});
