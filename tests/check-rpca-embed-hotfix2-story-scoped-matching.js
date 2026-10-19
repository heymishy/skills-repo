'use strict';
// check-rpca-embed-hotfix2-story-scoped-matching.js -- TDD tests for rpca-embed-hotfix2
// (2026-10-19-real-playback-capture-automation).
// Short-track fix: embedScreenshotPaths matches on (storySlug, acId), not position
// heuristics -- the cursor-based rpca-embed-hotfix1 fix was itself insufficient,
// found running it against the real journey-cx-redesign walkthrough.
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): a shot lands on its own story's section, not an earlier same-labelled one
(function () {
  const { embedScreenshotPaths } = require('../scripts/playback-capture');
  try {
    const markdown = [
      '<!-- story: early -->',
      '## AC1 — early\'s own AC1 (no screenshot)',
      '',
      'early text',
      '',
      '<!-- story: target -->',
      '## AC1 — target\'s own AC1 (has a screenshot)',
      '',
      'target text',
      '',
      '<!-- story: later -->',
      '## AC1 — later\'s own AC1 (no screenshot)',
      '',
      'later text',
      '',
    ].join('\n');
    const shots = [{ acId: 'AC1', path: 'artefacts/f1/playback/target/screenshots/AC1.png' }];
    const doc = embedScreenshotPaths(markdown, shots);
    const earlySection = doc.slice(doc.indexOf('early\'s own AC1'), doc.indexOf('target\'s own AC1'));
    const targetSection = doc.slice(doc.indexOf('target\'s own AC1'), doc.indexOf('later\'s own AC1'));
    const laterSection = doc.slice(doc.indexOf('later\'s own AC1'));
    assert.ok(!earlySection.includes('screenshots/AC1.png'), "expected early's own earlier AC1 section to NOT receive the screenshot");
    assert.ok(targetSection.includes('screenshots/AC1.png'), "expected target's own AC1 section to receive the screenshot");
    assert.ok(!laterSection.includes('screenshots/AC1.png'), "expected later's own AC1 section to NOT receive the screenshot");
    pass("AC1 (unit): a shot lands on its own story's section, not an earlier same-labelled one");
  } catch (e) { fail("AC1 (unit): a shot lands on its own story's section, not an earlier same-labelled one", e); }
})();

// AC2 (unit): generateWalkthroughMarkdown emits a story marker before each heading
(function () {
  const { generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  try {
    const fixtureDod = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
      '| AC1 — a thing | ✅ | some evidence | Automated test | None |'].join('\n');
    const doc = generateWalkthroughMarkdown({ featureSlug: 'f1', storyDods: [{ storySlug: 'sX', content: fixtureDod }], benefitMetricContent: '' });
    assert.ok(/<!-- story: sX -->\s*\n## AC1/.test(doc), 'expected a story marker immediately before the AC1 heading');
    pass('AC2 (unit): generateWalkthroughMarkdown emits a story marker before each heading');
  } catch (e) { fail('AC2 (unit): generateWalkthroughMarkdown emits a story marker before each heading', e); }
})();

// AC4 (integration): regenerating the real journey-cx-redesign walkthrough places
// every screenshot under its own correct story's own correct AC heading
(function () {
  const fs = require('fs');
  const path = require('path');
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

    // Anchor on each story's own invisible marker, not on AC body text: the
    // embedded image is inserted directly after the heading and BEFORE the
    // body text, so searching for a body-text substring (as this test
    // originally did) finds an index that is already past the image --
    // producing a false negative even when embedScreenshotPaths is correct.
    // A section runs from a story marker to the NEXT "##" heading -- but the
    // current section's own heading line sits just one line below the marker,
    // so indexOf('##', markerIdx + 1) immediately re-finds that same heading
    // instead of the next section's. Skip past the marker line and the
    // heading line themselves before searching for the next "##".
    function sectionFromMarker(md, markerIdx) {
      const markerLineEnd = md.indexOf('\n', markerIdx) + 1;
      const headingLineEnd = md.indexOf('\n', markerLineEnd) + 1;
      const nextHeadingIdx = md.indexOf('##', headingLineEnd);
      return md.slice(markerIdx, nextHeadingIdx === -1 ? undefined : nextHeadingIdx);
    }
    const jcxS3MarkerIdx = markdown.indexOf('<!-- story: jcx-s3 -->');
    const jcxS6MarkerIdx = markdown.indexOf('<!-- story: jcx-s6 -->');
    assert.ok(jcxS3MarkerIdx !== -1, "expected to find jcx-s3's own story marker");
    assert.ok(jcxS6MarkerIdx !== -1, "expected to find jcx-s6's own story marker");
    const jcxS3Section = sectionFromMarker(markdown, jcxS3MarkerIdx);
    const jcxS6Section = sectionFromMarker(markdown, jcxS6MarkerIdx);
    assert.ok(jcxS3Section.includes('screenshots/AC1.png'), "expected jcx-s3's own real AC1 heading to carry its own screenshot");
    assert.ok(jcxS6Section.includes('screenshots/AC1.png'), "expected jcx-s6's own real AC1 heading to carry its own screenshot");
    // The decisive check: no earlier hotfix story's generic "AC1 -- AC1" heading
    // (which appears before jcx-s3's own section) should have received an image.
    const firstGenericAc1Idx = markdown.indexOf('## AC1 — AC1');
    const genericSection = markdown.slice(firstGenericAc1Idx, markdown.indexOf('##', firstGenericAc1Idx + 2));
    assert.ok(!genericSection.includes('screenshots/AC1.png'), 'expected an unrelated earlier story\'s own generic AC1 heading to NOT receive a screenshot');
    pass('AC4 (integration): regenerating the real journey-cx-redesign walkthrough places every screenshot under its own correct story\'s own correct AC heading');
  } catch (e) { fail('AC4 (integration): regenerating the real journey-cx-redesign walkthrough places every screenshot under its own correct story\'s own correct AC heading', e); }
})();

console.log(`\n[rpca-embed-hotfix2-story-scoped-matching] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
