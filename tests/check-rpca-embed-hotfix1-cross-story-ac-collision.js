'use strict';
// check-rpca-embed-hotfix1-cross-story-ac-collision.js -- TDD tests for rpca-embed-hotfix1
// (2026-10-19-real-playback-capture-automation).
// Short-track fix: embedScreenshotPaths scopes matches per story, found running
// /feature-playback for real against journey-cx-redesign for the first time.
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): screenshots land in their own story's section when AC ids repeat across stories
(function () {
  const { embedScreenshotPaths } = require('../scripts/playback-capture');
  try {
    const markdown = [
      '## AC1 — story one\'s own AC1',
      '',
      'story one text',
      '',
      '## AC1 — story two\'s own AC1',
      '',
      'story two text',
      '',
    ].join('\n');
    // Realistic shape: both files legitimately share the same basename
    // (buildScreenshotPath names every shot "<acId>.png"; the story context
    // lives in the directory -- rpca-embed-hotfix3 made embedScreenshotPaths'
    // own output format story-prefixed, "![acId](<storySlug>/screenshots/
    // <basename>)", specifically so these two files resolve to different,
    // correct real paths instead of colliding on one bare basename).
    const shots = [
      { acId: 'AC1', path: 'artefacts/f1/playback/story-one/screenshots/AC1.png' },
      { acId: 'AC1', path: 'artefacts/f1/playback/story-two/screenshots/AC1.png' },
    ];
    const doc = embedScreenshotPaths(markdown, shots);
    const firstSection = doc.slice(doc.indexOf('story one\'s own AC1'), doc.indexOf('story two\'s own AC1'));
    const secondSection = doc.slice(doc.indexOf('story two\'s own AC1'));
    const countImages = (s, storySlug) => (s.match(new RegExp(`!\\[AC1\\]\\(${storySlug}/screenshots/AC1\\.png\\)`, 'g')) || []).length;
    assert.strictEqual(countImages(firstSection, 'story-one'), 1, "expected exactly one image embedded under story one's own heading");
    assert.strictEqual(countImages(secondSection, 'story-two'), 1, "expected exactly one image embedded under story two's own heading");
    pass('AC1 (unit): screenshots land in their own story\'s section when AC ids repeat across stories');
  } catch (e) { fail('AC1 (unit): screenshots land in their own story\'s section when AC ids repeat across stories', e); }
})();

console.log(`\n[rpca-embed-hotfix1-cross-story-ac-collision] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
