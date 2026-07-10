// bri-s3.2-signup-onboarding-journey.spec.js — @mocked
//
// Signup -> onboarding -> first-feature journey (bri-s3.2).
//
// AC1: email/password signup completes onboarding and lands on a dashboard
//      with a path to create a first product.
// AC2: a first product is created, then the outer loop (discovery ->
//      benefit-metric -> design -> definition -> [per-story] review ->
//      test-plan -> definition-of-ready) is driven end-to-end via the same
//      JSON/form endpoints the browser chat UI posts to.
// AC3: a passing definition-of-ready run reaches /journey/:id/complete with
//      a visible gate-pass state ("Journey complete", ready-for-implementation CTA).
// AC4: the same journey shape run a second time with the definition-of-ready
//      stage forced to the mock gateway's 'failure' fixture never reaches
//      the done/gate-confirm state — the assistant's "BLOCKED" response is
//      visible in the turn result instead, which is textually and
//      structurally distinct from the AC3 pass case.
// AC5: throughout, this spec never calls the real Copilot/Anthropic APIs —
//      asserted via the server's real-LLM-call counter (GET /test/real-llm-call-count).
//
// This suite drives the flow through Playwright's `request` context (shares
// cookies with the browser context) rather than clicking through the chat
// page's DOM/inline-JS — matching the established convention in this repo's
// other E2E specs (skill-launcher.spec.js, feature-navigation.spec.js) for
// exercising API-shaped browser-authenticated flows.
//
// bri-s3.1 dependency: uses S3.1's mock LLM gateway (src/web-ui/modules/
// mock-llm-gateway.js), active automatically because the shared webServer
// (playwright.config.js) runs with NODE_ENV=test. This spec also relies on
// two bri-s3.2 additions to the fixture set — design.success.json and
// review.success.json — needed because a plain (no-stories) feature-level
// journey traverses the full STAGE_SEQUENCE (discovery, benefit-metric,
// design, definition, [stories:] review, test-plan, definition-of-ready),
// not only the 5 stages named in this story's own AC2 text.

'use strict';

const { test, expect } = require('@playwright/test');

function uniqueEmail() {
  return 'bri-s3-2-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '@example.test';
}

const PASSWORD = 'Bri-S3-2-Test-Password-1!';

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
 * `request` context (cookies now carry the authenticated session) plus the email.
 */
async function signUpAndCompleteOnboarding(request) {
  const email = uniqueEmail();

  const signupRes = await request.post('/auth/email/signup', {
    form: { email: email, password: PASSWORD },
    maxRedirects: 0
  });
  expect(signupRes.status(), 'signup should redirect to /welcome').toBe(302);
  expect(signupRes.headers()['location']).toBe('/welcome');

  const welcomeRes = await request.get('/welcome');
  expect(welcomeRes.status(), 'onboarding (plan-selection) page reached').toBe(200);

  // bri-s3.2 AC1: complete the (mocked) onboarding gate — see server.js's
  // /test/complete-onboarding for why this bypasses a real Stripe checkout.
  const completeRes = await request.post('/test/complete-onboarding');
  expect(completeRes.status()).toBe(200);

  return email;
}

