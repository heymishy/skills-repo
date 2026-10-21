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

// rpca-s5: evaluates every story's own dodStatus evidence field directly
// (ADR-002 -- gates must use evidence fields, not a stage/field proxy), instead
// of the unwritten top-level feature.dodStatus field. Walks both flat
// feature.stories[] and epic-nested feature.epics[].stories[] shapes. Throws
// naming the specific incomplete story, not a generic message.
function checkDodGate(state, featureSlug) {
  const feature = (state.features || []).find(f => f.slug === featureSlug);
  if (!feature) {
    throw new Error(`Feature not found: ${featureSlug}`);
  }
  const allStories = [];
  if (Array.isArray(feature.stories)) allStories.push(...feature.stories);
  if (Array.isArray(feature.epics)) {
    for (const epic of feature.epics) {
      if (Array.isArray(epic.stories)) allStories.push(...epic.stories);
    }
  }
  if (allStories.length === 0) {
    // No story-level evidence exists at all -- fall back to the feature's own
    // field (legacy/minimal fixture shape; pre-existing callers rely on this).
    if (feature.dodStatus !== 'complete') {
      throw new Error(
        `Feature playback refused: dodStatus for "${featureSlug}" is "${feature.dodStatus}", not "complete". Run /definition-of-done first.`
      );
    }
    return { ok: true, feature };
  }
  const incomplete = allStories.find(s => s.dodStatus !== 'complete');
  if (incomplete) {
    throw new Error(
      `Feature playback refused: story "${incomplete.slug}" in "${featureSlug}" has dodStatus "${incomplete.dodStatus}", not "complete". Run /definition-of-done first.`
    );
  }
  return { ok: true, feature };
}

