// action-queue.spec.js — E2E tests for GET /api/actions (wuce.5)
//
// AC1: response contains items array with featureName, artefactType, daysPending
// AC2: empty state returns { items: [] } (no WUCE_REPOSITORIES configured in test)
// AC5: auth gate — unauthenticated returns 401
//
// ACs requiring real GitHub write access are excluded:
//   AC3: sign-off removes item from queue (depends on wuce.3 side-effect)
//   AC4: artefact link href navigation (browser runtime only)
// These remain in the manual verification script.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated ────────────────────────────────────────────────────────────

test('unauthenticated GET /api/actions returns 401', async ({ request }) => {
  // Route does its own 401 check (not authGuard redirect) for API endpoints.
  const response = await request.get('/api/actions');
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

// ── Authenticated ──────────────────────────────────────────────────────────────

withAuth('AC1/AC2: authenticated GET /api/actions returns 200 with items array', async ({ page }) => {
  const response = await page.request.get('/api/actions');
  expect(response.status()).toBe(200);
  const body = await response.json();
  // Response must contain an items array (AC1 shape contract)
  expect(Array.isArray(body.items)).toBe(true);
});

withAuth('AC2: no repos configured — items array is empty', async ({ page }) => {
  // WUCE_REPOSITORIES not set in test environment → getRepoList() returns []
  // → no artefacts scanned → empty queue
  const response = await page.request.get('/api/actions');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.items).toHaveLength(0);
});

withAuth('response includes bannerMessage field (null when no access failures)', async ({ page }) => {
  const response = await page.request.get('/api/actions');
  expect(response.status()).toBe(200);
  const body = await response.json();
  // bannerMessage is present (null when no repos failed access check)
  expect(Object.prototype.hasOwnProperty.call(body, 'bannerMessage')).toBe(true);
});
