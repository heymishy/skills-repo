// b1-formed-idea-outer-loop-story-map.spec.js — story b1-formed-idea-outer-loop-story-map
// artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
//
// Targets a REAL deployed environment (wuce-staging by default, overridable via
// E2E_STAGING_BASE_URL) — NOT the local NODE_ENV=test mocked harness. Per
// ADR-018's addendum (.github/architecture-guardrails.md), this spec must
// never be invoked from the unit test chain (npm test); it only ever runs via
// `npm run test:e2e` (or a scoped Playwright invocation).
//
// Per ADR-022/ADR-023, each of the six skill stages this story drives
// (discovery -> benefit-metric -> definition -> review -> test-plan ->
// definition-of-ready) runs in its OWN skill session with artefact-content
// handoff between them — this spec never assumes a single persistent session
// spans all six stages. It follows whatever /api/journey/:id/gate-confirm's
// redirect Location names as the next stage, the same generic approach
// tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js already uses for the
// local mocked harness.
//
// AC1: a formed-idea feature reaches an Approved discovery, readable via the API.
// AC2: benefit-metric -> definition writes epics/stories; the /definition
//      story-map canvas DOM (dic.1-5 selectors, tests/e2e/dic-canvas.spec.js)
//      renders them — not an empty/placeholder canvas.
// AC3: review -> test-plan -> definition-of-ready reaches a visible DoR
//      sign-off/status field.
// AC4 (story-map-specific session field restores on resume) is verified
//      separately and deterministically by
//      tests/check-b1-story-map-session-restore.js — it exercises
//      mergeRedisSessionData() directly and does not depend on real staging,
//      real credits, or real model turns. See that file for the AC4 coverage.
//
// Independent of A3 (per /review finding [1-M1], resolved run 2): this spec
// creates its own product/tenant context via signUpEmail() + /products/new +
// /products/confirm, exactly as bri-s3.2's local-harness spec does for the
// mocked flow — no run-order coupling to any other spec file. Can be run
// standalone: `npx playwright test b1-formed-idea-outer-loop-story-map`.
//
// *** REAL, LIVE-VERIFIED BLOCKER (found 2026-07-23 while building this spec) ***
// Every real skill turn on wuce-staging is blocked with HTTP 402
// ("Insufficient credits") by src/web-ui/middleware/credits-guard.js unless
// the authenticated tenant has a positive credit balance. A brand-new
// email/password signup's tenant has a balance of 0 — confirmed live against
// wuce-staging while building this spec (POST /api/skills/discovery/sessions/
// :id/turn returned 402 {"error":"Insufficient credits","topUpUrl":"/settings/
// billing"} immediately after a fresh signup + product creation). No free-tier
// credit grant exists in this codebase (src/web-ui/modules/credits.js's
// getBalance() returns 0 for any tenant with no credits-table row, and no
// signup path inserts one).
//
// The only two ways to obtain a positive balance are:
//   (a) a completed real Stripe Checkout round-trip (POST /billing/checkout
//       does return a real, live checkout.stripe.com test-mode session URL —
//       confirmed live) followed by a real Stripe webhook delivery to
//       /webhook/stripe. tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js's
//       own comments already document driving a real Stripe Checkout round-trip
//       as "unsafe to exercise for real in CI" — this spec follows that same
//       established precedent rather than reversing it unilaterally.
//   (b) an admin-role account calling POST /api/admin/credits/adjust
//       (src/web-ui/routes/admin-credits.js), gated by ADMIN_GITHUB_LOGINS —
//       credentials this spec does not have and should not invent.
//
// Every AC1-AC3 test below performs its own real first-turn attempt and calls
// test.skip() with CREDITS_BLOCKED_REASON when blocked — mirroring the
// skip-not-fail precedent already established by hasStubSecret() in
// tests/e2e/fixtures/staging-auth.js — rather than fabricating a pass. The
// NFR-Security test does not need a completed turn and runs unconditionally.

'use strict';

const { test, expect } = require('@playwright/test');
const { STAGING_BASE_URL, signUpEmail } = require('./fixtures/staging-auth');

test.use({ baseURL: STAGING_BASE_URL });

const CREDITS_BLOCKED_REASON =
  'wuce-staging blocks every real skill turn with HTTP 402 (Insufficient credits) for a tenant ' +
  'with a zero credit balance -- true for every brand-new e2e-test- signup, since no free-tier ' +
  'credit grant exists (src/web-ui/modules/credits.js). Obtaining credits requires either a ' +
  'completed real Stripe Checkout round-trip (documented elsewhere in this repo, ' +
  'bri-s3.2-signup-onboarding-journey.spec.js, as unsafe to exercise for real in CI) or an ' +
  'admin-role top-up (POST /api/admin/credits/adjust) this spec has no credentials for. ' +
  'Skipping rather than fabricating a pass -- see this story\'s coding-agent report for the ' +
  'full, live-verified blocker writeup.';

