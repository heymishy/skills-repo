'use strict';

// .github/scripts/ppc-capture-worker.js -- ppc-s9 Task 4. Runs inside the
// ppc-capture-worker.yml GitHub Actions workflow_dispatch job. Exchanges a
// single-use nonce (minted by Task 1's capture-nonce-store.js, delivered as
// this workflow's own `nonce` input) for the tenant's real sessionId via
// capture-worker-auth.js's POST /internal/capture/exchange (Task 2), then
// drives a Playwright-authenticated browser session the same way
// _captureOneAc/_captureVideoForAcIds (src/web-ui/routes/playback-evidence.js)
// already do today -- just triggered from a GitHub Actions runner instead of
// in-process, and from an exchanged sessionId instead of the live
// req.sessionId. Reuses src/utils/capture-screenshots.js and
// src/utils/capture-video.js UNCHANGED.
//
// This runs on a normal Ubuntu GitHub-hosted runner (not the production
// Alpine image), so this requires 'playwright' (full), not 'playwright-core'
// -- the executablePath/chromiumSandbox/--disable-dev-shm-usage concerns
// session-page-adapter.js's own realGetAuthenticatedPage comment documents
// (ppc-s8) are production-image (Alpine) specific and do not apply here.
// 'playwright' resolves here because @playwright/test (an existing
// devDependency) carries it as its own transitive dependency, and this
// workflow's own `npm ci` step is a full install (no --omit=dev) -- no new
// package.json dependency is needed for this to work.
//
// This script must NEVER reference the tenant's GitHub access credential
// (the field playback-evidence.js reads as req.session.<the credential>)
// -- it authenticates purely via the exchanged sessionId cookie (ADR-018:
// "capture mechanism reuses the tenant's own live session", no new
// token-minting, no service credential). The companion structural unit
// test (tests/check-ppc-s9-capture-worker-script.js) enforces this by
// scanning this file's own source text for the forbidden credential-field
// name -- deliberately not spelled out literally anywhere in this file,
// including in this comment, so that check stays meaningful.
//
// chromiumModule and fetchImpl are injectable third/fourth parameters on
// runCaptureWorker, the same convention session-page-adapter.js's own
// realGetAuthenticatedPage(sessionId, baseUrl, chromiumModule) used -- so
// the unit test chain can verify this script's real orchestration logic
// without ever launching a real browser or making a real HTTP call
// (ADR-018: the unit test chain (npm test) must not invoke Playwright).
// The top-level require('playwright') + env-var reading + real output-file
// writes only happen when this file is run directly
// (`node .github/scripts/ppc-capture-worker.js`), guarded by
// `require.main === module` below -- never when required as a module by
// the test.

const fs = require('fs');
const path = require('path');

const { captureAcScreenshots } = require('../../src/utils/capture-screenshots');
const { captureVideoRecording } = require('../../src/utils/capture-video');

// Same artefact-path storySlug convention _captureOneAc/_captureVideoForAcIds
// already use today (playback-evidence.js) -- not something this task
// changes; capture-screenshots.js/capture-video.js build their own output
// paths from this value.
const STORY_SLUG = 'ppc-s1';

/**
 * Exchanges `nonce` for the tenant's real sessionId via
 * capture-worker-auth.js's own POST /internal/capture/exchange. Throws on
 * any non-200 response -- the caller (runCaptureWorker) must never attempt
 * a browser launch after a failed exchange.
 * @param {string} baseUrl
 * @param {string} nonce
 * @param {Function} [fetchImpl] - defaults to the global fetch
 * @returns {Promise<string>} the real sessionId
 */
async function exchangeNonceForSessionId(baseUrl, nonce, fetchImpl) {
  const doFetch = fetchImpl || fetch;
  const response = await doFetch(baseUrl + '/internal/capture/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-capture-exchange-secret': process.env.CAPTURE_EXCHANGE_SECRET
    },
    body: JSON.stringify({ nonce: nonce })
  });
  if (!response.ok) {
    let text = '';
    try { text = await response.text(); } catch (_) { /* best-effort diagnostic only */ }
    throw new Error('capture exchange failed with status ' + response.status + ': ' + text);
  }
  const data = await response.json();
  if (!data || !data.sessionId) {
    throw new Error('capture exchange response missing sessionId');
  }
  return data.sessionId;
}

/**
 * Builds the session_id cookie descriptor seeded into the browser context --
 * same shape _captureVideoForAcIds already builds today (domain from
 * baseUrl's hostname, secure iff the base URL is actually https).
 * @param {string} sessionId
 * @param {URL} parsedBaseUrl
 * @returns {object}
 */
function _sessionCookie(sessionId, parsedBaseUrl) {
  return {
    name: 'session_id',
    value: sessionId,
    domain: parsedBaseUrl.hostname,
    path: '/',
    httpOnly: true,
    secure: parsedBaseUrl.protocol === 'https:',
    sameSite: 'Lax'
  };
}

