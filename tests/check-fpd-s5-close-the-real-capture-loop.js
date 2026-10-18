'use strict';
// check-fpd-s5-close-the-real-capture-loop.js -- TDD tests for fpd-s5
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape
(function () {
  const { parseDodAcCoverage } = require('../src/utils/dod-parsing');
  const fixture = [
    '## AC Verification', '',
    '| AC | Verified by | Result |',
    '|----|--------------|--------|',
    '| AC1 — Step 1 three named options | T3.1, T3.2 | ✅ PASS |',
  ].join('\n');
  try {
    const rows = parseDodAcCoverage(fixture);
    assert.strictEqual(rows.length, 1, 'expected exactly one parsed row');
    assert.strictEqual(rows[0].acId, 'AC1');
    assert.strictEqual(rows[0].description, 'Step 1 three named options');
    assert.strictEqual(rows[0].evidence, 'T3.1, T3.2', 'expected evidence sourced from the Verified by column');
    assert.strictEqual(rows[0].satisfied, '✅ PASS', 'expected satisfied sourced from the Result column');
    assert.strictEqual(rows[0].verificationMethod, '', 'no equivalent column in this table shape');
    assert.strictEqual(rows[0].deviation, '', 'no equivalent column in this table shape');
    pass('AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape');
  } catch (e) { fail('AC1 (unit): parseDodAcCoverage parses "## AC Verification"', e); }
})();

// AC2 (unit): screenshot path is namespaced by story -- two stories' own same-numbered AC resolve to different files
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const store = new Set();
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's1', 'screenshots', 'AC1.png'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's2', 'screenshots', 'AC1.png'));
  const fakeFs = {
    existsSync: (p) => store.has(p) || Array.from(store).some((f) => f.startsWith(p + path.sep)),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  try {
    const s1ac1 = resolveAcMedia('/repo', 'f1', 's1', 'AC1', fakeFs);
    const s2ac1 = resolveAcMedia('/repo', 'f1', 's2', 'AC1', fakeFs);
    assert.strictEqual(s1ac1.screenshotPath, 'artefacts/f1/playback/s1/screenshots/AC1.png');
    assert.strictEqual(s2ac1.screenshotPath, 'artefacts/f1/playback/s2/screenshots/AC1.png');
    assert.notStrictEqual(s1ac1.screenshotPath, s2ac1.screenshotPath, 'expected two independent, non-colliding paths');
    pass('AC2 (unit): screenshot path is namespaced by story -- no cross-story collision');
  } catch (e) { fail('AC2 (unit): screenshot path namespaced by story', e); }
})();

// AC2 (unit): video path is namespaced by story -- same collision check for the single-combined-file fallback
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const store = new Set();
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's1', 'video', 'walkthrough.webm'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's2', 'video', 'other.webm'));
  const fakeFs = {
    existsSync: (p) => store.has(p) || Array.from(store).some((f) => f.startsWith(p + path.sep)),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  try {
    const s1ac1 = resolveAcMedia('/repo', 'f1', 's1', 'AC1', fakeFs);
    const s2ac1 = resolveAcMedia('/repo', 'f1', 's2', 'AC1', fakeFs);
    assert.strictEqual(s1ac1.videoPath, 'artefacts/f1/playback/s1/video/walkthrough.webm');
    assert.strictEqual(s2ac1.videoPath, 'artefacts/f1/playback/s2/video/other.webm');
    pass('AC2 (unit): video path is namespaced by story -- single-combined-file fallback does not collide');
  } catch (e) { fail('AC2 (unit): video path namespaced by story', e); }
})();

// AC2 (integration): buildFeaturePlaybackStructure attaches independent, non-colliding media to two stories
(function () {
  const { buildFeaturePlaybackStructure } = require('../src/web-ui/routes/playback');
  const store = {};
  const state = {
    features: [{ slug: 'f1', epics: [{ slug: 'e1', name: 'Epic One', stories: [
      { slug: 's1', name: 'Story One' },
      { slug: 's2', name: 'Story Two' },
    ] }] }],
  };
  store[path.join('/repo', '.github', 'pipeline-state.json')] = JSON.stringify(state);
  const dodTable = (storyLabel) => [
    '## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    `| AC1 — ${storyLabel} thing works | ✅ | proof | Automated test | None |`,
  ].join('\n');
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 's1-dod.md')] = dodTable('Story One');
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 's2-dod.md')] = dodTable('Story Two');
  const s1Screenshot = path.join('/repo', 'artefacts', 'f1', 'playback', 's1', 'screenshots', 'AC1.png');
  const s2Screenshot = path.join('/repo', 'artefacts', 'f1', 'playback', 's2', 'screenshots', 'AC1.png');
  const fakeFs = {
    existsSync: (p) => p === '/repo' || Object.prototype.hasOwnProperty.call(store, p) || p === s1Screenshot || p === s2Screenshot
      || p === path.join('/repo', 'artefacts', 'f1') || p === path.join('/repo', 'artefacts', 'f1', 'dod'),
    readdirSync: (dir) => {
      if (dir === path.join('/repo', 'artefacts', 'f1')) return [{ name: 'dod', isDirectory: () => true, isFile: () => false }];
      if (dir === path.join('/repo', 'artefacts', 'f1', 'dod')) return [
        { name: 's1-dod.md', isDirectory: () => false, isFile: () => true },
        { name: 's2-dod.md', isDirectory: () => false, isFile: () => true },
      ];
      return [];
    },
    readFileSync: (p) => { if (store[p] !== undefined) return store[p]; throw new Error('ENOENT: ' + p); },
  };
  try {
    const structure = buildFeaturePlaybackStructure('/repo', 'f1', fakeFs);
    const s1 = structure.stories.find((s) => s.slug === 's1');
    const s2 = structure.stories.find((s) => s.slug === 's2');
    assert.ok(s1.acRows[0].media.screenshotPath, 'expected story 1 own AC1 to resolve a screenshot');
    assert.ok(s2.acRows[0].media.screenshotPath, 'expected story 2 own AC1 to resolve a screenshot');
    assert.notStrictEqual(s1.acRows[0].media.screenshotPath, s2.acRows[0].media.screenshotPath, 'expected two different, non-colliding files');
    pass('AC2 (integration): buildFeaturePlaybackStructure attaches independent, non-colliding media to two stories');
  } catch (e) { fail('AC2 (integration): buildFeaturePlaybackStructure non-colliding media', e); }
})();

console.log(`\n[fpd-s5-close-the-real-capture-loop] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
