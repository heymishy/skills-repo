'use strict';
// check-fpd-s2-video-walkthrough-and-accessibility.js -- TDD tests for fpd-s2
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s2-video-walkthrough-and-accessibility.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

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

console.log(`\n[fpd-s2-video-walkthrough-and-accessibility] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
