'use strict';
// check-fpd-s2-video-walkthrough-and-accessibility.js -- TDD tests for fpd-s2
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC6 (unit): unwired adapter throws the exact D37 stub error -- run FIRST,
// before any other test calls setGenerateCaptionsAndTranscript, so the
// module's own unwired default is still active.
(function () {
  const { generateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  try {
    generateCaptionsAndTranscript('artefacts/f1/playback/video/clip.webm', 'step text');
    fail('AC6 (unit): unwired adapter throws the exact D37 stub error', new Error('expected it to throw'));
  } catch (e) {
    try {
      assert.strictEqual(e.message, 'Adapter not wired: generateCaptionsAndTranscript. Call setGenerateCaptionsAndTranscript() with a real implementation before use.');
      pass('AC6 (unit): unwired adapter throws the exact D37 stub error');
    } catch (e2) { fail('AC6 (unit): unwired adapter throws the exact D37 stub error', e2); }
  }
})();

// AC6 (integration): behavioural wiring -- two different fixture inputs produce two different, individually-traceable outputs
(function () {
  const { setGenerateCaptionsAndTranscript, realGenerateCaptionsAndTranscript, generateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript);
  try {
    const a = generateCaptionsAndTranscript('artefacts/f1/playback/video/clip-a.webm', 'Step 1: open the dashboard.\nStep 2: click Export.');
    const b = generateCaptionsAndTranscript('artefacts/f1/playback/video/clip-b.webm', 'Step 1: sign in.\nStep 2: view the report.');
    assert.notStrictEqual(a.transcript, b.transcript, 'expected two different inputs to produce two different transcripts');
    assert.ok(a.transcript.includes('click Export'), 'expected transcript a traceable to its own input');
    assert.ok(b.transcript.includes('view the report'), 'expected transcript b traceable to its own input');
    assert.ok(a.captions.startsWith('WEBVTT'), 'expected valid WebVTT captions');
    pass('AC6 (integration): behavioural wiring -- two different inputs produce two different, traceable outputs');
  } catch (e) { fail('AC6 (integration): behavioural wiring', e); }
})();

// AC1 (unit): recording script's own logic -- correct context options, correct output path
await (async function () {
  const { captureVideoRecording } = require('../scripts/playback-capture');
  const calls = [];
  const fakeBrowser = {
    newContext: async (opts) => {
      calls.push(opts);
      return {
        newPage: async () => ({ video: () => ({ path: async () => `${opts.recordVideo.dir}clip-0.webm` }) }),
        close: async () => {},
      };
    },
  };
  try {
    const results = await captureVideoRecording({ browser: fakeBrowser, featureSlug: 'f1', clips: [{ name: 'walkthrough' }] });
    assert.strictEqual(calls.length, 1, 'expected newContext called once');
    assert.strictEqual(calls[0].recordVideo.dir, 'artefacts/f1/playback/video/');
    assert.ok(calls[0].recordVideo.size && calls[0].recordVideo.size.width, 'expected a recordVideo size option');
    assert.strictEqual(results[0].path, 'artefacts/f1/playback/video/clip-0.webm');
    pass("AC1 (unit): recording script's own logic -- correct context options, correct output path");
  } catch (e) { fail("AC1 (unit): recording script's own logic", e); }
})();

// AC2 (unit): single-file and multi-file shapes both work via the same mechanism
await (async function () {
  const { captureVideoRecording } = require('../scripts/playback-capture');
  function makeFakeBrowser() {
    const calls = [];
    return {
      calls,
      newContext: async (opts) => {
        calls.push(opts);
        return { newPage: async () => ({ video: () => ({ path: async () => `${opts.recordVideo.dir}c${calls.length}.webm` }) }), close: async () => {} };
      },
    };
  }
  try {
    const single = makeFakeBrowser();
    const singleResults = await captureVideoRecording({ browser: single, featureSlug: 'f1', clips: [{ name: 'walkthrough' }] });
    assert.strictEqual(singleResults.length, 1, 'expected exactly 1 output file for the single-file shape');

    const multi = makeFakeBrowser();
    const multiResults = await captureVideoRecording({ browser: multi, featureSlug: 'f1', clips: [{ name: 'ac1' }, { name: 'ac2' }, { name: 'ac3' }] });
    assert.strictEqual(multiResults.length, 3, 'expected exactly 3 output files for the multi-file shape');
    assert.strictEqual(multi.calls.length, 3, 'expected one context/recording per sequence, no branching logic difference beyond count');
    pass('AC2 (unit): single-file and multi-file shapes both work via the same mechanism');
  } catch (e) { fail('AC2 (unit): single-file and multi-file shapes', e); }
})();

console.log(`\n[fpd-s2-video-walkthrough-and-accessibility] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
