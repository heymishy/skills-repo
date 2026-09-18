// tests/e2e/ep2-s3-approval.spec.js — story ep2-s3
// artefacts/new-feature-2b74a292/stories/ep2-s3.md
// Plan: artefacts/new-feature-2b74a292/plans/ep2-s3-plan.md ("Task 5: E2E and NFR tests")
//
// --- Fixture investigation (read before touching this file) ---
//
// ep2-s1/ep2-s2 established a real product -> repo-seed -> pod -> feature
// creation flow for their own E2E fixtures. This story's Sign Off button
// lives on a DIFFERENT surface -- the skill-session CHAT page
// (/skills/:skillName/sessions/:sessionId/chat), gated by the real condition
// `if (session.done && session.journeyId)` (routes/skills.js, confirmed by
// reading _renderChatPage directly) -- not the /features/:featureSlug page
// those two stories extended. Driving a real chat turn to completion (so
// session.done becomes true for real) would mean routing through the mock
// LLM gateway's fixture family, which is unnecessarily slow/fragile for
// what this story needs to prove.
//
// Investigation found /test/seed-board-journey (server.js, added for s1.1's
// kanban board-advance story) as the established, precedented mechanism for
// exactly this: it creates a REAL journey via journey-store.js and a REAL
// HTML session linked to it with a controllable `done` state, bypassing the
// slow real chat-turn flow. However, empirically running
// tests/e2e/s1.1-board-advance-action.spec.js directly (to confirm the
// pattern actually works end-to-end for a real gate-confirm, not just for
// page rendering) surfaced a PRE-EXISTING BUG unrelated to this story: that
// spec's own AC1 ("advance moves the card to its next stage column") FAILS,
// because /test/seed-board-journey always defaults `productId` to the
// truthy string 'e2e-board-product', and handlePostGateConfirm's acdg-s1
// guard (routes/journey.js) hard-blocks with a 502 whenever
// ownerRepoForFeature throws AND journey.productId is truthy -- which it
// always does in this environment, since DATABASE_URL is unset for the
// Playwright webServer (playwright.config.js) and export-data-source.js's DB
// pool is therefore never wired. See decisions.md (2026-09-18) for the full
// note; NOT fixed here, as it is a separate, substantial, unrelated concern
// (board-advance/acdg-s1), out of scope for ep2-s3.
//
// To get a REAL journey (real completedStages, real getNextStage-driven
// advance) without tripping that pre-existing bug, this spec uses a new,
// narrowly-scoped test-only endpoint, /test/seed-approval-journey
// (server.js, ep2-s3), modelled closely on /test/seed-board-journey but
// deliberately OMITTING productId -- journey-store's createJourney() never
// sets productId by default, so acdg-s1's resolution-failure branch takes
// its "genuinely no product link" silent-skip path instead of the hard
// block, and gate-confirm completes for real, exactly as it does in
// production for a journey with no product link. ownerId is set to the
// test session's own login so requireJourneyAccess grants access outright.
//
// AC1: the Sign Off button and modal (reason field, Approve button) are
//      visible once a stage session is done.
// AC2: entering a reason and clicking Approve results in the feature
//      actually advancing to the next stage -- asserted via real state (the
//      existing, production GET /api/journey/:journeyId endpoint's
//      `completedStages` field, ADR-024's governed shape, the same
//      real-state pattern b1-formed-idea-outer-loop-story-map.spec.js's own
//      gate-confirm assertions already use), not just a redirect/URL check.
// AC3: after approval, artefacts/<featureSlug>/decisions.md contains a new
//      entry with the real field format (title/Date/Context/Decision/
//      Rationale) including the exact reason text entered. The approval
//      endpoint's own 200 response body already returns `written` (the
//      absolute decisions.md path on the SERVER's filesystem) -- since the
//      Playwright webServer subprocess and this test process share the same
//      filesystem (no container boundary in this local/CI setup) and
//      getRepoRoot() resolves to the server process's cwd (this worktree
//      root, confirmed by reading adapters/repo-root.js -- no
//      WUCE_TENANT_ROOT_BASE/CLAUDE_REPO_PATH/COPILOT_REPO_PATH set in
//      playwright.config.js's webServer.env), this spec reads the file
//      directly via Node `fs` rather than adding a second test-only read
//      endpoint (the ep1-s3 /test/pod-inheritance-state/:sessionId
//      precedent was for a case with no such filesystem access at all --
//      not needed here).
//
// NFR-A11y (keyboard-accessible modal): the modal's own showModal() already
// focuses the reason field on open (approval-modal.js), so this spec types
// the reason directly, Tabs to the Approve button (the next focusable
// element in DOM order -- the error <div> is not focusable), and presses
// Enter to activate it (a real <button> responds to Enter by default -- no
// extra work needed). This IS the same interaction AC2 needs, so it rides
// on that one flow rather than needing a separate keyboard-only pass --
// same economy ep2-s2's own NFR-A11y check uses.

'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueSlug(label) {
  return 'ep2-s3-' + label + '-' + Date.now();
}

