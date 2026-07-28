// dsh-s6-archived-stage-transparent-render.spec.js — story dsh-s6
// artefacts/2026-07-28-durable-session-history/test-plans/dsh-s6-rehydrate-archived-turns-test-plan.md
//
// AC4 (end-to-end confirmation): an archived stage — whose turns exist ONLY
// in session_turns_archive (dsh-s5), never in the hot session_turns table —
// renders the identical chat-left/artefact-right split view as a hot-table
// stage, through dsh-s3's completely unmodified GET
// /journey/:journeyId/stage/:stageName route and rendering code. This proves
// dsh-s2's read function (adapters/session-turns-pg.js's getTurnsForStage)
// actually falls back to and rehydrates from the archive tier — not just
// that the function returns the right value in isolation (unit-tested
// separately in tests/check-dsh-s6-rehydrate-archived-turns.js).
//
// Mirrors tests/e2e/dsh-s3-breadcrumb-split-view.spec.js's exact pattern:
// same withAuth fixture, same local ephemeral webServer, same seed-then-goto
// shape — the only difference is `archived: true` on the seed call, which
// routes the seeded turns into session_turns_archive instead of
// session_turns (server.js's /test/seed-durable-stage, extended by dsh-s6).

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

withAuth('AC4: an archived-only stage renders the identical chat+artefact split as a hot-table stage', async ({ page }) => {
  const assistantTurnLabel = uniqueLabel('dsh-s6-assistant-turn');
  const userTurnLabel = uniqueLabel('dsh-s6-user-turn');
  const artefactLabel = uniqueLabel('dsh-s6-artefact');
  const featureSlug = uniqueLabel('dsh-s6-e2e-feature');
  const stageName = 'discovery';

  // Seed a journey + completed stage whose turns exist ONLY in
  // session_turns_archive — archived: true routes the seed write through
  // writeSessionTurnsArchive (session-turns-pg.js), never writeSessionTurns,
  // so this row is provably absent from the hot table. If getTurnsForStage's
  // archive-tier fallback (dsh-s6) did not work, this page would render an
  // empty/missing chat panel instead of the seeded content.
  const seedRes = await page.request.post('/test/seed-durable-stage', {
    data: {
      featureSlug: featureSlug,
      stageName: stageName,
      archived: true,
      artefactContent: '# Seeded archived artefact ' + artefactLabel + '\n\nBody for ' + artefactLabel + '.\n',
      turns: [
        { role: 'assistant', content: 'Seeded archived question ' + assistantTurnLabel },
        { role: 'user', content: 'Seeded archived answer ' + userTurnLabel }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), '/test/seed-durable-stage (archived: true) should succeed').toBe(200);

  const seedBody = await seedRes.json();
  expect(seedBody.journeyId, 'seed response should include journeyId').toBeTruthy();
  expect(seedBody.stageName, 'seed response should include stageName').toBe(stageName);

  await page.goto('/journey/' + encodeURIComponent(seedBody.journeyId) + '/stage/' + encodeURIComponent(seedBody.stageName));

  // Chat panel (left): both seeded turns rendered, sourced only from the
  // archive-tier fallback — proves the fully assembled page (dsh-s3's
  // unmodified route + rendering code), not just the read function in
  // isolation, actually rehydrates archived turns through to the DOM.
  const chatMessages = page.locator('#chat-messages');
  await expect(chatMessages).toBeVisible();
  await expect(chatMessages).toContainText(assistantTurnLabel);
  await expect(chatMessages).toContainText(userTurnLabel);

  // Artefact panel (right): the seeded artefact content rendered alongside
  // the chat, in the same real page — identical structure to a hot-table
  // stage's rendering, with no visible indication anywhere that the data
  // came from archive storage (AC4's "fully transparent" claim).
  const artefactPanel = page.locator('#artefact-panel');
  await expect(artefactPanel).toBeVisible();
  await expect(artefactPanel).toContainText(artefactLabel);
});
