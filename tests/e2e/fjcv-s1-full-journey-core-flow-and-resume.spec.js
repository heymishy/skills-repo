// fjcv-s1-full-journey-core-flow-and-resume.spec.js — @mocked
//
// Confirms the two ways a brand-new feature journey can start (rough idea ->
// /ideate first, vs. formed idea -> /discovery first) both drive all the way
// to a passing definition-of-ready / "Journey complete" state, and that every
// major stage along the way is resumable afterward: GET
// /journey/:id/stage/:stageName renders that stage's real artefact content
// and the real conversation turns that produced it (not a blank or partial
// view), for a stage completed via the JSON /turn endpoint exactly as it
// would be for a stage completed via the real streaming chat UI -- the
// resume-view route (handleGetJourneyStageView) reads from the same durable
// per-stage turn store (getTurnsForStage) regardless of which endpoint
// produced the turns, so this is a genuine proof of the persistence path,
// not merely of the JSON endpoint's own immediate response.
//
// AC1: a rough-idea (/ideate-first) journey reaches definition-of-ready and
//      /journey/:id/complete, driving through /ideate's own multi-turn lens
//      cycle (isc-s1/isc-s2) before falling into the same
//      discovery -> ... -> definition-of-ready sequence as AC2.
// AC2: a formed-idea (/discovery-first) journey reaches definition-of-ready
//      and /journey/:id/complete via the same sequence bri-s3.2 already
//      proves, reused here (duplicated, not imported, per this repo's own
//      file-isolation convention -- see design-definition-canvas-render.spec.js,
//      rdac-s1's spec, etc.) so this file can add resume-view checks bri-s3.2
//      itself does not cover.
// AC3: for BOTH journeys, at least 3 representative checkpoints (ideate only
//      for AC1; discovery and definition-of-ready for both) are resumable:
//      GET /journey/:id/stage/:stageName returns 200 and contains real
//      artefact content AND real conversation text for that stage.
// AC4: throughout, zero real Copilot/Anthropic API calls (matching bri-s3.2's
//      own AC5 convention).
//
// This spec drives everything through Playwright's `request` context (shares
// cookies with the browser context), matching bri-s3.2/skill-launcher.spec.js's
// established convention for exercising API-shaped browser-authenticated
// flows without needing real browser DOM interaction for setup.

'use strict';

const { test, expect } = require('@playwright/test');
const { testEndpointBypassHeaders, hasStubSecret, RATE_LIMIT_BYPASS_HEADER, STUB_SECRET } = require('./fixtures/staging-auth');

function uniqueEmail() {
  return 'e2e-test-fjcv-s1-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '@example.test';
}

const PASSWORD = 'Fjcv-S1-Test-Password-1!';

/** Extract the session ID from a `/skills/:name/sessions/:id/chat` path. */
function sessionIdFromChatPath(pathname) {
  const m = pathname.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  return m ? m[1] : null;
}

/** Extract the journeyId embedded in the chat page's inline GATE_CONFIRM_URL script variable. */
function journeyIdFromChatHtml(html) {
  const m = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  return m ? m[1] : null;
}

/**
 * Sign up a brand-new email/password user and complete the (mocked) onboarding
 * gate, landing the session on the product dashboard. Returns the shared
 * `request` context (cookies now carry the authenticated session).
 */
async function signUpAndCompleteOnboarding(request) {
  const email = uniqueEmail();

  const landingRes = await request.get('/');
  const landingHtml = await landingRes.text();
  const csrfMatch = landingHtml.match(/name="_csrf" value="([^"]*)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  expect(csrfToken, 'landing page must embed a _csrf token in the signup form').toBeTruthy();

  const signupHeaders = {};
  if (hasStubSecret()) signupHeaders[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET;

  const signupRes = await request.post('/auth/email/signup', {
    form: { email: email, password: PASSWORD, _csrf: csrfToken },
    headers: signupHeaders,
    maxRedirects: 0
  });
  expect(signupRes.status(), 'signup should redirect to /welcome').toBe(302);

  const welcomeRes = await request.get('/welcome');
  expect(welcomeRes.status(), 'onboarding (plan-selection) page reached').toBe(200);

  const completeRes = await request.post('/test/complete-onboarding', { headers: testEndpointBypassHeaders() });
  expect(completeRes.status()).toBe(200);

  return email;
}

