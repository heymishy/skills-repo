// dsh-s4-resume-conversation-survives-restart.spec.js — story dsh-s4
// artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
// artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
//
// Targets a REAL deployed environment (wuce-staging by default, overridable via
// E2E_STAGING_BASE_URL) — NOT the local NODE_ENV=test mocked harness. Per
// ADR-018's addendum (.github/architecture-guardrails.md), this spec must
// never be invoked from the unit test chain (npm test); it only ever runs via
// `npm run test:e2e` (or a scoped Playwright invocation), and here specifically
// via the scenario-a-staging-e2e CI job (.github/workflows/e2e.yml).
//
// AC2 (the literal originally-reported bug, and the core guarantee this story
//      exists to fix): a stage completed before the last server restart
//      (session gone from both memory and Redis) must still render its real
//      conversation via the updated "Resume conversation" link
//      (/journey/:journeyId/stage/:stageName, dsh-s3's route) — never
//      "Session not found". Session loss is simulated via Task 2's
//      POST /test/evict-skill-session (deletes exactly one sessionId from the
//      in-memory _sessionStore only; Redis/Postgres untouched) rather than a
//      disruptive real Fly app restart mid-CI-run.
// AC3 (no regression): the same link, for a stage whose session is STILL
//      resident in memory (not evicted), must also render correctly.
//
// *** Verification note (this story's own dispatch, 2026-07-28) ***
// The dsh-s4 dispatch prompt flagged two blockers previously documented in
// artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md (a3/a4 findings):
// (1) the deployed wuce-staging container didn't ship tests/e2e/fixtures/llm-gateway/,
// so MOCK_LLM_GATEWAY had no effect at runtime; (2) handlePostTurnStreamHtml (the
// ONLY endpoint the real chat UI ever calls) never wired {stage, scenarioName}
// into the executor options, so every real browser-driven turn hit the real
// Anthropic API regardless of the flag. Both are now independently re-verified
// live against real wuce-staging as part of writing this spec:
//   - `flyctl ssh console --app wuce-staging -C "ls /app/tests/e2e/fixtures/llm-gateway"`
//     confirms all 17 fixture files (including discovery.success.json) are present
//     in the deployed container.
//   - `flyctl ssh console --app wuce-staging -C "grep -n srmw-s1 /app/src/web-ui/routes/skills.js"`
//     confirms the deployed code carries the srmw-s1 fix
//     (`_turnOptions.stage = session.skillName; _turnOptions.scenarioName = ...`).
//   - A live, throwaway script (real signup -> real product -> real "formed
//     idea" /discovery feature -> one real POST to .../turn-stream) confirmed the
//     SSE response contains the deterministic discovery.success.json fixture
//     text ("Discovery: Mock Fixture Feature", full ---ARTEFACT-START---/
//     ---ARTEFACT-END--- markers, `"done":true`) — not an empty/real-model
//     response — and that this single real turn auto-registers the stage into
//     journey.completedStages (confirmed via a subsequent real GET
//     /journey/:journeyId/stage/discovery returning 200 with both #chat-messages
//     and #artefact-panel populated), all with NO credits/admin-topup dependency
//     (discovery's mock fixture completes in turn 1, before any credit-gated
//     continuation would be needed).
// Both blockers are confirmed resolved. This spec therefore follows the test
// plan's literal design: drive a real stage to completion via a real turn
// against the mock-gateway-backed chat endpoint, then evict, then confirm the
// resume link survives — no seed-endpoint fallback needed.
//
// Reuses tests/e2e/fixtures/staging-auth.js (A1) for authentication, matching
// the established Scenario A/B convention. The `discovery` skill (not
// `ideate`) is used deliberately: its mock fixture
// (tests/e2e/fixtures/llm-gateway/discovery.success.json) returns a complete
// ---ARTEFACT-START---/---ARTEFACT-END--- artefact in a single turn, so the
// stage auto-completes (handlePostTurnStreamHtml's completeStage() +
// writeSessionTurns() calls) without needing the credits-gated multi-turn
// continuation a2/a3/a4's /ideate flow requires — keeping this spec's real
// Anthropic-API-avoidance and setup cost minimal.

'use strict';

const { test, expect } = require('@playwright/test');
const { STAGING_BASE_URL, signUpEmail, testEndpointBypassHeaders } = require('./fixtures/staging-auth');
// rcfc-s1: /products/confirm and /api/journey now require a valid
// session-scoped CSRF token on raw (non-page-driven) POSTs.
const { getCsrfToken } = require('./fixtures/csrf');

