'use strict';
// check-rpca-video-hotfix1-caption-failure-preserves-video.js -- TDD tests for
// rpca-video-hotfix1 (2026-10-19-real-playback-capture-automation).
// Short-track fix: captureVideoForClip deleted a successfully-recorded video
// when an unrelated downstream step (caption generation) failed afterward --
// found running the real mechanism end-to-end for the first time against
// real wuce-staging.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC2 (unit): a successful recording followed by a caption-generation
// failure does not delete the video
await (async function () {
  const { captureVideoForClip } = require('../scripts/playback-capture');
  const { setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-video-hotfix1-test-fixture-ac2', 'playback', 'rpca-fixture-story', 'video');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const fixtureVideoPath = path.join(fixtureDir, 'fixture.webm');
  fs.writeFileSync(fixtureVideoPath, 'fake recorded video bytes -- recording itself succeeded');
  const originalImpl = getGenerateCaptionsAndTranscript();
  setGenerateCaptionsAndTranscript(async () => {
    throw new Error('Adapter not wired: generateCaptionsAndTranscript. Call setGenerateCaptionsAndTranscript() with a real implementation before use.');
  });
  const mockPage = { video: () => ({ path: async () => fixtureVideoPath }) };
  const mockContext = { newPage: async () => mockPage, close: async () => {} };
  const mockBrowser = { newContext: async () => mockContext };
  const clip = { name: 'fixture', interactionSequenceText: 'fixture sequence', run: async () => {} };
  try {
    let threw = null;
    try {
      await captureVideoForClip({ browser: mockBrowser, featureSlug: 'rpca-video-hotfix1-test-fixture-ac2', storySlug: 'rpca-fixture-story', clip });
    } catch (e) { threw = e; }
    assert.ok(threw, 'expected the caption-generation failure to still be surfaced, not swallowed');
    assert.ok(/Adapter not wired/.test(threw.message), 'expected the original caption-generation error to propagate unmasked');
    assert.strictEqual(fs.existsSync(fixtureVideoPath), true, 'expected the successfully-recorded video to NOT be deleted by an unrelated downstream failure');
    pass('AC2 (unit): a successful recording followed by a caption-generation failure does not delete the video');
  } catch (e) { fail('AC2 (unit): a successful recording followed by a caption-generation failure does not delete the video', e); }
  finally {
    setGenerateCaptionsAndTranscript(originalImpl);
    fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-video-hotfix1-test-fixture-ac2'), { recursive: true, force: true });
  }
})();

// AC3 (unit): the thrown error carries the video's own path
await (async function () {
  const { captureVideoForClip } = require('../scripts/playback-capture');
  const { setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-video-hotfix1-test-fixture-ac3', 'playback', 'rpca-fixture-story', 'video');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const fixtureVideoPath = path.join(fixtureDir, 'fixture.webm');
  fs.writeFileSync(fixtureVideoPath, 'fake recorded video bytes -- recording itself succeeded');
  const originalImpl = getGenerateCaptionsAndTranscript();
  setGenerateCaptionsAndTranscript(async () => { throw new Error('simulated caption failure'); });
  const mockPage = { video: () => ({ path: async () => fixtureVideoPath }) };
  const mockContext = { newPage: async () => mockPage, close: async () => {} };
  const mockBrowser = { newContext: async () => mockContext };
  const clip = { name: 'fixture', run: async () => {} };
  try {
    let threw = null;
    try {
      await captureVideoForClip({ browser: mockBrowser, featureSlug: 'rpca-video-hotfix1-test-fixture-ac3', storySlug: 'rpca-fixture-story', clip });
    } catch (e) { threw = e; }
    assert.ok(threw, 'expected a rejection');
    assert.strictEqual(threw.videoPath, fixtureVideoPath, "expected the thrown error to carry the already-recorded video's own path");
    pass("AC3 (unit): the thrown error carries the video's own path");
  } catch (e) { fail("AC3 (unit): the thrown error carries the video's own path", e); }
  finally {
    setGenerateCaptionsAndTranscript(originalImpl);
    fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-video-hotfix1-test-fixture-ac3'), { recursive: true, force: true });
  }
})();

console.log(`\n[rpca-video-hotfix1-caption-failure-preserves-video] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
