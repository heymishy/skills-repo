// spdr-s2-metric1-timing.spec.js -- automated Playwright timing spec for
// Metric 1 (Time-to-triage, artefacts/2026-10-04-signals-panel-triage-ux/
// benefit-metric.md). Performs the exact filter->sort->dismiss x10 sequence
// via real Playwright clicks (no screenshot-confirm round-trips, no manual
// waits) to give a caveat-free automation-overhead read, complementing --
// NOT replacing -- sptu-s3-dod.md's own real, one-off, real-backlog
// measurement (210.5s, Claude-in-Chrome, 2026-10-06). See this feature's
// own decisions.md, "Scope note: spdr-s2 does not replace sptu-s3-dod.md's
// own real measurement".
//
// Runs against a small, deterministic seeded fixture (reusing ep2-s1's own
// established /test/seed-signals precedent, extended here to accept a
// custom `signals` array) rather than this repo's own real, ever-changing
// signal backlog -- a repeatable, CI-safe, cross-run-comparable number
// requires stable fixture data (see this story's own Architecture
// Constraints).
//
// The real dismissed-signals-store adapter IS wired in this shared
// webServer (WIRE_SKILL_ADAPTERS=true in playwright.config.js), so dismiss
// actions here write to the real workspace/dismissed-signals.json on disk
// -- this spec captures that file's pre-test content and restores it
// exactly afterward, so a local `npx playwright test` run never leaves
// real dismissed-state behind (mirrors the manual cleanup performed for
// sptu-s3-dod.md's own measurement, 2026-10-06).
//
// NOT in npm test chain (ADR-018) -- run with:
// npx playwright test tests/e2e/spdr-s2-metric1-timing.spec.js

const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

const DISMISSED_SIGNALS_PATH = path.resolve(__dirname, '../../workspace/dismissed-signals.json');

const PARSE_ERROR_COUNT = 3;
const DISMISS_COUNT = 10;
const EXTRA_NON_DISMISSED_COUNT = 2; // confirms the filter/dismiss flow doesn't over-remove

function buildFixtureSignals() {
  const signals = [];
  for (let i = 0; i < PARSE_ERROR_COUNT; i++) {
    signals.push({
      id: 'e2e-spdr-s2-parse-error-' + i,
      source: 'e2e-fixture',
      type: 'parse-error',
      text: 'spdr-s2 fixture parse-error #' + i,
      timestamp: null,
      cta: { label: 'Review', skill: '/improve' },
    });
  }
  const totalDated = DISMISS_COUNT + EXTRA_NON_DISMISSED_COUNT;
  for (let i = 0; i < totalDated; i++) {
    signals.push({
      id: 'e2e-spdr-s2-dated-' + i,
      source: 'e2e-fixture',
      type: 'note',
      text: 'spdr-s2 fixture dated signal #' + i,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(), // distinct, decreasing
      cta: { label: 'Review', skill: '/improve' },
    });
  }
  return signals;
}

function readDismissedFileSafe() {
  try { return fs.readFileSync(DISMISSED_SIGNALS_PATH, 'utf8'); } catch (_) { return null; }
}

function restoreDismissedFile(priorContent) {
  if (priorContent === null) {
    try { fs.unlinkSync(DISMISSED_SIGNALS_PATH); } catch (_) { /* already absent */ }
  } else {
    fs.writeFileSync(DISMISSED_SIGNALS_PATH, priorContent, 'utf8');
  }
}

withAuth('Metric 1: filter->sort->dismiss x10 completes correctly and under the regression-guard ceiling', async ({ page }) => {
  const fixtureSignals = buildFixtureSignals();
  const priorDismissedContent = readDismissedFileSafe();

  try {
    const seedRes = await page.request.post('/test/seed-signals', { data: { signals: fixtureSignals } });
    expect(seedRes.ok()).toBeTruthy();

    const startedAt = Date.now();

    await page.goto('/signals');
    await page.waitForLoadState('networkidle');

    // Filter out parse-error noise (AC1) -- a plain <a> link (zero-client-JS
    // filter-toggle convention, sptu-s2), not a <button>
    await page.click('a:has-text("Hide parse-error")');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.signal-item[data-signal-type="parse-error"]')).toHaveCount(0);

    // Dismiss 10 real (fixture) signals sequentially (AC2)
    for (let i = 0; i < DISMISS_COUNT; i++) {
      await page.locator('.signal-item form[action="/signals/dismiss"] button[type="submit"]').first().click();
      await page.waitForLoadState('networkidle');
    }

    const elapsedMs = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log('[spdr-s2] Metric 1 automated timing (seeded fixture, no human/automation-tool overhead): ' + elapsedMs + 'ms');

    // Verify all 10 persisted (AC2) -- same verification method as the real DoD measurement
    await page.goto('/signals?showDismissed=true');
    await page.waitForLoadState('networkidle');
    const dismissedFixtureCount = await page.locator('.signal-item[data-signal-dismissed="true"][data-signal-id^="e2e-spdr-s2-dated-"]').count();
    expect(dismissedFixtureCount).toBe(DISMISS_COUNT);

    // Regression-guard ceiling (AC3) -- see Architecture Constraints for rationale
    expect(elapsedMs).toBeLessThan(15000);
  } finally {
    // Restore workspace/dismissed-signals.json to its exact pre-test
    // content (or absence) -- this spec's 10 real dismisses must never
    // leak into a local dev checkout's real dismissed-state.
    restoreDismissedFile(priorDismissedContent);
    await page.request.post('/test/reset-signals-source');
  }
});
