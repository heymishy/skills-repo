'use strict';
// fpd-s2-video-capture.spec.js -- E2E for Feature Playback video capture (fpd-s2)
// Real end-to-end: a real DoD-validated feature, real Playwright recordVideo,
// real .webm file on disk. RISK-ACCEPTed for execution in this sandbox --
// no reachable Postgres (decisions.md D5), same gap as fpd-s1 this cycle.
const fs = require('fs');
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('real recording produces a .webm file on disk', async ({ page, context }) => {
  const { captureVideoRecording } = require('../../scripts/playback-capture');
  const results = await captureVideoRecording({
    browser: context.browser(),
    featureSlug: 'fpd-s2-e2e-check',
    clips: [{ name: 'walkthrough', run: async (p) => { await p.goto('/'); } }],
  });
  expect(fs.existsSync(results[0].path)).toBe(true);
});
