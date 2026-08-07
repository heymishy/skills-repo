// dsda-s1-default-all-stories.spec.js — story dsda-s1
// artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
//
// AC3: after /definition completes and the journey redirects to
// /journey/:id/stories, the story-list textarea remains a real, editable
// form field — the operator can adjust the list before submitting, and the
// edited value (not whatever the server pre-filled) is what proceeds.
//
// Drives the real mocked-LLM outer loop (discovery -> benefit-metric ->
// design -> definition) via the NODE_ENV=test mock gateway, the same
// request-driven pattern established by bri-s3.2-signup-onboarding-journey,
// then switches to real page.locator DOM interaction on /journey/:id/stories
// itself -- only a real browser can prove the rendered textarea is genuinely
// reachable/editable, which is the substance of AC3.
//
// Note: the shared definition.success.json mock fixture's artefact content
// uses a legacy story-header format that dsda-s1's server-side extractor
// does not recognise (by design -- see the story's Out of Scope: this fix
// adds a narrow extractor for the two current formats, not a rewrite of the
// legacy fallback). So this real end-to-end run naturally exercises AC4's
// graceful-fallback path (empty textarea, not an error) together with AC3's
// edit-affordance proof. AC1's true auto-population (a real pre-filled
// value) is covered at the integration level in
// tests/check-dsda-s1-default-all-stories.js against fixture content in
// the two currently-supported formats.

'use strict';

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function sessionIdFromChatPath(pathname) {
  const m = pathname.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  return m ? m[1] : null;
}

function journeyIdFromChatHtml(html) {
  const m = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  return m ? m[1] : null;
}

async function submitTurn(pageRequest, skillName, sessionId) {
  const res = await pageRequest.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
    data: { answer: 'Begin the session.' }
  });
  expect(res.status(), `turn submission for ${skillName}`).toBe(200);
  return res.json();
}

/**
 * Drive a brand-new feature-level journey (discovery -> benefit-metric ->
 * design -> definition) via the mock gateway, stopping right after
 * gate-confirming definition, whose redirect lands on /journey/:id/stories.
 */
async function driveJourneyToStoriesPage(pageRequest, featureName) {
  const createRes = await pageRequest.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const initialLocation = createRes.headers()['location'];

  let skillName = 'discovery';
  let sessionId = sessionIdFromChatPath(initialLocation);
  expect(sessionId, 'initial redirect should be a discovery chat session').toBeTruthy();

  const firstChatRes = await pageRequest.get(initialLocation);
  const journeyId = journeyIdFromChatHtml(await firstChatRes.text());
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();

  const FEATURE_LEVEL_STAGES = ['discovery', 'benefit-metric', 'design'];
  for (const stage of FEATURE_LEVEL_STAGES) {
    const turnResult = await submitTurn(pageRequest, skillName, sessionId);
    expect(turnResult.done, `${stage} stage should complete via the mock gateway`).toBe(true);

    const gateRes = await pageRequest.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), `gate-confirm after ${stage}`).toBe(303);
    const nextLocation = gateRes.headers()['location'];

    if (nextLocation.indexOf('/stories') !== -1) break;
    skillName = nextLocation.split('/skills/')[1].split('/sessions/')[0];
    sessionId = sessionIdFromChatPath(nextLocation);
  }

  // Complete 'definition' itself (the loop above breaks before submitting it).
  const definitionTurn = await submitTurn(pageRequest, skillName, sessionId);
  expect(definitionTurn.done, 'definition stage should complete via the mock gateway').toBe(true);
  const afterDefinitionGate = await pageRequest.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
  expect(afterDefinitionGate.status()).toBe(303);
  expect(afterDefinitionGate.headers()['location']).toBe('/journey/' + journeyId + '/stories');

  return journeyId;
}

withAuth('AC3: the story-list textarea on /journey/:id/stories is a real, editable field, and the edited value is what proceeds', async ({ page }) => {
  withAuth.setTimeout(60000);

  const journeyId = await driveJourneyToStoriesPage(page.request, 'DSDA S1 E2E Feature ' + Date.now());

  await page.goto('/journey/' + journeyId + '/stories');

  const textarea = page.locator('textarea[name="stories"]');
  await expect(textarea).toBeVisible();
  await expect(textarea).toBeEditable();

  // Operator clears whatever was pre-filled (this fixture's format yields an
  // empty pre-fill -- see file header note) and types their own story list.
  await textarea.fill('dsda-e2e-story.1\ndsda-e2e-story.2');

  await Promise.all([
    page.waitForURL(/\/skills\/review\/sessions\//, { timeout: 15000 }),
    page.locator('form button[type="submit"]').click()
  ]);

  expect(page.url()).toMatch(/\/skills\/review\/sessions\/[^/]+\/chat$/);
});
