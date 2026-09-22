'use strict';
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('ep3-s1: Request Regression form renders on the confirm-back interstitial (AC1); submitting resets the journey stage and downstream stages become unreachable via reopen (AC2)', async ({ page }) => {
  test.setTimeout(30000);

  const featureSlug = 'ep3-s1-e2e-' + Date.now();
  const reasonText = 'Architecture constraint needs revision before DoR. ep3-s1 E2E ' + Date.now() + '.';

  const seedRes = await page.request.post('/test/seed-approval-journey', {
    data: {
      featureSlug: featureSlug,
      stage: 'test-plan',
      completedStages: [
        { skillName: 'discovery' },
        { skillName: 'benefit-metric' },
        { skillName: 'definition' },
        { skillName: 'review' }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), 'POST /test/seed-approval-journey').toBe(200);
  const seeded = await seedRes.json();
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();

  // AC1: navigate to the confirm-back interstitial for an earlier, completed stage
  await page.goto('/journey/' + seeded.journeyId + '/stage/definition/confirm-back');

  const reasonField = page.locator('#cb-regress-reason');
  const submitBtn = page.locator('#cb-regress-submit');
  await expect(reasonField).toBeVisible();
  await expect(submitBtn).toBeVisible();

  await reasonField.fill(reasonText);
  await submitBtn.click();

  // The form submit is intercepted by an inline <script> (fetch()-based JSON
  // POST) that redirects to /journey/:journeyId on success. That handler
  // (handleGetJourneyById) itself always 303-redirects onward -- to
  // /journey/:featureSlug/resume, which in turn always 303-redirects to a
  // fresh /skills/:stage/sessions/:sid/chat session (traced directly through
  // both handlers before writing this assertion: neither one ever renders
  // /journey/:journeyId itself). Wait for that FINAL landing page, scoped to
  // the regression's OWN target stage ("definition") -- this both proves the
  // redirect chain fires end-to-end AND proves the user lands in a session
  // for the correct (regressed-to) stage, not a stale one.
  await page.waitForURL('**/skills/definition/sessions/**', { timeout: 10000 });

  // AC2: after the redirect/response, the journey's real state reflects the reset.
  // GET /api/journey/:journeyId (handleGetJourneyState) returns
  // { stage, stages: [{stage, status, navigable}, ...], ... } -- stage is the
  // CURRENT active stage; stages is the completedStages+active breadcrumb
  // (verified directly against handleGetJourneyState/_computeBreadcrumb
  // before writing this assertion -- there is no separate "/state" suffix
  // route and no raw completedStages array in the response).
  const stateRes = await page.request.get('/api/journey/' + seeded.journeyId);
  expect(stateRes.status(), 'GET /api/journey/:journeyId').toBe(200);
  const journeyState = await stateRes.json();
  expect(journeyState.stage, 'active stage reset to the regression target').toBe('definition');
  const breadcrumbStages = (journeyState.stages || []).map(function(s) { return s.stage; });
  expect(breadcrumbStages, 'review is no longer in the breadcrumb as a completed stage').not.toContain('review');
  expect(breadcrumbStages, 'discovery and benefit-metric remain in the breadcrumb').toContain('discovery');
  expect(breadcrumbStages, 'discovery and benefit-metric remain in the breadcrumb').toContain('benefit-metric');
  const definitionEntry = (journeyState.stages || []).find(function(s) { return s.stage === 'definition'; });
  expect(definitionEntry && definitionEntry.status, 'definition is the new active stage, not a completed one').toBe('active');

  // AC2 (downstream reachability): handleGetJourneyStageReopen's own guard
  // (`var stageEntry = (journey.completedStages||[]).find(...); if (!stageEntry) return 404`,
  // verified directly against the real handler before writing this
  // assertion) means reopening the now-invalidated "review" stage 404s.
  const reopenRes = await page.request.get('/journey/' + seeded.journeyId + '/stage/review/reopen');
  expect(reopenRes.status(), 'review is no longer completed, so its reopen link 404s').toBe(404);
});
