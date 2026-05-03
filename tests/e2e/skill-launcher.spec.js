// skill-launcher.spec.js — E2E tests for skill launcher API (wuce.13)
//
// Tests verified here:
//   AC1: GET /api/skills returns skill list with name + path (auth required)
//   AC1 (unauth): returns 401 NOT_AUTHENTICATED without a session
//   AC2: POST /api/skills/discovery/sessions returns 201 with sessionId + question
//   AC3: answer > 1000 chars returns 400 ANSWER_TOO_LONG
//   AC4: skill name containing path-traversal character returns 400 INVALID_SKILL_NAME
//
// Skipped (cannot automate without a real no-licence account):
//   AC5: user without Copilot licence sees 403 NO_COPILOT_LICENCE
//
// Infrastructure smoke test proves Playwright can reach the server.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

test('smoke: page loads without error', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
});

// ── AC1: GET /api/skills ──────────────────────────────────────────────────

test('AC1 unauthenticated: GET /api/skills returns 401 NOT_AUTHENTICATED', async ({ request }) => {
  const response = await request.get('/api/skills');
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error).toBe('NOT_AUTHENTICATED');
});

withAuth('AC1: GET /api/skills returns skill list — each entry has name and path', async ({ page }) => {
  const response = await page.request.get('/api/skills');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.skills).toBeDefined();
  expect(Array.isArray(body.skills)).toBe(true);
  expect(body.skills.length).toBeGreaterThan(0);
  // Each skill has a name (slug) and a path to its directory
  for (const skill of body.skills) {
    expect(typeof skill.name).toBe('string');
    expect(skill.name.length).toBeGreaterThan(0);
    expect(typeof skill.path).toBe('string');
  }
  // The 'discovery' skill must appear (it is always present in this repo)
  const names = body.skills.map(s => s.name);
  expect(names).toContain('discovery');
});

// ── AC2: POST /api/skills/:name/sessions ─────────────────────────────────

withAuth('AC2: POST /api/skills/discovery/sessions returns 201 with sessionId and first question', async ({ page }) => {
  const response = await page.request.post('/api/skills/discovery/sessions');
  expect(response.status()).toBe(201);
  const body = await response.json();
  // sessionId must be a non-empty string
  expect(typeof body.sessionId).toBe('string');
  expect(body.sessionId.length).toBeGreaterThan(0);
  // first question is present and has text content
  expect(body.question).toBeTruthy();
  // totalQuestions is a positive integer
  expect(typeof body.totalQuestions).toBe('number');
  expect(body.totalQuestions).toBeGreaterThan(0);
});

// ── AC3: Answer length validation ────────────────────────────────────────

withAuth('AC3: answer > 1000 chars returns 400 ANSWER_TOO_LONG', async ({ page }) => {
  // Create a session first
  const sessionRes = await page.request.post('/api/skills/discovery/sessions');
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  // Submit an answer exceeding the 1000-character limit
  const response = await page.request.post(
    `/api/skills/discovery/sessions/${sessionId}/answers`,
    { data: { answer: 'a'.repeat(1001) } }
  );
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBe('ANSWER_TOO_LONG');
  expect(body.maxLength).toBe(1000);
});

// ── AC4: Path injection in skill name ────────────────────────────────────

withAuth('AC4: skill name with path-traversal character returns 400 INVALID_SKILL_NAME', async ({ page }) => {
  // A dot in the name triggers the path-traversal check in _checkSkillName
  const response = await page.request.post('/api/skills/discovery.evil/sessions');
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toBe('INVALID_SKILL_NAME');
});

// ── ACs requiring specific account state — manual only ───────────────────

// AC5 requires a GitHub account that has NO active Copilot subscription.
// The licence adapter is a stub in test mode — cannot simulate the false case here.
test.skip('AC5: user without Copilot licence sees 403 NO_COPILOT_LICENCE message', async () => {
  /* Requires a real GitHub account without an active Copilot subscription */
});

// Future: verify the first question text matches SKILL.md content exactly
test.skip('AC2 (future): launched skill first question text matches parsed SKILL.md first question exactly', async () => {
  /* Requires question parser to expose expected text for assertion */
});

// Future: valid short answer advances session to the next question
test.skip('AC3 (future): valid answer under 100 chars advances to the next question in sequence', async () => {
  /* Requires session state to expose current question index */
});

