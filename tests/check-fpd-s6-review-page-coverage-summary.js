'use strict';
// check-fpd-s6-review-page-coverage-summary.js -- TDD tests for fpd-s6
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s6-review-page-status-summary.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly
(function () {
  const { computeAcCoverageSummary } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [
      { slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
        { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' } },
        { acId: 'AC2', description: 'b', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      ] },
      { slug: 's2', name: 'Story Two', epicSlug: 'e1', acRows: [
        { acId: 'AC1', description: 'c', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      ] },
    ],
  };
  try {
    const result = computeAcCoverageSummary(structure);
    assert.deepStrictEqual(result, { total: 3, captured: 1 }, 'expected 1 of 3 ACs counted as captured');
    pass('AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly');
  } catch (e) { fail('AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly', e); }
})();

// AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted
(function () {
  const { computeAcCoverageSummary } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      { acId: 'AC2', description: 'b', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      { acId: 'AC3', description: 'c', evidence: 'e', media: null },
    ] }],
  };
  try {
    const result = computeAcCoverageSummary(structure);
    assert.deepStrictEqual(result, { total: 3, captured: 0 }, 'expected 0 of 3 ACs counted as captured');
    pass('AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted');
  } catch (e) { fail('AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted', e); }
})();

// AC3 (unit): computeAcCoverageSummary reports full-coverage correctly
(function () {
  const { computeAcCoverageSummary } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' } },
      { acId: 'AC2', description: 'b', evidence: 'e', media: { videoPath: 'artefacts/f1/playback/s1/video/AC2.webm' } },
    ] }],
  };
  try {
    const result = computeAcCoverageSummary(structure);
    assert.deepStrictEqual(result, { total: 2, captured: 2 }, 'expected 2 of 2 ACs counted as captured');
    pass('AC3 (unit): computeAcCoverageSummary reports full-coverage correctly');
  } catch (e) { fail('AC3 (unit): computeAcCoverageSummary reports full-coverage correctly', e); }
})();

console.log(`\n[fpd-s6-review-page-coverage-summary] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
