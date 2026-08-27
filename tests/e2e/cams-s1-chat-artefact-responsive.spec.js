// cams-s1-chat-artefact-responsive.spec.js — story cams-s1
// artefacts/2026-08-27-chat-artefact-mobile-responsive/stories/cams-s1-stack-chat-artefact-panels-on-mobile.md
//
// Runs entirely locally against the mock LLM gateway (NODE_ENV=test) -- no
// real staging, no real credits, no real LLM cost. Reuses
// rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js's own
// useIsolatedTenant/driveJourneyToStage/sessionIdFromChatPath helpers
// verbatim (duplicated here, not imported -- matching that file's own stated
// "no cross-file run-order coupling" convention), combined with
// lphf-s2/s3/s4/s5-responsive.spec.js's viewport-resize + overflow/
// bounding-box assertion pattern.
//
// AC1/AC2/AC5: live chat page has no horizontal overflow and stacks its
//   panes vertically at 375px; the existing side-by-side layout is
//   unchanged at 1280px.
// AC3: the historical-conversation stage view (same shared renderChat
//   component) exhibits the same stacked, non-overflowing layout.
// AC4: the ideate skill's 3-panel right pane remains visible and
//   non-overflowing when stacked.

'use strict';

const { withAuth } = require('./fixtures/auth');
const { test, expect } = require('@playwright/test');
const { getCsrfToken } = require('./fixtures/csrf');

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

/** Create a fresh journey with the given startSkill and return its live chat page location + journeyId. */
async function createJourney(page, featureName, startSkill) {
  const createCsrfToken = await getCsrfToken(page.request, '/journey', 'journey home page');
  const createRes = await page.request.post('/api/journey', {
    form: { featureName: featureName, startSkill: startSkill, _csrf: createCsrfToken },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const location = createRes.headers()['location'];
  const chatHtml = await (await page.request.get(location)).text();
  const journeyIdMatch = chatHtml.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  const journeyId = journeyIdMatch ? journeyIdMatch[1] : null;
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();
  return { location, journeyId };
}

/** Complete the given (already-live) discovery-stage session and gate-confirm it, returning the resulting stage-view URL. */
async function completeAndGateConfirm(page, location, journeyId, skillName) {
  const sessionId = sessionIdFromChatPath(location);
  const turnRes = await page.request.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
    data: { answer: 'Begin the session.' }
  });
  expect(turnRes.status(), 'turn submission').toBe(200);
  const turnResult = await turnRes.json();
  expect(turnResult.done, `${skillName} stage should complete via the mock gateway`).toBe(true);

  const gateCsrfToken = await getCsrfToken(page.request, `/journey/${journeyId}/stage-review`, 'stage-review page');
  const gateRes = await page.request.post(`/api/journey/${journeyId}/gate-confirm`, {
    form: { _csrf: gateCsrfToken },
    maxRedirects: 0
  });
  expect(gateRes.status(), `gate-confirm after ${skillName}`).toBe(303);
  return `/journey/${journeyId}/stage/${skillName}`;
}

async function assertStackedNoOverflow(page, width) {
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth, `no horizontal overflow at ${width}px`).toBeLessThanOrEqual(width);

  const panes = page.locator('.sw-chat-pane');
  await expect(panes.first()).toBeVisible();
  const chatBox = await panes.first().boundingBox();
  const artefactBox = await panes.last().boundingBox();
  expect(chatBox.width, 'chat pane should span close to full viewport width when stacked').toBeGreaterThan(width * 0.7);
  expect(artefactBox.y, 'artefact/canvas pane should be stacked below the chat pane, not beside it').toBeGreaterThanOrEqual(chatBox.y + chatBox.height - 5);
}

async function assertSideBySide(page) {
  const panes = page.locator('.sw-chat-pane');
  const chatBox = await panes.first().boundingBox();
  const artefactBox = await panes.last().boundingBox();
  expect(artefactBox.x, 'artefact/canvas pane should be beside the chat pane on desktop').toBeGreaterThan(chatBox.x + chatBox.width - 5);
}

for (const width of [375, 1280]) {
  withAuth(`live chat page at ${width}px`, async ({ page }) => {
    await useIsolatedTenant(page, `cams-s1-live-${width}`);
    await page.setViewportSize({ width, height: 800 });
    const { location } = await createJourney(page, `CAMS S1 Live Chat ${width}`, 'discovery');
    await page.goto(location);
    // Not waitForLoadState('networkidle'): the live chat page holds an open
    // SSE/streaming connection that never quiesces, unlike the read-only
    // historical stage view -- wait for the chat pane itself instead.
    await page.locator('#chat-messages').waitFor({ state: 'visible' });

    if (width <= 768) {
      await assertStackedNoOverflow(page, width); // AC1, AC2
    } else {
      await assertSideBySide(page); // AC5
    }
  });
}

withAuth('historical-conversation stage view at 375px stacks the same way (AC3)', async ({ page }) => {
  await useIsolatedTenant(page, 'cams-s1-history');
  await page.setViewportSize({ width: 375, height: 800 });
  const { location, journeyId } = await createJourney(page, 'CAMS S1 History View', 'discovery');
  const stageViewUrl = await completeAndGateConfirm(page, location, journeyId, 'discovery');
  await page.goto(stageViewUrl);
  await page.waitForLoadState('networkidle');
  await assertStackedNoOverflow(page, 375);
});

withAuth('ideate 3-panel right pane remains visible and non-overflowing when stacked at 375px (AC4)', async ({ page }) => {
  await useIsolatedTenant(page, 'cams-s1-ideate');
  await page.setViewportSize({ width: 375, height: 800 });
  const { location } = await createJourney(page, 'CAMS S1 Ideate Mobile', 'ideate');
  await page.goto(location);
  await page.waitForLoadState('networkidle');

  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth, 'no horizontal overflow on the ideate 3-panel layout at 375px').toBeLessThanOrEqual(375);

  await expect(page.locator('#condition-items'), 'conditions sub-section must remain visible when stacked').toBeVisible();
  await expect(page.locator('#assumption-cards'), 'assumptions sub-section must remain visible when stacked').toBeVisible();
  await expect(page.locator('#canvas-panel'), 'canvas sub-section must remain visible when stacked').toBeVisible();
});
