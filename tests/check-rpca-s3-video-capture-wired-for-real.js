'use strict';
// check-rpca-s3-video-capture-wired-for-real.js -- TDD tests for rpca-s3
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed
await (async function () {
  const { captureVideoForClip } = require('../scripts/playback-capture');
  const { setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac2', 'playback', 'rpca-fixture-story', 'video');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const fixtureVideoPath = path.join(fixtureDir, 'fixture.webm');
  fs.writeFileSync(fixtureVideoPath, 'fake recorded video bytes');
  const originalImpl = getGenerateCaptionsAndTranscript();
  let receivedArgs = null;
  setGenerateCaptionsAndTranscript(async (videoPath, interactionSequenceText) => {
    receivedArgs = { videoPath, interactionSequenceText };
    return { captions: 'FIXTURE CAPTIONS', transcript: 'FIXTURE TRANSCRIPT' };
  });
  const mockPage = { video: () => ({ path: async () => fixtureVideoPath }) };
  const mockContext = { newPage: async () => mockPage, close: async () => {} };
  const mockBrowser = { newContext: async () => mockContext };
  const clip = { name: 'fixture', interactionSequenceText: 'fixture sequence', run: async () => {} };
  try {
    const result = await captureVideoForClip({ browser: mockBrowser, featureSlug: 'rpca-s3-test-fixture-ac2', storySlug: 'rpca-fixture-story', clip });
    assert.strictEqual(receivedArgs.videoPath, fixtureVideoPath, 'expected generateCaptionsForVideo to be called with the real captured video path');
    assert.strictEqual(receivedArgs.interactionSequenceText, 'fixture sequence', "expected the clip's own interaction sequence text to be passed through");
    assert.strictEqual(result.reviewed, false, 'expected the result to be marked unreviewed until explicit confirmation');
    assert.strictEqual(result.path, fixtureVideoPath, 'expected the real video path in the result');
    assert.ok(fs.existsSync(result.captionPath), 'expected a real caption file to be written');
    assert.ok(fs.existsSync(result.transcriptPath), 'expected a real transcript file to be written');
    pass('AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed');
  } catch (e) { fail('AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed', e); }
  finally {
    setGenerateCaptionsAndTranscript(originalImpl);
    fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac2'), { recursive: true, force: true });
  }
})();

// AC3 (unit): a mid-capture failure leaves no partial file on disk
await (async function () {
  const { captureVideoForClip } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac3', 'playback', 'rpca-fixture-story', 'video');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const partialVideoPath = path.join(fixtureDir, 'partial-fixture.webm');
  fs.writeFileSync(partialVideoPath, 'fake partial video bytes written by Playwright before the failure');
  const mockPage = { video: () => ({ path: async () => partialVideoPath }) };
  const mockContext = { newPage: async () => mockPage, close: async () => {} };
  const mockBrowser = { newContext: async () => mockContext };
  const clip = { name: 'fixture', run: async () => { throw new Error('simulated mid-recording failure'); } };
  try {
    let threw = null;
    try {
      await captureVideoForClip({ browser: mockBrowser, featureSlug: 'rpca-s3-test-fixture-ac3', storySlug: 'rpca-fixture-story', clip });
    } catch (e) { threw = e; }
    assert.ok(threw, 'expected the failure to be surfaced, not swallowed');
    assert.strictEqual(threw.message, 'simulated mid-recording failure', 'expected the original error to propagate unmasked');
    assert.strictEqual(fs.existsSync(partialVideoPath), false, 'expected the partial file to be deleted, not left behind');
    pass('AC3 (unit): a mid-capture failure leaves no partial file on disk');
  } catch (e) { fail('AC3 (unit): a mid-capture failure leaves no partial file on disk', e); }
  finally { fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac3'), { recursive: true, force: true }); }
})();

console.log(`\n[rpca-s3-video-capture-wired-for-real] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