/** Create a product via the real product-creation flow. */
async function createFirstProduct(request, name) {
  const draftRes = await request.post('/products/new', {
    data: { name: name, description: 'A product created by the fjcv-s1 E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 'A product created by the fjcv-s1 E2E spec.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  const productLocation = confirmRes.headers()['location'];
  expect(productLocation).toMatch(/^\/products\//);
  return productLocation.split('/products/')[1];
}

/**
 * Drive one turn of the given skill session through the mock gateway and
 * return the parsed JSON result ({ done, response, artefactContent?, usage }).
 */
async function submitTurn(request, skillName, sessionId, answer) {
  // rapp-s1 (fix-forward): this spec's own journeys need up to 12 real turns
  // from one fresh signup, more than ftcg-s1's 10-credit free-tier grant
  // covers -- the credits-guard bypass header lets the real staging-only
  // credits-guard skip its balance check for this e2e--prefixed tenant,
  // exactly the same double-gate pattern (secret header + e2e- prefix) every
  // other staging-only test bypass in this codebase already uses. Empty
  // object when the secret isn't configured (a normal contributor run) --
  // the guard then falls back to its real balance check, unchanged.
  const res = await request.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
    data: { answer: answer || 'Begin the session.' },
    headers: testEndpointBypassHeaders()
  });
  expect(res.status(), `turn submission for ${skillName}`).toBe(200);
  return res.json();
}

/**
 * Drive a fresh /ideate session to completion via the JSON /turn endpoint.
 *
 * fjcv-s1 / isc-s1 note: the JSON path (htmlSubmitTurn) pushes every user
 * turn to session.turns unconditionally -- unlike the real streaming chat
 * UI's handlePostTurnStreamHtml, which skips pushing the auto-fired first
 * turn's own synthetic "Begin the session" content (_isInitialTurn guard).
 * That asymmetry is why isc-s2's real turnIndex sequence for the STREAMING
 * path is 0,1,3,5,7 while this JSON path's own sequence is 0,2,4,6,8 instead
 * -- both land on real, progressive content because isc-s1's fixture fills
 * each "padding" slot with a duplicate of the PRECEDING meaningful entry, so
 * either turnIndex cadence resolves to Lens A -> B -> C -> D -> the final
 * artefact-completion turn. Confirmed empirically below via the `done` flag
 * on the 5th call.
 *
 * @returns {Promise<{ideateSessionId: string}>}
 */
async function driveIdeateToCompletion(request, ideateSessionId) {
  const MAX_IDEATE_TURNS = 5; // Lens A, B, C, D, final -- isc-s1's own scripted sequence length
  let lastResult = null;
  for (let i = 0; i < MAX_IDEATE_TURNS; i++) {
    lastResult = await submitTurn(request, 'ideate', ideateSessionId, i === 0 ? 'Begin the session.' : 'Continue to the next lens.');
    if (lastResult.done) break;
  }
  expect(lastResult.done, 'ideate must complete within its scripted 5-turn sequence (isc-s1)').toBe(true);
  expect(lastResult.artefactContent, 'ideate completion must produce a real ideation artefact').toContain('# Ideation Artefact');
  return { ideateSessionId };
}

/**
 * Drive a brand-new journey from creation through (and including) the
 * definition-of-ready stage's first turn, then gate-confirm it through to
 * /journey/:id/complete. Optionally starts from /ideate instead of
 * /discovery. Returns checkpoint session IDs collected along the way so the
 * caller can assert resumability of each without re-deriving them.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} featureName
 * @param {'ideate'|'discovery'} startSkill
 * @returns {Promise<{journeyId: string, checkpoints: Object<string,string>}>}
 */
async function driveFullJourneyToDoRComplete(request, featureName, startSkill) {
  const createRes = await request.post('/api/journey', { form: { featureName: featureName, startSkill: startSkill }, maxRedirects: 0 });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const initialLocation = createRes.headers()['location'];

  let skillName = startSkill;
  let sessionId = sessionIdFromChatPath(initialLocation);
  expect(sessionId, `initial redirect should be a ${startSkill} chat session`).toBeTruthy();

  const firstChatRes = await request.get(initialLocation);
  expect(firstChatRes.status()).toBe(200);
  const journeyId = journeyIdFromChatHtml(await firstChatRes.text());
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();

  const checkpoints = {};

  if (startSkill === 'ideate') {
    await driveIdeateToCompletion(request, sessionId);
    checkpoints.ideate = sessionId;

    const gateRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), 'gate-confirm after ideate').toBe(303);
    const nextLocation = gateRes.headers()['location'];
    skillName = 'discovery';
    sessionId = sessionIdFromChatPath(nextLocation);
    expect(sessionId, 'ideate gate-confirm should land on a discovery chat session').toBeTruthy();
  }

  // Stage order for a plain (no manually-listed stories) feature-level
  // journey: discovery -> benefit-metric -> design -> definition
  // -> [switches to per-story routing] -> review -> test-plan -> definition-of-ready.
  const FEATURE_LEVEL_STAGES = ['discovery', 'benefit-metric', 'design'];

  for (const stage of FEATURE_LEVEL_STAGES) {
    const turnResult = await submitTurn(request, skillName, sessionId);
    expect(turnResult.done, `${stage} stage should complete via the mock gateway`).toBe(true);
    checkpoints[stage] = sessionId;

    const gateRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), `gate-confirm after ${stage}`).toBe(303);
    const nextLocation = gateRes.headers()['location'];

    if (nextLocation.indexOf('/stories') !== -1) break; // definition just completed, switched to per-story routing
    skillName = nextLocation.split('/skills/')[1].split('/sessions/')[0];
    sessionId = sessionIdFromChatPath(nextLocation);
  }

  const definitionTurn = await submitTurn(request, skillName, sessionId);
  expect(definitionTurn.done, 'definition stage should complete via the mock gateway').toBe(true);
  checkpoints.definition = sessionId;

  const afterDefinitionGate = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
  expect(afterDefinitionGate.status()).toBe(303);
  const afterDefinitionLocation = afterDefinitionGate.headers()['location'];
  expect(afterDefinitionLocation, 'definition gate-confirm should auto-skip straight into a review session').toMatch(/^\/skills\/review\/sessions\/[0-9a-f-]+\/chat$/);

  let perStoryLocation = afterDefinitionLocation;
  let perStorySessionId = sessionIdFromChatPath(perStoryLocation);

  const PER_STORY_SEQ = ['review', 'test-plan', 'definition-of-ready'];
  for (let i = 0; i < PER_STORY_SEQ.length; i++) {
    const stage = PER_STORY_SEQ[i];
    const turnResult = await submitTurn(request, stage, perStorySessionId);
    checkpoints[stage] = perStorySessionId;

    if (stage === 'definition-of-ready') {
      expect(turnResult.done, 'definition-of-ready should complete via the mock gateway success fixture').toBe(true);
      break;
    }

    expect(turnResult.done, `${stage} stage should complete via the mock gateway`).toBe(true);
    const gateRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), `gate-confirm after ${stage}`).toBe(303);
    perStoryLocation = gateRes.headers()['location'];
    perStorySessionId = sessionIdFromChatPath(perStoryLocation);
  }

  const finalGateConfirmRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
  expect(finalGateConfirmRes.status()).toBe(303);
  expect(finalGateConfirmRes.headers()['location']).toBe('/journey/' + journeyId + '/complete');

  const completeRes = await request.get(`/journey/${journeyId}/complete`);
  expect(completeRes.status()).toBe(200);
  const completeHtml = await completeRes.text();
  expect(completeHtml).toContain('Journey complete');
  expect(completeHtml).toContain('Ready for implementation');

  return { journeyId, checkpoints };
}

