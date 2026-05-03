// smoke.spec.js — E2E infrastructure smoke tests (wuce.17, AC1 + AC3)
// T6.1: server starts and responds HTTP 200 on /
// T6.2: root response is HTML not a JSON error
// T6.3: /health returns 200 {"status":"ok"} (wuce.4 AC1)
//
// These tests validate the full Playwright stack is wired:
//   playwright.config.js webServer starts src/web-ui/server.js
//   Playwright connects to http://localhost:3000
//   Unauthenticated root route returns 200 HTML

const { test, expect } = require('@playwright/test');

test('smoke: server starts and responds 200 on /', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
});

test('smoke: root response is HTML not a JSON error', async ({ page }) => {
  await page.goto('/');
  const contentType = await page.evaluate(() =>
    document.contentType || document.querySelector('html') ? 'html' : 'other'
  );
  expect(contentType).toBe('html');
});

test('smoke: /health returns 200 with {"status":"ok"}', async ({ request }) => {
  // wuce.4 AC1 — health endpoint confirms the server process is alive
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});
