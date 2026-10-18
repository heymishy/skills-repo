'use strict';
// scripts/playback-capture.js
// Reads a DoD-validated feature's own DoD artefact(s) and benefit-metric.md,
// generates artefacts/[feature-slug]/playback/walkthrough.md, and drives
// Playwright screenshot capture at each AC's stable UI state.
// Reuses Playwright as a plain function argument (ADR-018, ADR-026) -- not a
// D37 adapter: `page` is ordinary dependency injection, not a hidden
// module-level default.

const fs = require('fs');
const { generateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
// fpd-s3 hotfix: moved to src/utils/dod-parsing.js -- a production route
// handler also needs these, and scripts/ is never copied into the
// deployed Docker image (see that module's own header comment for the
// full incident). Re-exported here unchanged so every existing caller of
// this module keeps working with no change required on their part.
const { parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets } = require('../src/utils/dod-parsing');

function checkDodGate(state, featureSlug) {
  const feature = (state.features || []).find(f => f.slug === featureSlug);
  if (!feature) {
    throw new Error(`Feature not found: ${featureSlug}`);
  }
  if (feature.dodStatus !== 'complete') {
    throw new Error(
      `Feature playback refused: dodStatus for "${featureSlug}" is "${feature.dodStatus}", not "complete". Run /definition-of-done first.`
    );
  }
  return { ok: true, feature };
}

function generateWalkthroughMarkdown({ featureSlug, storyDods, benefitMetricContent }) {
  const lines = [`# Playback Walkthrough: ${featureSlug}`, ''];
  for (const story of storyDods) {
    const acRows = parseDodAcCoverage(story.content);
    for (const ac of acRows) {
      lines.push(`## ${ac.acId} — ${ac.description}`, '');
      lines.push(ac.evidence, '');
    }
  }
  lines.push('## Metric Signal', '');
  const targets = parseBenefitMetricTargets(benefitMetricContent);
  for (const story of storyDods) {
    const metricRows = parseDodMetricSignal(story.content);
    for (const m of metricRows) {
      const metricName = m.metric.replace(/^M\d+\s*—\s*/, '');
      const target = targets[metricName] ? ` | Target: ${targets[metricName]}` : '';
      lines.push(`- **${m.metric}**: ${m.signal} — ${m.evidence} (measured ${m.dateMeasured})${target}`);
    }
  }
  return lines.join('\n');
}

async function captureAcScreenshots({ page, featureSlug, storySlug, acList }) {
  const shots = [];
  for (const ac of acList) {
    const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${ac.acId}.png`;
    await page.screenshot({ path: relPath, selector: ac.selector });
    shots.push({ acId: ac.acId, path: relPath });
  }
  return shots;
}

function embedScreenshotPaths(markdown, shots) {
  const path = require('path');
  let doc = markdown;
  for (const shot of shots) {
    const fileName = path.basename(shot.path);
    const sectionRe = new RegExp(`(## ${shot.acId}[^\\n]*\\n)`);
    doc = doc.replace(sectionRe, `$1\n![${shot.acId}](screenshots/${fileName})\n`);
  }
  return doc;
}

function getPackageStatus(statusPath, readFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  return JSON.parse(read(statusPath));
}

function markPackageReviewed(statusPath, readFileFn, writeFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  const write = writeFileFn || ((p, c) => fs.writeFileSync(p, c, 'utf8'));
  const current = JSON.parse(read(statusPath));
  current.status = 'complete';
  current.reviewedAt = new Date().toISOString();
  // fpd-s2: also confirm every video's own captions/transcript -- the
  // single review gate now covers accessibility artefacts, not just
  // screenshots (AC5).
  if (Array.isArray(current.videos)) {
    current.videos = current.videos.map(v => Object.assign({}, v, { reviewed: true }));
  }
  write(statusPath, JSON.stringify(current, null, 2));
}

// fpd-s2: the real completeness gate -- a package is NOT complete while any
// video's own captions/transcript are still unreviewed, even if the
// top-level status field claims "complete" (AC5).
function isPackageComplete(statusObj) {
  if (statusObj.status !== 'complete') return false;
  if (Array.isArray(statusObj.videos) && statusObj.videos.some(v => !v.reviewed)) return false;
  return true;
}

// fpd-s2: Playwright recordVideo capture. One browser context per clip --
// the engineer's own choice of single combined walkthrough vs. several
// per-AC/per-flow clips (AC2) is just the length of `clips`, no branching
// logic difference.
async function captureVideoRecording({ browser, featureSlug, storySlug, clips }) {
  const dir = `artefacts/${featureSlug}/playback/${storySlug}/video/`;
  const results = [];
  for (const clip of clips) {
    const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
    const page = await context.newPage();
    if (clip.run) await clip.run(page);
    await context.close();
    const video = page.video ? page.video() : null;
    const resultPath = video ? await video.path() : null;
    results.push({ name: clip.name, path: resultPath });
  }
  return results;
}

// fpd-s2: generates captions + a standalone transcript for one video via the
// D37 adapter, writes both to disk, and marks them unreviewed until the
// engineer explicitly confirms (AC3) -- automated generation never sets
// reviewed: true itself.
// fpd-s4 hotfix lesson: captionTranscriptPaths itself now lives in
// src/utils/playback-paths.js, not here -- scripts/ is never deployed, and
// fpd-s4's own production route needs this same convention too.
const { captionTranscriptPaths } = require('../src/utils/playback-paths');

async function generateCaptionsForVideo(videoPath, interactionSequenceText, writeFileFn) {
  const write = writeFileFn || ((p, c) => fs.writeFileSync(p, c, 'utf8'));
  const { captionPath, transcriptPath } = captionTranscriptPaths(videoPath);
  const result = await generateCaptionsAndTranscript(videoPath, interactionSequenceText);
  write(captionPath, result.captions);
  write(transcriptPath, result.transcript);
  return { captionPath, transcriptPath, reviewed: false };
}

// rpca-s1: authenticates against a real deployed wuce-staging instance by calling
// its own existing GET /test/session route (src/web-ui/server.js,
// _isTestEndpointAllowed's staging-secret branch) -- confirmed at /clarify that
// tests/e2e/fixtures/auth.js already calls this exact route for every local E2E
// test. No new route, no widened blast radius (ADR-026).
const http = require('http');
const https = require('https');

function authenticateStagingSession(baseUrl, secret) {
  return new Promise((resolve, reject) => {
    const url = new URL('/test/session', baseUrl);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, {
      method: 'GET',
      headers: { 'x-e2e-test-endpoint-bypass': secret },
    }, (res) => {
      const setCookie = res.headers['set-cookie'];
      if (!setCookie || setCookie.length === 0) {
        reject(new Error('Authentication failed: no Set-Cookie header in /test/session response'));
        return;
      }
      const match = setCookie[0].match(/session_id=([^;]+)/);
      if (!match) {
        reject(new Error('Authentication failed: session_id not found in Set-Cookie header'));
        return;
      }
      res.resume();
      resolve(match[1]);
    });
    req.on('error', reject);
    req.end();
  });
}

// rpca-s1: path-construction helper matching captureAcScreenshots' own existing
// convention exactly (artefacts/<feature>/playback/<story>/screenshots/<acId>.png).
// A standalone function, not a refactor of captureAcScreenshots itself -- the new
// CLI entrypoint needs this same shape at a new call site.
// rpca-s1-hotfix1: featureSlug comes directly from the CLI's own argv -- unlike
// captureAcScreenshots' own existing callers (which only ever pass a known,
// already-validated AC list), this is untrusted-shaped input. Guards the
// resolved path stays within the repo root, same pattern as
// src/web-ui/routes/playback.js's own existing path-traversal guard
// (web-ui-patterns.md).
function buildScreenshotPath(featureSlug, storySlug, acId) {
  const path = require('path');
  const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${acId}.png`;
  const repoRoot = path.resolve(__dirname, '..');
  const resolvedPath = path.resolve(repoRoot, relPath);
  if (!resolvedPath.startsWith(repoRoot + path.sep)) {
    throw new Error(`Refusing to build a screenshot path outside the repo root -- check the feature-slug argument: "${featureSlug}"`);
  }
  return relPath;
}

// rpca-s1: real CLI entrypoint. argv[2] is the feature slug. Validates the
// required secret env var synchronously, before any async work, so a missing
// secret fails immediately and loudly -- not a confusing auth error surfaced
// later from the staging server itself.
const CAPTURE_SECRET_ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';
const STAGING_BASE_URL = 'https://wuce-staging.fly.dev';

function runCli(argv) {
  const secret = process.env[CAPTURE_SECRET_ENV_VAR];
  if (!secret) {
    throw new Error(
      `Missing required environment variable: ${CAPTURE_SECRET_ENV_VAR}. ` +
      `Set it to the staging auth-stub secret before running this CLI.`
    );
  }
  const featureSlug = argv[2];
  if (!featureSlug) {
    throw new Error('Missing required argument: feature-slug. Usage: node scripts/playback-capture.js <feature-slug>');
  }
  return runCaptureForFeature(featureSlug, secret);
}

// rpca-s1: the real end-to-end capture flow -- authenticates, launches a real
// Playwright browser with the session cookie, navigates to one hand-picked AC's
// own URL (hardcoded for this story; rpca-s2 generalises this), and saves a
// real screenshot. This function's own real-world behaviour is RISK-ACCEPTed
// for automated execution (decisions.md, 2026-10-19) -- it needs a real secret
// and real network access this test suite does not have. Proven manually.
async function runCaptureForFeature(featureSlug, secret) {
  const { chromium } = require('playwright');
  const sessionId = await authenticateStagingSession(STAGING_BASE_URL, secret);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([{
    name: 'session_id', value: sessionId, url: STAGING_BASE_URL,
  }]);
  const page = await context.newPage();
  // Hand-picked proof target for this story -- rpca-s2 generalises AC/selector
  // derivation from existing E2E specs instead of this hardcoded pair.
  const targetUrl = `${STAGING_BASE_URL}/playback/${featureSlug}`;
  const targetSelector = '.playback-summary';
  const targetAcId = 'AC1';
  const targetStorySlug = 'rpca-s1-proof';
  await page.goto(targetUrl);
  const relPath = buildScreenshotPath(featureSlug, targetStorySlug, targetAcId);
  await page.screenshot({ path: relPath, selector: targetSelector });
  await browser.close();
  return { acId: targetAcId, path: relPath };
}

if (require.main === module) {
  try {
    runCli(process.argv).then(
      () => { /* success -- real capture completed */ },
      (err) => { console.error(`[playback-capture] ${err.message}`); process.exitCode = 1; }
    );
  } catch (err) {
    console.error(`[playback-capture] ${err.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
  getPackageStatus, markPackageReviewed,
  captureVideoRecording,
  generateCaptionsForVideo,
  isPackageComplete,
  buildScreenshotPath, authenticateStagingSession, runCli,
};