function uniqueFeatureName(label) {
  return 'B1 E2E ' + label + ' ' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

/**
 * Sign up a brand-new tenant and create this spec's own minimal product
 * context — independent of any other story's spec file (per the review fix).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} label
 * @returns {Promise<{email: string, productId: string}>}
 */
async function createOwnProductContext(request, label) {
  const { email } = await signUpEmail(request, label);

  const draftRes = await request.post('/products/new', {
    data: { name: 'B1 Product ' + label, description: 'Product created independently by the b1-formed-idea-outer-loop-story-map E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed for a freshly authenticated tenant').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: 'B1 Product ' + label, description: 'Product created independently by the b1-formed-idea-outer-loop-story-map E2E spec.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location, 'product confirm should redirect under /products/').toMatch(/^\/products\//);

  return { email, productId: location.split('/products/')[1] };
}

/** Extract the session ID from a `/skills/:name/sessions/:id/chat` path. */
function sessionIdFromChatPath(pathname) {
  const m = pathname.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  return m ? m[1] : null;
}

/** Extract the journeyId embedded in the chat page's inline gate-confirm URL. */
function journeyIdFromChatHtml(html) {
  const m = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  return m ? m[1] : null;
}

/**
 * Create a formed-idea journey starting at /discovery. Returns the journeyId
 * plus the first stage's skillName/sessionId.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} featureName
 */
async function createFormedIdeaJourney(request, featureName) {
  const createRes = await request.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery' },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const initialLocation = createRes.headers()['location'];
  const sessionId = sessionIdFromChatPath(initialLocation);
  expect(sessionId, 'initial redirect should be a discovery chat session').toBeTruthy();

  const firstChatRes = await request.get(initialLocation);
  expect(firstChatRes.status()).toBe(200);
  const journeyId = journeyIdFromChatHtml(await firstChatRes.text());
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();

  return { journeyId: journeyId, skillName: 'discovery', sessionId: sessionId, chatPath: initialLocation };
}

/**
 * Submit one real turn. Returns { blocked: true, body } on the live credits
 * gate (HTTP 402) instead of throwing, so callers can test.skip() cleanly
 * rather than fail on infrastructure this story does not own.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string} answer
 */
async function submitRealTurn(request, skillName, sessionId, answer) {
  const start = Date.now();
  const res = await request.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
    data: { answer: answer }
  });
  const elapsedMs = Date.now() - start;
  if (res.status() === 402) {
    return { blocked: true, body: await res.json(), elapsedMs: elapsedMs };
  }
  expect(res.status(), `turn submission for ${skillName}`).toBe(200);
  return { blocked: false, result: await res.json(), elapsedMs: elapsedMs };
}

// NFR-Performance: no single stage's turn wait exceeds Playwright's default
// action timeout (30s per playwright.config.js) multiplied by this factor.
const STAGE_WAIT_FACTOR = 3;
const MAX_STAGE_WAIT_MS = 30000 * STAGE_WAIT_FACTOR;

/**
 * Drive a real skill session turn-by-turn with plausible freeform answers
 * until the model signals completion (done:true) or a safety cap is hit.
 * Unlike the local mocked harness (which always completes in exactly one
 * turn via the mock gateway), a real model's turn count is not knowable in
 * advance — this loops generically rather than assuming a fixed count.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} skillName
 * @param {string} sessionId
 * @param {string[]} answerPool
 */
async function driveSkillToCompletion(request, skillName, sessionId, answerPool) {
  const MAX_TURNS = 25;
  for (let i = 0; i < MAX_TURNS; i++) {
    const answer = answerPool[Math.min(i, answerPool.length - 1)];
    const turn = await submitRealTurn(request, skillName, sessionId, answer);
    if (turn.blocked) return turn;
    expect(turn.elapsedMs, `${skillName} turn ${i} must complete within the NFR-Performance bound`).toBeLessThan(MAX_STAGE_WAIT_MS);
    if (turn.result.done) return turn;
  }
  throw new Error(`${skillName} session did not reach done:true within ${MAX_TURNS} turns`);
}

/**
 * Confirm the gate for the current stage and resolve the next stage's
 * skillName/sessionId from the redirect Location — generic to whatever the
 * real STAGE_SEQUENCE is (this spec does not hardcode the exact stage list;
 * it follows the real app's own routing, exactly as a real browser would).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} journeyId
 */
async function gateConfirmAndAdvance(request, journeyId) {
  const gateRes = await request.post(`/api/journey/${journeyId}/gate-confirm`, { maxRedirects: 0 });
  expect(gateRes.status(), 'gate-confirm').toBe(303);
  const nextLocation = gateRes.headers()['location'];
  return { nextLocation: nextLocation, sessionId: sessionIdFromChatPath(nextLocation) };
}

const FORMED_IDEA_ANSWERS = [
  'We want to add a CSV export button to the reports page so operators can download report data for offline analysis.',
  'The primary user is an internal operator who currently has no way to get report data out of the platform except manual copy-paste.',
  'Success looks like a visible Export CSV button on the reports page that downloads a correctly-formatted file matching the on-screen data.',
  'This is scoped to the existing reports page only -- no new report types, no scheduled or emailed exports.',
  'The main risk is a very large report timing out the export -- we will cap the exportable row count and surface a clear message if exceeded.',
  'No new third-party dependencies are needed; standard CSV formatting on the existing report data pipeline is sufficient.',
  'Approved -- this is ready to move forward.'
];

test.describe('b1-formed-idea-outer-loop-story-map @real-staging', () => {

  test('AC1: a formed-idea feature reaches an Approved discovery on real staging', async ({ request }) => {
    test.setTimeout(180000);
    await createOwnProductContext(request, 'b1-ac1');
    const { sessionId } = await createFormedIdeaJourney(request, uniqueFeatureName('AC1'));

    const discoveryResult = await driveSkillToCompletion(request, 'discovery', sessionId, FORMED_IDEA_ANSWERS);
    test.skip(discoveryResult.blocked === true, CREDITS_BLOCKED_REASON);

    // AC1: discovery artefact saved and readable, reflecting Approved status.
    expect(discoveryResult.result.done, 'discovery stage should complete with a real model turn').toBe(true);
    expect(typeof discoveryResult.result.artefactContent, 'a discovery artefact must be produced').toBe('string');
    expect(discoveryResult.result.artefactContent.length).toBeGreaterThan(0);
  });

  test('AC2: definition writes epics/stories and the story-map canvas DOM renders them', async ({ page }) => {
    test.setTimeout(240000);
    await createOwnProductContext(page.request, 'b1-ac2');
    const journey = await createFormedIdeaJourney(page.request, uniqueFeatureName('AC2'));

    const discoveryResult = await driveSkillToCompletion(page.request, 'discovery', journey.sessionId, FORMED_IDEA_ANSWERS);
    test.skip(discoveryResult.blocked === true, CREDITS_BLOCKED_REASON);
    expect(discoveryResult.result.done).toBe(true);

    let advance = await gateConfirmAndAdvance(page.request, journey.journeyId);
    // benefit-metric stage
    const benefitMetricResult = await driveSkillToCompletion(page.request, 'benefit-metric', advance.sessionId, FORMED_IDEA_ANSWERS);
    expect(benefitMetricResult.blocked, 'benefit-metric should not be credit-blocked once discovery already passed').toBe(false);
    expect(benefitMetricResult.result.done).toBe(true);

    advance = await gateConfirmAndAdvance(page.request, journey.journeyId);
    // definition stage — drive to completion, then load the chat page and assert the canvas DOM.
    const definitionSessionId = advance.sessionId;
    const definitionResult = await driveSkillToCompletion(page.request, 'definition', definitionSessionId, FORMED_IDEA_ANSWERS);
    expect(definitionResult.blocked).toBe(false);
    expect(definitionResult.result.done, 'definition stage should complete and write epics/stories').toBe(true);

    // AC2: the /definition story-map canvas DOM renders visual elements
    // corresponding to the epics/stories just created — not an empty or
    // placeholder canvas. Uses the same selectors as tests/e2e/dic-canvas.spec.js
    // (dic.1-5), which is this repo's established way of asserting this canvas.
    await page.goto(`/skills/definition/sessions/${definitionSessionId}/chat`);
    await expect(page.locator('.dm-canvas')).toBeAttached({ timeout: 10000 });
    const epicHeaderCount = await page.locator('.dm-epic-th').count();
    expect(epicHeaderCount, 'the canvas must render at least one epic column, not an empty canvas').toBeGreaterThan(0);
    const storyCardCount = await page.locator('.story-card').count();
    expect(storyCardCount, 'the canvas must render at least one story card, not a placeholder canvas').toBeGreaterThan(0);
  });

  test('AC3: review -> test-plan -> definition-of-ready reaches a visible DoR sign-off status', async ({ request }) => {
    test.setTimeout(300000);
    await createOwnProductContext(request, 'b1-ac3');
    const journey = await createFormedIdeaJourney(request, uniqueFeatureName('AC3'));

    const discoveryResult = await driveSkillToCompletion(request, 'discovery', journey.sessionId, FORMED_IDEA_ANSWERS);
    test.skip(discoveryResult.blocked === true, CREDITS_BLOCKED_REASON);
    expect(discoveryResult.result.done).toBe(true);

    let advance = await gateConfirmAndAdvance(request, journey.journeyId);
    const benefitMetricResult = await driveSkillToCompletion(request, 'benefit-metric', advance.sessionId, FORMED_IDEA_ANSWERS);
    expect(benefitMetricResult.result.done).toBe(true);

    advance = await gateConfirmAndAdvance(request, journey.journeyId);
    const definitionResult = await driveSkillToCompletion(request, 'definition', advance.sessionId, FORMED_IDEA_ANSWERS);
    expect(definitionResult.result.done).toBe(true);

    advance = await gateConfirmAndAdvance(request, journey.journeyId);
    // definition's gate-confirm may route to a per-story list (bri-s3.2 pattern)
    // or directly to review, depending on the real STAGE_SEQUENCE — handle both.
    let perStorySessionId = advance.sessionId;
    if (!perStorySessionId && advance.nextLocation && advance.nextLocation.indexOf('/stories') !== -1) {
      const storiesRes = await request.post(`/api/journey/${journey.journeyId}/stories`, {
        form: { stories: 'b1-e2e-story.1' },
        maxRedirects: 0
      });
      expect(storiesRes.status(), 'story list submission').toBe(303);
      perStorySessionId = sessionIdFromChatPath(storiesRes.headers()['location']);
    }
    expect(perStorySessionId, 'a review-stage session should be reachable after definition').toBeTruthy();

    const reviewResult = await driveSkillToCompletion(request, 'review', perStorySessionId, FORMED_IDEA_ANSWERS);
    expect(reviewResult.result.done).toBe(true);

    advance = await gateConfirmAndAdvance(request, journey.journeyId);
    const testPlanResult = await driveSkillToCompletion(request, 'test-plan', advance.sessionId, FORMED_IDEA_ANSWERS);
    expect(testPlanResult.result.done).toBe(true);

    advance = await gateConfirmAndAdvance(request, journey.journeyId);
    const dorResult = await driveSkillToCompletion(request, 'definition-of-ready', advance.sessionId, FORMED_IDEA_ANSWERS);
    expect(dorResult.result.done, 'definition-of-ready should complete and reach a sign-off state').toBe(true);

    const gateConfirmRes = await request.post(`/api/journey/${journey.journeyId}/gate-confirm`, { maxRedirects: 0 });
    expect(gateConfirmRes.status()).toBe(303);
    expect(gateConfirmRes.headers()['location']).toBe('/journey/' + journey.journeyId + '/complete');

    // AC3: a visible DoR status field reflects the sign-off state — checked
    // via the ADR-024-governed GET /api/journey/:id shape (full shape, not partial).
    const journeyStateRes = await request.get(`/api/journey/${journey.journeyId}`);
    expect(journeyStateRes.status()).toBe(200);
    const journeyState = await journeyStateRes.json();
    expect(Array.isArray(journeyState.turns), 'ADR-024: turns must be an array').toBe(true);
    expect(Array.isArray(journeyState.stages), 'ADR-024: stages must be an array').toBe(true);
    expect(Array.isArray(journeyState.completedStages), 'ADR-024: completedStages must be an array').toBe(true);
    expect(typeof journeyState.stage, 'ADR-024: stage must be present').toBe('string');
    expect('ownerId' in journeyState, 'ADR-024: ownerId must be present').toBe(true);
    expect('activeSkill' in journeyState, 'ADR-024: activeSkill must be present').toBe(true);
    expect(journeyState.complete, 'the journey should be marked complete after a passing DoR gate-confirm').toBe(true);

    const completeRes = await request.get(`/journey/${journey.journeyId}/complete`);
    expect(completeRes.status()).toBe(200);
    const completeHtml = await completeRes.text();
    expect(completeHtml).toContain('Journey complete');
  });

  // NFR-Security: a resumed session is only reachable by the same authenticated
  // user/tenant who created it (ADR-025 tenant scoping) — same pattern as A4's
  // equivalent NFR test. Does not require a completed turn, so it is not
  // gated by the credits blocker above and runs unconditionally.
  test('NFR-Security: an outer-loop session is only reachable by its owning tenant', async ({ request, browser }) => {
    test.setTimeout(60000);
    await createOwnProductContext(request, 'b1-nfr-sec-owner');
    const journey = await createFormedIdeaJourney(request, uniqueFeatureName('NFR-Security'));

    const otherContext = await browser.newContext({ baseURL: STAGING_BASE_URL });
    const otherRequest = otherContext.request;
    await createOwnProductContext(otherRequest, 'b1-nfr-sec-other');

    const res = await otherRequest.get(`/api/skills/discovery/sessions/${journey.sessionId}/state`);
    expect([401, 403, 404], 'a different tenant must never be able to read another tenant\'s session state').toContain(res.status());

    await otherContext.close();
  });

});
