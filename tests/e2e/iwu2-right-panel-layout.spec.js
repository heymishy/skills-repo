// iwu2-right-panel-layout.spec.js — E2E tests for iwu.2 right panel restructure
//
// GET /skills/:name/sessions/:id/chat — renders the split-pane chat UI.
//
// The right panel is skill-specific (views/chat-view.js):
//   ideate          — #assumption-cards (assumption tracking, in the resizable
//                     #sw-ideate-assum-group) above #canvas-panel
//   every other one — #artefact-panel (the artefact draft; discovery is used
//                     here) above #canvas-panel
//
// Tests create a real in-process session via POST /api/skills/:name/sessions
// then navigate to the chat page to inspect the rendered DOM.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

const ASSUMPTION_SKILL = 'ideate';
const DRAFT_SKILL      = 'discovery';

async function openChat(page, skillName) {
  const sessionRes = await page.request.post(`/api/skills/${skillName}/sessions`);
  expect(sessionRes.status()).toBe(201);
  const { sessionId } = await sessionRes.json();
  await page.goto(`/skills/${skillName}/sessions/${sessionId}/chat`);
}

// Unauthenticated guard

test('unauthenticated GET /skills/:name/sessions/:id/chat redirects (not JSON 401)', async ({ page }) => {
  await page.goto(`/skills/${DRAFT_SKILL}/sessions/nonexistent-session-id-001/chat`);
  // Auth guard issues 302 → /auth/github
  expect(['/auth/github', '/']).toContain(new URL(page.url()).pathname.replace(/\/$/, '') || '/');
});

// Authenticated — HTML structure

withAuth('AC1: #assumption-cards section is present in the ideate right panel', async ({ page }) => {
  await openChat(page, ASSUMPTION_SKILL);
  await expect(page.locator('#assumption-cards')).toBeAttached();
});

withAuth('AC2: the artefact draft section (#artefact-panel) is present in the discovery right panel', async ({ page }) => {
  await openChat(page, DRAFT_SKILL);
  await expect(page.locator('#artefact-panel')).toBeAttached();
  // The assumption section belongs to the ideate layout only.
  await expect(page.locator('#assumption-cards')).toHaveCount(0);
});

withAuth('AC3: #assumption-cards shows placeholder text when no assumptions exist', async ({ page }) => {
  await openChat(page, ASSUMPTION_SKILL);
  await expect(page.locator('#assumption-cards')).toContainText('No assumptions identified yet');
});

withAuth('AC4: the assumptions section is capped at 38% of the right panel, leaving room for the canvas', async ({ page }) => {
  await openChat(page, ASSUMPTION_SKILL);
  // The cap moved from max-height:42% on #assumption-cards to a flex-basis on
  // the resizable group that wraps the header and the cards (dsa-s4).
  const style = await page.locator('#sw-ideate-assum-group').getAttribute('style');
  expect(style).toContain('flex:0 0 38%');
});

withAuth('AC5: #assumption-cards has role="region" accessibility attribute', async ({ page }) => {
  await openChat(page, ASSUMPTION_SKILL);
  const assumptionSection = page.locator('#assumption-cards');
  await expect(assumptionSection).toHaveAttribute('role', 'region');
  await expect(assumptionSection).toHaveAttribute('aria-label', 'Assumption cards');
});

withAuth('AC6: #artefact-panel has role="region" and aria-label="Artefact draft"', async ({ page }) => {
  await openChat(page, DRAFT_SKILL);
  const draftSection = page.locator('#artefact-panel');
  await expect(draftSection).toHaveAttribute('role', 'region');
  await expect(draftSection).toHaveAttribute('aria-label', 'Artefact draft');
});

withAuth('AC7: #assumption-cards appears before #canvas-panel in document order', async ({ page }) => {
  await openChat(page, ASSUMPTION_SKILL);
  const order = await page.evaluate(() => {
    const a = document.getElementById('assumption-cards');
    const c = document.getElementById('canvas-panel');
    if (!a || !c) return null;
    // Node.DOCUMENT_POSITION_FOLLOWING (4) means c follows a
    return (a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  });
  expect(order).toBe(true);
});
