'use strict';
// check-fpux.2-nav-entry-points.js -- fpux.2 AC2: every confirmed real entry
// point into /features/:slug leads directly there.
//
// Entry points 1-3 (dashboard row, product-page item, story-DoD redirect)
// already have real, passing coverage elsewhere in this suite:
//   - #1/#2: tests/e2e/frsr-s1-feature-row-session-resume.spec.js (real
//     browser click-through, both the dashboard row and the product-page
//     item -- requires a real/mocked skill-execution turn to create a test
//     feature; passes in CI where ANTHROPIC_API_KEY/SKILL_EXECUTOR_PROVIDER
//     is configured, confirmed independently to fail locally in this sandbox
//     for that same reason on master itself, unrelated to fpux.2)
//   - #3: tests/check-kcrs-s1-kanban-card-resume-session.js AC3 ("a fully-
//     complete journey with no active session falls back to the artefact
//     index (/features/:slug)") -- 7/7 passing locally, no API key needed.
//
// Entry point #4 (kanban board card) had NO existing test asserting its
// href actually points at /features/:slug -- a real, previously-uncovered
// gap this story's own AC1 audit exists to find. This file closes it.

var assert = require('assert');
var path = require('path');
var KANBAN_PATH = path.resolve(__dirname, '../src/web-ui/views/kanban-view.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

console.log('\n[fpux.2] AC2 -- entry point #4 (kanban board card) leads directly to /features/:slug');
{
  var mod = freshRequire(KANBAN_PATH);
  var html = mod.renderKanban({
    features: [{ slug: 'my-test-feature', title: 'My Test Feature', stage: 'discovery' }],
    ideas: []
  });

  test('kb-card href points directly at /features/<slug>, no intermediate hop', function() {
    assert.ok(html.indexOf('href="/features/my-test-feature"') !== -1,
      'expected a direct /features/my-test-feature link, got: ' + html.slice(0, 300));
  });
  test('kb-card href is correctly escaped for a slug containing special characters', function() {
    var html2 = mod.renderKanban({ features: [{ slug: 'a&b<c', title: 'X', stage: 'discovery' }], ideas: [] });
    assert.ok(html2.indexOf('href="/features/a&amp;b&lt;c"') !== -1,
      'expected escaped href, got: ' + html2.slice(0, 300));
  });
}

console.log('\n--- fpux.2 (nav entry points) Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
