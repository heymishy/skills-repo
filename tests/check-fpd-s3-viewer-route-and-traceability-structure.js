'use strict';
// check-fpd-s3-viewer-route-and-traceability-structure.js -- TDD tests for fpd-s3
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC1 (unit) + AC5 (unit): viewer lists only DoD-validated features with a playback package
(function () {
  const { listPlaybackFeatures } = require('../src/web-ui/routes/playback');
  const state = {
    features: [
      { slug: 'has-package', name: 'Has Package' },
      { slug: 'no-package', name: 'No Package' },
    ],
  };
  const fakeExistsSync = (p) => p.includes('has-package') && p.includes('walkthrough.md');
  try {
    const result = listPlaybackFeatures('/repo', state, fakeExistsSync);
    assert.strictEqual(result.length, 1, 'expected exactly 1 feature listed');
    assert.strictEqual(result[0].slug, 'has-package');
    pass('AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package');
  } catch (e) { fail('AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package', e); }
})();

// AC2 (unit): review page opens with the scope/benefit summary, not re-authored
(function () {
  const { extractMarkdownSection } = require('../src/web-ui/routes/playback');
  const { parseBenefitMetricTargets } = require('../scripts/playback-capture');
  const discoveryContent = [
    '# Discovery: Thing', '', '## Problem statement', '', 'Engineers waste time doing X by hand.', '',
    '## Who it affects', '', 'Everyone.',
  ].join('\n');
  const benefitMetricContent = [
    '### Metric 1: Widget load time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤500ms p95 |',
    '### Metric 2: Setup time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤10min |',
  ].join('\n');
  try {
    const problemStatement = extractMarkdownSection(discoveryContent, 'Problem statement');
    assert.strictEqual(problemStatement, 'Engineers waste time doing X by hand.');
    const targets = parseBenefitMetricTargets(benefitMetricContent);
    assert.strictEqual(targets['Widget load time'], '≤500ms p95');
    assert.strictEqual(targets['Setup time'], '≤10min');
    pass('AC2 (unit): review page scope/benefit summary sourced verbatim, not re-authored');
  } catch (e) { fail('AC2 (unit): review page scope/benefit summary', e); }
})();

console.log(`\n[fpd-s3-viewer-route-and-traceability-structure] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