function generateWalkthroughMarkdown({ featureSlug, storyDods, benefitMetricContent }) {
  const lines = [`# Playback Walkthrough: ${featureSlug}`, ''];
  for (const story of storyDods) {
    const acRows = parseDodAcCoverage(story.content);
    for (const ac of acRows) {
      // rpca-embed-hotfix2: an invisible (HTML comment) story marker directly
      // before each heading -- AC ids restart per story (every story can have
      // its own "AC1"), so embedScreenshotPaths needs a way to scope a match
      // to the RIGHT story's own heading, not just the right AC id anywhere
      // in the document. Invisible when rendered; no visible change to the
      // document's own human-readable content.
      lines.push(`<!-- story: ${story.storySlug} -->`);
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

// Re-exported from src/utils/capture-screenshots.js (ppc-s1 Task 0) -- a
// production route (playback-evidence.js, added in a later story task) also
// needs this function, and scripts/ is never copied into the deployed
// Docker image. Kept re-exported here unchanged so every existing caller of
// this module keeps working with no change required on their part (same
// pattern already used for parseDodAcCoverage above).
const { captureAcScreenshots } = require('../src/utils/capture-screenshots');

// rpca-embed-hotfix1: tracks a cursor so each shot's own heading search starts
// from where the last insertion ended, not from the start of the document.
// Fixes a cross-story AC-id collision: two different stories can legitimately
// both have an "AC1" section (AC numbering restarts per story), and the old
// non-global, always-from-the-start replace() put every matching screenshot
// under the FIRST such heading in the whole document, regardless of which
// story it actually belonged to. Requires shots to be passed in the same
// relative order their own sections appear in the document -- true for every
// existing caller (captureAcScreenshots already returns shots in acList
// order; the walkthrough is built from the same ordered storyDods array).
// rpca-embed-hotfix2: the rpca-embed-hotfix1 cursor fix was itself
// insufficient -- it only prevents re-matching an ALREADY-consumed heading,
// it cannot stop a shot from matching an EARLIER, unrelated story's own
// same-labelled heading that the cursor hasn't reached yet (e.g. the first
// shot's own cursor starts at 0, so it matches whichever story's "AC1" comes
// first in the whole document, not necessarily its own). Confirmed by
// tracing the real journey-cx-redesign walkthrough: every heading ended up
// with exactly one image (looking correct), but several were the WRONG
// image -- a harder-to-notice failure than the original duplicate-pile-up.
// The real fix: match on (storySlug, acId) together, using the invisible
// story marker generateWalkthroughMarkdown now emits before each heading.
// Falls back to the old cursor-based behaviour only when no story marker is
// found at all (pre-existing hand-written fixture markdown, e.g. this
// function's own fpd-s1 regression test).
function embedScreenshotPaths(markdown, shots) {
  const path = require('path');
  let doc = markdown;
  let cursor = 0;
  for (const shot of shots) {
    const fileName = path.basename(shot.path);
    const pathParts = shot.path.split('/');
    const storySlug = pathParts.length >= 3 ? pathParts[pathParts.length - 3] : null;
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let matchStart = null;
    let heading = null;

    if (storySlug) {
      const scopedRe = new RegExp(`<!-- story: ${escapeRe(storySlug)} -->\\n(## ${escapeRe(shot.acId)}[^\\n]*\\n)`);
      const scopedMatch = doc.match(scopedRe);
      if (scopedMatch) {
        matchStart = scopedMatch.index + scopedMatch[0].indexOf(scopedMatch[1]);
        heading = scopedMatch[1];
      }
    }

    if (matchStart === null) {
      const sectionRe = new RegExp(`(## ${escapeRe(shot.acId)}[^\\n]*\\n)`);
      const rest = doc.slice(cursor);
      const fallbackMatch = rest.match(sectionRe);
      if (!fallbackMatch) continue;
      matchStart = cursor + fallbackMatch.index;
      heading = fallbackMatch[1];
    }

    // rpca-embed-hotfix3: walkthrough.md lives one directory above each
    // story's own screenshots (artefacts/<feature>/playback/<storySlug>/
    // screenshots/<acId>.png) -- a bare "screenshots/<file>" link resolves
    // to a non-existent artefacts/<feature>/playback/screenshots/ directory
    // for every multi-story feature. Reuse the same storySlug already
    // derived above for heading-matching to build a path that actually
    // resolves, falling back to the old bare form only when no storySlug
    // can be derived.
    const imgPath = storySlug ? `${storySlug}/screenshots/${fileName}` : `screenshots/${fileName}`;
    const insertion = `${heading}\n![${shot.acId}](${imgPath})\n`;
    doc = doc.slice(0, matchStart) + insertion + doc.slice(matchStart + heading.length);
    cursor = matchStart + insertion.length;
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

// rpca-s3: wires a single clip's own real Playwright recording (reusing
// captureVideoRecording's own existing directory convention and size) to
// generateCaptionsForVideo on success. On a mid-capture failure, closes the
// context to flush whatever Playwright already wrote, deletes that partial
// file if it exists, and re-throws the original error -- a failed run
// leaves no partial/corrupt file behind (AC3). Does not modify
// captureVideoRecording or generateCaptionsForVideo themselves.
// rpca-video-hotfix1: recording and caption generation are two sequential
// phases with DIFFERENT failure semantics -- a failure DURING recording
// really does leave a partial/corrupt file (delete it, as before); a
// failure AFTER recording, in the wholly separate caption-generation step,
// means the video is complete and valid and must never be deleted just
// because an unrelated downstream step failed. Found running this function
// for real against real wuce-staging: the recording succeeded, but the
// caption adapter's own correct "not wired" throw (D37) caused the just-
// recorded video to be destroyed along with it.
async function captureVideoForClip({ browser, featureSlug, storySlug, clip }) {
  const dir = `artefacts/${featureSlug}/playback/${storySlug}/video/`;
  const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
  const page = await context.newPage();
  let videoPath;
  try {
    if (clip.run) await clip.run(page);
    await context.close();
    const video = page.video ? page.video() : null;
    videoPath = video ? await video.path() : null;
  } catch (err) {
    try { await context.close(); } catch (_) { /* already closed or closing failed -- still attempt cleanup below */ }
    try {
      const video = page.video ? page.video() : null;
      const partialPath = video ? await video.path() : null;
      if (partialPath && fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
    } catch (_) { /* best-effort cleanup -- never mask the original error */ }
    throw err;
  }
  // Recording succeeded -- videoPath is a complete, valid file from here on.
  // A caption-generation failure must propagate (callers still need to know
  // captions are missing) but must never delete or otherwise touch the
  // already-successfully-recorded video. The video's own path is attached
  // to the thrown error so a caller can still report/recover it.
  try {
    const captionResult = await generateCaptionsForVideo(videoPath, clip.interactionSequenceText || '');
    return Object.assign({ path: videoPath }, captionResult);
  } catch (captionErr) {
    captionErr.videoPath = videoPath;
    throw captionErr;
  }
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

// rpca-s2: scans a spec file's own text for a comment naming acId (matching the
// existing convention, e.g. tests/e2e/fpd-s4-caption-sync.spec.js's own header
// "(fpd-s4 AC3)"), then finds the NEAREST FOLLOWING page.locator(...) call --
// not just the first one in the file, since a spec file can cover several ACs.
// Returns null (never throws) when the AC isn't named at all -- a spec file
// simply not covering a given AC is a normal, expected case, not an error.
// rpca-s2-hotfix1: anchors on `<acId>)` specifically, not any bare mention of
// acId. Both real per-AC inline conventions sampled place the AC id directly
// before a closing paren ("(fpd-s4 AC3)", "(AC1)") -- only a SHARED header
// comment naming several ACs together (tests/e2e/jcx-s3-emotion-curve.spec.js:
// "AC1, AC2, AC3 of story") lacks the trailing ")". The bare \b-only anchor
// matched that shared header for every AC equally and returned the SAME
// (wrong) selector for AC2/AC3 -- confirmed directly against that real file
// at /definition-of-done for rpca-s2.
function deriveSelectorFromSpec(specFileContent, acId) {
  const acRe = new RegExp(`\\b${acId}\\)`);
  const acMatch = acRe.exec(specFileContent);
  if (!acMatch) return null;
  const rest = specFileContent.slice(acMatch.index);
  const locatorMatch = rest.match(/page\.locator\(['"]([^'"]+)['"]\)/);
  if (!locatorMatch) return null;
  return { acId, selector: locatorMatch[1] };
}

// rpca-s2: reads the manually-authored fallback file for one AC when no E2E
// spec covers it. A missing file is the normal, expected case for a feature
// that hasn't needed a manual entry yet -- returns null, never throws.
// featureSlug/storySlug come from the same untrusted-shaped CLI-argument
// origin buildScreenshotPath already guards (rpca-s1-hotfix1) -- applies the
// identical path-traversal guard before any fs access.
function loadManualFallback(featureSlug, storySlug, acId) {
  const path = require('path');
  const relPath = `artefacts/${featureSlug}/playback/${storySlug}/selectors-manual.json`;
  const repoRoot = path.resolve(__dirname, '..');
  const resolvedPath = path.resolve(repoRoot, relPath);
  if (!resolvedPath.startsWith(repoRoot + path.sep)) {
    throw new Error(`Refusing to read a manual fallback path outside the repo root -- check the feature-slug argument: "${featureSlug}"`);
  }
  if (!fs.existsSync(resolvedPath)) return null;
  const data = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  return data[acId] || null;
}

// rpca-s2: builds the real multi-AC capture list -- tries every spec file's
// own deriveSelectorFromSpec first (E2E specs are the primary source, per
// discovery's own MVP scope item 4), then loadManualFallback, then skips
// with a named warning identifying the specific AC. Never throws on a
// no-match AC -- that's the normal "not every AC has coverage yet" case,
// not an error; only a real path-traversal attempt (loadManualFallback's
// own guard) throws.
function buildCaptureList(featureSlug, storySlug, acIds, specFiles) {
  const captured = [];
  let skipped = 0;
  for (const acId of acIds) {
    let entry = null;
    for (const specContent of specFiles) {
      entry = deriveSelectorFromSpec(specContent, acId);
      if (entry) break;
    }
    if (!entry) {
      const fallback = loadManualFallback(featureSlug, storySlug, acId);
      if (fallback) entry = Object.assign({ acId }, fallback);
    }
    if (entry) {
      captured.push(entry);
    } else {
      skipped += 1;
      console.warn(`[playback-capture] No selector found for ${acId} -- skipping (no E2E spec match, no manual fallback entry)`);
    }
  }
  return { captured, skipped, summary: `${captured.length} captured, ${skipped} skipped` };
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
  deriveSelectorFromSpec, loadManualFallback, buildCaptureList,
  captureVideoForClip,
};
