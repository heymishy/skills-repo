'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(function() {
  const { renderGoldenTraceHtml, CANDIDATES, ACTIVE_CANDIDATE } = require('../src/web-ui/content/golden-trace-content');

  // AC1
  try {
    const html = renderGoldenTraceHtml();
    const frameMatches = html.match(/class="gt-frame"/g) || [];
    assert.strictEqual(frameMatches.length, 4, `expected exactly 4 frames, found ${frameMatches.length}`);
    pass('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate');
  } catch (e) { fail('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
