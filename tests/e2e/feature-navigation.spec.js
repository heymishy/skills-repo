// feature-navigation.spec.js — E2E tests for /features/:slug (wuce.6)
//
// kbc-s1 (AC5): GET /features (the list/board view -- AC1's original scope)
// was removed outright along with handleGetFeatures, in favour of the
// product/org/tenant kanban boards. The two tests that exercised that route
// directly ("unauthenticated GET /features redirects", "AC1: authenticated
// GET /features returns 200 JSON array") were removed here -- U9's zero-
// dangling-reference check, not a route-level test of a handler that no
// longer exists. GET /features/:slug (handleGetFeatureArtefacts, the
// artefact-index page) is a DIFFERENT route and was NOT touched by kbc-s1;
// its tests below are unaffected and remain in force.
//
// AC2: type labels are plain-language (tested via /features/:slug artefact list)
// AC3: artefacts grouped by stage (server-side, covered in unit tests)
// AC4: artefact link opens artefact view — link href tested in unit; navigation runtime-only
// AC5: no artefacts directory → "No artefacts found" message
// Auth gate: unauthenticated requests redirect to sign-in (authGuard 302)
//
// In test mode WUCE_REPOSITORIES is not set, so:
//   GET /features/:slug → 200 { message: 'No artefacts found' } (no repos configured)

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated (authGuard → 302 redirect to sign-in) ─────────────────────

test('unauthenticated GET /features/:slug redirects to sign-in', async ({ page }) => {
  await page.goto('/features/some-feature-slug');
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated ──────────────────────────────────────────────────────────────

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
