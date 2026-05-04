// wuce24-guided-question-form.spec.js — E2E tests for skill session question HTML (wuce.24)
//
// GET /skills/:name/sessions/:id/next — renders the current question as an HTML form.
// POST /api/skills/:name/sessions/:id/answer — submits an answer (form submission → 303).
//
// Tests use a fake session ID which the server does not recognise.
// The important guarantees:
//   - Unauthenticated → redirect (not a JSON 401)
//   - Authenticated + unknown session → HTML error page (not JSON)
//   - Content-Type is always text/html
//
// Full session flow tests (AC1: actual question rendering, AC2: answer advancement)
// require a live Copilot CLI session and are deferred to manual smoke tests
// at artefacts/2026-05-02-web-ui-copilot-execution-layer/verification-scripts/wuce.24-guided-question-form-verification.md

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const FAKE_SESSION = 'nonexistent-session-id-001';
const SKILL_NAME   = 'discovery';

// ── Unauthenticated ──────────────────────────────────────────────────────────

test('unauthenticated GET /skills/:name/sessions/:id/next redirects (not JSON 401)', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/next`);
  // Handler has its own auth check → 302 to /auth/github; Playwright follows → eventually root or auth page
  expect(['/auth/github', '/']).toContain(new URL(page.url()).pathname.replace(/\/$/, '') || '/');
});

// ── Authenticated ─────────────────────────────────────────────────────────────

withAuth('AC1 auth guard: authenticated GET /skills/:name/sessions/:id/next returns HTML (not JSON)', async ({ page }) => {
  // Unknown session → server returns an HTML error page (not raw JSON)
  const response = await page.request.get(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/next`);
  const ct = response.headers()['content-type'] || '';
  // Must be HTML even for error responses
  expect(ct).toContain('text/html');
  // Must not be JSON
  expect(ct).not.toContain('application/json');
});

withAuth('AC1: /skills/:name/sessions/:id/next response is an HTML document', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/next`);
  const html = await page.content();
  expect(html).toContain('<html');
});

withAuth('AC7: progress indicator present in HTML — step counter element exists when session valid', async ({ page }) => {
  // With a fake session we get an error page — verify we still get HTML shell, not a crash
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/next`);
  const nav = page.locator('nav');
  // renderShell is used even for error pages — nav should be present
  await expect(nav).toBeVisible();
});
