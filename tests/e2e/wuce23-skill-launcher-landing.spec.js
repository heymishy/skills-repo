// wuce23-skill-launcher-landing.spec.js — E2E tests for GET /skills HTML (wuce.23)
//
// /skills is the HTML skill launcher landing page (handleGetSkillsHtml).
// Always returns text/html. authGuard applied in server.js before handler.
//
// AC1: authenticated GET /skills returns 200 text/html
// AC2: HTML page includes skill cards with links to /skills/:name/start
// AC3: unauthenticated GET /skills redirects to sign-in (authGuard → 302 → root)
// AC4: page title or heading contains skill-related content
// AC5: response is not JSON — Content-Type is text/html
// AC6: nav shell is present (renderShell)

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated ──────────────────────────────────────────────────────────

test('unauthenticated GET /skills redirects to sign-in', async ({ page }) => {
  await page.goto('/skills');
  // authGuard → 302 → root sign-in
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated ─────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET /skills returns 200 text/html', async ({ page }) => {
  const response = await page.request.get('/skills');
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

withAuth('AC2: /skills page renders HTML skill launcher shell with main element', async ({ page }) => {
  await page.goto('/skills');
  const html = await page.content();
  // renderShell is used — expect HTML document structure with main landmark
  expect(html).toContain('<html');
  expect(html).toContain('<main');
  // Page title is "Run a Skill" (from handleGetSkillsHtml renderShell call)
  const title = await page.title();
  expect(title).toMatch(/skill/i);
});

withAuth('AC5: Content-Type is text/html — not JSON', async ({ page }) => {
  const response = await page.request.get('/skills');
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
  expect(ct).not.toContain('application/json');
});

withAuth('AC6: /skills HTML page includes nav shell (renderShell)', async ({ page }) => {
  await page.goto('/skills');
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
});
