'use strict';
// check-fpd-s1-walkthrough-document-and-screenshots.js -- TDD tests for fpd-s1
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s1-walkthrough-document-and-screenshots.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

// AC5 (unit): skill refuses to run against a non-DoD-validated feature
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  const state = { features: [{ slug: 'not-ready-feature', dodStatus: 'in-progress' }] };
  try {
    checkDodGate(state, 'not-ready-feature');
    fail('AC5 (unit): skill refuses to run against a non-DoD-validated feature', new Error('expected checkDodGate to throw'));
  } catch (e) {
    try {
      assert.ok(/dodStatus/.test(e.message) && /in-progress/.test(e.message), 'error must name the unmet gate');
      pass('AC5 (unit): skill refuses to run against a non-DoD-validated feature');
    } catch (e2) { fail('AC5 (unit): skill refuses to run against a non-DoD-validated feature', e2); }
  }
})();

// AC1 (unit): walkthrough doc has one section per AC, sourced from the DoD table verbatim
(function () {
  const { parseDodAcCoverage, generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  const fixtureDod = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence | Verification method | Deviation |',
    '|----|-----------|----------|---------------------|-----------|',
    '| AC1 — Widget renders on load | ✅ | widget-renders-on-load test passes | Automated test | None |',
    '| AC2 — Widget updates on click | ✅ | widget-updates-on-click test passes | Automated test | None |',
    '| AC3 — Widget persists state | ✅ | widget-persists-state test passes | Automated test | None |',
  ].join('\n');
  try {
    const rows = parseDodAcCoverage(fixtureDod);
    assert.strictEqual(rows.length, 3, 'expected 3 AC rows parsed');
    const doc = generateWalkthroughMarkdown({ featureSlug: 'f1', storyDods: [{ storySlug: 's1', content: fixtureDod }], benefitMetricContent: '' });
    const sections = doc.split(/^## /m).filter(s => /^AC\d/.test(s));
    assert.strictEqual(sections.length, 3, 'expected 3 AC sections in generated doc');
    assert.ok(doc.includes('widget-renders-on-load test passes'), 'narrative must be sourced verbatim from the DoD row, not re-authored');
    pass('AC1 (unit): walkthrough doc has one section per AC, sourced from the DoD table verbatim');
  } catch (e) { fail('AC1 (unit): walkthrough doc has one section per AC, sourced from the DoD table verbatim', e); }
})();

// AC2 (unit): Metric Signal section includes benefit-metric.md targets alongside DoD signal/evidence
(function () {
  const { generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  const fixtureDod = [
    '## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — thing works | ✅ | test passes | Automated test | None |',
    '', '## Metric Signal', '', '| Metric | Signal | Evidence | Date measured |', '|----|----|----|----|',
    '| M1 — Widget load time | on-track | p95 420ms | 2026-10-15 |',
  ].join('\n');
  const fixtureBenefitMetric = [
    '### Metric 1: Widget load time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤500ms p95 |',
  ].join('\n');
  try {
    const doc = generateWalkthroughMarkdown({ featureSlug: 'f1', storyDods: [{ storySlug: 's1', content: fixtureDod }], benefitMetricContent: fixtureBenefitMetric });
    assert.ok(doc.includes('≤500ms p95'), 'expected benefit-metric target in the Metric Signal section');
    assert.ok(doc.includes('on-track') && doc.includes('p95 420ms'), 'expected DoD signal/evidence in the Metric Signal section');
    pass('AC2 (unit): Metric Signal section includes benefit-metric.md targets alongside DoD signal/evidence');
  } catch (e) { fail('AC2 (unit): Metric Signal section includes benefit-metric.md targets alongside DoD signal/evidence', e); }
})();

// AC3 (unit): capture script's own logic -- correct selector, correct path, correct AC mapping
(async function () {
  const { captureAcScreenshots, embedScreenshotPaths } = require('../scripts/playback-capture');
  const calls = [];
  const fakePage = { screenshot: async (opts) => { calls.push(opts); } };
  const acList = [
    { acId: 'AC1', url: '/widget', selector: '#widget-loaded' },
    { acId: 'AC2', url: '/widget', selector: '#widget-updated' },
  ];
  try {
    const shots = await captureAcScreenshots({ page: fakePage, featureSlug: 'f1', storySlug: 's1', acList });
    assert.strictEqual(calls.length, 2, 'expected page.screenshot() called once per AC');
    assert.strictEqual(shots[0].path, 'artefacts/f1/playback/s1/screenshots/AC1.png');
    assert.strictEqual(shots[1].path, 'artefacts/f1/playback/s1/screenshots/AC2.png');
    const doc = embedScreenshotPaths('## AC1 — x\n\ntext\n\n## AC2 — y\n\ntext\n', shots);
    assert.ok(doc.includes('![AC1](screenshots/AC1.png)'), 'expected screenshot embedded in AC1 section');
    assert.ok(doc.includes('![AC2](screenshots/AC2.png)'), 'expected screenshot embedded in AC2 section');
    pass("AC3 (unit): capture script's own logic -- correct selector, correct path, correct AC mapping");
  } catch (e) { fail("AC3 (unit): capture script's own logic -- correct selector, correct path, correct AC mapping", e); }
})().then(() => {

// AC4 (unit): package not complete until editorial review confirmed
(function () {
  const { getPackageStatus, markPackageReviewed } = require('../scripts/playback-capture');
  const store = {};
  const readFile = (p) => store[p];
  const writeFile = (p, content) => { store[p] = content; };
  const statusPath = 'artefacts/f1/playback/package-status.json';
  writeFile(statusPath, JSON.stringify({ status: 'pending-review' }));
  try {
    assert.strictEqual(getPackageStatus(statusPath, readFile).status, 'pending-review', 'expected pending-review before confirmation');
    markPackageReviewed(statusPath, readFile, writeFile);
    assert.strictEqual(getPackageStatus(statusPath, readFile).status, 'complete', 'expected complete after confirmation');
    pass('AC4 (unit): package not complete until editorial review confirmed');
  } catch (e) { fail('AC4 (unit): package not complete until editorial review confirmed', e); }
})();

// AC1 (integration): full document generation against a realistic multi-story DoD
(function () {
  const { generateWalkthroughMarkdown } = require('../scripts/playback-capture');
  const dodA = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — story A thing | ✅ | storyA evidence | Automated test | None |'].join('\n');
  const dodB = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — story B thing | ✅ | storyB evidence | Automated test | None |'].join('\n');
  try {
    const doc = generateWalkthroughMarkdown({
      featureSlug: 'f1',
      storyDods: [{ storySlug: 'sA', content: dodA }, { storySlug: 'sB', content: dodB }],
      benefitMetricContent: '',
    });
    assert.ok(doc.includes('storyA evidence') && doc.includes('storyB evidence'), 'expected both stories represented');
    const firstIdx = doc.indexOf('storyA evidence');
    const secondIdx = doc.indexOf('storyB evidence');
    assert.ok(firstIdx !== -1 && secondIdx !== -1 && firstIdx < secondIdx, 'expected no cross-story mixing or omission');
    pass('AC1 (integration): full document generation against a realistic multi-story DoD');
  } catch (e) { fail('AC1 (integration): full document generation against a realistic multi-story DoD', e); }
})();

  console.log(`\n[fpd-s1-walkthrough-document-and-screenshots] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
});
