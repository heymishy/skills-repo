// programme-status.spec.js — E2E tests for /status and /status/export (wuce.7)
//
// AC1: GET /status returns portfolio board data as JSON array
// AC2: traceStatus "has-findings" → "Trace findings" label (unit-tested; covered server-side)
// AC3: dorStatus "signed-off" + prStatus "none" → "Awaiting implementation dispatch" (unit-tested)
// AC4: GET /status/export returns Content-Type text/markdown with attachment filename
// AC5: Done condition (all merged + trace passed) → unit-tested via status-board.js
// Auth gate: unauthenticated returns 401 (own check, not authGuard)
//
// In test mode WUCE_REPOSITORIES is not set, pipeline-status fetcher is not injected:
//   GET /status → 200 [] (no features to report)
//   GET /status/export → 200 text/markdown (empty table)

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated (own 401 check — no authGuard redirect) ───────────────────

test('unauthenticated GET /status returns 401', async ({ request }) => {
  const response = await request.get('/status');
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

test('unauthenticated GET /status/export returns 401', async ({ request }) => {
  const response = await request.get('/status/export');
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

// ── Authenticated ──────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET /status returns 200 JSON array', async ({ page }) => {
  const response = await page.request.get('/status');
  expect(response.status()).toBe(200);
  const body = await response.json();
  // Portfolio board data must be an array (each element is a feature status object)
  expect(Array.isArray(body)).toBe(true);
});

withAuth('AC4: GET /status/export returns 200 text/markdown with attachment disposition', async ({ page }) => {
  const response = await page.request.get('/status/export');
  expect(response.status()).toBe(200);

  const contentType = response.headers()['content-type'] || '';
  expect(contentType).toContain('text/markdown');

  const disposition = response.headers()['content-disposition'] || '';
  expect(disposition).toContain('attachment');
  expect(disposition).toContain('status.md');
});

withAuth('GET /status/export body is non-empty text', async ({ page }) => {
  const response = await page.request.get('/status/export');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body.length).toBeGreaterThan(0);
});