/**
 * Assert a completed stage is resumable: GET /journey/:id/stage/:stageName
 * returns 200 and its HTML contains both real artefact content and real
 * conversation text for that stage -- not a blank or partial view.
 */
async function assertStageResumable(request, journeyId, stageName, artefactSnippet, conversationSnippet) {
  const res = await request.get(`/journey/${journeyId}/stage/${encodeURIComponent(stageName)}`);
  expect(res.status(), `GET /journey/${journeyId}/stage/${stageName} must be resumable`).toBe(200);
  const html = await res.text();
  expect(html, `${stageName} resume view must contain its real artefact content`).toContain(artefactSnippet);
  expect(html, `${stageName} resume view must contain the real conversation text that produced it`).toContain(conversationSnippet);
}

test.describe('fjcv-s1 full journey core flow (ideate/discovery -> definition-of-ready) and resume @mocked', () => {

  test('AC5 baseline: real-LLM-call counter is available and starts at a stable value', async ({ request }) => {
    const res = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe('number');
  });

  test('AC1/AC3/AC4: a rough-idea (/ideate-first) journey reaches definition-of-ready complete, with ideate/discovery/definition-of-ready all resumable', async ({ request }) => {
    test.setTimeout(90000);

    const beforeCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const beforeCount = (await beforeCountRes.json()).count;

    await signUpAndCompleteOnboarding(request);
    await createFirstProduct(request, 'Fjcv S1 Ideate-First Product');

    const { journeyId, checkpoints } = await driveFullJourneyToDoRComplete(request, 'Fjcv S1 Ideate-First Feature', 'ideate');

    await assertStageResumable(request, journeyId, 'ideate', '# Ideation Artefact', 'Lens A -- Opportunity map');
    await assertStageResumable(request, journeyId, 'discovery', '# Discovery: Mock Fixture Feature', 'Understood');
    await assertStageResumable(request, journeyId, 'definition-of-ready', '# Definition of Ready: Mock Fixture Feature', 'Producing the full Definition of Ready');

    expect(Object.keys(checkpoints)).toEqual(expect.arrayContaining(['ideate', 'discovery', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']));

    const afterCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount, 'no real Anthropic/Copilot API calls during the ideate-first mocked run').toBe(beforeCount);
  });

  test('AC2/AC3/AC4: a formed-idea (/discovery-first) journey reaches definition-of-ready complete, with discovery/definition/definition-of-ready all resumable', async ({ request }) => {
    test.setTimeout(90000);

    const beforeCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const beforeCount = (await beforeCountRes.json()).count;

    await signUpAndCompleteOnboarding(request);
    await createFirstProduct(request, 'Fjcv S1 Discovery-First Product');

    const { journeyId, checkpoints } = await driveFullJourneyToDoRComplete(request, 'Fjcv S1 Discovery-First Feature', 'discovery');

    await assertStageResumable(request, journeyId, 'discovery', '# Discovery: Mock Fixture Feature', 'Understood');
    await assertStageResumable(request, journeyId, 'definition', '# Definition: Mock Fixture Feature', 'Proceeding with the full definition');
    await assertStageResumable(request, journeyId, 'definition-of-ready', '# Definition of Ready: Mock Fixture Feature', 'Producing the full Definition of Ready');

    expect(checkpoints.ideate, 'discovery-first journey must never touch /ideate').toBeUndefined();
    expect(Object.keys(checkpoints)).toEqual(expect.arrayContaining(['discovery', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']));

    const afterCountRes = await request.get('/test/real-llm-call-count', { headers: testEndpointBypassHeaders() });
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount, 'no real Anthropic/Copilot API calls during the discovery-first mocked run').toBe(beforeCount);
  });

});
