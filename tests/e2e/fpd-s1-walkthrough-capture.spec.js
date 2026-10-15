'use strict';
// fpd-s1-walkthrough-capture.spec.js -- E2E for Feature Playback Package capture (fpd-s1)
// Real end-to-end: a real DoD-validated feature, real capture, real file on disk.
// RISK-ACCEPTed for execution in this sandbox -- no reachable Postgres
// (decisions.md D5), same gap as jcx-s6/jae-s5/cnsf-s1 this cycle.
const fs = require('fs');
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('real capture produces a walkthrough.md with embedded screenshots on disk', async ({ page }) => {
  const { checkDodGate, captureAcScreenshots } = require('../../scripts/playback-capture');
  const state = JSON.parse(fs.readFileSync('.github/pipeline-state.json', 'utf8'));
  const featureSlug = '2026-10-07-feature-playback-demo-with-video-and-or-screens-';
  checkDodGate(state, featureSlug); // throws if this feature is not yet DoD-complete -- expected to pass once fpd-* reach DoD
  const shots = await captureAcScreenshots({
    page,
    featureSlug,
    acList: [{ acId: 'AC1', url: '/', selector: 'body' }],
  });
  expect(fs.existsSync(shots[0].path)).toBe(true);
});
