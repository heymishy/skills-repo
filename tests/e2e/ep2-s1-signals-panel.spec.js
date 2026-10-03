// ep2-s1-signals-panel.spec.js -- E2E coverage for ep2-s1's Accessibility NFR
// (keyboard Tab-order across signal CTAs), classified CSS-layout-dependent
// by analogy to ep1-s3's own precedent (jsdom cannot reproduce real
// sequential Tab-order focus movement) -- see test-plan Step 3a note.
// NOT in npm test chain (ADR-018) -- run with:
// npx playwright test tests/e2e/ep2-s1-signals-panel.spec.js
//
// --- Fixture investigation (read before touching this file) ---
//
// This spec originally drove GET /signals against the real, unbounded
// getSignals() aggregation. Confirmed independently: this repo's own real
// workspace history produces 5,293 real signals as of this story, and
// GET /signals has no pagination (an explicit, reviewed, DoR'd MVP scope
// decision to render the full list -- the pagination gap is real and is
// being tracked as a separate follow-up story, not fixed here). A full
// Tab-order walk across 5,293 real CTA buttons cannot complete within any
// reasonable E2E timeout -- this is a genuine production finding, not a
// flaky test.
//
// The repo's own established pattern for injecting bounded/fixture data
// into Playwright's E2E webServer process (a SEPARATE OS process from this
// test file, so the in-process setSignalsSource() seam used by
// tests/check-ep2-s1-signals-panel.js cannot reach it directly) is a
// test-only `/test/seed-*` POST endpoint in server.js, gated by
// NODE_ENV==='test' -- see /test/seed-board-journey, /test/seed-presence,
// /test/seed-durable-stage, etc. This spec follows that precedent via a new
// /test/seed-signals endpoint, which calls the real setSignalsSource() seam
// from inside the server process. This was preferred over (a) pointing the
// shared webServer at a separate CLAUDE_REPO_PATH fixture directory, which
// would require editing playwright.config.js's single shared `webServer`
// block used by every other E2E spec, and (b) truncating the test's own
// assertions to "first N of however-many-are-live", which would silently
// weaken real coverage. Seeding a small, deterministic fixture instead lets
// this spec assert the full, real Tab-order behaviour (every rendered CTA
// reachable) exactly as originally intended, just at a bounded scale. This
// used to be the only E2E spec exercising GET /signals, so the process-
// lifetime override below was believed safe -- that stopped being true once
// ep2-s3's own tests/e2e/ep2-s3-signals-pagination.spec.js was added, which
// also exercises GET /signals and was affected by exactly this leak; see
// that spec's own file-header comment and the new /test/reset-signals-source
// endpoint, which fixes it.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

const FIXTURE_SIGNAL_COUNT = 24;

withAuth('NFR-Accessibility: every signal CTA has a non-empty accessible name and is Tab-reachable', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-signals', { data: { count: FIXTURE_SIGNAL_COUNT } });
  expect(seedRes.ok()).toBeTruthy();

  await page.goto('/signals');
  await page.waitForLoadState('networkidle');

  const ctaButtons = page.locator('.signal-item .sw-btn--primary');
  const count = await ctaButtons.count();
  expect(count).toBe(FIXTURE_SIGNAL_COUNT); // bounded fixture, not live 5,293-signal data -- see file-header note

  for (let i = 0; i < count; i++) {
    const name = await ctaButtons.nth(i).evaluate((el) => el.textContent.trim());
    expect(name.length).toBeGreaterThan(0);
  }

  await page.locator('body').evaluate((el) => el.focus());
  let seen = 0;
  for (let i = 0; i < 100 && seen < count; i++) {
    await page.keyboard.press('Tab');
    const inCta = await page.evaluate(() => {
      const active = document.activeElement;
      return !!(active && active.closest('.signal-item'));
    });
    if (inCta) seen++;
  }
  expect(seen).toBe(count); // Tab order reaches every rendered CTA button
});
