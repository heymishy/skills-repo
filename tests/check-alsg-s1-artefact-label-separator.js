'use strict';

// check-alsg-s1-artefact-label-separator.js — AC verification for alsg-s1
// Fixes: type label rendered flush against the file-path link with no
// separator (e.g. "Discoveryartefacts/x/discovery.md").
// Story: artefacts/2026-08-27-artefact-label-spacing-gap/stories/alsg-s1-fix-artefact-item-label-separator.md
// Test plan: artefacts/2026-08-27-artefact-label-spacing-gap/test-plans/alsg-s1-test-plan.md

const assert = require('assert');
const { renderArtefactItem, renderArtefactIndexHtml } = require('../src/web-ui/routes/features');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.log(`  [FAIL] ${name} -- ${err.message}`);
  }
}

// ── AC1: label and link are visually separated ──────────────────────────────

test('AC1: renderArtefactItem separates the type label from the link with ": "', () => {
  const html = renderArtefactItem({
    type: 'Discovery',
    name: 'artefacts/x/discovery.md',
    viewUrl: '/artefact/x/discovery'
  });
  assert.ok(html.includes('Discovery: </span><a'), 'expected "Discovery: " immediately before the <a> tag, got: ' + html);
  assert.ok(!html.includes('Discovery</span><a'), 'label must not be flush against the link (pre-fix behaviour)');
});

// ── AC2: existing regression suite unaffected ───────────────────────────────
// (covered by re-running tests/check-wuce6-feature-navigation.js separately,
// per the test plan -- not duplicated here.)

// ── AC3: full-page render regression (dates, resume links preserved) ───────

test('AC3: renderArtefactIndexHtml preserves date + resume-link spacing alongside the new separator', () => {
  const artefacts = [
    { type: 'discovery', createdAt: '2026-08-27', path: 'artefacts/x/discovery.md' },
    { type: 'benefit-metric', createdAt: '2026-08-27', path: 'artefacts/x/benefit-metric.md' }
  ];
  const resumeLookup = {
    'artefacts/x/discovery.md': { skillName: 'discovery', sessionId: 's1', journeyId: 'j1' }
  };
  const html = renderArtefactIndexHtml(artefacts, 'x', resumeLookup);

  // Row 1 (has a resume link): label separator + date + resume link, all present and correctly spaced.
  assert.ok(html.includes('Discovery: </span><a'), 'AC3: row 1 label separator present');
  assert.ok(html.includes('Resume conversation</a></li>'), 'AC3: row 1 resume link present and correctly closes the <li>');
  assert.ok(/<time class="artefact-list__date">2026-08-27<\/time> <a class="artefact-list__resume-link"/.test(html),
    'AC3: row 1 date and resume link are still correctly spaced apart');

  // Row 2 (no resume link): label separator present, no resume link, <li> closes right after </time>.
  assert.ok(html.includes('Benefit Metric: </span><a'), 'AC3: row 2 label separator present');
  assert.ok(/<time class="artefact-list__date">2026-08-27<\/time><\/li>/.test(html),
    'AC3: row 2 (no resume link) still closes cleanly right after the date');
});

console.log(`\n[alsg-s1] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
