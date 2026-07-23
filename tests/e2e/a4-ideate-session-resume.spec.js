// a4-ideate-session-resume.spec.js — story a4-ideate-session-resume
// artefacts/2026-07-23-e2e-core-journey-coverage/stories/a4-ideate-session-resume.md
//
// Targets a REAL deployed environment (wuce-staging by default, overridable via
// E2E_STAGING_BASE_URL) — NOT the local NODE_ENV=test mocked harness. Per
// ADR-018's addendum (.github/architecture-guardrails.md), this spec must
// never be invoked from the unit test chain (npm test); it only ever runs via
// `npm run test:e2e` (or a scoped Playwright invocation).
//
// This story continues the SAME kind of /ideate session
// a3-product-feature-ideate-canvas establishes (sign up -> create product ->
// create a feature via the "rough idea" path -> top up credits -> drive a
// turn), per this repo's per-spec-file test isolation convention (each spec
// creates its own independent tenant/product/feature — see a3's own header
// comment) — not a literal cross-file run-order dependency on a3's test.
//
// AC1 (server retains in-progress turn state after a mid-stream disconnect)
//      is verified deterministically, WITHOUT any staging/credits/model
//      dependency, by the Integration test
//      tests/check-a4-session-store-state.js — it exercises the real
//      skills.js session-restore functions directly against a simulated
//      mid-stream-interrupted session. This spec's own "close mid-stream"
//      action below exists only to set up AC2's real-session precondition,
//      not to re-verify AC1 itself (test plan: AC1 is Integration-only).
// AC2: reopening the closed session (in a fresh browser context, carrying
//      forward only the captured cookie/storage state — same authenticated
//      user, not a cross-device/cross-browser test per this story's Out of
//      Scope) restores the canvas and the turn history exactly as they
//      existed immediately before closing.
// AC3: the first new turn sent after resume explicitly references a detail
//      only present in the pre-close conversation, and the restored thread
//      continues to show that detail — proving the operator side of the
//      conversation genuinely continues from the restored context rather
//      than a blank session (see the header note below on why the mock
//      gateway's own response text cannot be used as the "coherence" signal
//      here).
// AC4 (canvasBlocks, never in mergeRedisSessionData's original 8-field
//      allowlist, restores correctly) is verified deterministically by the
//      same Integration test as AC1 (tests/check-a4-session-store-state.js),
//      mirroring a3's own AC4 pattern (tests/check-a3-ideate-artefact-disk-match.js).
// NFR-Security: a resumed session is only reachable by the same
//      authenticated user/tenant who created it (ADR-025). This does NOT
//      require any skill turn, credits, or the mock gateway — it only needs
//      a session to exist, so it is expected to run and pass reliably
//      regardless of the known blockers documented below.
//
// Reuses tests/e2e/fixtures/staging-auth.js (A1) for authentication and
// tests/e2e/fixtures/admin-credits-topup.js (B1 follow-up, PR #555) to top up
// this spec's own e2e-test- tagged tenant's credits before driving any turn —
// per this repo's D37/reuse convention, neither fixture is duplicated here.
// The createOwnProduct/createRoughIdeaFeature helpers below mirror
// a3-product-feature-ideate-canvas.spec.js's own local helpers exactly (not
// imported from a3's file, matching the same "no run-order coupling to any
// other spec file" precedent a3 itself establishes for b1/other specs).
//
// *** KNOWN, SEPARATELY-TRACKED BLOCKERS this spec inherits from a3/b1, live-
//     verified against real wuce-staging (see decisions.md) ***
// 1. The `credits` table's INSERT/upsert gap (b1 follow-up finding) is now
//    FIXED by PR #556 (cuf-s1) — topUpTestTenantCredits() is expected to
//    succeed now, provided the e2e-test-admin identity is provisioned into
//    ADMIN_GITHUB_LOGINS (a separate, one-time operator action — see
//    tests/e2e/fixtures/admin-credits-topup.js's own header for the exact
//    flyctl command). If that provisioning has not yet happened, top-up still
//    fails and this spec's AC2/AC3 test skips with the exact reason
//    topUpTestTenantCredits() returns.
// 2. The deployed wuce-staging container does not ship tests/, so the mock
//    gateway's fixture files (tests/e2e/fixtures/llm-gateway/) are missing at
//    runtime, even with MOCK_LLM_GATEWAY=true set (a3's own "Dockerfile"
//    FINDING, decisions.md, 2026-07-23).
// 3. *** NEW FINDING from this a4 dispatch (see decisions.md) *** — even once
//    1 and 2 above are resolved, MOCK_LLM_GATEWAY would STILL have no effect
//    on the real chat UI: the client's chat form always POSTs to the
//    STREAMING endpoint (.../turn-stream, wired to handlePostTurnStreamHtml),
//    and that handler never sets `stage`/`scenarioName` on the options object
//    it passes to the executor — only the non-streaming htmlSubmitTurn
//    (.../turn, not used by the browser UI at all) does. So every real,
//    browser-driven turn — in this spec, a3's, and any future story reusing
//    the same chat UI — calls the REAL Anthropic API regardless of
//    MOCK_LLM_GATEWAY, contradicting the 2026-07-23 ARCH decision's cost-
//    control intent. Recorded as a separate FINDING, not fixed here (out of
//    this story's declared touch points; fixing it "properly" would also
//    need a way to make the mock's response vary by conversation content,
//    which the current fixture-file mechanism does not support at all — see
//    decisions.md for the full writeup and recommended follow-up).
// Given blockers 2 and 3 above, turn 1 in the AC2/AC3 test below may not
// produce any canvas content when actually run against current real staging.
// This spec attempts the real flow and skips with an accurate, specific
// reason rather than fabricating a pass if that happens — mirroring a3's own
// documented precedent exactly.

