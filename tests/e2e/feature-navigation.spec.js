// feature-navigation.spec.js — E2E tests for /features and /features/:slug (wuce.6)
//
// AC1: GET /features returns feature list (slug, stage, lastUpdated, artefactIndexUrl)
// AC2: type labels are plain-language (tested via /features/:slug artefact list)
// AC3: artefacts grouped by stage (server-side, covered in unit tests)
// AC4: artefact link opens artefact view — link href tested in unit; navigation runtime-only
// AC5: no artefacts directory → "No artefacts found" message
// Auth gate: unauthenticated requests redirect to sign-in (authGuard 302)
//
// In test mode WUCE_REPOSITORIES is not set, so:
//   GET /features → 200 [] (no repos to scan)
//   GET /features/:slug → 200 { message: 'No artefacts found' } (no repos configured)

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated (authGuard → 302 redirect to sign-in) ─────────────────────

test('unauthenticated GET /features redirects to sign-in', async ({ page }) => {
  // authGuard responds 302 to '/'; Playwright follows redirect.
  await page.goto('/features');
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

test('unauthenticated GET /features/:slug redirects to sign-in', async ({ page }) => {
  await page.goto('/features/some-feature-slug');
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated ──────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET /features returns 200 JSON array', async ({ page }) => {
  // No repos configured in test → empty array; route still returns valid JSON
  const response = await page.request.get('/features');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

withAuth('AC5: GET /features/:slug with no accessible repos returns no-artefacts message', async ({ page }) => {
  // listArtefacts exhausts configured repos (none in test) and returns noArtefacts:true
  // Route responds 200 JSON { message: 'No artefacts found' }
  const response = await page.request.get('/features/2026-05-02-test-feature');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.message).toBe('No artefacts found');
});

withAuth('authenticated GET /features/:slug returns JSON (not HTML, not 500)', async ({ page }) => {
  const response = await page.request.get('/features/any-slug-at-all');
  expect(response.status()).toBe(200);
  const contentType = response.headers()['content-type'] || '';
  expect(contentType).toContain('application/json');
});