/**
 * Core orchestration, independently callable with an injected chromium
 * module (mirrors realGetAuthenticatedPage's own injectable-third-parameter
 * convention) and an injected fetch implementation -- exported for the unit
 * test chain, never launches a real browser or makes a real HTTP call when
 * fakes are supplied for both.
 *
 * For each entry in `options.targets`, navigates to its url and captures a
 * screenshot via the EXISTING, UNCHANGED captureAcScreenshots (one shared
 * context, sequential navigation). Then records ONE combined video
 * spanning every target in `options.targets`, in a single Playwright
 * recording context, via the EXISTING, UNCHANGED captureVideoRecording --
 * exactly as _captureOneAc/_captureVideoForAcIds already do today.
 *
 * @param {{nonce:string, baseUrl:string, featureSlug:string, acIds:string[], targets:Array<{acId:string,url:string,selector:string}>, correlationId:string, outputDir?:string}} options
 * @param {object} [chromiumModule] - defaults to require('playwright').chromium
 * @param {Function} [fetchImpl] - defaults to the global fetch
 * @returns {Promise<{screenshots:Array, video:(object|null)}>}
 */
async function runCaptureWorker(options, chromiumModule, fetchImpl) {
  const sessionId = await exchangeNonceForSessionId(options.baseUrl, options.nonce, fetchImpl);

  const chromium = chromiumModule || require('playwright').chromium;
  const browser = await chromium.launch();
  const parsedBaseUrl = new URL(options.baseUrl);

  let screenshots = [];
  try {
    const screenshotContext = await browser.newContext();
    await screenshotContext.addCookies([_sessionCookie(sessionId, parsedBaseUrl)]);
    const page = await screenshotContext.newPage();

    for (let i = 0; i < options.targets.length; i++) {
      const target = options.targets[i];
      await page.goto(target.url);
      const shots = await captureAcScreenshots({
        page: page,
        featureSlug: options.featureSlug,
        storySlug: STORY_SLUG,
        acList: [{ acId: target.acId, selector: target.selector }]
      });
      screenshots.push(shots[0]);
    }

    const videoResults = await captureVideoRecording({
      browser: browser,
      featureSlug: options.featureSlug,
      storySlug: STORY_SLUG,
      clips: [{
        name: options.acIds.join('+'),
        run: async function(videoPage) {
          await videoPage.context().addCookies([_sessionCookie(sessionId, parsedBaseUrl)]);
          for (let i = 0; i < options.targets.length; i++) {
            await videoPage.goto(options.targets[i].url);
          }
        }
      }]
    });
    const video = videoResults[0] || null;

    if (options.outputDir) {
      // Copy the REAL bytes captureAcScreenshots/captureVideoRecording wrote
      // (to their own artefacts/<featureSlug>/playback/... paths, unchanged)
      // into outputDir -- the upload-artifact step only uploads outputDir, so
      // without this copy the uploaded artifact would contain nothing but a
      // path manifest, never the actual screenshot/video bytes Task 6's own
      // downloadCaptureArtifact needs to extract (AC3).
      fs.mkdirSync(options.outputDir, { recursive: true });

      const copiedScreenshots = screenshots.map(function(shot) {
        const destName = shot.acId + '.png';
        fs.copyFileSync(shot.path, path.join(options.outputDir, destName));
        return { acId: shot.acId, path: destName };
      });

      let copiedVideo = null;
      if (video && video.path) {
        const destName = 'video.webm';
        fs.copyFileSync(video.path, path.join(options.outputDir, destName));
        copiedVideo = { name: video.name, path: destName };
      }

      fs.writeFileSync(
        path.join(options.outputDir, 'result.json'),
        JSON.stringify({ correlationId: options.correlationId, screenshots: copiedScreenshots, video: copiedVideo }, null, 2)
      );
    }

    return { screenshots: screenshots, video: video };
  } finally {
    await browser.close();
  }
}

/**
 * Real production entrypoint -- reads this workflow's own
 * workflow_dispatch inputs from env vars (GitHub Actions inputs are always
 * strings; the JSON-shaped ones are parsed here), then writes the result
 * manifest into a local output directory for the workflow's own
 * actions/upload-artifact step to pick up. Only runs when this file is
 * invoked directly.
 * @returns {Promise<void>}
 */
async function main() {
  const acIds = JSON.parse(process.env.CAPTURE_AC_IDS);
  const targets = JSON.parse(process.env.CAPTURE_TARGETS_JSON);
  const outputDir = path.join(process.cwd(), 'capture-worker-output');

  await runCaptureWorker({
    nonce: process.env.CAPTURE_NONCE,
    baseUrl: process.env.CAPTURE_BASE_URL,
    featureSlug: process.env.CAPTURE_FEATURE_SLUG,
    acIds: acIds,
    targets: targets,
    correlationId: process.env.CAPTURE_CORRELATION_ID,
    outputDir: outputDir
  });

  console.log('capture-worker: done, output written to ' + outputDir);
}

if (require.main === module) {
  main().catch(function(err) {
    console.error('capture-worker: failed:', err);
    process.exitCode = 1;
  });
}

module.exports = {
  runCaptureWorker,
  exchangeNonceForSessionId,
  main
};
