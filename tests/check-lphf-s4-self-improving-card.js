'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
  // AC1
  try {
    const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
    const count = getLearningsCount();
    assert(Number.isInteger(count) && count > 0, `expected a real positive integer, got ${count}`);
    const fs = require('fs');
    const path = require('path');
    const raw = fs.readFileSync(path.join(__dirname, '..', 'workspace', 'learnings.md'), 'utf8');
    const independentCount = (raw.match(/^## /gm) || []).length;
    assert.strictEqual(count, independentCount, `getLearningsCount() (${count}) disagrees with an independent recount (${independentCount})`);
    pass('selfImprovingCard_displaysRealNonZeroLearningsCount');
  } catch (e) { fail('selfImprovingCard_displaysRealNonZeroLearningsCount', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