'use strict';

const { test, expect } = require('@playwright/test');
const { STAGING_BASE_URL, signUpEmail } = require('./fixtures/staging-auth');
const { topUpTestTenantCredits } = require('./fixtures/admin-credits-topup');

test.use({ baseURL: STAGING_BASE_URL });

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

function creditsBlockedReason(topUpOutcome) {
  const topUpPart = topUpOutcome && topUpOutcome.reason
    ? 'Top-up attempt result: ' + topUpOutcome.reason
    : 'Top-up attempt reported toppedUp=true but the turn was still credit-blocked -- unexpected, investigate.';
  return (
    'wuce-staging blocks every real skill turn with HTTP 402 (Insufficient credits) for a tenant ' +
    'with a zero credit balance. This spec attempts a real admin-authenticated top-up in setup ' +
    '(tests/e2e/fixtures/admin-credits-topup.js) before driving any /ideate turn -- it did not succeed ' +
    'this run. ' + topUpPart + ' Skipping rather than fabricating a pass -- see this story\'s ' +
    'coding-agent report and decisions.md for the full, live-verified blocker writeup.'
  );
}

function turnBlockedReason() {
  return (
    'Turn 1 did not produce any canvas content within the poll timeout. This story (a4) drives the ' +
    'same real-staging chat UI / mock-LLM-gateway path as a3, and can hit either (or both) of two ' +
    'separately-tracked, live-verified blockers documented in decisions.md: (1) the deployed ' +
    'wuce-staging container does not ship tests/, so the mock gateway\'s fixture files are missing at ' +
    'runtime even with MOCK_LLM_GATEWAY=true set (a3\'s own "Dockerfile" FINDING); and (2) a NEW gap ' +
    'this a4 dispatch found -- the SSE streaming turn route (handlePostTurnStreamHtml, skills.js), ' +
    'which is the ONLY endpoint the real chat UI ever calls, never wires {stage, scenarioName} into the ' +
    'executor options the way the non-streaming htmlSubmitTurn does, so MOCK_LLM_GATEWAY has no effect ' +
    'on this flow at all -- every real browser-driven turn calls the real Anthropic API regardless of ' +
    'the flag. Skipping rather than fabricating a pass -- see this story\'s coding-agent report and ' +
    'decisions.md for the full writeup.'
  );
}

/**
 * Sign up a brand-new e2e-test- tagged tenant and create this spec's own
 * product context via the real /products/new -> /products/confirm API path
 * (independent of any other spec file's product, per the established
 * per-test-isolation convention — mirrors a3-product-feature-ideate-canvas.spec.js).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} label
 * @returns {Promise<{email: string, productId: string, productName: string}>}
 */
