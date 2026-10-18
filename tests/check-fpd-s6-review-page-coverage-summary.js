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

// AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording
(function () {
  const { renderCoverageSummaryHtml } = require('../src/web-ui/routes/playback');
  try {
    const html = renderCoverageSummaryHtml({ total: 3, captured: 1 });
    assert.ok(html.includes('1 of 3 ACs have captured evidence'), 'expected exact "M of N" wording');
    pass('AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording');
  } catch (e) { fail('AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording', e); }
})();

// AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted
(function () {
  const { renderCoverageSummaryHtml } = require('../src/web-ui/routes/playback');
  try {
    const html = renderCoverageSummaryHtml({ total: 3, captured: 0 });
    assert.ok(html.includes('0 of 3 ACs have captured evidence yet'), 'expected exact zero-coverage wording');
    pass('AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted');
  } catch (e) { fail('AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted', e); }
})();

// AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)
(function () {
  const { renderCoverageSummaryHtml } = require('../src/web-ui/routes/playback');
  try {
    const fullHtml = renderCoverageSummaryHtml({ total: 2, captured: 2 });
    const partialHtml = renderCoverageSummaryHtml({ total: 3, captured: 1 });
    assert.ok(fullHtml.includes('Full coverage'), 'expected full-coverage wording to say "Full coverage"');
    assert.ok(!partialHtml.includes('Full coverage'), 'expected partial-coverage wording to NOT say "Full coverage"');
    pass("AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)");
  } catch (e) { fail("AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)", e); }
})();

// AC1 (integration): summary appears in renderPlaybackReviewHtml's own output, positioned before any per-story section
(function () {
  const { renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' } },
      { acId: 'AC2', description: 'b', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
    ] }],
  };
  try {
    const html = renderPlaybackReviewHtml('f1', 'A problem statement', {}, structure);
    assert.ok(html.includes('1 of 2 ACs have captured evidence'), 'expected the coverage summary text to appear in the rendered page');
    const summaryIndex = html.indexOf('1 of 2 ACs have captured evidence');
    const firstStoryIndex = html.indexOf('Story One');
    assert.ok(summaryIndex > -1 && firstStoryIndex > -1 && summaryIndex < firstStoryIndex, 'expected the summary to appear before the first per-story section');
    pass('AC1 (integration): summary appears in renderPlaybackReviewHtml\'s own output, positioned before any per-story section');
  } catch (e) { fail('AC1 (integration): summary appears in renderPlaybackReviewHtml\'s own output, positioned before any per-story section', e); }
})();

// AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4's own fixture shape verbatim
(function () {
  const { renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  const structureWithEvidence = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{
      slug: 's1', name: 'Story One', epicSlug: 'e1',
      acRows: [{ acId: 'AC1', description: 'Thing works', evidence: 'proof', media: {
        screenshotPath: 'artefacts/f1/playback/screenshots/AC1.png',
        videoPath: 'artefacts/f1/playback/video/AC1.webm',
        captionPath: 'artefacts/f1/playback/video/AC1.vtt',
        transcriptPath: 'artefacts/f1/playback/video/AC1.transcript.txt',
      } }],
    }],
  };
  try {
    const html = renderPlaybackReviewHtml('f1', '', {}, structureWithEvidence);
    assert.ok(html.includes('<img') && html.includes('AC1.png'), 'expected an <img> referencing the screenshot, unchanged from fpd-s4');
    assert.ok(html.includes('<video') && html.includes('AC1.webm'), 'expected a native <video> referencing the clip, unchanged from fpd-s4');
    assert.ok(html.includes('<track') && html.includes('AC1.vtt'), 'expected a captions <track>, unchanged from fpd-s4');
    assert.ok(html.includes('AC1.transcript.txt'), 'expected the standalone transcript link, unchanged from fpd-s4');
    pass('AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4\'s own fixture shape verbatim');
  } catch (e) { fail('AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4\'s own fixture shape verbatim', e); }
})();

// NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order
(function () {
  const { renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  const makeStructure = (media) => ({
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media },
    ] }],
  });
  try {
    [
      { media: { screenshotPath: null, videoPath: null }, label: 'zero coverage' },
      { media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' }, label: 'full coverage' },
    ].forEach(({ media, label }) => {
      const html = renderPlaybackReviewHtml('f1', '', {}, makeStructure(media));
      const summaryIndex = html.indexOf('playback-coverage-summary');
      const storyIndex = html.indexOf('Story One');
      assert.ok(summaryIndex > -1 && storyIndex > -1 && summaryIndex < storyIndex, `expected summary before story content for ${label}`);
    });
    pass('NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order');
  } catch (e) { fail('NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order', e); }
})();

console.log(`\n[fpd-s6-review-page-coverage-summary] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
