'use strict';
// tests/e2e/actr-s2-capture-target-fixture.spec.js -- story actr-s2
//
// Two jobs, deliberately combined:
// (1) A real, minimal, always-passing E2E check (actr-s2 AC1's own trivial
//     render smoke test) -- not load-bearing for this story's actual ACs by
//     itself, just enough to make this a genuine, runnable spec rather than
//     inert text sitting under tests/e2e/.
// (2) The REAL on-disk spec file that check-actr-s2-e2e-auto-resolve.spec.js
//     (below) points a seeded test-plan.md's "**File:**" line at, so
//     _resolveAutoCaptureTarget (src/web-ui/routes/playback-evidence.js) has
//     a genuine file to read and src/utils/capture-target-derivation.js's
//     deriveCaptureTargetFromSpec has genuine AC-tagged text to parse --
//     the exact chain the actr-s2 feature exists to automate. Target
//     (/dashboard + body) is deliberately the most stable page+selector in
//     the app, so this fixture can never flake for reasons unrelated to
//     what it's actually proving.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('the dashboard renders for an authenticated session (actr-s2 AC1)', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('body')).toBeVisible();
});
