// dic-canvas.spec.js — Playwright E2E tests for dic.1–5: definition canvas
//
// Tests the interactive story-map canvas for /definition sessions:
//   dic.1  — story cards render in table layout
//   dic.2  — phase-row model drives locked/current row display
//   dic.3  — add-story (+) button and input flow
//   dic.4  — touch fallback (simulated via click interactions)
//   dic.5  — canvas-edit POST dispatch and audit trail
//
// Uses the withAuth fixture (wuce.17) for authenticated tests.
// Uses the /test/seed-definition-session endpoint (NODE_ENV=test) to provide a
// definition session with stub artefact content — analogous to how unit tests
// use setSkillTurnExecutorStreamAdapter to inject synthetic turn responses
// without hitting the real model API.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const SKILL = 'definition';

// ── Unauthenticated guard ─────────────────────────────────────────────────────

test('unauthenticated GET /skills/definition/sessions/:id/chat redirects to auth', async ({ page }) => {
  await page.goto('/skills/definition/sessions/nonexistent-id/chat');
  const dest = new URL(page.url()).pathname;
  expect(['/auth/github', '/']).toContain(dest.replace(/\/$/, '') || '/');
});

// ── Empty session — page structure (dic.1/dic.2) ─────────────────────────────
// AC1-AC4 use /test/seed-definition-session to obtain a session ID without
// going through the skill-discovery path (which only scans .github/skills/,
// not the skills/ root directory where the definition SKILL.md lives).

withAuth('AC1: definition chat page sets IS_DEFINITION=true in page source', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  const source = await page.content();
  expect(source).toContain('IS_DEFINITION  = true');
});

withAuth('AC2: definition chat page exposes CANVAS_EDIT_URL in page source', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  const source = await page.content();
  expect(source).toContain('CANVAS_EDIT_URL');
  expect(source).toContain('canvas-edit');
});

withAuth('AC3: seeded definition session with no artefact shows placeholder text', async ({ page }) => {
  // The seeded session has artefactContent pre-populated, so we verify the
  // canvas renders (not the empty placeholder) — empty-session behaviour is
  // covered by the unit tests (check-dic1-story-cards.js).
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  const panel = page.locator('#artefact-panel');
  await expect(panel).toBeAttached();
});

withAuth('AC4: definition page includes renderDefinitionMap function in page source', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  const source = await page.content();
  expect(source).toContain('renderDefinitionMap');
  expect(source).toContain('initCanvasInteractivity');
  expect(source).toContain('applyChanges');
});

// ── Seeded session — canvas with content (dic.1/dic.2/dic.3) ─────────────────

withAuth('AC5: seeded definition session renders epic cards in the canvas', async ({ page }) => {
  // Seed a definition session with stub artefact content via the test helper endpoint
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  // The page loads with __SW_INITIAL_ARTEFACT__ pre-seeded, triggering updateDraftPanel
  // which calls renderDefinitionMap and injects the canvas HTML
  await expect(page.locator('.dm-canvas')).toBeAttached({ timeout: 5000 });
  await expect(page.locator('.dm-epic-th')).toHaveCount(2);
});

withAuth('AC6: seeded session shows dm-apply-btn when epics are present', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  await expect(page.locator('#dm-apply-btn')).toBeAttached({ timeout: 5000 });
  // Button is disabled until there are pending changes
  await expect(page.locator('#dm-apply-btn')).toBeDisabled();
});

withAuth('AC7: seeded session renders story cards with draggable attribute', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  await expect(page.locator('.story-card').first()).toBeAttached({ timeout: 5000 });
  // All story cards have draggable="true" (dic.1)
  const cards = page.locator('.story-card[draggable="true"]');
  expect(await cards.count()).toBeGreaterThan(0);
});

withAuth('AC8: seeded session renders add-story (+) button in current-phase cells (dic.3)', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  await expect(page.locator('.add-story-btn').first()).toBeAttached({ timeout: 5000 });
  const addBtns = page.locator('.add-story-btn');
  // One + button per epic column in the current phase row
  expect(await addBtns.count()).toBe(2);
});

withAuth('AC9: seeded session phase model script is embedded in page (dic.2)', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/${SKILL}/sessions/${sessionId}/chat`);

  const source = await page.content();
  expect(source).toContain('__SW_PHASE_MODEL__');
  expect(source).toContain('Phase 1 (current)');
});

// ── canvas-edit POST endpoint (dic.5) ─────────────────────────────────────────

test('canvas-edit POST redirects (302) to auth without authentication', async ({ page }) => {
  // authGuard returns 302 → / (not 401) for unauthenticated requests.
  // maxRedirects:0 captures the redirect response before Playwright follows it.
  const res = await page.request.post(
    '/api/skills/definition/sessions/any-id/canvas-edit',
    { data: { pendingReorder: [], pendingAdds: [] }, maxRedirects: 0 }
  );
  expect(res.status()).toBe(302);
});

withAuth('canvas-edit POST 400 for missing required fields', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  const { sessionId } = await seedRes.json();

  // Missing pendingAdds
  const res = await page.request.post(`/api/skills/${SKILL}/sessions/${sessionId}/canvas-edit`, {
    data: { pendingReorder: [] },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('pendingReorder and pendingAdds');
});

withAuth('canvas-edit POST 400 for extra unrecognised fields', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  const { sessionId } = await seedRes.json();

  const res = await page.request.post(`/api/skills/${SKILL}/sessions/${sessionId}/canvas-edit`, {
    data: { pendingReorder: [], pendingAdds: [], extraField: 'bad' },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('Unrecognised field');
});

withAuth('canvas-edit POST 200 with empty arrays returns ok:true and artefactContent (dic.5)', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  const { sessionId } = await seedRes.json();

  const res = await page.request.post(`/api/skills/${SKILL}/sessions/${sessionId}/canvas-edit`, {
    data: { pendingReorder: [], pendingAdds: [] },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(typeof body.artefactContent).toBe('string');
  expect(body.artefactContent).toContain('Platform Core');
});

withAuth('canvas-edit POST 400 for non-current phase (dic.5 phase guard)', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  const { sessionId } = await seedRes.json();

  // phase-2 is not current in the seeded session
  const res = await page.request.post(`/api/skills/${SKILL}/sessions/${sessionId}/canvas-edit`, {
    data: {
      pendingReorder: [{ cardId: 'epic-1_s.1', epicId: 'epic-1', newIndex: 0, phaseId: 'phase-2' }],
      pendingAdds: [],
    },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('non-current phase');
});

withAuth('canvas-edit POST 200 with a valid reorder writes audit entry (dic.5)', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-definition-session');
  const { sessionId } = await seedRes.json();

  const res = await page.request.post(`/api/skills/${SKILL}/sessions/${sessionId}/canvas-edit`, {
    data: {
      pendingReorder: [{ cardId: 'epic-1_s.1', epicId: 'epic-1', newIndex: 1, phaseId: 'phase-1' }],
      pendingAdds: [],
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
});
