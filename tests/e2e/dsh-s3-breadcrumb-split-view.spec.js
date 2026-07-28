// dsh-s3-breadcrumb-split-view.spec.js — story dsh-s3
// artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md
//
// AC1 (end-to-end confirmation): the rebuilt GET /journey/:journeyId/stage/:stageName
// page renders a genuine chat-left/artefact-right split in a real browser when the
// stage's conversation turns exist ONLY via the durable-read path (getTurnsForStage
// falling through to Postgres, no in-memory HTML session at all) — this is the
// specific class of bug (handler correct in isolation, but not actually correct
// once rendered through the real router/page) that jsvr-s1 taught us a unit test
// on the handler function alone can miss.
// AC5: no message-input control (<textarea>/submit button) appears in the
// read-only chat panel.
//
// AC2-AC4 are covered at the unit/integration level in
// tests/check-*.js — see the test plan's AC-coverage table; this spec only
// carries the E2E row for AC1/AC5.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

withAuth('AC1/AC5: a durable-only completed stage renders the chat+artefact split with no input control', async ({ page }) => {
  const assistantTurnLabel = uniqueLabel('dsh-s3-assistant-turn');
  const userTurnLabel = uniqueLabel('dsh-s3-user-turn');
  const artefactLabel = uniqueLabel('dsh-s3-artefact');
  const featureSlug = uniqueLabel('dsh-s3-e2e-feature');
  const stageName = 'discovery';

  // Seed a journey + completed stage whose turns exist ONLY via the durable
  // session_turns read path (session-turns-pg.js's getTurnsForStage) — no
  // in-memory HTML session is ever created for this stage, simulating
  // "server restarted, memory is gone" without an actual restart.
  const seedRes = await page.request.post('/test/seed-durable-stage', {
    data: {
      featureSlug: featureSlug,
      stageName: stageName,
      artefactContent: '# Seeded artefact ' + artefactLabel + '\n\nBody for ' + artefactLabel + '.\n',
      turns: [
        { role: 'assistant', content: 'Seeded question ' + assistantTurnLabel },
        { role: 'user', content: 'Seeded answer ' + userTurnLabel }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), '/test/seed-durable-stage should succeed').toBe(200);

  const seedBody = await seedRes.json();
  expect(seedBody.journeyId, 'seed response should include journeyId').toBeTruthy();
  expect(seedBody.stageName, 'seed response should include stageName').toBe(stageName);

  await page.goto('/journey/' + encodeURIComponent(seedBody.journeyId) + '/stage/' + encodeURIComponent(seedBody.stageName));

  // Chat panel (left): both seeded turns rendered, sourced only from the
  // durable-read path — proves the assembled page, not just the handler in
  // isolation, actually wires the durable turns through to the DOM.
  const chatMessages = page.locator('#chat-messages');
  await expect(chatMessages).toBeVisible();
  await expect(chatMessages).toContainText(assistantTurnLabel);
  await expect(chatMessages).toContainText(userTurnLabel);

  // Artefact panel (right): the seeded artefact content rendered alongside
  // the chat, in the same real page.
  const artefactPanel = page.locator('#artefact-panel');
  await expect(artefactPanel).toBeVisible();
  await expect(artefactPanel).toContainText(artefactLabel);

  // AC5: read-only MVP — no message-input control anywhere in the rendered page.
  await expect(page.locator('#chat-input')).toHaveCount(0);
  await expect(page.locator('textarea')).toHaveCount(0);
  await expect(page.locator('.sw-chat-foot')).toHaveCount(0);
  await expect(page.locator('button[type="submit"]', { hasText: 'Send' })).toHaveCount(0);
});
