// ep1-s4-stage-selector.spec.js — story ep1-s4
// artefacts/new-feature-af17f555/stories/ep1-s4.md
// artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md
//
// Local (NODE_ENV=test) spec — does NOT target staging. Uses the pre-existing
// /test/seed-durable-stage endpoint (server.js) to create a journey with
// completed stages directly (journeyStore.createJourney + completeStage),
// avoiding a full mock-gateway chat turn. tenantId is explicitly set to
// 'e2e-tester' to match withAuth's default session tenant — /journey's own
// tenant filter would otherwise silently exclude the seeded journey.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function seedStage(request, featureSlug, stageName) {
  const res = await request.post('/test/seed-durable-stage', {
    data: { featureSlug, stageName, tenantId: 'e2e-tester' }
  });
  return res.json();
}

// The shared e2e-tester tenant also holds journeys left by other specs and runs,
// so every locator is scoped to the journey this scenario seeded, through the
// journeyId the seed endpoint returns (esh-s1).
function navDots(page, journeyId, label) {
  const byLabel = label ? '[aria-label="' + label + '"]' : '';
  return page.locator('a[data-stage-nav]' + byLabel + '[href*="/journey/' + journeyId + '/"]');
}

// ── Scenario 1: stage selector visible, backward navigation with confirm ──

withAuth('Scenario 1: stage selector visible and backward navigation with confirm', async ({ page }) => {
  const featureSlug = 'ep1s4-e2e-scenario1-' + Date.now();
  const seeded = await seedStage(page.request, featureSlug, 'discovery');

  await page.goto('/journey');
  const navDot = navDots(page, seeded.journeyId, 'Move back to Discovery').first();
  await expect(navDot).toBeVisible();

  await navDot.click();
  await expect(page).toHaveURL(/\/journey\/[^/]+\/stage\/discovery\/confirm-back$/);
  await expect(page.locator('h1')).toContainText('Move back to Discovery?');
  await expect(page.locator('text=/prior artefacts and any revisions/i')).toBeVisible();

  // ep3-s1 relabeled this link "Just view (no reset)" (its underlying
  // reopen URL/behavior is unchanged -- verified directly against
  // handleGetStageConfirmBack before updating this selector) and added a
  // separate "Request Regression" form alongside it.
  await page.click('text=Just view (no reset)');
  // reopen redirects into a chat session
  await expect(page).toHaveURL(/\/skills\/[^/]+\/sessions\/[^/]+\/chat/);
});

// ── Scenario 2: forward navigation disabled for stages not yet reached ────

withAuth('Scenario 2: forward navigation is disabled for stages not yet reached', async ({ page }) => {
  const featureSlug = 'ep1s4-e2e-scenario2-' + Date.now();
  const seeded = await seedStage(page.request, featureSlug, 'discovery');

  await page.goto('/journey');
  // The seeded journey's own Discovery dot is there, so the zero count below is
  // about this journey and not an empty match caused by a wrong scope.
  await expect(navDots(page, seeded.journeyId, 'Move back to Discovery')).toHaveCount(1);
  // benefit-metric is later than discovery and was never completed for this
  // fixture — must render as a plain, non-clickable span, not a link.
  const laterStageLink = navDots(page, seeded.journeyId, 'Move back to Benefits');
  await expect(laterStageLink).toHaveCount(0);
});

// ── Scenario 3: stage selector is keyboard-accessible ──────────────────────

withAuth('Scenario 3: stage selector is keyboard-accessible', async ({ page }) => {
  // Note: /test/seed-durable-stage always creates a fresh journey per call,
  // with no way to add a second completed stage to an existing one -- so
  // this fixture cannot cleanly produce one card with 2+ nav dots to arrow
  // between. This test verifies the piece it CAN verify with the existing
  // seeding infrastructure: the nav dot is a real, tab-focusable <a> element
  // (native Tab/Enter semantics), and the arrow-key handler doesn't throw or
  // move focus off the page when there's only one dot in the group (the
  // no-op boundary case the handler's own bounds check exists for).
  const featureSlug = 'ep1s4-e2e-scenario3-' + Date.now();
  const seeded = await seedStage(page.request, featureSlug, 'discovery');

  await page.goto('/journey');
  const navDot = navDots(page, seeded.journeyId).first();
  await navDot.focus();
  await expect(navDot).toBeFocused();

  await page.keyboard.press('ArrowRight');
  // Single-dot group: focus must stay on the same element (bounds check, no throw).
  await expect(navDot).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/journey\/[^/]+\/stage\/discovery\/confirm-back$/);
});
