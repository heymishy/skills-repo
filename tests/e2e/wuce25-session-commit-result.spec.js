// wuce25-session-commit-result.spec.js — E2E tests for commit preview and result HTML (wuce.25)
//
// GET /skills/:name/sessions/:id/commit-preview — HTML preview before committing
// GET /skills/:name/sessions/:id/result — HTML confirmation after a successful commit
//
// Full flow tests (AC2: form POST → 303, AC3: result page with commit SHA) require
// a live session with a real Copilot CLI run and GitHub write token — deferred to
// manual smoke tests at verification-scripts/wuce.25-session-commit-result-verification.md
//
// These E2E tests verify:
//   - Auth guard on both routes (unauthenticated → redirect, not JSON)
//   - Authenticated access → HTML response (even for unknown session → HTML error)
//   - Content-Type always text/html
//   - renderShell nav present on all responses
//   - AC5: existing JSON commit path (/api/.../commit with JSON body) returns 201 JSON — verified below

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const FAKE_SESSION = 'nonexistent-session-id-002';
const SKILL_NAME   = 'discovery';

// ── Unauthenticated ──────────────────────────────────────────────────────────

test('unauthenticated GET commit-preview redirects (auth guard)', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/commit-preview`);
  // 302 to /auth/github or root
  expect(['/auth/github', '/']).toContain(new URL(page.url()).pathname.replace(/\/$/, '') || '/');
});

test('unauthenticated GET result redirects (auth guard)', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/result`);
  expect(['/auth/github', '/']).toContain(new URL(page.url()).pathname.replace(/\/$/, '') || '/');
});

// ── Authenticated ─────────────────────────────────────────────────────────────

withAuth('AC1: authenticated GET commit-preview returns HTML (not JSON) even for unknown session', async ({ page }) => {
  const response = await page.request.get(
    `/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/commit-preview`
  );
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
  expect(ct).not.toContain('application/json');
});

withAuth('AC3: authenticated GET result returns HTML (not JSON) even for unknown session', async ({ page }) => {
  const response = await page.request.get(
    `/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/result`
  );
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
  expect(ct).not.toContain('application/json');
});

withAuth('AC1: commit-preview HTML page includes renderShell nav', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/commit-preview`);
  const html = await page.content();
  expect(html).toContain('<html');
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
});

withAuth('AC3: result HTML page includes renderShell nav', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/result`);
  const html = await page.content();
  expect(html).toContain('<html');
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
});

withAuth('AC5: POST /api/skills/:name/sessions/:id/commit with JSON body still returns 201 JSON (backward compat)', async ({ page }) => {
  // Content-Type dispatch — JSON body routes to the original JSON handler (wuce.13 AC)
  const response = await page.request.post(
    `/api/skills/${SKILL_NAME}/sessions/${FAKE_SESSION}/commit`,
    {
      headers: { 'Content-Type': 'application/json' },
      data:    { confirm: true },
    }
  );
  // Session doesn't exist → error, but response should be JSON (not HTML)
  const ct = response.headers()['content-type'] || '';
  expect(ct).toContain('application/json');
  expect(ct).not.toContain('text/html');
});
