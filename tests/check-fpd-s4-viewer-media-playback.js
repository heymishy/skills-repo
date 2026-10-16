'use strict';
// check-fpd-s4-viewer-media-playback.js -- TDD tests for fpd-s4
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s4-viewer-media-playback.md
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeRes() {
  const state = { status: 200, body: '' };
  return {
    writeHead: function (code) { state.status = code; },
    end: function (body) { state.body = body || ''; },
    _get: function () { return state; },
  };
}

(async function () {

// Deployment-safety (unit): captionTranscriptPaths lives under src/, not scripts/
(function () {
  const { captionTranscriptPaths } = require('../src/utils/playback-paths');
  try {
    const result = captionTranscriptPaths('artefacts/f1/playback/video/clip-0.webm');
    assert.strictEqual(result.captionPath, 'artefacts/f1/playback/video/clip-0.vtt');
    assert.strictEqual(result.transcriptPath, 'artefacts/f1/playback/video/clip-0.transcript.txt');
    pass('Deployment-safety (unit): captionTranscriptPaths lives under src/, not scripts/');
  } catch (e) { fail('Deployment-safety (unit): captionTranscriptPaths lives under src/', e); }
})();

console.log(`\n[fpd-s4-viewer-media-playback] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
