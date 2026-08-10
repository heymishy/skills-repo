// rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js
//
// Operator-requested coverage (2026-08-10, live confirmation session):
// "resuming a feature with real LLM generated artefacts and diagrams ...
// I want to hero [resuming] is key" -- confirmed live on staging that
// resuming/viewing a completed stage now shows diagrams (drh-s1), the
// artefact (pre-existing), AND the conversation history that generated them
// (rht-s1) all together on one page. This spec locks that combined scenario
// in as a real, browser-driven E2E test so a future regression in any one
// of drh-s1/rht-s1/the artefact-rendering path is caught automatically,
// rather than relying on the operator noticing it live again.
//
// Runs entirely locally against the mock LLM gateway (NODE_ENV=test) -- no
// real staging, no real credits, no real LLM cost. Reuses
// design-definition-canvas-render.spec.js's own driveJourneyToStage/
// useIsolatedTenant/submitTurnViaRealChatUiAndWaitForStreamToFinish helpers
// verbatim (duplicated here, not imported -- matching that file's own
// stated "no cross-file run-order coupling" convention) and extends the
// same real-browser-driven-turn pattern one step further: after the stage's
// turn completes, gate-confirm past it (making it a genuinely completed,
// historical stage) and navigate to its resume/history view
// (/journey/:id/stage/:stageName) -- the exact page drh-s1 and rht-s1 fixed.

'use strict';

const { withAuth } = require('./fixtures/auth');
const { test, expect } = require('@playwright/test');

function sessionIdFromChatPath(pathname) {
  const m = pathname.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  return m ? m[1] : null;
}

async function useIsolatedTenant(page, label) {
  const sessionId = 'e2e' + Date.now().toString(16) + Math.random().toString(16).slice(2).padEnd(50, '0').slice(0, 50);
  const tenantId = 'e2e-' + label;
  const res = await page.request.get(`/test/session?sessionId=${sessionId}&tenantId=${tenantId}`);
  if (res.status() !== 200) {
    throw new Error(`isolated tenant seed failed for ${label}: ${res.status()}`);
  }
  await page.context().addCookies([
    { name: 'session_id', value: sessionId, domain: 'localhost', path: '/', httpOnly: true, secure: false }
  ]);
}

async function submitTurnJson(page, skillName, sessionId) {
  const res = await page.request.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
    data: { answer: 'Begin the session.' }
  });
  expect(res.status(), `turn submission for ${skillName}`).toBe(200);
  return res.json();
}

/**
 * Drive a fresh journey from creation through the stage immediately before
 * `targetStage` via the fast plain-JSON /turn endpoint, and return
 * { location, journeyId } for targetStage's chat page, without submitting
 * its turn -- the caller drives that stage via the real browser UI instead.
 */
async function driveJourneyToStage(page, featureName, targetStage) {
  const createRes = await page.request.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  let location = createRes.headers()['location'];

  const STAGE_ORDER = ['discovery', 'benefit-metric', 'design', 'definition'];
  const targetIdx = STAGE_ORDER.indexOf(targetStage);
  if (targetIdx === -1) throw new Error(`unsupported targetStage: ${targetStage}`);

  const firstChatRes = await page.request.get(location);
  const firstChatHtml = await firstChatRes.text();
  const journeyIdMatch = firstChatHtml.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  const journeyId = journeyIdMatch ? journeyIdMatch[1] : null;
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();

  let skillName = STAGE_ORDER[0];
  let sessionId = sessionIdFromChatPath(location);

  for (let i = 0; i < targetIdx; i++) {
    const turnResult = await submitTurnJson(page, skillName, sessionId);
    expect(turnResult.done, `${skillName} stage should complete via the mock gateway`).toBe(true);

    const gateRes = await page.request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), `gate-confirm after ${skillName}`).toBe(303);
    location = gateRes.headers()['location'];
    skillName = STAGE_ORDER[i + 1];
    sessionId = sessionIdFromChatPath(location);
    expect(sessionId, `session id resolvable after ${skillName} redirect`).toBeTruthy();
  }

  return { location, journeyId };
}