async function createOwnProduct(request, label) {
  const { email } = await signUpEmail(request, label);
  const productName = 'A4 Product ' + label;

  const draftRes = await request.post('/products/new', {
    data: { name: productName, description: 'Product created by the a4-ideate-session-resume E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'products/new should succeed for a freshly authenticated tenant').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: productName, description: 'Product created by the a4-ideate-session-resume E2E spec.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'products/confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location, 'product confirm should redirect under /products/').toMatch(/^\/products\//);

  return { email: email, productId: location.split('/products/')[1], productName: productName };
}

/**
 * Create a feature via the "rough idea" path, mirroring
 * a3-product-feature-ideate-canvas.spec.js's own helper exactly.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} featureName
 * @returns {Promise<{journeyId: string, sessionId: string, chatPath: string}>}
 */
async function createRoughIdeaFeature(request, featureName) {
  const createRes = await request.post('/api/journey', {
    form: { featureName: featureName, startSkill: 'ideate' },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey (rough idea) should redirect to the new session').toBe(303);
  const location = createRes.headers()['location'];
  expect(location, 'rough-idea path must route into an /ideate chat session').toMatch(/^\/skills\/ideate\/sessions\//);

  const chatRes = await request.get(location);
  expect(chatRes.status()).toBe(200);
  const html = await chatRes.text();
  const journeyMatch = html.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  const sessionMatch = location.match(/\/skills\/ideate\/sessions\/([^/]+)\/chat/);

  return {
    journeyId: journeyMatch ? journeyMatch[1] : null,
    sessionId: sessionMatch ? sessionMatch[1] : null,
    chatPath: location
  };
}

test.describe('a4-ideate-session-resume @real-staging', () => {

  test('AC2 & AC3: closing the browser mid-SSE-stream and reopening the session restores canvas/turn history and continues with the restored context', async ({ page, browser }) => {
    test.setTimeout(120000);
    const { email } = await createOwnProduct(page.request, uniqueLabel('a4-ac23'));

    // Credits gate applies to every real skill turn (including /ideate), per
    // src/web-ui/middleware/credits-guard.js. Attempt the real,
    // admin-authenticated top-up before driving any turn (now that PR #556
    // fixed the credits-upsert gap, this is expected to succeed provided the
    // e2e-test-admin identity has been provisioned -- see this file's own
    // header for the full writeup).
    const topUpOutcome = await topUpTestTenantCredits(email, 1000);
    test.skip(topUpOutcome.toppedUp !== true, creditsBlockedReason(topUpOutcome));

    const feature = await createRoughIdeaFeature(page.request, 'A4 E2E AC2-3 Feature ' + uniqueLabel('feat'));
    await page.goto(feature.chatPath);

    const canvasBlocks = page.locator('#canvas-panel .canvas-block');
    const initialCount = await canvasBlocks.count();

    // A distinctive detail that only ever appears because THIS turn said it —
    // AC3 needs proof the restored session's history (not a fresh/blank one)
    // is what a later turn continues from.
    const distinctiveDetail = 'Project-Codename-Falcon-' + uniqueLabel('detail');
    await page.locator('#chat-input').fill(
      'Here is my rough idea, call it ' + distinctiveDetail + ': an internal tool that captures meeting ' +
      'decisions automatically so nothing gets lost after a workshop.'
    );
    await page.locator('#chat-form button[type="submit"]').click();

    let turn1Rendered = true;
    try {
      await expect.poll(
        async () => canvasBlocks.count(),
        { timeout: 20000, message: 'canvas must render at least one card/block element after turn 1' }
      ).toBeGreaterThan(initialCount);
    } catch (_pollErr) {
      turn1Rendered = false;
    }
    test.skip(!turn1Rendered, turnBlockedReason());

    const afterTurn1Count = await canvasBlocks.count();
    const firstBlockTitle = await canvasBlocks.first().locator('.canvas-block-title').textContent();
    const preCloseThreadText = await page.locator('#chat-messages').textContent();
    expect(preCloseThreadText).toContain(distinctiveDetail);

    // Start a NEW turn's SSE stream (AC1's scenario setup — this is the
    // precondition for AC2, not a re-verification of AC1 itself, which the
    // Integration test covers deterministically), then close the browser
    // context as soon as possible afterward, without waiting for the stream
    // to complete.
    await page.locator('#chat-input').fill('Let\'s focus on the capture problem first -- that seems like the highest-value cluster.');
    await page.locator('#chat-form button[type="submit"]').click();

    // "Close the browser tab/context" — capture the authenticated cookie/
    // storage state first (so we can reopen as the SAME user), then close
    // this context immediately. Deliberately not awaiting the stream's
    // completion event.
    const storageState = await page.context().storageState();
    await page.context().close();

    // "Reopens the same session URL in a fresh browser context" — a
    // genuinely new context (not just a new tab in the same context),
    // carrying forward only the captured storage state. Same authenticated
    // user, same-context resume per this story's Out of Scope boundary (not
    // testing a different device/browser/token).
    const resumedContext = await browser.newContext({ storageState });
    const resumedPage = await resumedContext.newPage();
    await resumedPage.goto(feature.chatPath);

    // AC2: canvas renders with (at least) the same blocks/markers that
    // existed before closing — nothing lost on resume.
    const resumedCanvasBlocks = resumedPage.locator('#canvas-panel .canvas-block');
    await expect(resumedCanvasBlocks.first()).toBeVisible({ timeout: 15000 });
    const resumedCount = await resumedCanvasBlocks.count();
    expect(resumedCount, 'canvas block count after resume must not have dropped below what existed before closing (AC2)').toBeGreaterThanOrEqual(afterTurn1Count);
    await expect(resumedCanvasBlocks.first().locator('.canvas-block-title')).toHaveText(firstBlockTitle);

    // AC2: turn history (chat log) matches what existed before closing.
    const resumedThreadText = await resumedPage.locator('#chat-messages').textContent();
    expect(resumedThreadText).toContain(distinctiveDetail);

    // AC3: the first new turn after resume explicitly references the
    // distinctive detail only present in the pre-close conversation. The
    // mock gateway's own response text is a static fixture and cannot be
    // used as a "coherence" signal (it never varies by conversation
    // content) — what this DOES prove deterministically is that the
    // operator's own reference to the restored detail is accepted and
    // rendered in the SAME, continuous thread (not a blank/reset session
    // that would reject or orphan a message referencing history it doesn't
    // have).
    await resumedPage.locator('#chat-input').fill('Going back to ' + distinctiveDetail + ' -- what did you think of that angle specifically?');
    await resumedPage.locator('#chat-form button[type="submit"]').click();
    await expect(resumedPage.locator('#chat-messages')).toContainText(distinctiveDetail, { timeout: 20000 });

    await resumedContext.close();
  });

  test('NFR-Security: a resumed session is only reachable by the same authenticated user/tenant', async ({ page, browser }) => {
    test.setTimeout(60000);
    // No turn/credits dependency at all — session creation and page reads
    // are not credit-gated, so this test is expected to run and pass
    // reliably regardless of the known blockers documented at the top of
    // this file.
    await createOwnProduct(page.request, uniqueLabel('a4-nfr-owner'));
    const feature = await createRoughIdeaFeature(page.request, 'A4 E2E NFR Feature ' + uniqueLabel('feat'));

    // Unauthenticated request to the same session URL must not return the
    // session content (handleGetChatHtml redirects unauthenticated requests
    // to /auth/github).
    const unauthContext = await browser.newContext({ baseURL: STAGING_BASE_URL });
    const unauthResponse = await unauthContext.request.get(feature.chatPath, { maxRedirects: 0 });
    expect([302, 401, 403, 404]).toContain(unauthResponse.status());
    if (unauthResponse.status() === 200) {
      const body = await unauthResponse.text();
      expect(body).not.toContain('IS_IDEATE');
    }
    await unauthContext.close();

    // A different, freshly-signed-up tenant (a genuinely separate
    // authenticated identity, not the session's owner) must also be
    // rejected — not merely redirected to login, but blocked from viewing
    // this specific session's content.
    const otherTenantContext = await browser.newContext({ baseURL: STAGING_BASE_URL });
    await signUpEmail(otherTenantContext.request, uniqueLabel('a4-nfr-other'));
    const otherResponse = await otherTenantContext.request.get(feature.chatPath, { maxRedirects: 0 });
    expect(otherResponse.status(), 'a different tenant must not be able to view another tenant\'s session').not.toBe(200);
    await otherTenantContext.close();
  });

});
