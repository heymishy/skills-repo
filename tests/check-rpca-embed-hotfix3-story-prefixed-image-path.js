'use strict';
// check-rpca-embed-hotfix3-story-prefixed-image-path.js -- TDD tests for rpca-embed-hotfix3
// (2026-10-19-real-playback-capture-automation).
// Short-track fix: embedScreenshotPaths wrote a bare basename ("screenshots/<file>")
// with no story-directory prefix -- broken for every multi-story feature, since
// walkthrough.md lives one directory above each story's own screenshots folder.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): embedScreenshotPaths writes a story-prefixed relative path
(function () {
  const { embedScreenshotPaths } = require('../scripts/playback-capture');
  try {
    const markdown = ['## AC1 — a thing', '', 'text', ''].join('\n');
    const shots = [{ acId: 'AC1', path: 'artefacts/f1/playback/s1/screenshots/AC1.png' }];
    const doc = embedScreenshotPaths(markdown, shots);
    assert.ok(doc.includes('![AC1](s1/screenshots/AC1.png)'), 'expected a story-prefixed relative path');
    assert.ok(!doc.includes('![AC1](screenshots/AC1.png)'), 'expected the bare basename form to NOT appear');
    pass('AC1 (unit): embedScreenshotPaths writes a story-prefixed relative path');
  } catch (e) { fail('AC1 (unit): embedScreenshotPaths writes a story-prefixed relative path', e); }
})();

// AC2 (unit): two stories sharing an identical screenshot basename each get their own resolvable path
(function () {
  const { embedScreenshotPaths } = require('../scripts/playback-capture');
  try {
    const markdown = [
      '<!-- story: story-one -->',
      '## AC1 — story one\'s own AC1',
      '',
      'story one text',
      '',
      '<!-- story: story-two -->',
      '## AC1 — story two\'s own AC1',
      '',
      'story two text',
      '',
    ].join('\n');
    const shots = [
      { acId: 'AC1', path: 'artefacts/f1/playback/story-one/screenshots/AC1.png' },
      { acId: 'AC1', path: 'artefacts/f1/playback/story-two/screenshots/AC1.png' },
    ];
    const doc = embedScreenshotPaths(markdown, shots);
    const firstSection = doc.slice(doc.indexOf('story one\'s own AC1'), doc.indexOf('story two\'s own AC1'));
    const secondSection = doc.slice(doc.indexOf('story two\'s own AC1'));
    assert.ok(firstSection.includes('story-one/screenshots/AC1.png'), "expected story-one's own section to reference its own path");
    assert.ok(secondSection.includes('story-two/screenshots/AC1.png'), "expected story-two's own section to reference its own path");
    assert.ok(!firstSection.includes('story-two/screenshots/AC1.png'), "expected story-one's own section to NOT reference story-two's path");
    pass('AC2 (unit): two stories sharing an identical screenshot basename each get their own resolvable path');
  } catch (e) { fail('AC2 (unit): two stories sharing an identical screenshot basename each get their own resolvable path', e); }
})();

// AC3 (integration): regenerated real walkthrough's image links resolve to real files on disk
(function () {
  const { generateWalkthroughMarkdown, embedScreenshotPaths } = require('../scripts/playback-capture');
  const repoRoot = path.join(__dirname, '..');
  const featureSlug = '2026-10-11-journey-cx-redesign';
  try {
    const dodDir = path.join(repoRoot, 'artefacts', featureSlug, 'dod');
    const dodFiles = fs.readdirSync(dodDir).filter(f => f.endsWith('.md')).sort();
    const storyDods = dodFiles.map(f => ({
      storySlug: f.replace(/-dod\.md$/, ''),
      content: fs.readFileSync(path.join(dodDir, f), 'utf8'),
    }));
    const benefitMetricContent = fs.readFileSync(path.join(repoRoot, 'artefacts', featureSlug, 'benefit-metric.md'), 'utf8');
    let markdown = generateWalkthroughMarkdown({ featureSlug, storyDods, benefitMetricContent });

    const shots = [];
    for (const storySlug of ['jcx-s3', 'jcx-s4', 'jcx-s6']) {
      const shotDir = path.join(repoRoot, 'artefacts', featureSlug, 'playback', storySlug, 'screenshots');
      if (!fs.existsSync(shotDir)) continue;
      for (const file of fs.readdirSync(shotDir)) {
        shots.push({ acId: file.replace(/\.png$/, ''), path: `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${file}` });
      }
    }
    markdown = embedScreenshotPaths(markdown, shots);

    const linkRe = /!\[[^\]]*\]\(([^)]+)\)/g;
    const links = [...markdown.matchAll(linkRe)].map(m => m[1]);
    assert.ok(links.length === shots.length, `expected ${shots.length} embedded links, found ${links.length}`);
    const playbackDir = path.join(repoRoot, 'artefacts', featureSlug, 'playback');
    const broken = links.filter(link => !fs.existsSync(path.join(playbackDir, link)));
    assert.deepStrictEqual(broken, [], `expected every embedded link to resolve to a real file, found broken: ${JSON.stringify(broken)}`);
    pass("AC3 (integration): regenerated real walkthrough's image links resolve to real files on disk");
  } catch (e) { fail("AC3 (integration): regenerated real walkthrough's image links resolve to real files on disk", e); }
})();

console.log(`\n[rpca-embed-hotfix3-story-prefixed-image-path] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
