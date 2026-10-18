'use strict';
// fpd-s4-caption-sync.spec.js -- E2E for caption sync during real video
// playback (fpd-s4 AC3). jsdom cannot play media or render caption tracks
// over time -- this needs a real browser engine. RISK-ACCEPTed for
// execution in this sandbox -- no reachable Postgres (decisions.md D5),
// same gap as every other story this cycle.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('captions display, synced, when enabled via native player controls', async ({ page }) => {
  await page.goto('/playback/some-dod-complete-feature-with-a-real-package');
  const video = page.locator('.playback-ac__video').first();
  await expect(video).toBeVisible();
  const track = video.locator('track[kind="captions"]');
  await expect(track).toHaveCount(1);
  await video.evaluate((el) => { el.textTracks[0].mode = 'showing'; });
  await video.evaluate((el) => el.play());
  await page.waitForTimeout(1000);
  const activeCues = await video.evaluate((el) => el.textTracks[0].activeCues.length);
  expect(activeCues).toBeGreaterThan(0);
});