test.use({ baseURL: STAGING_BASE_URL });

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

/**
 * Sign up a brand-new e2e-test- tagged tenant and create this spec's own
 * product context via the real /products/new -> /products/confirm API path
 * (independent of any other spec file's product, per the established
 * per-test-isolation convention — mirrors a3/a4's own createOwnProduct).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} label
 * @returns {Promise<{email: string}>}
 */
async function createOwnProduct(request, label) {
  const { email } = await signUpEmail(request, label);
  const productName = 'DSH-S4 Product ' + label;

  const draftRes = await request.post('/products/new', {
    data: { name: productName, description: 'Product created by the dsh-s4 resume-conversation E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed for a freshly authenticated tenant').toBe(200);

  // rcfc-s1: /products/confirm now requires a valid session-scoped CSRF token,
  // embedded as a hidden field in the real /products/new form.
  const csrfToken = await getCsrfToken(request, '/products/new', 'products/new page');

  const confirmRes = await request.post('/products/confirm', {
    form: { name: productName, description: 'Product created by the dsh-s4 resume-conversation E2E spec.', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);

  return { email: email };
}

/**
 * Create a feature via the "formed idea" path (startSkill=discovery) — the
 * skill whose mock-gateway fixture completes a full artefact in a single
 * turn. Mirrors a3/a4's createRoughIdeaFeature helper, choosing 'discovery'
 * instead of 'ideate'.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} featureName
 * @returns {Promise<{journeyId: string, sessionId: string, chatPath: string}>}
 */
async function createFormedIdeaFeature(request, featureName) {
  // rcfc-s1: /api/journey now requires a valid session-scoped CSRF token,
  // embedded as a hidden field in the real /journey home page form.
  const csrfToken = await getCsrfToken(request, '/journey', 'journey home page');
  const createRes = await request.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'discovery', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey (formed idea) should redirect to the new session').toBe(303);
  const location = createRes.headers()['location'];
  expect(location, 'formed-idea path must route into a /discovery chat session').toMatch(/^\/skills\/discovery\/sessions\//);

  const chatRes = await request.get(location);
  expect(chatRes.status()).toBe(200);
  const html = await chatRes.text();
  const journeyMatch = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  const sessionMatch = location.match(/\/skills\/discovery\/sessions\/([^/]+)\/chat/);

  return {
    journeyId: journeyMatch ? journeyMatch[1] : null,
    sessionId: sessionMatch ? sessionMatch[1] : null,
    chatPath: location
  };
}

/**
 * Drive one real turn against the mock-gateway-backed /turn-stream endpoint.
 * discovery.success.json returns a full ---ARTEFACT-START---/---ARTEFACT-END---
 * artefact in this single turn, which causes handlePostTurnStreamHtml to
 * auto-complete the stage: journeyStore.completeStage() (registers the stage
 * in journey.completedStages with this real sessionId + artefactPath — the
 * exact precondition _resolveResumeLinksForFeature/dsh-s3's stage-view route
 * both require) and session-turns-pg.writeSessionTurns() (dsh-s1's real,
 * deployed durable-write path — the real Postgres row AC2 depends on).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} sessionId
 * @param {string} distinctiveMessage
 * @returns {Promise<string>} the raw SSE response body
 */
async function driveDiscoveryTurnToCompletion(request, sessionId, distinctiveMessage) {
  const streamRes = await request.post('/api/skills/discovery/sessions/' + sessionId + '/turn-stream', {
    data: { answer: distinctiveMessage },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(streamRes.status(), 'turn-stream should succeed for a freshly created session').toBe(200);
  const body = await streamRes.text();
  expect(body, 'the mock-gateway discovery fixture must return its deterministic artefact in turn 1').toContain('Discovery: Mock Fixture Feature');
  expect(body, 'turn 1 must complete (done:true), not just stream partial chunks').toContain('"done":true');
  return body;
}

test.describe('dsh-s4-resume-conversation-survives-restart @real-staging', () => {

  test('AC2: Resume conversation renders the real conversation after the session is evicted from memory (simulated restart)', async ({ page }) => {
    test.setTimeout(90000);
    await createOwnProduct(page.request, uniqueLabel('dsh-s4-ac2'));

    const distinctiveDetail = 'DSH-S4-AC2-Detail-' + uniqueLabel('detail');
    const feature = await createFormedIdeaFeature(page.request, 'DSH-S4 E2E AC2 Feature ' + uniqueLabel('feat'));
    expect(feature.journeyId, 'a journeyId must be resolvable from the rendered chat page').toBeTruthy();
    expect(feature.sessionId, 'a sessionId must be resolvable from the redirect URL').toBeTruthy();

    await driveDiscoveryTurnToCompletion(
      page.request,
      feature.sessionId,
      'Please run a full discovery for this feature. Context marker: ' + distinctiveDetail
    );

    // Task 2's endpoint: evict this exact sessionId from the in-memory
    // _sessionStore ONLY — simulates "server restarted, memory is gone"
    // without touching Redis/Postgres and without a disruptive real restart.
    const evictRes = await page.request.post('/test/evict-skill-session', {
      data: { sessionId: feature.sessionId },
      headers: Object.assign({ 'Content-Type': 'application/json' }, testEndpointBypassHeaders())
    });
    expect(evictRes.status(), '/test/evict-skill-session should succeed').toBe(200);
    const evictBody = await evictRes.json();
    expect(evictBody.evicted, 'the named sessionId must actually have been present and deleted from _sessionStore').toBe(true);

    // Confirm eviction genuinely took effect: the OLD, broken route this story
    // fixes (routes/features.js used to point "Resume conversation" here) must
    // now 404 with "Session not found" for this sessionId — proving the
    // in-memory session is truly gone, not just that the endpoint reported success.
    const oldRouteRes = await page.request.get('/skills/discovery/sessions/' + feature.sessionId + '/chat');
    const oldRouteBody = await oldRouteRes.text();
    expect(oldRouteBody, 'the old raw chat route must 404 once the session is evicted from memory').toContain('Session not found');

    // AC2 (the literal originally-reported bug, fixed): follow the UPDATED
    // "Resume conversation" link target (/journey/:journeyId/stage/:stageName,
    // dsh-s3's route) — must render the real, durably-persisted conversation,
    // never "Session not found".
    await page.goto('/journey/' + encodeURIComponent(feature.journeyId) + '/stage/discovery');

    const pageBody = await page.content();
    expect(pageBody, 'AC2: the resume destination must never show "Session not found" once evicted').not.toContain('Session not found');

    const chatMessages = page.locator('#chat-messages');
    await expect(chatMessages, 'chat panel must be visible, sourced from the durable session_turns read (dsh-s2), not the (now-evicted) in-memory session').toBeVisible();
    await expect(chatMessages, 'the real turn content (the distinctive detail this test sent) must render, proving this is the real conversation, not a blank/placeholder view').toContainText(distinctiveDetail);

    const artefactPanel = page.locator('#artefact-panel');
    await expect(artefactPanel, 'artefact panel must also render alongside the chat panel').toBeVisible();
    await expect(artefactPanel).toContainText('Discovery: Mock Fixture Feature');
  });

  test('AC3 (no regression): Resume conversation still renders correctly when the session is STILL resident in memory', async ({ page }) => {
    test.setTimeout(90000);
    await createOwnProduct(page.request, uniqueLabel('dsh-s4-ac3'));

    const distinctiveDetail = 'DSH-S4-AC3-Detail-' + uniqueLabel('detail');
    const feature = await createFormedIdeaFeature(page.request, 'DSH-S4 E2E AC3 Feature ' + uniqueLabel('feat'));
    expect(feature.journeyId).toBeTruthy();
    expect(feature.sessionId).toBeTruthy();

    await driveDiscoveryTurnToCompletion(
      page.request,
      feature.sessionId,
      'Please run a full discovery for this feature. Context marker: ' + distinctiveDetail
    );

    // Deliberately NO eviction call here — the session remains resident in
    // this process's in-memory _sessionStore, matching the "recently
    // completed, same server process" case AC3 exists to protect.
    await page.goto('/journey/' + encodeURIComponent(feature.journeyId) + '/stage/discovery');

    const pageBody = await page.content();
    expect(pageBody).not.toContain('Session not found');

    const chatMessages = page.locator('#chat-messages');
    await expect(chatMessages).toBeVisible();
    await expect(chatMessages).toContainText(distinctiveDetail);

    const artefactPanel = page.locator('#artefact-panel');
    await expect(artefactPanel).toBeVisible();
    await expect(artefactPanel).toContainText('Discovery: Mock Fixture Feature');
  });

});
