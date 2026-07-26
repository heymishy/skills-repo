// design-definition-canvas-render.spec.js
//
// Reproduces a real gap found manually on staging: an operator running a
// real /design (or /definition) session sees no diagram, even though
// csd-s3/csd-s4 taught those skills to emit CANVAS-JSON markers and
// csd-s1/csd-s2 built a real canvas rendering mechanism for them.
//
// Root cause investigation found TWO separate, independent problems:
//   1. tests/e2e/fixtures/llm-gateway/design.success.json and
//      definition.success.json (the canned mock-gateway responses staging
//      uses -- fly.staging.toml sets MOCK_LLM_GATEWAY=true unconditionally)
//      predated csd-s3/csd-s4 by two weeks and contained zero CANVAS-JSON
//      markers. Fixed directly alongside this spec -- both fixtures now
//      include a real marker matching each skill's documented worked
//      example (skills/design/SKILL.md, skills/definition/SKILL.md).
//   2. src/web-ui/views/chat-view.js's right-hand panel is gated on
//      `data.skillName === 'ideate' || data.isIdeate === true` -- only the
//      /ideate skill's chat page renders a #canvas-panel element at all.
//      /design and /definition render an "Artefact Draft"/"Story Map" panel
//      instead (confirmed still functionally correct on its own -- this is
//      an ADDITIVE gap, not a regression of that panel), which has no
//      canvas-block rendering capability. Even with fixture #1 fixed, a
//      real /design turn's SSE canvasBlock event has nowhere to attach
//      client-side (appendCanvasBlock's document.getElementById
//      ("canvas-panel") returns null and no-ops).
//
// Sessions must be created via the real journey flow (POST /api/journey),
// matching bri-s3.2's established pattern -- the standalone
// POST /api/skills/:name/sessions endpoint's createSession adapter is
// never wired to a real implementation outside the journey flow (returns
// {id: ''}), a separate, pre-existing, unrelated gap discovered while
// building this spec (see the DoD/decisions note this finding was logged
// against).
//
// This spec drives discovery/benefit-metric quickly via the plain JSON
// /turn endpoint (matching bri-s3.2 -- fast, and canvas rendering isn't in
// scope for those stages), then switches to real browser interaction for
// the design stage: fills and submits the actual chat form, which
// triggers the real streaming /turn-stream fetch (the only endpoint that
// parses CANVAS-JSON markers into session.canvasBlocks), and asserts the
// canvas panel renders the diagram the mock response's marker describes.

'use strict';

const { withAuth } = require('./fixtures/auth');
const { test, expect } = require('@playwright/test');

function sessionIdFromChatPath(pathname) {
  const m = pathname.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  return m ? m[1] : null;
}

/**
 * Re-seed this test's browser context onto its OWN isolated tenant (bri-s3.5's
 * ?sessionId=&tenantId= override), instead of withAuth's shared default
 * "e2e-tester" tenant. Each test in this file drives a full journey through
 * several real streaming turns, and the turn-stream endpoint is rate-limited
 * to 30 turns/min PER TENANT (sec-perf AC1) -- sharing the default tenant
 * across both tests in this file was observed to trip that limiter when run
 * back-to-back in one worker (real 429s, confirmed via console listener),
 * an environment interaction unrelated to the fix this spec verifies.
 */
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
 * `targetStage`, using the fast plain-JSON /turn endpoint (matches
 * bri-s3.2), and return the chat-page location for targetStage without
 * submitting its turn -- the caller drives that stage via the real browser
 * UI instead.
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

  return location; // chat-page path for targetStage, turn not yet submitted
}

async function submitTurnViaRealChatUiAndWaitForStreamToFinish(page) {
  // A fresh chat page load can auto-fire an initial (__init__) turn
  // client-side; the send button stays disabled until that stream
  // finishes, so wait for it to be enabled before interacting.
  await page.waitForFunction(() => {
    const btn = document.querySelector('#chat-form button[type="submit"]');
    return btn && !btn.disabled;
  }, { timeout: 90000 });

  await page.fill('#chat-input', 'Begin the session.');
  await page.click('#chat-form button[type="submit"]');
  // The send button is disabled while streaming and re-enabled once the
  // fetch/reader pump completes (sendTurn's `result.done` branch).
  await page.waitForFunction(() => {
    const btn = document.querySelector('#chat-form button[type="submit"]');
    return btn && !btn.disabled;
  }, { timeout: 90000 });
}

withAuth('a real /design session turn (via the real chat UI, streaming) renders the system-architecture diagram in a canvas panel', async ({ page }) => {
  // Generous timeout: the very first streaming turn against a freshly
  // started local server can hit a rate-limit (429) retry/backoff cycle
  // before succeeding -- observed to take up to ~50s in that case, unrelated
  // to this test's own assertions. Subsequent turns are fast.
  test.setTimeout(120000);
  await useIsolatedTenant(page, 'design-canvas-spec');
  const chatLocation = await driveJourneyToStage(page, 'Design Canvas E2E Feature', 'design');
  await page.goto(chatLocation);
  await submitTurnViaRealChatUiAndWaitForStreamToFinish(page);

  // The canvas panel must exist at all for a /design session -- this is
  // the assertion that fails today (chat-view.js only renders it for
  // skillName === 'ideate').
  const panel = page.locator('#canvas-panel');
  await expect(panel, '#canvas-panel must be present in the /design chat view so emitted diagram markers have somewhere to render').toBeAttached({ timeout: 20000 });

  // .last(): this journey drives through discovery/benefit-metric before
  // reaching design, and the local NODE_ENV=test stub adapter (server.js)
  // is skill-agnostic -- every prior stage's turn also emits both marker
  // types, so multiple matching blocks legitimately accumulate. Real
  // per-stage fixtures (design.success.json et al) only emit their own
  // marker once; this is a local-dev-stub artifact, not a rendering bug.
  const block = panel.locator('.canvas-block[data-block-type="system-architecture"]').last();
  await expect(block, 'the system-architecture CANVAS-JSON marker from the mock design.success.json fixture must render as a real canvas block').toBeAttached({ timeout: 20000 });
  await expect(block.locator('.mermaid svg'), 'the diagram must render as a real mermaid SVG, not raw text or nothing').toBeVisible({ timeout: 20000 });
});

withAuth('a real /definition session turn (via the real chat UI, streaming) renders the program-design diagram in a canvas panel', async ({ page }) => {
  test.setTimeout(120000);
  await useIsolatedTenant(page, 'definition-canvas-spec');
  const chatLocation = await driveJourneyToStage(page, 'Definition Canvas E2E Feature', 'definition');
  await page.goto(chatLocation);
  await submitTurnViaRealChatUiAndWaitForStreamToFinish(page);

  const panel = page.locator('#canvas-panel');
  await expect(panel, '#canvas-panel must be present in the /definition chat view so emitted diagram markers have somewhere to render').toBeAttached({ timeout: 20000 });

  const block = panel.locator('.canvas-block[data-block-type="program-design"]').last();
  await expect(block, 'the program-design CANVAS-JSON marker from the mock definition.success.json fixture must render as a real canvas block').toBeAttached({ timeout: 20000 });
  await expect(block.locator('.mermaid svg'), 'the diagram must render as a real mermaid SVG, not raw text or nothing').toBeVisible({ timeout: 20000 });
});
