// iwu2-right-panel-layout.spec.js — E2E tests for iwu.2 right panel restructure
//
// GET /skills/:name/sessions/:id/chat — renders the split-pane chat UI.
//
// These tests verify that the right panel contains two distinct named sections:
//   #assumption-cards  — assumption tracking section (top, capped height)
//   #draft-content     — artefact draft section (bottom, flex-grow)
//
// Tests create a real in-process session via POST /api/skills/discovery/sessions
// then navigate to the chat page to inspect the rendered DOM.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const SKILL_NAME = 'discovery';

// ── Unauthenticated guard ─────────────────────────────────────────────────

test('unauthenticated GET /skills/:name/sessions/:id/chat redirects (not JSON 401)', async ({ page }) => {
  await page.goto(`/skills/${SKILL_NAME}/sessions/nonexistent-session-id-001/chat`);
  // Auth guard issues 302 → /auth/github
  expect(['/auth/github', '/']).toContain(new URL(page.url()).pathname.replace(/\/$/, '') || '/');
});

// ── Authenticated — HTML structure ───────────────────────────────────────

withAuth('AC1: #assumption-cards section is present in the right panel', async ({ page }) => {
  // Create a real session so the chat page renders fully
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  // Navigate to the chat page
  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  // #assumption-cards must be present
  const assumptionSection = page.locator('#assumption-cards');
  await expect(assumptionSection).toBeAttached();
});

withAuth('AC2: #draft-content section is present in the right panel', async ({ page }) => {
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  const draftSection = page.locator('#draft-content');
  await expect(draftSection).toBeAttached();
});

withAuth('AC3: #assumption-cards shows placeholder text when no assumptions exist', async ({ page }) => {
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  const assumptionSection = page.locator('#assumption-cards');
  await expect(assumptionSection).toContainText('No assumptions identified yet');
});

withAuth('AC4: #assumption-cards has max-height:42% — capped to leave room for draft', async ({ page }) => {
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  // Verify the inline style attribute contains max-height:42%
  const assumptionSection = page.locator('#assumption-cards');
  const style = await assumptionSection.getAttribute('style');
  expect(style).toContain('max-height:42%');
});

withAuth('AC5: #assumption-cards has role="region" accessibility attribute', async ({ page }) => {
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  const assumptionSection = page.locator('#assumption-cards');
  await expect(assumptionSection).toHaveAttribute('role', 'region');
  await expect(assumptionSection).toHaveAttribute('aria-label', 'Assumption cards');
});

withAuth('AC6: #draft-content has role="region" and aria-label="Artefact draft"', async ({ page }) => {
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  const draftSection = page.locator('#draft-content');
  await expect(draftSection).toHaveAttribute('role', 'region');
  await expect(draftSection).toHaveAttribute('aria-label', 'Artefact draft');
});

withAuth('AC7: #assumption-cards appears before #draft-content in document order', async ({ page }) => {
  const sessionRes = await page.request.post(`/api/skills/${SKILL_NAME}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();

  await page.goto(`/skills/${SKILL_NAME}/sessions/${sessionId}/chat`);

  // Use DOM comparison: assumption-cards must precede draft-content
  const order = await page.evaluate(() => {
    const a = document.getElementById('assumption-cards');
    const d = document.getElementById('draft-content');
    if (!a || !d) return null;
    // Node.DOCUMENT_POSITION_FOLLOWING (4) means d follows a
    return (a.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  });
  expect(order).toBe(true);
});
