// artefact-read.spec.js — E2E tests for GET /artefact/:slug/:type (wuce.2)
//
// Tests verified here:
//   Unauthenticated redirect to sign-in (authGuard)
//   AC1: authenticated URL renders HTML prose — no raw markdown syntax visible
//   AC2: markdown tables render as HTML <table> elements with <th> headers
//   AC3: unknown slug returns 404 with friendly message — no raw JSON
//   AC5: discovery artefact shows metadata bar (Status, Approved by, Created)
//
// AC4 (corrupt token → friendly error) cannot be automated here because
// invalidating the test session affects other tests sharing the same server
// process.  AC4 remains in the manual verification script.
//
// The E2E fixture fetcher in server.js (NODE_ENV=test) serves
// tests/fixtures/markdown/discovery-sample.md for the canonical TEST_SLUG
// and throws ArtefactNotFoundError for any other slug.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const TEST_SLUG  = '2026-05-02-web-ui-copilot-execution-layer';
const ARTEFACT_URL = `/artefact/${TEST_SLUG}/discovery`;

// ── Unauthenticated access ────────────────────────────────────────────────

test('unauthenticated /artefact/:slug/:type redirects to sign-in', async ({ page }) => {
  // Playwright follows the 302 redirect; the final page is the sign-in root.
  await page.goto(ARTEFACT_URL);
  // URL should be root (sign-in) — not the artefact URL
  expect(page.url()).toMatch(/localhost:3000\/?$/);
});

// ── Authenticated access: fixture-backed artefact ────────────────────────

withAuth('AC1: authenticated artefact URL renders HTML with no raw markdown syntax', async ({ page }) => {
  const response = await page.goto(ARTEFACT_URL);
  expect(response.status()).toBe(200);

  // Content-Type must declare text/html and utf-8 charset
  const contentType = response.headers()['content-type'] || '';
  expect(contentType).toContain('text/html');
  expect(contentType).toContain('utf-8');

  // Body must contain rendered HTML elements (heading from "## Discovery…")
  const html = await page.content();
  expect(html).toContain('<h2>');

  // No raw markdown heading syntax in the HTML source
  expect(html).not.toMatch(/^##\s/m);
});

withAuth('AC2: markdown table renders as HTML <table> with <th> column headers', async ({ page }) => {
  await page.goto(ARTEFACT_URL);

  // At least one <table> must be present
  const tableCount = await page.locator('table').count();
  expect(tableCount).toBeGreaterThan(0);

  // At least one <th> (from "| Constraint | Impact |" header row in fixture)
  const thCount = await page.locator('th').count();
  expect(thCount).toBeGreaterThan(0);

  // Pipe-delimited raw text must NOT appear as visible page text
  const bodyText = await page.textContent('body');
  expect(bodyText).not.toContain('| Constraint |');
});

withAuth('AC3: unknown feature slug returns 404 with friendly message — not raw JSON', async ({ page }) => {
  const response = await page.goto('/artefact/this-feature-does-not-exist-xyz/discovery');
  expect(response.status()).toBe(404);

  const body = await page.content();
  // Human-readable error message present
  expect(body.toLowerCase()).toContain('artefact not found');
  // Must not expose raw JSON error structure to the user
  expect(body).not.toContain('"error"');
});

withAuth('AC5: discovery artefact shows metadata bar with Status, Approved by, Created', async ({ page }) => {
  await page.goto(ARTEFACT_URL);

  // Metadata bar container rendered by markdown-renderer.js
  const metaBar = page.locator('.metadata-bar');
  await expect(metaBar).toBeVisible();

  const metaText = await metaBar.textContent();
  // Values from tests/fixtures/markdown/discovery-sample.md
  expect(metaText).toContain('Approved');         // Status
  expect(metaText).toContain('Test Stakeholder'); // Approved by
  expect(metaText).toContain('2026-01-15');       // Created
});
