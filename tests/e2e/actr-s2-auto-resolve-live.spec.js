'use strict';
// tests/e2e/actr-s2-auto-resolve-live.spec.js -- story actr-s2
//
// Closes the live-browser-render-check gate for actr-s2 with genuine
// automated coverage, replacing the RISK-ACCEPT this story's
// /verify-completion run originally logged (decisions.md, now superseded --
// see the 2026-10-29 entry there). The operator's own instruction: "All
// work should be testable. And covered in test plan rather than manual
// driven" -- this spec, plus check-actr-s2-auto-resolve-single-ac.js's unit
// coverage of _resolveAutoCaptureTarget itself, is that coverage.
//
// Root cause of why this wasn't automatable before: the original Task 3
// design read test-plan.md/spec-file content via the GitHub Contents API
// (fetchArtefact/fetchRepoPath), which needs a real OAuth-authenticated
// token -- impossible to obtain from an automated test without materialising
// a real credential. The fix (src/web-ui/routes/playback-evidence.js,
// _resolveAutoCaptureTarget) switched that one read to the same local-clone
// pattern (getRepoRoot + fs) this file already uses elsewhere for committed
// screenshots/videos -- fully deterministic, no network, no token. This
// spec exercises that corrected path against the REAL running server
// process, not a mock.
//
// Fixture: /test/seed-actr-s2-journey (server.js, NODE_ENV=test only) seeds
// a real journey via journey-store.js and writes a real test-plan.md onto
// this checkout's own disk (getRepoRoot(req) resolves to the server
// process's cwd -- confirmed via adapters/repo-root.js, same resolution
// ep2-s3-approval.spec.js's own header comment documents). That test-plan.md
// names tests/e2e/actr-s2-capture-target-fixture.spec.js (a real, separate,
// always-passing spec in this same directory) as AC1's E2E coverage --
// deriveCaptureTargetFromSpec (src/utils/capture-target-derivation.js)
// parses that real file's own `(actr-s2 AC1)` tag + page.goto('/dashboard')
// + page.locator('body') into {url: '/dashboard', selector: 'body'}, which
// is the exact value this spec asserts the UI renders.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueSlug(label) {
  return 'actr-s2-e2e-' + label + '-' + Date.now();
}

withAuth('AC1/AC4/AC5: the auto-detected target is read-only and shown with no manual form, derived from a real test-plan.md + spec file on disk', async ({ page, request }) => {
  const featureSlug = uniqueSlug('happy');
  const seedRes = await request.post('/test/seed-actr-s2-journey', {
    data: { featureSlug, acId: 'AC1', acDescription: 'Shows the auto-detected capture target' }
  });
  expect(seedRes.ok()).toBeTruthy();
  const { productId } = await seedRes.json();

  await page.goto(`/products/${productId}/playback-evidence/${featureSlug}`);

  const acBlock = page.locator('text=AC1').first();
  await expect(acBlock).toBeVisible();
  await expect(page.locator('body')).toContainText('Auto-detected from');
  await expect(page.locator('body')).toContainText('/dashboard');
  await expect(page.locator('body')).toContainText('body');
  await expect(page.locator('form input[name="url"]')).toHaveCount(0);
  await expect(page.locator('text=Capture evidence').first()).toBeVisible();
});

withAuth('AC4/AC5: an AC whose story test-plan has no E2E Tests section falls back to the unchanged manual form, never a page error', async ({ page, request }) => {
  const featureSlug = uniqueSlug('no-coverage');
  const seedRes = await request.post('/test/seed-actr-s2-journey', {
    data: { featureSlug, acId: 'AC1', acDescription: 'Shows the auto-detected capture target', noE2eSection: true }
  });
  expect(seedRes.ok()).toBeTruthy();
  const { productId } = await seedRes.json();

  const res = await page.goto(`/products/${productId}/playback-evidence/${featureSlug}`);
  expect(res.status()).toBe(200);
  await expect(page.locator('body')).not.toContainText('Error');
  await expect(page.locator('body')).not.toContainText('Auto-detected from');
  await expect(page.locator('form input[name="url"]')).toHaveCount(1);
});
