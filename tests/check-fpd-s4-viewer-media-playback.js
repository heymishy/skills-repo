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

// Media resolution (unit): screenshot, video (per-AC and single-combined-file cases), caption, transcript
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const store = new Set();
  const fakeFs = {
    existsSync: (p) => store.has(p) || Array.from(store).some((f) => f.startsWith(p + path.sep)),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  // AC1: screenshot exists for AC1
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'screenshots', 'AC1.png'));
  // AC2 (per-AC-named clip + caption + transcript, all present)
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC2.webm'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC2.vtt'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC2.transcript.txt'));
  // A second, unrelated per-AC clip -- makes "exactly one .webm" false, so
  // AC1/AC3's own lookups correctly do NOT fall back to a single-combined
  // video (that fallback is only for a genuinely single-file package).
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC4.webm'));
  try {
    const ac1 = resolveAcMedia('/repo', 'f1', 'AC1', fakeFs);
    assert.strictEqual(ac1.screenshotPath, 'artefacts/f1/playback/screenshots/AC1.png');
    assert.strictEqual(ac1.videoPath, null, 'expected no video for AC1 -- no per-AC file and not a single-combined-file case (2 files exist)');

    const ac2 = resolveAcMedia('/repo', 'f1', 'AC2', fakeFs);
    assert.strictEqual(ac2.videoPath, 'artefacts/f1/playback/video/AC2.webm');
    assert.strictEqual(ac2.captionPath, 'artefacts/f1/playback/video/AC2.vtt');
    assert.strictEqual(ac2.transcriptPath, 'artefacts/f1/playback/video/AC2.transcript.txt');

    const ac3 = resolveAcMedia('/repo', 'f1', 'AC3', fakeFs);
    assert.strictEqual(ac3.screenshotPath, null);
    assert.strictEqual(ac3.videoPath, null, 'expected no evidence for AC3 -- no file matches and 2 videos exist, not a single-combined-file case');
    pass('Media resolution (unit): screenshot, per-AC video, caption, transcript, and no-evidence cases');
  } catch (e) { fail('Media resolution (unit): screenshot, per-AC video, caption, transcript', e); }
})();

// Media resolution (unit): single combined walkthrough video shared by every AC
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const store = new Set([path.join('/repo', 'artefacts', 'f2', 'playback', 'video', 'walkthrough.webm')]);
  const fakeFs = {
    existsSync: (p) => store.has(p) || Array.from(store).some((f) => f.startsWith(p + path.sep)),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  try {
    const ac1 = resolveAcMedia('/repo', 'f2', 'AC1', fakeFs);
    const ac2 = resolveAcMedia('/repo', 'f2', 'AC2', fakeFs);
    assert.strictEqual(ac1.videoPath, 'artefacts/f2/playback/video/walkthrough.webm', 'expected the single combined video shared with AC1');
    assert.strictEqual(ac2.videoPath, 'artefacts/f2/playback/video/walkthrough.webm', 'expected the SAME single combined video shared with AC2 too');
    pass('Media resolution (unit): a single combined walkthrough video is shared by every AC');
  } catch (e) { fail('Media resolution (unit): single combined walkthrough video', e); }
})();

// buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media
(function () {
  const { buildFeaturePlaybackStructure } = require('../src/web-ui/routes/playback');
  const store = {};
  const state = {
    features: [{ slug: 'f1', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1', name: 'Story One' }] }] }],
  };
  store[path.join('/repo', '.github', 'pipeline-state.json')] = JSON.stringify(state);
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 's1-dod.md')] = [
    '## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — thing works | ✅ | proof | Automated test | None |',
  ].join('\n');
  const screenshotPath = path.join('/repo', 'artefacts', 'f1', 'playback', 'screenshots', 'AC1.png');
  const fakeFs = {
    existsSync: (p) => p === '/repo' || Object.prototype.hasOwnProperty.call(store, p) || p === screenshotPath || p === path.join('/repo', 'artefacts', 'f1') || p === path.join('/repo', 'artefacts', 'f1', 'dod'),
    readdirSync: (dir) => {
      if (dir === path.join('/repo', 'artefacts', 'f1')) return [{ name: 'dod', isDirectory: () => true, isFile: () => false }];
      if (dir === path.join('/repo', 'artefacts', 'f1', 'dod')) return [{ name: 's1-dod.md', isDirectory: () => false, isFile: () => true }];
      return [];
    },
    readFileSync: (p) => { if (store[p] !== undefined) return store[p]; throw new Error('ENOENT: ' + p); },
  };
  try {
    const structure = buildFeaturePlaybackStructure('/repo', 'f1', fakeFs);
    const ac1 = structure.stories[0].acRows[0];
    assert.strictEqual(ac1.media.screenshotPath, 'artefacts/f1/playback/screenshots/AC1.png');
    pass('buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media');
  } catch (e) { fail('buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media', e); }
})();

console.log(`\n[fpd-s4-viewer-media-playback] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