/** Create a product via the real product-creation flow (AC1/AC2 precondition). */
async function createFirstProduct(request, name) {
  const draftRes = await request.post('/products/new', {
    data: { name: name, description: 'A product created by the bri-s3.2 E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 'A product created by the bri-s3.2 E2E spec.' },
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
async function submitTurn(request, skillName, sessionId) {
  const res = await request.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
    data: { answer: 'Begin the session.' }
  });
  expect(res.status(), `turn submission for ${skillName}`).toBe(200);
  return res.json();
}

/**
 * Drive a brand-new journey from creation through (and including) the
 * definition-of-ready stage's first turn. Stops right after that turn so the
 * caller can branch on the pass (AC3, gate-confirm) vs fail (AC4, no
 * gate-confirm possible) outcome.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} featureName
 * @param {string|null} e2eForceFailStage — e.g. 'definition-of-ready' for AC4
 * @returns {Promise<{journeyId: string, dorSkillName: string, dorSessionId: string, dorTurnResult: object}>}
 */
async function driveJourneyToDefinitionOfReady(request, featureName, e2eForceFailStage) {
  const createForm = { featureName: featureName, startSkill: 'discovery' };
  if (e2eForceFailStage) createForm.e2eForceFailStage = e2eForceFailStage;

  const createRes = await request.post('/api/journey', { form: createForm, maxRedirects: 0 });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const initialLocation = createRes.headers()['location'];

  let skillName = 'discovery';
  let sessionId = sessionIdFromChatPath(initialLocation);
  expect(sessionId, 'initial redirect should be a discovery chat session').toBeTruthy();

  // Resolve journeyId once via the chat page's embedded gate-confirm URL.
  const firstChatRes = await request.get(initialLocation);
  expect(firstChatRes.status()).toBe(200);
  const journeyId = journeyIdFromChatHtml(await firstChatRes.text());
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();

  // Stage order for a plain (no manually-listed stories) feature-level
  // journey: discovery -> benefit-metric -> design -> definition
  // -> [switches to per-story routing] -> review -> test-plan -> definition-of-ready.
  const FEATURE_LEVEL_STAGES = ['discovery', 'benefit-metric', 'design'];

  for (const stage of FEATURE_LEVEL_STAGES) {
    const turnResult = await submitTurn(request, skillName, sessionId);
    expect(turnResult.done, `${stage} stage should complete via the mock gateway`).toBe(true);

    const gateRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), `gate-confirm after ${stage}`).toBe(303);
    const nextLocation = gateRes.headers()['location'];

    if (nextLocation.indexOf('/stories') !== -1) {
      // definition stage just completed and switched to per-story routing.
      break;
    }
    skillName = nextLocation.split('/skills/')[1].split('/sessions/')[0];
    sessionId = sessionIdFromChatPath(nextLocation);
  }

  // Complete 'definition' itself (the loop above breaks before submitting it).
  const definitionTurn = await submitTurn(request, skillName, sessionId);
  expect(definitionTurn.done, 'definition stage should complete via the mock gateway').toBe(true);
  const afterDefinitionGate = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
  expect(afterDefinitionGate.status()).toBe(303);
  expect(afterDefinitionGate.headers()['location']).toBe('/journey/' + journeyId + '/stories');

  // Enter a single-story list so the per-story sequence (review -> test-plan
  // -> definition-of-ready) has exactly one story to complete.
  const storiesRes = await request.post(`/api/journey/${journeyId}/stories`, {
    form: { stories: 'bri-s3-2-e2e-story.1' },
    maxRedirects: 0
  });
  expect(storiesRes.status(), 'story list submission').toBe(303);
  let perStoryLocation = storiesRes.headers()['location'];
  let perStoryStage = 'review';
  let perStorySessionId = sessionIdFromChatPath(perStoryLocation);

  const PER_STORY_SEQ = ['review', 'test-plan', 'definition-of-ready'];
  let dorTurnResult = null;
  let dorSessionId = null;

  for (let i = 0; i < PER_STORY_SEQ.length; i++) {
    const stage = PER_STORY_SEQ[i];
    const turnResult = await submitTurn(request, stage, perStorySessionId);

    if (stage === 'definition-of-ready') {
      dorTurnResult = turnResult;
      dorSessionId = perStorySessionId;
      break; // caller decides whether to gate-confirm
    }

    expect(turnResult.done, `${stage} stage should complete via the mock gateway`).toBe(true);
    const gateRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateRes.status(), `gate-confirm after ${stage}`).toBe(303);
    perStoryLocation = gateRes.headers()['location'];
    perStorySessionId = sessionIdFromChatPath(perStoryLocation);
  }

  return {
    journeyId: journeyId,
    dorSkillName: 'definition-of-ready',
    dorSessionId: dorSessionId,
    dorTurnResult: dorTurnResult
  };
}

