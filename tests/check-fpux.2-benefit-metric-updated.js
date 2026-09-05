'use strict';
// check-fpux.2-benefit-metric-updated.js -- fpux.2 AC4: benefit-metric.md's
// M3 row must be updated with real values from the AC1 audit, not left as
// placeholder "Not yet established"/"TBD" text.
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var BM_PATH = path.resolve(__dirname, '../artefacts/2026-09-05-feature-page-ux-redesign/benefit-metric.md');

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

console.log('\n[fpux.2] AC4 -- benefit-metric.md M3 row updated with real values');
{
  var content = fs.readFileSync(BM_PATH, 'utf8');
  // Bound the slice to the Metric 3 heading through the next heading of equal
  // or higher level ("## Tier 3") -- NOT a bare '---' split, which false-
  // triggers on the markdown table header divider row ("|-------|-------|")
  // and silently truncates the section before its own data rows.
  var start = content.indexOf('### Metric 3:');
  var end = content.indexOf('## Tier 3', start);
  var m3Section = content.slice(start, end === -1 ? undefined : end);
  test('M3 no longer says "Not yet established"', function() {
    assert.ok(m3Section.indexOf('Not yet established') === -1, 'placeholder baseline text still present');
  });
  test('M3 no longer says "TBD"', function() {
    assert.ok(m3Section.indexOf('TBD') === -1, 'placeholder target text still present');
  });
  test('M3 mentions the real entry-point count (4)', function() {
    assert.ok(/4 (real )?entry points/i.test(m3Section), 'expected the real "4 entry points" finding to be recorded');
  });
}

console.log('\n--- fpux.2 (benefit-metric) Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