async function submitTurnViaRealChatUiAndWaitForStreamToFinish(page) {
  await page.waitForFunction(() => {
    const btn = document.querySelector('#chat-form button[type="submit"]');
    return btn && !btn.disabled;
  }, { timeout: 90000 });

  await page.fill('#chat-input', 'Begin the session.');
  await page.click('#chat-form button[type="submit"]');
  await page.waitForFunction(() => {
    const btn = document.querySelector('#chat-form button[type="submit"]');
    return btn && !btn.disabled;
  }, { timeout: 90000 });
}

withAuth('resuming a completed /definition stage shows the diagram, the artefact, and the conversation that generated them together (drh-s1 + rht-s1)', async ({ page }) => {
  test.setTimeout(120000);
  await useIsolatedTenant(page, 'rdac-s1-spec');

  // ── Drive discovery/benefit-metric/design via the fast path, then
  //    complete /definition's own turn through the REAL streaming chat UI
  //    (the only path that parses CANVAS-JSON markers into
  //    session.canvasBlocks and persists the durable turn history) ──
  const { location: chatLocation, journeyId } = await driveJourneyToStage(page, 'RDAC S1 Resume Diagrams Artefact Conversation Feature', 'definition');
  await page.goto(chatLocation);
  await submitTurnViaRealChatUiAndWaitForStreamToFinish(page);

  // Completing the turn (above) already calls journeyStore.completeStage()
  // as soon as the ---ARTEFACT-START--- signal fires (skills.js's htmlSubmitTurn
  // AC5 path) -- /definition is already a genuinely completed, historical
  // stage at this point; no gate-confirm needed just to view its history.
  await page.goto(`/journey/${journeyId}/stage/definition`);
  await page.waitForLoadState('networkidle');

  // ── Diagram (drh-s1): the program-design marker from the mock
  //    definition.success.json fixture renders as a real canvas block with
  //    a real mermaid SVG, not raw text or nothing ──
  // .last(): mirrors design-definition-canvas-render.spec.js's own exact
  // pattern -- this journey drives through discovery/benefit-metric/design
  // before reaching definition, and the local NODE_ENV=test stub adapter is
  // skill-agnostic, so every prior stage's turn also emits a matching
  // marker. A local-dev-stub artifact, not a rendering bug.
  const diagramBlock = page.locator('.canvas-block[data-block-type="program-design"]').last();
  await expect(diagramBlock, 'the resumed stage view must render the program-design diagram (drh-s1)').toBeAttached({ timeout: 20000 });
  await expect(diagramBlock.locator('.mermaid svg'), 'the diagram must render as a real mermaid SVG on the resumed view').toBeVisible({ timeout: 20000 });

  // ── Artefact: the definition document's own real content renders. Text
  //    matches server.js's local-dev _STUB_ARTEFACT (the streaming chat UI
  //    always drives through this stub in NODE_ENV=test, not the file-
  //    backed mock-gateway fixtures the fast JSON-endpoint calls above use)
  //    -- see design-definition-canvas-render.spec.js's own header comment
  //    for the same distinction. ──
  await expect(page.locator('body'), 'the resumed stage view must render the real artefact content').toContainText('Definition — Stub Feature');

  // ── Conversation (rht-s1): the skill's own final message -- the exact
  //    text a lone trailing assistant turn used to be silently dropped for
  //    -- renders in the chat thread, not an empty panel ──
  const chatMessages = page.locator('#chat-messages');
  await expect(chatMessages, 'the resumed stage view must render the conversation panel').toBeAttached({ timeout: 10000 });
  await expect(chatMessages, 'the skill\'s own final message must appear in the conversation history, not be silently dropped (rht-s1)').toContainText('Definition — Stub Feature');

  // ── No live interactive affordance on a read-only historical view --
  //    matches drh-s1's own proven assertion shape (check-drh-s1-resume-
  //    history-diagram-rendering.js's AC4), not a guessed selector ──
  await expect(page.locator('#chat-messages textarea'), 'the resumed stage view must be read-only -- no live input textarea').toHaveCount(0);
  await expect(page.locator('#chat-messages button[type="submit"]'), 'the resumed stage view must be read-only -- no submit button').toHaveCount(0);
});