// Repo root as the Playwright webServer subprocess resolves it
// (adapters/repo-root.js's getRepoRoot() falls through to path.resolve('.'),
// i.e. the server process's cwd -- which is this worktree root, since
// playwright.config.js's webServer.command is run from the directory
// containing the config file).
const REPO_ROOT = path.resolve(__dirname, '..', '..');

withAuth('ep2-s3: Sign Off button/modal visible once the stage session is done (AC1); approving via reason + keyboard advances the stage through the real gate-confirm mechanism (AC2, NFR-A11y); a real decisions.md entry with the exact reason is written (AC3)', async ({ page }) => {
  // Generous budget: journey seed + page render + modal interaction + the
  // real gate-confirm round trip (disk write, completeStage, next-stage
  // session creation, redirect).
  test.setTimeout(60000);

  const featureSlug = uniqueSlug('feature');
  const reasonText = 'Reviewed the discovery artefact against the benefit-metric brief -- approved for advance. ep2-s3 E2E ' + Date.now() + '.';

  // --- Setup: seed a REAL journey + REAL done session via the ep2-s3 ---
  // --- test-only endpoint (see file-header investigation notes above) ---
  const seedRes = await page.request.post('/test/seed-approval-journey', {
    data: { featureSlug: featureSlug, stage: 'discovery' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), 'POST /test/seed-approval-journey').toBe(200);
  const seeded = await seedRes.json();
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();
  expect(seeded.sessionId, 'expected a real sessionId').toBeTruthy();

  // --- AC1: navigate to the real skill-session chat page; the Sign Off ---
  // --- button and modal (reason field, Approve button) render because ---
  // --- session.done && session.journeyId is true ---
  await page.goto('/skills/discovery/sessions/' + seeded.sessionId + '/chat');

  const signOffBtn = page.locator('#sign-off-btn');
  await expect(signOffBtn).toBeVisible();
  await expect(signOffBtn).toHaveAttribute('data-journey-id', seeded.journeyId);

  const modal = page.locator('#sign-off-modal');
  await expect(modal).toBeHidden();

  await signOffBtn.click();
  await expect(modal).toBeVisible();

  const reasonInput = page.locator('#sign-off-reason');
  const approveBtn = page.locator('#sign-off-approve-btn');
  await expect(reasonInput).toBeVisible();
  await expect(approveBtn).toBeVisible();

  // approval-modal.js's showModal() focuses the reason field automatically
  // on open -- confirms the keyboard entry point is real, not assumed.
  await expect(reasonInput).toBeFocused();

  // --- AC2 + NFR-A11y: type the reason, Tab to the Approve button (the ---
  // --- next focusable element -- #sign-off-error is a <div>, not ---
  // --- focusable), and press Enter to activate it (real <button>, no ---
  // --- extra keyboard wiring needed) ---
  await reasonInput.fill(reasonText);
  await page.keyboard.press('Tab');
  await expect(approveBtn).toBeFocused();
  await page.keyboard.press('Enter');

  // The modal hides on a successful approval POST, then chains into the
  // existing, unmodified gate-confirm form -- a real full-page navigation
  // (form.submit()) to the next stage's session, per journey-store.js's
  // real STAGE_SEQUENCE (discovery -> benefit-metric).
  await page.waitForURL(/\/skills\/benefit-metric\/sessions\/[^/]+\/chat/, { timeout: 20000 });

  // --- AC2 (real-state assertion): the production GET /api/journey/:id ---
  // --- endpoint's completedStages now includes the approved stage -- not ---
  // --- just the redirect/URL above, which (per acdg-s1's own non-fatal ---
  // --- try/catch elsewhere in this file) is not on its own sufficient ---
  // --- proof that completeStage() actually ran ---
  const journeyStateRes = await page.request.get('/api/journey/' + encodeURIComponent(seeded.journeyId));
  expect(journeyStateRes.status()).toBe(200);
  const journeyState = await journeyStateRes.json();
  expect(Array.isArray(journeyState.completedStages), 'ADR-024: completedStages must be an array').toBe(true);
  const completedStageNames = journeyState.completedStages.map(function (s) { return typeof s === 'string' ? s : s.skillName; });
  expect(completedStageNames, 'discovery must be recorded as a completed stage after a real gate-confirm advance').toContain('discovery');
  expect(journeyState.activeSkill, 'the journey should now be active on benefit-metric').toBe('benefit-metric');

  // --- AC3: a real decisions.md entry was written, with the real field ---
  // --- format and the exact reason text entered ---
  const decisionsPath = path.join(REPO_ROOT, 'artefacts', featureSlug, 'decisions.md');
  await expect.poll(() => fs.existsSync(decisionsPath), {
    message: 'decisions.md should exist after a successful approval',
    timeout: 5000
  }).toBe(true);

  const decisionsContent = fs.readFileSync(decisionsPath, 'utf8');
  expect(decisionsContent).toContain('## discovery approved by e2e-tester');
  expect(decisionsContent).toContain('**Date:** ' + new Date().toISOString().slice(0, 10));
  expect(decisionsContent).toContain('**Context:** Approval recorded via Sign Off at the discovery stage of feature ' + featureSlug + '.');
  expect(decisionsContent).toContain('**Decision:** discovery approved and advancing to benefit-metric.');
  expect(decisionsContent).toContain('**Rationale:** ' + reasonText);
});