test.describe('bri-s3.2 signup -> onboarding -> first feature journey @mocked', () => {

  test('AC5 baseline: real-LLM-call counter is available and starts at a stable value', async ({ request }) => {
    const res = await request.get('/test/real-llm-call-count');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe('number');
  });

  test('AC1: email/password signup completes onboarding and reaches a dashboard with a create-first-product path', async ({ request }) => {
    test.setTimeout(60000);
    await signUpAndCompleteOnboarding(request);

    const dashboardRes = await request.get('/dashboard');
    expect(dashboardRes.status()).toBe(200);
    const dashboardHtml = await dashboardRes.text();
    expect(dashboardHtml).toContain('/products/new');
    expect(dashboardHtml.toLowerCase()).toContain('create your first product');
  });

  test('AC2/AC3/AC5: full outer loop from a first product through a passing definition-of-ready reaches a visible gate-pass state, with zero real LLM calls', async ({ request }) => {
    test.setTimeout(60000);

    const beforeCountRes = await request.get('/test/real-llm-call-count');
    const beforeCount = (await beforeCountRes.json()).count;

    await signUpAndCompleteOnboarding(request);
    const productId = await createFirstProduct(request, 'Bri S3.2 E2E Product');
    expect(productId).toBeTruthy();

    const { journeyId, dorSessionId } = await driveJourneyToDefinitionOfReady(
      request,
      'Bri S3.2 First Feature',
      null // no forced failure — this is the AC3 pass path
    );

    // definition-of-ready's own turn was left un-gate-confirmed by the shared
    // helper (it stops right after the DoR turn) — drive it through to completion.
    const dorTurn = await submitTurn(request, 'definition-of-ready', dorSessionId);
    expect(dorTurn.done, 'definition-of-ready should complete via the mock gateway success fixture').toBe(true);

    const gateConfirmRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateConfirmRes.status()).toBe(303);
    expect(gateConfirmRes.headers()['location']).toBe('/journey/' + journeyId + '/complete');

    const completeRes = await request.get(`/journey/${journeyId}/complete`);
    expect(completeRes.status()).toBe(200);
    const completeHtml = await completeRes.text();
    // AC3: gate-pass result visible in the UI — "Journey complete" + the
    // ready-for-implementation CTA (the inner-loop build stage's entry point).
    expect(completeHtml).toContain('Journey complete');
    expect(completeHtml).toContain('Ready for implementation');
    expect(completeHtml).toContain('start the inner coding loop');

    // AC5: zero real LLM calls were made across this whole pass-path run.
    const afterCountRes = await request.get('/test/real-llm-call-count');
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount, 'no real Anthropic/Copilot API calls during the mocked run').toBe(beforeCount);
  });

  test('AC4: a deliberately incomplete definition-of-ready run shows a gate-fail result, distinct from the AC3 pass case, with zero real LLM calls', async ({ request }) => {
    test.setTimeout(60000);

    const beforeCountRes = await request.get('/test/real-llm-call-count');
    const beforeCount = (await beforeCountRes.json()).count;

    await signUpAndCompleteOnboarding(request);
    await createFirstProduct(request, 'Bri S3.2 E2E Product Fail Path');

    const { dorTurnResult } = await driveJourneyToDefinitionOfReady(
      request,
      'Bri S3.2 Failing Feature',
      'definition-of-ready' // AC4: force the DoR stage to the 'failure' fixture
    );

    // AC4: the mock gateway's definition-of-ready.failure.json fixture has no
    // ---ARTEFACT-START---/---ARTEFACT-END--- markers, so htmlSubmitTurn never
    // sets done=true — there is no artefact to gate-confirm and no path to
    // /journey/:id/complete. This is the "gate fail" state: visibly and
    // textually distinct from AC3's green "Journey complete" pass case.
    expect(dorTurnResult.done, 'a deliberately incomplete DoR run must never report done:true').toBe(false);
    expect(dorTurnResult.artefactContent, 'no artefact should be produced on the failure path').toBeUndefined();
    expect(dorTurnResult.response).toContain('BLOCKED');
    expect(dorTurnResult.response.toLowerCase()).toContain('hard block');
    // Distinct from the AC3 pass case's content:
    expect(dorTurnResult.response).not.toContain('Journey complete');
    expect(dorTurnResult.response).not.toContain('✅ READY');

    // AC5: zero real LLM calls were made across this whole fail-path run either.
    const afterCountRes = await request.get('/test/real-llm-call-count');
    const afterCount = (await afterCountRes.json()).count;
    expect(afterCount, 'no real Anthropic/Copilot API calls during the mocked run').toBe(beforeCount);
  });

});
