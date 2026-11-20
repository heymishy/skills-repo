'use strict';
// fpd-s4-caption-sync.spec.js -- E2E for caption sync during real video
// playback (fpd-s4 AC3). jsdom cannot play media or render caption tracks
// over time -- this needs a real browser engine. RISK-ACCEPTed for
// execution in this sandbox -- no reachable Postgres (decisions.md D5),
// same gap as every other story this cycle.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('captions display, synced, when enabled via native player controls', async ({ page }) => {
  // fpsr-s1: a real feature whose story jcx-s3 has a committed .webm with a .vtt beside it,
  // so the playback page renders a <video> with a captions <track>. The earlier placeholder
  // slug matched no feature, so the page was a 404 and no video was ever rendered.
  await page.goto('/playback/2026-10-11-journey-cx-redesign');
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
