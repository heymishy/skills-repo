// sign-off.spec.js — E2E tests for POST /sign-off (wuce.3)
//
// Tests verified here:
//   Unauthenticated POST → authGuard 302 redirect (no sign-off occurs)
//   AC2: path traversal artefactPath rejected with 400
//   AC2: missing artefactPath returns 400
//   AC2: path outside artefacts/ rejected with 400
//
// Remaining ACs cannot be automated in E2E without real GitHub write access:
//   AC1: valid path + valid token commits approved-by section (GitHub API write)
//   AC3: committer identity in GitHub commit history matches authenticated user
//   AC5: second sign-off on same artefact returns 409 Conflict
// These remain in the manual verification script (wuce.3-attributed-signoff-verification.md).

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// ── Unauthenticated access ────────────────────────────────────────────────

test('unauthenticated POST /sign-off is rejected — authGuard redirects to sign-in', async ({ request }) => {
  // maxRedirects: 0 prevents Playwright from following the 302 so we see it directly
  const response = await request.post('/sign-off', {
    data:         { artefactPath: 'artefacts/test/discovery.md' },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);
});

// ── AC2: Path validation (runs before any GitHub API call) ────────────────

withAuth('AC2: path traversal artefactPath rejected with 400', async ({ page }) => {
  const response = await page.request.post('/sign-off', {
    data: { artefactPath: '../etc/passwd' },
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

withAuth('AC2: missing artefactPath returns 400', async ({ page }) => {
  const response = await page.request.post('/sign-off', {
    data: {},
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

withAuth('AC2: path outside artefacts/ directory rejected with 400', async ({ page }) => {
  const response = await page.request.post('/sign-off', {
    data: { artefactPath: 'src/evil.js' },
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

withAuth('AC2: URL-encoded traversal sequence rejected with 400', async ({ page }) => {
  const response = await page.request.post('/sign-off', {
    data: { artefactPath: 'artefacts/../../.env' },
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBeTruthy();
});

// ── ACs requiring real GitHub write access — manual only ─────────────────

test.skip('AC1: POST /sign-off with valid path and valid token commits approved-by section', async () => {
  /* Manual: curl POST with real session cookie — see wuce.3 verification script */
});

test.skip('AC3: committer identity in GitHub commit history matches authenticated user', async () => {
  /* Manual: inspect GitHub commits page after AC1 curl */
});

test.skip('AC5: second sign-off on same artefact returns 409 Conflict', async () => {
  /* Manual: repeat AC1 curl on an already-signed artefact */
});
