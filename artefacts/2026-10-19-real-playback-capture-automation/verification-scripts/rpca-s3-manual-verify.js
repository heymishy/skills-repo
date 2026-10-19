'use strict';
// rpca-s3-manual-verify.js -- AC1 manual verification aid for rpca-s3.
// Not part of the production touch points (scripts/playback-capture.js is
// unchanged by this file) -- a one-off script the operator runs directly to
// prove captureVideoForClip produces a real .webm against real wuce-staging,
// same shared secret/session this epic already retrieved for rpca-s1.
//
// Usage (from repo root, after setting the secret):
//   $env:E2E_STAGING_AUTH_STUB_SECRET = "<the real secret>"
//   node artefacts/2026-10-19-real-playback-capture-automation/verification-scripts/rpca-s3-manual-verify.js <feature-slug>
//
// Example:
//   node artefacts/2026-10-19-real-playback-capture-automation/verification-scripts/rpca-s3-manual-verify.js 2026-10-11-journey-cx-redesign

const { chromium } = require('playwright');
const { authenticateStagingSession, captureVideoForClip } = require('../../../scripts/playback-capture');
// Same one-line wiring src/web-ui/server.js performs at its own bootstrap
// (D37 adapter, CLAUDE.md's Injectable adapter rule) -- this standalone
// script never runs that bootstrap, so it must wire it itself.
const { setGenerateCaptionsAndTranscript, realGenerateCaptionsAndTranscript } = require('../../../src/web-ui/adapters/caption-transcript');
setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript);

const STAGING_BASE_URL = 'https://wuce-staging.fly.dev';
const CAPTURE_SECRET_ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';

async function main() {
  const secret = process.env[CAPTURE_SECRET_ENV_VAR];
  if (!secret) {
    throw new Error(`Missing required environment variable: ${CAPTURE_SECRET_ENV_VAR}. Set it to the staging auth-stub secret first.`);
  }
  const featureSlug = process.argv[2];
  if (!featureSlug) {
    throw new Error('Missing required argument: feature-slug. Usage: node rpca-s3-manual-verify.js <feature-slug>');
  }

  console.log(`[rpca-s3-manual-verify] authenticating against ${STAGING_BASE_URL} ...`);
  const sessionId = await authenticateStagingSession(STAGING_BASE_URL, secret);
  console.log('[rpca-s3-manual-verify] authenticated.');

  const browser = await chromium.launch();
  try {
    const clip = {
      name: 'rpca-s3-proof',
      interactionSequenceText: 'Navigate to the playback page and wait 2 seconds (proof clip for rpca-s3 AC1).',
      run: async (page) => {
        await page.context().addCookies([{ name: 'session_id', value: sessionId, url: STAGING_BASE_URL }]);
        await page.goto(`${STAGING_BASE_URL}/playback/${featureSlug}`);
        await page.waitForTimeout(2000);
      },
    };
    console.log('[rpca-s3-manual-verify] recording a real clip against', `${STAGING_BASE_URL}/playback/${featureSlug}`, '...');
    const result = await captureVideoForClip({ browser, featureSlug, storySlug: 'rpca-s3-proof', clip });
    console.log('[rpca-s3-manual-verify] SUCCESS');
    console.log('  video path:     ', result.path);
    console.log('  caption path:   ', result.captionPath);
    console.log('  transcript path:', result.transcriptPath);
    console.log('  reviewed:       ', result.reviewed);
  } finally {
    await browser.close();
  }
}

main().then(
  () => process.exit(0),
  (err) => { console.error(`[rpca-s3-manual-verify] FAILED: ${err.message}`); process.exit(1); }
);
